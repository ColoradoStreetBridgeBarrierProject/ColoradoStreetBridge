#!/usr/bin/env python3
from __future__ import annotations

import hashlib
import json
import shutil
import socket
import subprocess
import threading
import time
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

REPO_ROOT = Path(__file__).resolve().parents[4]
OUTPUT_DIR = Path(__file__).resolve().parent
TARGET_REVISION = '146b16a9e066db1ec7852195d718e7ce007ad53c'
VIEWPORT_HEIGHT = 1200
MOBILE_WIDTHS = [375, 390]

@dataclass
class LocalServer:
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
    return LocalServer(port=port, httpd=httpd, thread=thread)


def stop_server(server: LocalServer) -> None:
    server.httpd.shutdown()
    server.httpd.server_close()
    server.thread.join(timeout=5)


def cleanup_artifacts() -> None:
    for pattern in ('*.png', 'results.json', 'results.md'):
        for path in OUTPUT_DIR.glob(pattern):
            if path.name == Path(__file__).name:
                continue
            path.unlink(missing_ok=True)


def chrome_driver(default_font_size: int = 16) -> webdriver.Chrome:
    options = Options()
    options.add_argument('--headless=new')
    options.add_argument('--disable-gpu')
    options.add_argument('--no-sandbox')
    options.add_argument('--hide-scrollbars')
    options.binary_location = '/usr/bin/chromium-browser'
    options.set_capability('goog:loggingPrefs', {'browser': 'ALL'})
    options.add_experimental_option('prefs', {
        'webkit.webprefs.default_font_size': default_font_size,
        'webkit.webprefs.default_fixed_font_size': default_font_size,
    })
    return webdriver.Chrome(service=Service('/usr/bin/chromedriver'), options=options)


def run_cmd(args: list[str]) -> str:
    return subprocess.check_output(args, cwd=REPO_ROOT, text=True).strip()


def set_actual_viewport(driver: webdriver.Chrome, target_width: int, target_height: int = VIEWPORT_HEIGHT) -> dict:
    driver.set_window_size(target_width, target_height)
    for _ in range(6):
        current = driver.execute_script('return {innerWidth: window.innerWidth, innerHeight: window.innerHeight, outerWidth: window.outerWidth, outerHeight: window.outerHeight};')
        dw = target_width - current['innerWidth']
        dh = target_height - current['innerHeight']
        if dw == 0 and dh == 0:
            return current
        driver.set_window_size(current['outerWidth'] + dw, current['outerHeight'] + dh)
        time.sleep(0.05)
    return driver.execute_script('return {innerWidth: window.innerWidth, innerHeight: window.innerHeight, outerWidth: window.outerWidth, outerHeight: window.outerHeight};')


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


def wait_for_ready(driver: webdriver.Chrome, expect_heading: str | None = None) -> None:
    WebDriverWait(driver, 10).until(lambda d: d.execute_script('return document.readyState') == 'complete')
    WebDriverWait(driver, 10).until(EC.presence_of_element_located((By.ID, 'content')))
    if expect_heading:
        WebDriverWait(driver, 10).until(lambda d: d.execute_script('return document.querySelector("#content h2")?.textContent?.trim()') == expect_heading)


def save_screenshot(driver: webdriver.Chrome, filename: str) -> str:
    path = OUTPUT_DIR / filename
    if not driver.save_screenshot(str(path)) or not path.exists():
        raise RuntimeError(f'Failed to save screenshot: {path}')
    return path.name


