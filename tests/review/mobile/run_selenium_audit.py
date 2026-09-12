#!/usr/bin/env python3
from __future__ import annotations

import json
import os
import shutil
import socket
import subprocess
import tarfile
import tempfile
import threading
import time
import hashlib
from dataclasses import dataclass
from functools import partial
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path

from selenium import webdriver
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.chrome.service import Service
from selenium.webdriver.common.by import By
from selenium.webdriver.common.keys import Keys
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.support.ui import WebDriverWait

REPO_ROOT = Path(__file__).resolve().parents[3]
OUTPUT_DIR = Path(__file__).resolve().parent
BASELINE_REV = '679a0c9069e51abd82b8f974ca72c4365ca9e4f5'
VIEWPORTS = [375, 390, 430, 768, 1440]
MOBILE_WIDTHS = [375, 390, 430, 768]
CAPTURE_HEIGHT = {375: 1100, 390: 1100, 430: 1100, 768: 1400, 1440: 1400}

@dataclass
class LocalServer:
    root: Path
    port: int
    httpd: ThreadingHTTPServer
    thread: threading.Thread


def free_port() -> int:
    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as sock:
        sock.bind(('127.0.0.1', 0))
        return sock.getsockname()[1]


def start_server(root: Path) -> LocalServer:
    port = free_port()
    handler = partial(SimpleHTTPRequestHandler, directory=str(root))
    httpd = ThreadingHTTPServer(('127.0.0.1', port), handler)
    thread = threading.Thread(target=httpd.serve_forever, daemon=True)
    thread.start()
    return LocalServer(root=root, port=port, httpd=httpd, thread=thread)


def stop_server(server: LocalServer) -> None:
    server.httpd.shutdown()
    server.httpd.server_close()
    server.thread.join(timeout=5)


def chrome_driver(default_font_size: int = 16) -> webdriver.Chrome:
    options = Options()
    options.add_argument('--headless=new')
    options.add_argument('--disable-gpu')
    options.add_argument('--no-sandbox')
    options.add_argument('--hide-scrollbars')
    options.binary_location = '/usr/bin/chromium-browser'
    options.add_experimental_option('prefs', {
        'webkit.webprefs.default_font_size': default_font_size,
        'webkit.webprefs.default_fixed_font_size': default_font_size,
    })
    service = Service('/usr/bin/chromedriver')
    return webdriver.Chrome(service=service, options=options)


def run(cmd: list[str], cwd: Path | None = None, capture: bool = False) -> str:
    result = subprocess.run(cmd, cwd=cwd, check=True, text=True, capture_output=capture)
    return result.stdout if capture else ''


def cleanup_old_artifacts() -> None:
    for pattern in ('*.png', 'results.json', 'results.md'):
        for path in OUTPUT_DIR.glob(pattern):
            if path.name == Path(__file__).name:
                continue
            path.unlink(missing_ok=True)


def export_revision(revision: str, destination: Path) -> None:
    archive_path = destination / 'baseline.tar'
    with open(archive_path, 'wb') as stream:
        subprocess.run(['git', 'archive', revision], cwd=REPO_ROOT, check=True, stdout=stream)
    with tarfile.open(archive_path) as archive:
        archive.extractall(destination)
    archive_path.unlink()


def browser_version() -> str:
    return subprocess.check_output(['/usr/bin/chromium-browser', '--version'], text=True).strip()


def save_screenshot(driver: webdriver.Chrome, name: str) -> str:
    path = OUTPUT_DIR / name
    if not driver.save_screenshot(str(path)) or not path.exists():
        raise RuntimeError(f'Failed to save screenshot: {path}')
    return path.name


def normalize_scroll(driver: webdriver.Chrome) -> None:
    driver.execute_script(
        """
        document.documentElement.style.scrollBehavior = 'auto';
        document.body.style.scrollBehavior = 'auto';
        if ('scrollRestoration' in history) history.scrollRestoration = 'manual';
        window.scrollTo(0, 0);
        """
    )
    time.sleep(0.1)


