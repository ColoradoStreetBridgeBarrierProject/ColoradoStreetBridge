# ColoradoStreetBridge

Independent searchable guide to Pasadena’s Colorado Street Bridge suicide prevention project since 2017, featuring a project timeline, speaker quotations, and timestamps, meeting recordings, City documents, and news coverage.

## Explore the guide

The website is titled **Colorado Street Bridge Barrier Enhancements Project**. It is an independent research guide, not an official City website.

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

In repository **Settings → Pages**, select **Deploy from a branch**, choose **main** and **/(root)**, and save. The root `index.html` is the website entry point. No package installation or build step is required. See [GitHub’s publishing instructions](https://docs.github.com/en/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site).

The site uses relative asset links and hash-based navigation so it can run under this repository’s project address. Future website edits belong in the root HTML, CSS, and JavaScript files. Keep private research files out of this public repository.

## Local checks

Run `node tests/site.test.cjs` for data, routing, link, search, preservation, and public-file checks.