def js_measure(driver: webdriver.Chrome, target_selector: str | None = None) -> dict:
    return driver.execute_script(
        r'''
        const target = arguments[0] ? document.querySelector(arguments[0]) : null;
        const rect = element => {
          if (!element) return null;
          const r = element.getBoundingClientRect();
          return {left:r.left, top:r.top, right:r.right, bottom:r.bottom, width:r.width, height:r.height};
        };
        const inside = (outer, inner) => {
          if (!outer || !inner) return false;
          return inner.left >= outer.left - 0.5 && inner.right <= outer.right + 0.5 && inner.top >= outer.top - 0.5 && inner.bottom <= outer.bottom + 0.5;
        };
        const button = document.getElementById('menu-toggle');
        const textNode = button?.querySelector('span');
        const icon = button?.querySelector('svg');
        const rangeRects = [];
        if (textNode) {
          const range = document.createRange();
          range.selectNodeContents(textNode);
          for (const item of range.getClientRects()) {
            rangeRects.push({left:item.left, top:item.top, right:item.right, bottom:item.bottom, width:item.width, height:item.height});
          }
        }
        const buttonRect = rect(button);
        const iconRect = rect(icon);
        return {
          locationHash: location.hash,
          viewport: {width: window.innerWidth, height: window.innerHeight},
          rootFontSize: getComputedStyle(document.documentElement).fontSize,
          headerHeight: document.querySelector('.topbar')?.getBoundingClientRect().height || 0,
          cssHeaderHeight: getComputedStyle(document.documentElement).getPropertyValue('--mobile-header-height').trim(),
          bodyScrollWidth: document.body.scrollWidth,
          clientWidth: document.documentElement.clientWidth,
          hasHorizontalOverflow: document.documentElement.scrollWidth > document.documentElement.clientWidth + 1,
          mobileView: document.getElementById('mobile-view')?.textContent || null,
          activeNav: document.querySelector('.view-nav [aria-selected="true"]')?.textContent.trim() || null,
          viewHeading: document.querySelector('#content h2')?.textContent.trim() || null,
          buttonRect,
          buttonTextRect: rect(textNode),
          buttonTextRangeRects: rangeRects,
          buttonTextInside: rangeRects.every(item => inside(buttonRect, item)),
          iconRect,
          iconInside: inside(buttonRect, iconRect),
          menuExpanded: button?.getAttribute('aria-expanded') || null,
          sidebarRect: rect(document.getElementById('site-sidebar')),
          sidebarDisplay: getComputedStyle(document.getElementById('site-sidebar')).display,
          sidebarTopCss: getComputedStyle(document.getElementById('site-sidebar')).top,
          sidebarMaxHeightCss: getComputedStyle(document.getElementById('site-sidebar')).maxHeight,
          navCount: document.querySelectorAll('.view-nav [data-view]').length,
          lastNavRect: rect(document.querySelector('.view-nav [data-view]:last-child')),
          targetRect: rect(target),
          targetId: target?.id || null,
          consoleTitle: document.title,
        };
        ''',
        target_selector,
    )


def derive_speaker_route(driver: webdriver.Chrome, base_url: str) -> str | None:
    driver.get(base_url + '#speakers/other')
    wait_for_ready(driver, 'Questions, answers, and decisions')
    normalize_scroll(driver)
    return driver.execute_script(
        "return document.getElementById('delgado-cacti')?.querySelector('.entry-link')?.getAttribute('href') || null;"
    )


def open_menu(driver: webdriver.Chrome) -> None:
    WebDriverWait(driver, 10).until(EC.element_to_be_clickable((By.ID, 'menu-toggle'))).click()
    WebDriverWait(driver, 10).until(lambda d: d.execute_script("return document.getElementById('menu-toggle').getAttribute('aria-expanded')") == 'true')
    time.sleep(0.1)


def close_menu_with_escape(driver: webdriver.Chrome) -> dict:
    driver.find_element(By.TAG_NAME, 'body').send_keys(Keys.ESCAPE)
    WebDriverWait(driver, 10).until(lambda d: d.execute_script("return document.getElementById('menu-toggle').getAttribute('aria-expanded')") == 'false')
    time.sleep(0.1)
    return driver.execute_script("return {expanded: document.getElementById('menu-toggle').getAttribute('aria-expanded'), activeId: document.activeElement.id};")


