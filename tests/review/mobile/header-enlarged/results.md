# Enlarged-text navigation validation

- Tested source revision: `146b16a9e066db1ec7852195d718e7ce007ad53c`
- Browser: Chromium 152.0.7977.0
- Browser mode: local Chromium headless via Selenium and chromedriver
- Device coverage: viewport emulation only, not a physical iPhone or Safari test
- Production build served locally from this repository after `node scripts/build.cjs`
- Audit script: `tests/review/mobile/header-enlarged/run_header_enlarged_audit.py`
- Audit script SHA-256: `622e4f2ad7a0cd59e93cf8a2e223928ecdd679632f2b2df8addf5a2ae4232120`

## Commands run

- `node scripts/build.cjs`
- `node tests/site.test.cjs`
- `node tests/site.test.cjs --bundle`
- `node tests/site.test.cjs --no-resize-observer`
- `node tests/site.test.cjs --bundle --no-resize-observer`
- `python3 tests/review/mobile/header-enlarged/run_header_enlarged_audit.py`

## Simulated 200% text enlargement

A separate Chromium session was launched with `webkit.webprefs.default_font_size=32` and `webkit.webprefs.default_fixed_font_size=32`, doubling the earlier 16px browser default. This is simulated browser font enlargement in Chromium, not a physical iPhone/Safari text-size test.

## Derived speaker deep link

- Derived from the current DOM entry link for `#delgado-cacti`: `#speakers/delgado/delgado-cacti`

## Enlarged-text mobile measurements

| Requested width | Actual viewport width | Root font size | Header height | Menu text inside button | Menu icon inside button | Overflow | Menu below header on scroll |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 375 | 375 | 32px | 132.98px | yes | yes | none | yes |
| 390 | 390 | 32px | 132.98px | yes | yes | none | yes |

Exact button/text/icon bounds were captured in `results.json`. Key closed-menu bounds:

- 375px: button [left 239.95, top 34.55, right 357.00, bottom 97.44, 117.05×62.89], text ranges [left 278.95, top 50.55, right 344.00, bottom 80.55, 65.05×30.00], icon [left 252.95, top 56.98, right 270.95, bottom 74.98, 18.00×18.00]
- 390px: button [left 254.95, top 34.55, right 372.00, bottom 97.44, 117.05×62.89], text ranges [left 293.95, top 50.55, right 359.00, bottom 80.55, 65.05×30.00], icon [left 267.95, top 56.98, right 285.95, bottom 74.98, 18.00×18.00]

## Menu and navigation results

- A closed enlarged-text overview screenshot and an open enlarged-text Meetings menu screenshot at 390px were saved.
- On enlarged-text overview and Meetings states, the Menu text Range rectangles and menu icon bounds stayed inside the button border at both 375px and 390px.
- On enlarged-text overview and Meetings states, the sticky sidebar top matched or stayed below the measured header height, and all seven navigation items were reachable after scrolling the menu.
- Meetings navigation was clicked from the open menu, Escape returned focus to `#menu-toggle`, and browser Back returned from `#meetings/meeting-2024-01-09` to `#meetings`.
- The meeting deep-link destination settled below the visible header and remained inside the viewport before the screenshot was saved.
- The derived speaker deep link `#speakers/delgado/delgado-cacti` was present in the current DOM and its destination card settled below the visible header before measurement.

## Normal-font sanity checks

- 390px normal font: overflow `False` on overview, `False` on meetings.
- 1440px desktop: topbar visible `False`, sidebar display `flex`.

## ResizeObserver/root-font probe

- Root font change after load was attempted in normal-font Chromium at 390px. Root font moved from `16px` to `20px` and back to `16px`.
- Measured header height was `69` before, `69` after the change, and `69` after restore. Header changed: `False`. Header restored: `True`.

## Browser console

- No browser console errors were captured during the audited routes.

## Saved evidence

- [menu-closed-enlarged-390.png](menu-closed-enlarged-390.png)
- [menu-open-enlarged-390.png](menu-open-enlarged-390.png)
- [meeting-destination-enlarged-390.png](meeting-destination-enlarged-390.png)
- [results.json](results.json)
- [run_header_enlarged_audit.py](run_header_enlarged_audit.py)

## Limitations

- This pass used local Chromium viewport emulation only.
- No physical iPhone hardware or Safari run was available in this environment.