def wait_for_target_in_view(driver: webdriver.Chrome, selector: str, *, top_limit: int = 220) -> None:
    WebDriverWait(driver, 10).until(
        lambda current: current.execute_script(
            """
            const target = document.querySelector(arguments[0]);
            if (!target) return false;
            const rect = target.getBoundingClientRect();
            return rect.top >= -1 && rect.top <= arguments[1] && rect.bottom > 0;
            """,
            selector,
            top_limit,
        )
    )


def audit_page(driver: webdriver.Chrome, base_url: str, route: str, width: int, *, scroll_to: str | None = None) -> dict:
    driver.set_window_size(width, CAPTURE_HEIGHT[width])
    driver.get(base_url + route)
    wait = WebDriverWait(driver, 10)
    wait.until(EC.presence_of_element_located((By.ID, 'content')))
    normalize_scroll(driver)
    if scroll_to:
        driver.execute_script(
            "const target=document.querySelector(arguments[0]); if (target) { target.scrollIntoView({block:'start'}); }",
            scroll_to,
        )
        wait_for_target_in_view(driver, scroll_to)
    return driver.execute_script(
        r'''
        const scope = arguments[0] ? document.querySelector(arguments[0]) : null;
        const selectorPairs = [
          ['.intro-copy', '.bridge-figure-group', false],
          ['.bridge-image', '.figure-links', false],
          ['#search-input', '#search-form button', false],
          ['#menu-toggle', '.mobile-brand', false],
          ['.speaker-filter', '.speaker-heading', false],
          ['.source-link', '.entry-link', true]
        ];
        const rectOf = (selector, scoped = false) => {
          const root = scoped && scope ? scope : document;
          const element = root.querySelector(selector);
          if (!element) return null;
          const rect = element.getBoundingClientRect();
          return {left: rect.left, top: rect.top, right: rect.right, bottom: rect.bottom, width: rect.width, height: rect.height};
        };
        const overlaps = selectorPairs.map(([a,b,scoped]) => {
          const ra = rectOf(a, scoped), rb = rectOf(b, scoped);
          if (!ra || !rb) return {pair:[a,b], missing:true};
          const overlap = !(ra.right <= rb.left || rb.right <= ra.left || ra.bottom <= rb.top || rb.bottom <= ra.top);
          return {pair:[a,b], overlap, a:ra, b:rb};
        });
        const vw = window.innerWidth;
        const offenders = [];
        for (const el of document.querySelectorAll('body *')) {
          const rect = el.getBoundingClientRect();
          if (!rect.width && !rect.height) continue;
          if (rect.right > vw + 1 || rect.left < -1 || rect.width > vw + 1) {
            offenders.push({
              tag: el.tagName.toLowerCase(),
              className: el.className,
              id: el.id,
              left: rect.left,
              right: rect.right,
              width: rect.width,
              text: (el.innerText || el.textContent || '').trim().replace(/\s+/g, ' ').slice(0, 120)
            });
          }
        }
        return {
          route: location.hash,
          title: document.title,
          width: window.innerWidth,
          height: window.innerHeight,
          scrollWidth: document.documentElement.scrollWidth,
          clientWidth: document.documentElement.clientWidth,
          overflow: offenders,
          overlaps,
          introChildren: [...document.querySelectorAll('.intro > *')].map(el => el.className || el.tagName.toLowerCase()),
          topbarVisible: getComputedStyle(document.querySelector('.topbar')).display !== 'none',
          mobileView: document.getElementById('mobile-view')?.textContent || null,
          activeNav: document.querySelector('.view-nav [aria-selected="true"]')?.textContent.trim() || null,
          viewHeading: document.querySelector('#content h2')?.textContent.trim() || null,
          searchQuery: document.getElementById('search-input')?.value || '',
          searchResultsCount: document.querySelectorAll('.search-results li').length,
          figureGroup: rectOf('.bridge-figure-group'),
          figureImage: rectOf('.bridge-image'),
          figureLinks: rectOf('.figure-links'),
          introCopy: rectOf('.intro-copy'),
          searchInput: rectOf('#search-input'),
          searchButton: rectOf('#search-form button'),
          targetSourceLink: rectOf('.source-link', true),
          targetEntryLink: rectOf('.entry-link', true),
          footerLink: rectOf('.footer-link')
        };
        ''',
        scroll_to,
    )