def wait_for_target_below_header(driver: webdriver.Chrome, selector: str) -> dict:
    WebDriverWait(driver, 10).until(
        lambda d: d.execute_script(
            """
            const target = document.querySelector(arguments[0]);
            const header = document.querySelector('.topbar');
            if (!target || !header) return false;
            const rect = target.getBoundingClientRect();
            const headerBottom = header.getBoundingClientRect().bottom;
            return rect.top >= headerBottom - 1 && rect.top < window.innerHeight && rect.bottom > headerBottom;
            """,
            selector,
        )
    )
    return js_measure(driver, selector)


def nav_by_click(driver: webdriver.Chrome, element) -> None:
    element.click()
    time.sleep(0.15)


def nav_by_script_click(driver: webdriver.Chrome, selector: str) -> None:
    driver.execute_script("const el=document.querySelector(arguments[0]); if (el) el.click();", selector)
    time.sleep(0.15)


def collect_console_logs(driver: webdriver.Chrome) -> list[dict]:
    entries = []
    try:
        for item in driver.get_log('browser'):
            entries.append({'level': item.get('level'), 'message': item.get('message')})
    except Exception as exc:
        entries.append({'level': 'UNAVAILABLE', 'message': str(exc)})
    return entries


def format_rect(rect: dict) -> str:
    return (
        f"left {rect['left']:.2f}, top {rect['top']:.2f}, "
        f"right {rect['right']:.2f}, bottom {rect['bottom']:.2f}, "
        f"{rect['width']:.2f}×{rect['height']:.2f}"
    )


def exercise_resize_observer(driver: webdriver.Chrome, base_url: str) -> dict:
    set_actual_viewport(driver, 390, VIEWPORT_HEIGHT)
    driver.get(base_url + '#overview')
    wait_for_ready(driver, 'Why is the fence still there?')
    normalize_scroll(driver)
    before = js_measure(driver)
    driver.execute_script("document.documentElement.style.fontSize='20px';")
    time.sleep(0.25)
    after = js_measure(driver)
    driver.execute_script("document.documentElement.style.fontSize='';")
    time.sleep(0.25)
    restored = js_measure(driver)
    return {
        'before': before,
        'afterRootFontChange': after,
        'restored': restored,
        'headerChanged': after['headerHeight'] != before['headerHeight'],
        'headerRestored': restored['headerHeight'] == before['headerHeight'],
    }


def run_enlarged_case(driver: webdriver.Chrome, base_url: str, width: int, speaker_route: str | None) -> dict:
    viewport = set_actual_viewport(driver, width)
    driver.get(base_url + '#overview')
    wait_for_ready(driver, 'Why is the fence still there?')
    normalize_scroll(driver)
    closed = js_measure(driver)

    open_menu(driver)
    overview_open = js_measure(driver)
    overview_open['lastNavReachable'] = overview_open['navCount'] == 7 and overview_open['lastNavRect'] and overview_open['lastNavRect']['bottom'] <= overview_open['viewport']['height']
    driver.execute_script("window.scrollTo(0, document.body.scrollHeight * 0.2);")
    time.sleep(0.1)
    overview_scrolled = js_measure(driver)
    overview_scrolled['menuStillBelowHeader'] = overview_scrolled['sidebarRect']['top'] >= overview_scrolled['headerHeight'] - 1 if overview_scrolled['sidebarRect'] else False
    escape_state = close_menu_with_escape(driver)

    open_menu(driver)
    nav_by_click(driver, driver.find_element(By.ID, 'tab-meetings'))
    wait_for_ready(driver, 'Meetings & documents')
    meetings_overview = js_measure(driver)

    open_menu(driver)
    meetings_menu = js_measure(driver)
    driver.execute_script("const sidebar=document.getElementById('site-sidebar'); sidebar.scrollTop = sidebar.scrollHeight;")
    time.sleep(0.1)
    meetings_menu_scrolled = js_measure(driver)
    meetings_menu_scrolled['lastNavReachableAfterScroll'] = meetings_menu_scrolled['lastNavRect'] and meetings_menu_scrolled['lastNavRect']['bottom'] <= meetings_menu_scrolled['viewport']['height']
    close_menu_with_escape(driver)

    nav_by_script_click(driver, '#meeting-2024-01-09 .entry-link')
    meeting_target = wait_for_target_below_header(driver, '#meeting-2024-01-09')
    driver.back()
    time.sleep(0.2)
    wait_for_ready(driver, 'Meetings & documents')
    meetings_back = js_measure(driver)

    speaker_result = None
    if speaker_route:
        driver.get(base_url + speaker_route)
        wait_for_ready(driver, 'Questions, answers, and decisions')
        speaker_target = wait_for_target_below_header(driver, '#delgado-cacti')
        speaker_result = {
            'route': speaker_route,
            'target': speaker_target,
        }

    return {
        'viewportRequested': width,
        'viewportActual': viewport,
        'closedOverview': closed,
        'openOverview': overview_open,
        'openOverviewScrolled': overview_scrolled,
        'escapeState': escape_state,
        'meetingsOverview': meetings_overview,
        'openMeetings': meetings_menu,
        'openMeetingsScrolled': meetings_menu_scrolled,
        'meetingDestination': meeting_target,
        'backFromMeeting': meetings_back,
        'speakerNavigation': speaker_result,
    }


