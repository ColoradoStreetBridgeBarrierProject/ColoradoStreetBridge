# ColoradoStreetBridge

Independent searchable guide to Pasadena’s Colorado Street Bridge suicide prevention project since 2017, featuring a project timeline, speaker quotations, and timestamps, meeting recordings, City documents, and news coverage.

## Explore the guide

The website is titled **Colorado Street Bridge Project Guide**. It is an independent research guide, not an official City website.

- Project highlights and a decision timeline
- Alternatives, four attributed City illustrations, earlier research, responses, and evidence limits
- 71 selected entries for 19 speakers, with an all-speaker selector, topic/year filters, and quotations distinguished from summaries
- 34 dated meeting records with links to recordings and corresponding documents
- 8 news and commentary links, plus the preserved City-records folder
- Search across the guide, with shareable entry links and a return-to-results link

The full paper, private research archives, and working transcripts are not included. Search covers the guide’s entries, not the contents of linked documents or videos. The larger bridge photograph loads only when opened.

## Research scope

The comprehensive research baseline is September 1, 2026, with specific later checks and additions identified in the guide. Each speaker entry describes its quotation or summary provenance and the limits of its timestamp. A listed document is not a claim that it was read in full, and a selected exchange is not a complete record of a speaker’s contributions.

Links open original City records, recordings, publishers, or the existing preserved-records folder. Some sources may require a subscription or become unavailable. Linked and reproduced material retains its original attribution. This repository does not grant a blanket reuse license for third-party material.

Source policy set by the author on September 17, 2026: do not use Pasadena Star-News in this guide or future bridge-paper citations and research. The three former news entries were removed from the guide and search. Do not restore them or substitute other Star-News articles; use original City records or other independently reviewed sources. This exclusion does not apply to Pasadena Now or other publishers. The full paper remains private and must not be added to this repository.

A read-only check on September 17 covered the September 15 clean and highlighted Word and PDF paper files, including their 41 source notes, document text, Word XML relationships and field content, and PDF link annotations. No excluded-publisher references or URL targets were found. Clean/highlighted text and external-link targets matched within each format. No paper edits, citation renumbering, or re-export were needed; the paper files were left unchanged and unpublished. This was a publisher-dependency check, not a new verification of every source's contents.

## GitHub Pages setup