def check_navigation_and_back(driver: webdriver.Chrome, base_url: str, width: int) -> dict:
    driver.set_window_size(width, CAPTURE_HEIGHT[width])
    driver.get(base_url + '#overview')
    wait = WebDriverWait(driver, 10)
    wait.until(EC.presence_of_element_located((By.ID, 'content')))
    normalize_scroll(driver)
    topbar_visible = driver.execute_script("return getComputedStyle(document.querySelector('.topbar')).display !== 'none';")
    if topbar_visible:
        wait.until(EC.element_to_be_clickable((By.ID, 'menu-toggle'))).click()
        time.sleep(0.2)
        driver.find_element(By.ID, 'tab-meetings').click()
    else:
        driver.find_element(By.ID, 'tab-meetings').click()
    time.sleep(0.25)
    navigated = driver.execute_script(
        "return {hash:location.hash, active:document.querySelector('.view-nav [aria-selected=\"true\"]')?.textContent.trim(), menuExpanded:document.getElementById('menu-toggle')?.getAttribute('aria-expanded')};"
    )
    driver.back()
    time.sleep(0.35)
    returned = driver.execute_script(
        "return {hash:location.hash, active:document.querySelector('.view-nav [aria-selected=\"true\"]')?.textContent.trim(), mobileView:document.getElementById('mobile-view')?.textContent || null};"
    )
    return {'topbarVisible': topbar_visible, 'navigated': navigated, 'returned': returned}


def capture_open_menu(driver: webdriver.Chrome, base_url: str) -> dict:
    driver.set_window_size(390, CAPTURE_HEIGHT[390])
    driver.get(base_url + '#overview')
    wait = WebDriverWait(driver, 10)
    toggle = wait.until(EC.element_to_be_clickable((By.ID, 'menu-toggle')))
    normalize_scroll(driver)
    toggle.click()
    time.sleep(0.2)
    state = driver.execute_script(
        "return {expanded:document.getElementById('menu-toggle').getAttribute('aria-expanded'), sidebar:getComputedStyle(document.getElementById('site-sidebar')).display, topbarTop:document.querySelector('.topbar').getBoundingClientRect().top};"
    )
    screenshot = save_screenshot(driver, 'menu-open-current-390.png')
    driver.find_element(By.TAG_NAME, 'body').send_keys(Keys.ESCAPE)
    time.sleep(0.2)
    state['afterEscape'] = driver.execute_script(
        "return {expanded:document.getElementById('menu-toggle').getAttribute('aria-expanded'), activeId:document.activeElement.id};"
    )
    state['screenshot'] = screenshot
    return state