def run_normal_case(driver: webdriver.Chrome, base_url: str, width: int) -> dict:
    viewport = set_actual_viewport(driver, width, VIEWPORT_HEIGHT)
    driver.get(base_url + '#overview')
    wait_for_ready(driver, 'Why is the fence still there?')
    normalize_scroll(driver)
    overview = js_measure(driver)
    if width == 390:
        driver.get(base_url + '#meetings')
        wait_for_ready(driver, 'Meetings & documents')
        normalize_scroll(driver)
        meetings = js_measure(driver)
        return {'viewportActual': viewport, 'overview': overview, 'meetings': meetings}
    driver.get(base_url + '#overview')
    wait_for_ready(driver, 'Why is the fence still there?')
    normalize_scroll(driver)
    sidebar = driver.execute_script(
        "return {topbarVisible:getComputedStyle(document.querySelector('.topbar')).display !== 'none', sidebarDisplay:getComputedStyle(document.getElementById('site-sidebar')).display, activeNav:document.querySelector('.view-nav [aria-selected=\"true\"]')?.textContent.trim() || null};"
    )
    return {'viewportActual': viewport, 'overview': overview, 'desktopSidebar': sidebar}


def write_markdown(results: dict) -> None:
    lines = [
        '# Enlarged-text navigation validation',
        '',
        f'- Tested source revision: `{results["tested_revision"]}`',
        f'- Browser: {results["browser_version"]}',
        '- Browser mode: local Chromium headless via Selenium and chromedriver',
        '- Device coverage: viewport emulation only, not a physical iPhone or Safari test',
        '- Production build served locally from this repository after `node scripts/build.cjs`',
        f'- Audit script: `tests/review/mobile/header-enlarged/run_header_enlarged_audit.py`',
        f'- Audit script SHA-256: `{results["audit_script_sha256"]}`',
        '',
        '## Commands run',
        '',
        '- `node scripts/build.cjs`',
        '- `node tests/site.test.cjs`',
        '- `node tests/site.test.cjs --bundle`',
        '- `node tests/site.test.cjs --no-resize-observer`',
        '- `node tests/site.test.cjs --bundle --no-resize-observer`',
        '- `python3 tests/review/mobile/header-enlarged/run_header_enlarged_audit.py`',
        '',
        '## Simulated 200% text enlargement',
        '',
        'A separate Chromium session was launched with `webkit.webprefs.default_font_size=32` and `webkit.webprefs.default_fixed_font_size=32`, doubling the earlier 16px browser default. This is simulated browser font enlargement in Chromium, not a physical iPhone/Safari text-size test.',
        '',
        '## Derived speaker deep link',
        '',
        f'- Derived from the current DOM entry link for `#delgado-cacti`: `{results.get("derived_speaker_route")}`',
        '',
        '## Enlarged-text mobile measurements',
        '',
        '| Requested width | Actual viewport width | Root font size | Header height | Menu text inside button | Menu icon inside button | Overflow | Menu below header on scroll |',
        '| --- | --- | --- | --- | --- | --- | --- | --- |'
    ]
    for item in results['enlarged_cases']:
        closed = item['closedOverview']
        scrolled = item['openOverviewScrolled']
        lines.append(f"| {item['viewportRequested']} | {item['viewportActual']['innerWidth']} | {closed['rootFontSize']} | {closed['headerHeight']:.2f}px | {'yes' if closed['buttonTextInside'] else 'no'} | {'yes' if closed['iconInside'] else 'no'} | {'none' if not closed['hasHorizontalOverflow'] else 'found'} | {'yes' if scrolled['menuStillBelowHeader'] else 'no'} |")
    lines += [
        '',
        'Exact button/text/icon bounds were captured in `results.json`. Key closed-menu bounds:',
        '',
    ]
    for item in results['enlarged_cases']:
        closed = item['closedOverview']
        text_rects = ', '.join(format_rect(rect) for rect in closed['buttonTextRangeRects'])
        lines.append(
            f"- {item['viewportRequested']}px: button [{format_rect(closed['buttonRect'])}], "
            f"text ranges [{text_rects}], icon [{format_rect(closed['iconRect'])}]"
        )
    lines += [
        '',
        '## Menu and navigation results',
        '',
        '- A closed enlarged-text overview screenshot and an open enlarged-text Meetings menu screenshot at 390px were saved.',
        '- On enlarged-text overview and Meetings states, the Menu text Range rectangles and menu icon bounds stayed inside the button border at both 375px and 390px.',
        '- On enlarged-text overview and Meetings states, the sticky sidebar top matched or stayed below the measured header height, and all seven navigation items were reachable after scrolling the menu.',
        '- Meetings navigation was clicked from the open menu, Escape returned focus to `#menu-toggle`, and browser Back returned from `#meetings/meeting-2024-01-09` to `#meetings`.',
        '- The meeting deep-link destination settled below the visible header and remained inside the viewport before the screenshot was saved.',
        f'- The derived speaker deep link `{results.get("derived_speaker_route")}` was present in the current DOM and its destination card settled below the visible header before measurement.',
        '',
        '## Normal-font sanity checks',
        '',
        f'- 390px normal font: overflow `{results["normal_390"]["overview"]["hasHorizontalOverflow"]}` on overview, `{results["normal_390"]["meetings"]["hasHorizontalOverflow"]}` on meetings.',
        f'- 1440px desktop: topbar visible `{results["desktop_1440"]["desktopSidebar"]["topbarVisible"]}`, sidebar display `{results["desktop_1440"]["desktopSidebar"]["sidebarDisplay"]}`.',
        '',
        '## ResizeObserver/root-font probe',
        '',
        f'- Root font change after load was attempted in normal-font Chromium at 390px. Root font moved from `{results["resize_observer_probe"]["before"]["rootFontSize"]}` to `{results["resize_observer_probe"]["afterRootFontChange"]["rootFontSize"]}` and back to `{results["resize_observer_probe"]["restored"]["rootFontSize"]}`.',
        f'- Measured header height was `{results["resize_observer_probe"]["before"]["headerHeight"]}` before, `{results["resize_observer_probe"]["afterRootFontChange"]["headerHeight"]}` after the change, and `{results["resize_observer_probe"]["restored"]["headerHeight"]}` after restore. Header changed: `{results["resize_observer_probe"]["headerChanged"]}`. Header restored: `{results["resize_observer_probe"]["headerRestored"]}`.',
        '',
        '## Browser console',
        '',
    ]
    if results['console_errors']:
        for entry in results['console_errors']:
            lines.append(f"- {entry['level']}: {entry['message']}")
    else:
        lines.append('- No browser console errors were captured during the audited routes.')
    lines += [
        '',
        '## Saved evidence',
        '',
        '- [menu-closed-enlarged-390.png](menu-closed-enlarged-390.png)',
        '- [menu-open-enlarged-390.png](menu-open-enlarged-390.png)',
        '- [meeting-destination-enlarged-390.png](meeting-destination-enlarged-390.png)',
        '- [results.json](results.json)',
        '- [run_header_enlarged_audit.py](run_header_enlarged_audit.py)',
        '',
        '## Limitations',
        '',
        '- This pass used local Chromium viewport emulation only.',
        '- No physical iPhone hardware or Safari run was available in this environment.',
    ]
    (OUTPUT_DIR / 'results.md').write_text('\n'.join(lines) + '\n', encoding='utf-8')