In repository **Settings → Pages**, select **Deploy from a branch**, choose **main** and **/(root)**, and save. The root `index.html` is the website entry point. GitHub serves the committed build files without an additional deployment build. See [GitHub’s publishing instructions](https://docs.github.com/en/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site).

The site uses pre-rendered section pages and relative asset links so it can run at the custom domain or under this repository’s project address. Edit `index.template.html`, `styles.css`, or the readable root JavaScript sources, then run the build and checks below. Commit all generated section `index.html` files, `sitemap.xml`, and `assets/guide.js` alongside the source changes. Keep the paper and private research files out of this public repository.

The interface uses a dark charcoal palette, teal accents, and system fonts. A persistent sidebar serves larger screens. On phones, a compact header opens the section menu, and forms and cards adapt to the available width. Keyboard navigation, visible focus, and reduced-motion preferences are supported.

Every section is rendered into HTML by the same view functions used by the interactive guide. Permanent paths are `/timeline/`, `/alternatives-studied/`, `/evidence-and-limits/`, `/who-said-what/`, `/meetings-and-documents/`, and `/news-and-commentary/`. Each of the four alternatives also has a readable subpage. Ordinary navigation links work without JavaScript and can open in a new tab. JavaScript enhances navigation, search, and filters. Old hash links, including individual entry links, remain supported. The full 71 selected entries, 34 meetings, and 8 news records are in their sections’ HTML. A `/search/` page hosts the interactive search; search itself requires JavaScript.

The five script files are combined into one download, with data formatting compacted without changing the source records. The introduction appears only on Overview; other sections start with their own heading. Navigation stays in the sidebar or phone menu, without a floating control over the reading area. Versioned asset URLs help readers receive matching updates. The build supplies section titles, descriptions, canonical URLs, and a sitemap. Source verification dates remain separate from the site update date.

The footer links to `/about/` and the project email address. About explains the research scope and corrections route without a byline and is readable without JavaScript. At the author’s request, the Changes page, its route, and its sitemap entry have been removed; earlier versions remain in Git history. The paper remains unpublished on this website.

The September 17 audit implementation adds a dated homepage status panel, grouped evidence destinations, a forecast comparison, meeting sorting, clearer source labels, and social-sharing metadata. All speaker source data remain unchanged. The September 16 removals remain in force. The illustrations are extracted from the City's July 17, 2024 presentation; provenance and image-specific limitations are documented in `assets/illustrations/README.md`. They do not establish a current shortlist or a September 2026 photograph of the fence.

The September 17 plain-language pass simplifies headings, explanations, funding and survey notes, and repeated source labels. Quotations and original speaker records remain byte-identical. Source links, dates, reported figures, and official titles are preserved. Search uses the same revised topic labels and source-note wording as the displayed entries. Original City tables retain their source fields and values. The wording update does not advance source-check dates or change the unpublished paper.

A bounded finishing pass adds Julianna Delgado's full-name and initial variants to search without changing stored remarks or display names. Illustration frames share a 4:3 ratio and contain the complete images, with their existing City-slide links and captions retained. A native anchor shortcut skips the gallery. Two redundant evidence headings were removed while preserving their search titles and entry routes. Minor copy corrections include the meeting-and-related-record count. No paper, preserved source files, or Dropbox permissions were changed.

## Local checks

The follow-up adds an optional light reading mode on every guide page and the source tables. Dark remains the default. The choice is saved only in the browser's local storage; switching still works when storage is blocked. The small `theme.js` applies that choice before the stylesheet renders. Print output stays light.

The six City-record filenames were confirmed on September 17. The author then supplied six separate, public, view-only Dropbox folder links, each containing one PDF: five sets of committee minutes and the February 3, 2020 agenda packet. The meeting directory links to the matching folders and retains the exact filenames. February 2020 minutes and the agenda packet have separate links. The broader source-folder link remains available. This link-only update changes no source documents, Dropbox permissions, layout styles, or paper files. The remaining Steve Lopez column was reviewed and described. The three unreviewed Star-News articles and their access notes were removed at the author's request. Regression checks prevent their return in site data, rendered content, and search.

Physical iPhone/Safari, enlarged-text reflow, and screen-reader operation require separate testing. The automated contrast checks cover palette tokens, not a comprehensive accessibility certification.

Run these with Node.js. No external packages are required:

```sh
node scripts/build.cjs
node tests/site.test.cjs
node tests/site.test.cjs --bundle
node tests/site.test.cjs --no-resize-observer
node tests/site.test.cjs --bundle --no-resize-observer
node tests/pages.test.cjs
node tests/reading.test.cjs
node tests/milestones.test.cjs
node tests/milestones.test.cjs --bundle
node tests/reading-paths.test.cjs
node tests/reading-paths.test.cjs --bundle
```

The September 17 milestone enhancement adds seven selected stops to the existing Timeline, covering July 2017 through the reviewed 2025–2026 records. Each preview distinguishes physical changes from project decisions and work. Preview titles, dates, narrative text, and source destinations come from the existing chronology records. Physical-status annotations are attached to those records and included in their existing search entries. The complete eleven-entry chronology, existing entry URLs, and supporting sources remain intact. The schedule comparison follows the chronology and has a shortcut near the page heading. A brief historical introduction links to the National Park Service account for 1913 and 1993; this does not advance the barrier research baseline or older source-check dates.

The author subsequently confirmed that the milestone update looked good on an iPhone. A further reading-flow review left the overview, timeline, evidence presentation, illustrations, budget emphasis, news, search, About, and preserved tables unchanged in substance. It added quiet two-way links between the four alternative summaries and their existing topic-filtered exchanges, and between eight meeting records and their matching exchange groups. Matching requires both the exact date and the exact meeting body, with no link when the match is absent or ambiguous. The published-interview group is not presented as a meeting or assigned an unrelated City record. The index now says “Jump to a date,” covering its eight meetings and one interview accurately. No entries, quotations, verification labels, source documents, research dates, or record counts changed. These are reading paths, not new research or additional interactive displays.

The milestone controls are native buttons revealed after JavaScript enhancement. Selection stays within the page, keeps focus on the button, announces the selected content, and links to the full underlying entry. Without JavaScript, readers retain the first summary and complete chronology; print output omits the interactive summary. The two tracks stack below 600px, controls wrap, and the feature adds no image, font, video, or third-party dependency. Existing illustrations remain in their attributed gallery rather than being assigned unsupported capture dates. This is a presentation update, not new verification of the quoted meeting material or an update to the unpublished paper.

The checks cover both readable sources and the production bundle, including data, routing, page locators, source-note search, static pages, menu interactions, and enlarged-header offsets. They verify 71 entries (including the legacy 35-entry group), all 19 selector options, year filtering, entry-copy controls, Overview-only introduction, distinct excerpt verification labels, and dated follow-ups retained while record-note blocks and the recurring-question callout remain excluded from views and search. The page checks cover direct loads, local links at both deployment roots, old entry links, new-tab behavior, back/forward, shared rendering, the email and 988 links, metadata, and the four illustrations. They are not a substitute for browser or physical-device testing.

The final usability pass makes ISO and numeric dates and the six displayed PDF filenames searchable. Four remaining source-reference locations use the document-specific folders, with separate links where both minutes and an agenda packet or two meetings are cited. Speaker source files remain byte-identical; the renderer supplies the updated destinations. Each alternative-detail page now has its own heading and short introduction. No styles, Dropbox permissions, source-check dates, or paper files were changed.