def write_markdown(results: dict) -> None:
    lines = []
    lines.append('# Browser validation results')
    lines.append('')
    lines.append(f'- Tested revision base: `{results["tested_revision"]}`')
    lines.append(f'- Working tree state: {"dirty" if results["working_tree_dirty"] else "clean"}')
    if results['working_tree_dirty']:
        lines.append(f'- Working tree entries at run start: `{", ".join(results["working_tree_status"])}`')
    lines.append(f'- Audit script: `{results["audit_script"]}`')
    lines.append(f'- Audit script SHA-256: `{results["audit_script_sha256"]}`')
    lines.append(f'- Browser: {results["browser_version"]}')
    lines.append('- Browser mode: local Chromium headless via Selenium and chromedriver')
    lines.append('- Device coverage: viewport emulation only, not physical iPhone hardware or Safari')
    lines.append(f'- Command: `python3 tests/review/mobile/run_selenium_audit.py`')
    lines.append('')
    lines.append('## Viewports checked')
    lines.append('')
    lines.append(', '.join(f'`{width}px`' for width in VIEWPORTS))
    lines.append('')
    lines.append('## Text-enlargement simulation')
    lines.append('')
    lines.append('A separate Chromium session was launched with `webkit.webprefs.default_font_size=32` and `webkit.webprefs.default_fixed_font_size=32`, doubling the default 16px browser font settings to approximate a 200% browser text-size case at 390px. This is not a physical iPhone/Safari text-size test.')
    lines.append('')
    lines.append('## Current branch results')
    lines.append('')
    lines.append('| Width | Overview/photo group | Search | Menu | Navigation + Back | Speakers | Meetings | News | Overflow | Overlap |')
    lines.append('| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |')
    for item in results['current_audit']:
        menu = 'n/a' if item['menu_status'] == 'n/a' else ('open/close ok' if item['menu_status'] == 'ok' else 'issue')
        lines.append(
            f"| {item['width']} | {item['overview_status']} | {item['search_status']} | {menu} | {item['nav_status']} | {item['speakers_status']} | {item['meetings_status']} | {item['news_status']} | {item['overflow_status']} | {item['overlap_status']} |"
        )
    lines.append('')
    lines.append('## Saved screenshots')
    lines.append('')
    for filename in results['screenshots']:
        lines.append(f'- [{filename}]({filename})')
    lines.append('')
    if results['baseline'].get('status') == 'captured':
        lines.append('## Baseline comparison')
        lines.append('')
        lines.append(f'- Baseline revision: `{results["baseline"]["revision"]}`')
        lines.append('- Matching overview screenshots were captured at the same top-of-page scroll position and widths below.')
        for filename in results['baseline']['screenshots']:
            lines.append(f'  - [{filename}]({filename})')
        lines.append('')
    else:
        lines.append('## Baseline comparison limitation')
        lines.append('')
        lines.append(f"- {results['baseline'].get('error', 'The baseline comparison could not be recovered.')}" )
        lines.append('')
    lines.append('## Concrete findings')
    lines.append('')
    findings = results.get('findings', []) or ['No concrete layout or interaction issues were detected in this bounded pass.']
    for finding in findings:
        lines.append(f'- {finding}')
    lines.append('')
    lines.append('## Unresolved gaps')
    lines.append('')
    for gap in results['gaps']:
        lines.append(f'- {gap}')
    (OUTPUT_DIR / 'results.md').write_text('\n'.join(lines) + '\n', encoding='utf-8')


def summarize_page(name: str, data: dict) -> str:
    if data['overflow']:
        return f'overflow ({len(data["overflow"])})'
    if any(item.get('overlap') for item in data['overlaps'] if not item.get('missing')):
        return 'overlap issue'
    return 'ok'


def summarize_search(data: dict) -> str:
    if summarize_page('search', data) != 'ok':
        return summarize_page('search', data)
    if data.get('viewHeading') != 'Search the highlights':
        return 'missing search heading'
    if data.get('searchQuery') != 'Madison':
        return 'query mismatch'
    if data.get('searchResultsCount', 0) < 1:
        return 'no results'
    return 'ok'