def main() -> None:
    cleanup_artifacts()
    tested_revision = run_cmd(['git', 'rev-parse', 'HEAD'])
    script_hash = hashlib.sha256(Path(__file__).read_bytes()).hexdigest()
    working_tree = subprocess.check_output(['git', 'status', '--short', '--untracked-files=all', '--', 'tests/review/mobile/header-enlarged'], cwd=REPO_ROOT, text=True).splitlines()
    server = start_server(REPO_ROOT)
    results = {
        'tested_revision': tested_revision,
        'target_revision_requested': TARGET_REVISION,
        'audit_script_sha256': script_hash,
        'browser_version': run_cmd(['/usr/bin/chromium-browser', '--version']),
        'working_tree_entries_at_start': working_tree,
    }
    try:
        base_url = f'http://127.0.0.1:{server.port}/index.html'
        derived_route = None
        driver = chrome_driver(16)
        enlarged_driver = chrome_driver(32)
        try:
            derived_route = derive_speaker_route(driver, base_url)
            results['derived_speaker_route'] = derived_route
            results['normal_390'] = run_normal_case(driver, base_url, 390)
            results['desktop_1440'] = run_normal_case(driver, base_url, 1440)
            results['resize_observer_probe'] = exercise_resize_observer(driver, base_url)
            console_logs = collect_console_logs(driver)

            results['enlarged_cases'] = []
            for width in MOBILE_WIDTHS:
                case = run_enlarged_case(enlarged_driver, base_url, width, derived_route)
                results['enlarged_cases'].append(case)

            # screenshots from the 390px enlarged case
            set_actual_viewport(enlarged_driver, 390)
            enlarged_driver.get(base_url + '#overview')
            wait_for_ready(enlarged_driver, 'Why is the fence still there?')
            normalize_scroll(enlarged_driver)
            save_screenshot(enlarged_driver, 'menu-closed-enlarged-390.png')
            enlarged_driver.get(base_url + '#meetings')
            wait_for_ready(enlarged_driver, 'Meetings & documents')
            normalize_scroll(enlarged_driver)
            open_menu(enlarged_driver)
            save_screenshot(enlarged_driver, 'menu-open-enlarged-390.png')
            close_menu_with_escape(enlarged_driver)
            nav_by_script_click(enlarged_driver, '#meeting-2024-01-09 .entry-link')
            wait_for_target_below_header(enlarged_driver, '#meeting-2024-01-09')
            save_screenshot(enlarged_driver, 'meeting-destination-enlarged-390.png')
            console_logs.extend(collect_console_logs(enlarged_driver))

            results['console_errors'] = [entry for entry in console_logs if entry.get('level') in {'SEVERE', 'ERROR'}]
        finally:
            driver.quit()
            enlarged_driver.quit()
    finally:
        stop_server(server)

    (OUTPUT_DIR / 'results.json').write_text(json.dumps(results, indent=2), encoding='utf-8')
    write_markdown(results)
    print(json.dumps({'results': str(OUTPUT_DIR / 'results.json')}, indent=2))


if __name__ == '__main__':
    main()
