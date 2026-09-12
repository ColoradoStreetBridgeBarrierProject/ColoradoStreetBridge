# Browser validation results

- Tested revision base: `12e56019b1fd24bf9c1a1c8630d20110eabcc3c4`
- Working tree state: dirty
- Working tree entries at run start: `?? tests/review/mobile/meeting-card-current-390.png, ?? tests/review/mobile/menu-open-current-390.png, ?? tests/review/mobile/overview-baseline-1440.png, ?? tests/review/mobile/overview-baseline-390.png, ?? tests/review/mobile/overview-baseline-768.png, ?? tests/review/mobile/overview-current-1440.png, ?? tests/review/mobile/overview-current-390.png, ?? tests/review/mobile/overview-current-768.png, ?? tests/review/mobile/results.json, ?? tests/review/mobile/results.md, ?? tests/review/mobile/run_selenium_audit.py, ?? tests/review/mobile/speaker-entry-current-390.png, ?? tests/review/mobile/text-enlarged-current-390.png`
- Audit script: `tests/review/mobile/run_selenium_audit.py`
- Audit script SHA-256: `f5b59ffb0c463e3e0049d6e0495caee7e9d2cddb4b0800571389d0ee3e4f685a`
- Browser: Chromium 152.0.7977.0
- Browser mode: local Chromium headless via Selenium and chromedriver
- Device coverage: viewport emulation only, not physical iPhone hardware or Safari
- Command: `python3 tests/review/mobile/run_selenium_audit.py`

## Viewports checked

`375px`, `390px`, `430px`, `768px`, `1440px`

## Text-enlargement simulation

A separate Chromium session was launched with `webkit.webprefs.default_font_size=32` and `webkit.webprefs.default_fixed_font_size=32`, doubling the default 16px browser font settings to approximate a 200% browser text-size case at 390px. This is not a physical iPhone/Safari text-size test.

## Current branch results

| Width | Overview/photo group | Search | Menu | Navigation + Back | Speakers | Meetings | News | Overflow | Overlap |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 375 | ok | ok | open/close ok | ok | ok | ok | ok | none | none |
| 390 | ok | ok | open/close ok | ok | ok | ok | ok | none | none |
| 430 | ok | ok | open/close ok | ok | ok | ok | ok | none | none |
| 768 | ok | ok | open/close ok | ok | ok | ok | ok | none | none |
| 1440 | ok | ok | n/a | ok | ok | ok | ok | none | none |

## Saved screenshots

- [overview-current-390.png](overview-current-390.png)
- [overview-current-768.png](overview-current-768.png)
- [overview-current-1440.png](overview-current-1440.png)
- [menu-open-current-390.png](menu-open-current-390.png)
- [speaker-entry-current-390.png](speaker-entry-current-390.png)
- [meeting-card-current-390.png](meeting-card-current-390.png)
- [text-enlarged-current-390.png](text-enlarged-current-390.png)
- [overview-baseline-390.png](overview-baseline-390.png)
- [overview-baseline-768.png](overview-baseline-768.png)
- [overview-baseline-1440.png](overview-baseline-1440.png)

## Baseline comparison

- Baseline revision: `679a0c9069e51abd82b8f974ca72c4365ca9e4f5`
- Matching overview screenshots were captured at the same top-of-page scroll position and widths below.
  - [overview-baseline-390.png](overview-baseline-390.png)
  - [overview-baseline-768.png](overview-baseline-768.png)
  - [overview-baseline-1440.png](overview-baseline-1440.png)

## Concrete findings

- No concrete layout or interaction issues were detected across the audited current-branch routes at 375, 390, 430, 768, and 1440 CSS pixels.
- The simulated 200% text-size case at 390px did not trigger the audit overflow or overlap checks.

## Unresolved gaps

- No physical iPhone or Safari run was available in this environment.
