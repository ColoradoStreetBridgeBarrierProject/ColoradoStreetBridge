# ColoradoStreetBridge

Independent searchable guide to Pasadena’s Colorado Street Bridge suicide prevention project since 2017, featuring a project timeline, speaker quotations, and timestamps, meeting recordings, City documents, and news coverage.

## Explore the guide

The website is titled **Colorado Street Bridge Project Guide**. It is an independent research guide, not an official City website.

- Project highlights and a decision timeline
- Alternatives, earlier research, responses, and evidence limits
- 71 selected entries for 19 speakers, with quotations distinguished from summaries
- 34 dated meeting records with links to recordings and corresponding documents
- 11 news and commentary links, plus the preserved City-records folder
- Search across the guide, with shareable links to individual entries

The full paper, private research archives, and working transcripts are not included. Search covers the guide’s entries, not the contents of linked documents or videos. The larger bridge photograph loads only when opened.

## Research scope

The comprehensive research baseline is September 1, 2026, with specific later checks and additions identified in the guide. Each speaker entry describes its quotation or summary provenance and the limits of its timestamp. A listed document is not a claim that it was read in full, and a selected exchange is not a complete record of a speaker’s contributions.

Links open original City records, recordings, publishers, or the existing preserved-records folder. Some sources may require a subscription or become unavailable. Linked and reproduced material retains its original attribution. This repository does not grant a blanket reuse license for third-party material.

## GitHub Pages setup

In repository **Settings → Pages**, select **Deploy from a branch**, choose **main** and **/(root)**, and save. The root `index.html` is the website entry point. GitHub serves the committed build files without an additional deployment build. See [GitHub’s publishing instructions](https://docs.github.com/en/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site).

The site uses relative asset links and hash-based navigation so it can run under this repository’s project address. Edit `index.template.html`, `styles.css`, or the readable root JavaScript sources, then run the build and checks below. Commit the generated `index.html` and `assets/guide.js` alongside the source changes. Keep private research files out of this public repository.

The interface uses a dark charcoal palette, teal accents, and system fonts. A persistent sidebar serves larger screens. On phones, a compact header opens the section menu, and forms and cards adapt to the available width. Keyboard navigation, visible focus, and reduced-motion preferences are supported.

The opening explanation and its source links are rendered into HTML so they do not wait for JavaScript. The same overview function supplies both versions. The five script files are combined into one download, with data formatting compacted without changing the source records. The introduction appears only on Overview; other sections start with their own heading. Navigation stays in the sidebar or phone menu, without a floating control over the reading area. Versioned asset URLs help readers receive matching updates.

## Local checks

Run these with Node.js. No external packages are required:

```sh
node scripts/build.cjs
node tests/site.test.cjs
node tests/site.test.cjs --bundle
node tests/site.test.cjs --no-resize-observer
node tests/site.test.cjs --bundle --no-resize-observer
```

The checks cover both readable sources and the production bundle, including data, routing, page locators, source-note search, the static overview, menu interactions, and enlarged-header offsets. They also verify the September 15 editorial cleanup: 71 entries including 35 from 15 other speakers, Overview-only introduction, distinct excerpt verification labels, and dated follow-ups separated from record notes. They are not a substitute for browser or physical-device testing.