def main() -> None:
    working_tree_status = subprocess.check_output(['git', 'status', '--short', '--untracked-files=all'], cwd=REPO_ROOT, text=True).splitlines()
    audit_script = Path(__file__).resolve()
    audit_script_hash = hashlib.sha256(audit_script.read_bytes()).hexdigest()
    cleanup_old_artifacts()
    results: dict = {
        'tested_revision': subprocess.check_output(['git', 'rev-parse', 'HEAD'], cwd=REPO_ROOT, text=True).strip(),
        'working_tree_dirty': bool(working_tree_status),
        'working_tree_status': working_tree_status,
        'audit_script': str(audit_script.relative_to(REPO_ROOT)),
        'audit_script_sha256': audit_script_hash,
        'browser_version': browser_version(),
        'viewports': VIEWPORTS,
        'current_audit': [],
        'screenshots': [],
        'baseline': {},
        'findings': [],
        'gaps': ['No physical iPhone or Safari run was available in this environment.'],
    }

    temp_root = Path(tempfile.mkdtemp(prefix='csb-mobile-review-'))
    baseline_dir = temp_root / 'baseline'
    baseline_dir.mkdir(parents=True, exist_ok=True)

    current_server = start_server(REPO_ROOT)
    baseline_server = None
    baseline_ready = False
    try:
        try:
            export_revision(BASELINE_REV, baseline_dir)
            baseline_server = start_server(baseline_dir)
            baseline_ready = True
            results['baseline'] = {'status': 'captured', 'revision': BASELINE_REV, 'screenshots': []}
        except Exception as exc:  # pragma: no cover - best effort reporting
            results['baseline'] = {'status': 'missing', 'revision': BASELINE_REV, 'error': f'Could not export or serve {BASELINE_REV}: {exc}'}

        current_url = f'http://127.0.0.1:{current_server.port}/index.html'
        driver = chrome_driver()
        try:
            results['browser_capabilities'] = driver.capabilities
            for width in VIEWPORTS:
                overview = audit_page(driver, current_url, '#overview', width)
                search = audit_page(driver, current_url, '#search?q=Madison', width)
                speakers = audit_page(driver, current_url, '#speakers/other/delgado-cacti', width, scroll_to='#delgado-cacti')
                meetings = audit_page(driver, current_url, '#meetings/meeting-2024-01-09', width, scroll_to='#meeting-2024-01-09')
                news = audit_page(driver, current_url, '#news/lat-2017', width, scroll_to='#lat-2017')
                nav = check_navigation_and_back(driver, current_url, width)
                menu = {'expanded': 'n/a', 'afterEscape': {'expanded': 'n/a'}}
                if width in MOBILE_WIDTHS:
                    driver.set_window_size(width, CAPTURE_HEIGHT[width])
                    driver.get(current_url + '#overview')
                    WebDriverWait(driver, 10).until(EC.element_to_be_clickable((By.ID, 'menu-toggle')))
                    normalize_scroll(driver)
                    driver.find_element(By.ID, 'menu-toggle').click()
                    time.sleep(0.2)
                    menu = driver.execute_script(
                        "return {expanded:document.getElementById('menu-toggle').getAttribute('aria-expanded'), sidebar:getComputedStyle(document.getElementById('site-sidebar')).display};"
                    )
                    driver.find_element(By.TAG_NAME, 'body').send_keys(Keys.ESCAPE)
                    time.sleep(0.2)
                    menu['afterEscape'] = driver.execute_script(
                        "return {expanded:document.getElementById('menu-toggle').getAttribute('aria-expanded'), activeId:document.activeElement.id};"
                    )
                item = {
                    'width': width,
                    'overview': overview,
                    'search': search,
                    'speakers': speakers,
                    'meetings': meetings,
                    'news': news,
                    'menu': menu,
                    'navigation': nav,
                }
                item['overview_status'] = 'ok' if overview['introChildren'] == ['intro-copy', 'bridge-figure-group'] and not overview['overflow'] else 'issue'
                item['search_status'] = summarize_search(search)
                item['speakers_status'] = summarize_page('speakers', speakers)
                item['meetings_status'] = summarize_page('meetings', meetings)
                item['news_status'] = summarize_page('news', news)
                item['nav_status'] = 'ok' if (
                    nav['navigated']['hash'] == '#meetings'
                    and nav['navigated'].get('active') == 'Meetings & documents'
                    and nav['returned']['hash'] == '#overview'
                    and nav['returned'].get('active') == 'Overview'
                ) else 'issue'
                item['menu_status'] = 'n/a' if width > 900 else ('ok' if item['menu']['expanded'] == 'true' and item['menu'].get('sidebar') == 'block' and item['menu']['afterEscape']['expanded'] == 'false' else 'issue')
                item['overflow_status'] = 'none' if not any(section['overflow'] for section in [overview, search, speakers, meetings, news]) else 'found'
                item['overlap_status'] = 'none' if not any(x.get('overlap') for section in [overview, search, speakers, meetings, news] for x in section['overlaps'] if not x.get('missing')) else 'found'
                results['current_audit'].append(item)

            # Saved current screenshots.
            driver.set_window_size(390, CAPTURE_HEIGHT[390])
            driver.get(current_url + '#overview')
            WebDriverWait(driver, 10).until(EC.presence_of_element_located((By.ID, 'content')))
            normalize_scroll(driver)
            results['screenshots'].append(save_screenshot(driver, 'overview-current-390.png'))

            driver.set_window_size(768, CAPTURE_HEIGHT[768])
            driver.get(current_url + '#overview')
            WebDriverWait(driver, 10).until(EC.presence_of_element_located((By.ID, 'content')))
            normalize_scroll(driver)
            results['screenshots'].append(save_screenshot(driver, 'overview-current-768.png'))

            driver.set_window_size(1440, CAPTURE_HEIGHT[1440])
            driver.get(current_url + '#overview')
            WebDriverWait(driver, 10).until(EC.presence_of_element_located((By.ID, 'content')))
            normalize_scroll(driver)
            results['screenshots'].append(save_screenshot(driver, 'overview-current-1440.png'))

            menu_state = capture_open_menu(driver, current_url)
            results['screenshots'].append(menu_state['screenshot'])
            results['menu_open_390'] = menu_state

            driver.set_window_size(390, CAPTURE_HEIGHT[390])
            driver.get(current_url + '#speakers/other/delgado-cacti')
            WebDriverWait(driver, 10).until(EC.presence_of_element_located((By.ID, 'delgado-cacti')))
            normalize_scroll(driver)
            driver.execute_script("document.getElementById('delgado-cacti').scrollIntoView({block:'start'});")
            wait_for_target_in_view(driver, '#delgado-cacti')
            results['screenshots'].append(save_screenshot(driver, 'speaker-entry-current-390.png'))

            driver.set_window_size(390, CAPTURE_HEIGHT[390])
            driver.get(current_url + '#meetings/meeting-2024-01-09')
            WebDriverWait(driver, 10).until(EC.presence_of_element_located((By.ID, 'meeting-2024-01-09')))
            normalize_scroll(driver)
            driver.execute_script("document.getElementById('meeting-2024-01-09').scrollIntoView({block:'start'});")
            wait_for_target_in_view(driver, '#meeting-2024-01-09')
            results['screenshots'].append(save_screenshot(driver, 'meeting-card-current-390.png'))

            enlarged_driver = chrome_driver(default_font_size=32)
            try:
                enlarged_driver.set_window_size(390, CAPTURE_HEIGHT[390])
                enlarged_driver.get(current_url + '#overview')
                WebDriverWait(enlarged_driver, 10).until(EC.presence_of_element_located((By.ID, 'content')))
                normalize_scroll(enlarged_driver)
                results['screenshots'].append(save_screenshot(enlarged_driver, 'text-enlarged-current-390.png'))
                results['text_enlargement'] = audit_page(enlarged_driver, current_url, '#overview', 390)
            finally:
                enlarged_driver.quit()

            if baseline_ready and baseline_server:
                baseline_url = f'http://127.0.0.1:{baseline_server.port}/index.html'
                for width in [390, 768, 1440]:
                    driver.set_window_size(width, CAPTURE_HEIGHT[width])
                    driver.get(baseline_url + '#overview')
                    WebDriverWait(driver, 10).until(EC.presence_of_element_located((By.ID, 'content')))
                    normalize_scroll(driver)
                    filename = save_screenshot(driver, f'overview-baseline-{width}.png')
                    results['baseline']['screenshots'].append(filename)
                    results['screenshots'].append(filename)

            if any(
                item['overflow_status'] != 'none'
                or item['overlap_status'] != 'none'
                or item['nav_status'] != 'ok'
                or item['menu_status'] == 'issue'
                for item in results['current_audit']
            ):
                results['findings'].append('One or more audited current-branch routes reported menu, overflow, overlap, or navigation issues. Review results.json for details.')
            else:
                results['findings'].append('No concrete layout or interaction issues were detected across the audited current-branch routes at 375, 390, 430, 768, and 1440 CSS pixels.')
            text_enlargement = results.get('text_enlargement', {})
            enlarged_overlap = any(item.get('overlap') for item in text_enlargement.get('overlaps', []) if not item.get('missing'))
            if text_enlargement.get('overflow') or enlarged_overlap:
                results['findings'].append('The simulated 200% text-size case produced an audit finding; see results.json.')
            else:
                results['findings'].append('The simulated 200% text-size case at 390px did not trigger the audit overflow or overlap checks.')
        finally:
            driver.quit()
    finally:
        stop_server(current_server)
        if baseline_server:
            stop_server(baseline_server)
        shutil.rmtree(temp_root, ignore_errors=True)

    (OUTPUT_DIR / 'results.json').write_text(json.dumps(results, indent=2), encoding='utf-8')
    write_markdown(results)
    print(json.dumps({'results': str(OUTPUT_DIR / 'results.json'), 'screenshots': results['screenshots']}, indent=2))


if __name__ == '__main__':
    main()
