'use strict';
// Directory additions checked at their stated scope on September 12, 2026.
const resourceUrls = {
  "dropbox": "https://www.dropbox.com/scl/fo/fulazr7h1pcj6tgpkbeoi/ANjuObtxDwDhjr9IU5Wv-M0?rlkey=f4t0ypr91hr7o0cimhcdb1773&dl=0",
  "v2019": "https://pasadena.granicus.com/MediaPlayer.php?clip_id=4580&view_id=25",
  "m2021": "https://www.cityofpasadena.net/public-works/wp-content/uploads/sites/29/2021-08-18-Public-Safety-Committee-Minutes.pdf",
  "jan24memo": "https://www.cityofpasadena.net/commissions/wp-content/uploads/sites/31/2024-01-09-Design-Commission-4A-Colorado-St.-Bridge-Barrier-Memo.pdf",
  "fire2026": "https://www.cityofpasadena.net/commissions/wp-content/uploads/sites/31/2026-05-20-Public-Safety-Committee-Meeting-Agenda.pdf#page=22",
  "lamag": "https://lamag.com/architecture/colorado-street-bridge/",
  "wpra": "https://wpra.net/wp-content/uploads/2025/12/2026-A-Winter-newsletter.pdf#page=8"
};
const meetingRecords = [
  {
    "id": "meeting-2017-07-19",
    "date": "2017-07-19",
    "body": "Public Safety Committee",
    "title": "Early mitigation proposals",
    "links": [
      {
        "label": "Presentation",
        "source": "p2017"
      },
      {
        "label": "Preserved minutes in Dropbox",
        "source": "dropbox"
      }
    ],
    "note": "The reviewed record uses written minutes and the presentation. A recording was not recovered.",
    "kind": "Project meeting"
  },
  {
    "id": "meeting-2017-11-29",
    "date": "2017-11-29",
    "body": "Community meeting",
    "title": "Public suggestions and alternatives",
    "links": [
      {
        "label": "Presentation",
        "url": "https://www.cityofpasadena.net/public-works/wp-content/uploads/sites/29/2017-11-29-Colorado-Street-Bridge-Community-Meeting.pdf"
      },
      {
        "label": "Meeting flyer",
        "url": "https://www.cityofpasadena.net/public-works/wp-content/uploads/sites/29/2017-11-29-Community-Meeting-Flyer.pdf"
      }
    ],
    "note": "",
    "kind": "Project meeting"
  },
  {
    "id": "meeting-2018-02-20",
    "date": "2018-02-20",
    "body": "Community meeting",
    "title": "Evaluation of the proposed measures",
    "links": [
      {
        "label": "Presentation",
        "url": "https://www.cityofpasadena.net/public-works/wp-content/uploads/sites/29/2018-02-20-Colorado-Bridge-Presentation-Final.pdf"
      }
    ],
    "note": "",
    "kind": "Project meeting"
  },
  {
    "id": "meeting-2018-04-18",
    "date": "2018-04-18",
    "body": "Public Safety Committee",
    "title": "Task-force recommendation",
    "links": [
      {
        "label": "Agenda report",
        "url": "https://www.cityofpasadena.net/public-works/wp-content/uploads/sites/29/2018-04-18-Colorado-Street-Bridge-Agenda.pdf"
      },
      {
        "label": "Presentation",
        "source": "p2018"
      },
      {
        "label": "Preserved minutes in Dropbox",
        "source": "dropbox"
      }
    ],
    "note": "A recording was not recovered. The preserved minutes document the committee’s recommendation.",
    "kind": "Project meeting"
  },
  {
    "id": "meeting-2018-04-23",
    "date": "2018-04-23",
    "body": "City Council",
    "title": "Council considers the task-force recommendation",
    "links": [
      {
        "label": "Recording",
        "source": "v2018"
      },
      {
        "label": "Bridge agenda report",
        "source": "r2018"
      },
      {
        "label": "Approved minutes",
        "source": "m2018"
      },
      {
        "label": "Minutes · Public Works copy",
        "url": "https://www.cityofpasadena.net/public-works/wp-content/uploads/sites/29/2018-04-23-City-Council-Meeting-Minutes.pdf"
      },
      {
        "label": "Task-force presentation",
        "source": "p2018"
      }
    ],
    "note": "The bridge item begins at approximately 00:52:35.",
    "kind": "Project meeting"
  },
  {
    "id": "meeting-2018-05-07",
    "date": "2018-05-07",
    "body": "City Council",
    "title": "Environmental and design funding",
    "links": [
      {
        "label": "Staff report · p. 2",
        "url": "https://ww2.cityofpasadena.net/2018%20Agendas/May_07_18/AR.%207.pdf#page=2"
      },
      {
        "label": "Funding exhibit · p. 1",
        "url": "https://ww2.cityofpasadena.net/2018%20Agendas/May_07_18/AR.%207%20ATTACHMENT%20B.pdf#page=1"
      },
      {
        "label": "Approved minutes · pp. 7–9",
        "url": "https://ww2.cityofpasadena.net/2018%20Agendas/Minutes%202018/2018%2005%2007%20CC%20MIN.pdf#page=7"
      }
    ],
    "note": "",
    "kind": "Funding record"
  },
  {
    "id": "meeting-2019-04-17",
    "date": "2019-04-17",
    "body": "Public Safety Committee",
    "title": "Consultant schedule and budget review",
    "links": [
      {
        "label": "Preserved minutes in Dropbox",
        "source": "dropbox"
      }
    ],
    "note": "Preserved minutes, pages 2–3, record the discussion. A recording was not recovered.",
    "kind": "Project meeting"
  },
  {
    "id": "meeting-2019-05-15",
    "date": "2019-05-15",
    "body": "Public Safety Committee",
    "title": "Revised consultant recommendation",
    "links": [
      {
        "label": "Preserved minutes in Dropbox",
        "source": "dropbox"
      },
      {
        "label": "City-linked agenda packet",
        "url": "https://www.cityofpasadena.net/public-works/wp-content/uploads/sites/29/2019-05-15-Public-Safety-Committee-Minutes.pdf"
      }
    ],
    "note": "The City project page labels its 46-page packet “Minutes.” Use the preserved minutes, pages 2–3, for the recorded motion and vote. A recording was not recovered.",
    "kind": "Project meeting"
  },
  {
    "id": "meeting-2019-05-20",
    "date": "2019-05-20",
    "body": "City Council",
    "title": "Consultant contract and revised design schedule",
    "links": [
      {
        "label": "Recording",
        "source": "v2019"
      },
      {
        "label": "Bridge agenda report",
        "source": "r2019"
      },
      {
        "label": "Bridge agenda report · Public Works copy",
        "url": "https://www.cityofpasadena.net/public-works/wp-content/uploads/sites/29/2019-05-20-City-Council-Meeting-Agenda.pdf"
      },
      {
        "label": "Approved minutes",
        "url": "https://www.cityofpasadena.net/public-works/wp-content/uploads/sites/29/2019-05-20-City-Council-Meeting-Minutes.pdf"
      }
    ],
    "note": "The bridge presentation begins at approximately 00:47:19.",
    "kind": "Project meeting"
  },
  {
    "id": "meeting-2019-09-26",
    "date": "2019-09-26",
    "body": "Community meeting",
    "title": "First design-cycle community presentation",
    "links": [
      {
        "label": "Presentation",
        "url": "https://www.cityofpasadena.net/public-works/wp-content/uploads/sites/29/2019-09-26-Community-Meeting-Presentation.pdf"
      },
      {
        "label": "Meeting notice",
        "url": "https://www.cityofpasadena.net/public-works/wp-content/uploads/sites/29/2019-09-26-Colorado-Bridge-Enhancement-Postcard.pdf"
      }
    ],
    "note": "",
    "kind": "Project meeting"
  },
  {
    "id": "meeting-2019-10-29",
    "date": "2019-10-29",
    "body": "Community meeting",
    "title": "Further community design review",
    "links": [
      {
        "label": "Presentation via City project page",
        "url": "https://www.cityofpasadena.net/public-works/engineering-and-construction/construction/colorado-street-bridge/",
        "note": "The City lists this document, but its direct file could not be recovered in this update."
      },
      {
        "label": "Meeting notice",
        "url": "https://www.cityofpasadena.net/public-works/wp-content/uploads/sites/29/2019-10-29-Colorado-Street-Bridge-Meeting-Notice.pdf"
      }
    ],
    "note": "",
    "kind": "Project meeting"
  },
  {
    "id": "meeting-2019-11-19",
    "date": "2019-11-19",
    "body": "Historic Preservation Commission",
    "title": "Barrier concepts and preservation review",
    "links": [
      {
        "label": "Staff memo",
        "url": "https://www.cityofpasadena.net/public-works/wp-content/uploads/sites/29/2019-11-19-Historic-Preservation-Commission-Memo.pdf"
      },
      {
        "label": "Presentation",
        "url": "https://www.cityofpasadena.net/public-works/wp-content/uploads/sites/29/2019-11-19-Historic-Preservation-Commission-Presentation.pdf"
      }
    ],
    "note": "",
    "kind": "Project meeting"
  },
  {
    "id": "meeting-2019-11-26",
    "date": "2019-11-26",
    "body": "Design Commission",
    "title": "Barrier concept review",
    "links": [
      {
        "label": "Staff memo via City project page",
        "url": "https://www.cityofpasadena.net/public-works/engineering-and-construction/construction/colorado-street-bridge/",
        "note": "The City lists this document, but its direct file could not be recovered in this update."
      },
      {
        "label": "Presentation via City project page",
        "url": "https://www.cityofpasadena.net/public-works/engineering-and-construction/construction/colorado-street-bridge/",
        "note": "The City lists this document, but its direct file could not be recovered in this update."
      }
    ],
    "note": "",
    "kind": "Project meeting"
  },
  {
    "id": "meeting-2020-02-03",
    "date": "2020-02-03",
    "body": "Public Safety Committee",
    "title": "Design alternatives and enclosure request",
    "links": [
      {
        "label": "Staff memo",
        "url": "https://www.cityofpasadena.net/public-works/wp-content/uploads/sites/29/2020-02-03-Public-Safety-Committee-Memo.pdf"
      },
      {
        "label": "Presentation",
        "url": "https://www.cityofpasadena.net/public-works/wp-content/uploads/sites/29/2020-02-03-Public-Safety-Committee-Presentation.pdf"
      },
      {
        "label": "Preserved agenda and minutes in Dropbox",
        "source": "dropbox"
      }
    ],
    "note": "The City Clerk supplied agenda and minutes in September 2026. A recording was not recovered.",
    "kind": "Project meeting"
  },
  {
    "id": "meeting-2021-03-25",
    "date": "2021-03-25",
    "body": "Virtual open house",
    "title": "Mockups and design concepts",
    "links": [
      {
        "label": "Recording",
        "url": "https://vimeo.com/530523714"
      },
      {
        "label": "Presentation",
        "url": "https://www.cityofpasadena.net/public-works/wp-content/uploads/sites/29/2021-03-25-Virtual-Open-House-Presentation.pdf"
      },
      {
        "label": "Open-house notice",
        "url": "https://www.cityofpasadena.net/public-works/wp-content/uploads/sites/29/Colorado-Street-Bridge-Barrier-Virtual-Open-House.pdf"
      }
    ],
    "note": "",
    "kind": "Project meeting"
  },
  {
    "id": "meeting-2021-04-20",
    "date": "2021-04-20",
    "body": "Historic Preservation Commission",
    "title": "Review following design development",
    "links": [
      {
        "label": "Presentation via City project page",
        "url": "https://www.cityofpasadena.net/public-works/engineering-and-construction/construction/colorado-street-bridge/",
        "note": "The City lists this document, but its direct file could not be recovered in this update."
      },
      {
        "label": "Staff memo",
        "url": "https://www.cityofpasadena.net/public-works/wp-content/uploads/sites/29/2021-04-20-Historic-Preservation-Commission-Memo.pdf"
      },
      {
        "label": "Minutes",
        "url": "https://www.cityofpasadena.net/public-works/wp-content/uploads/sites/29/2021-04-20-Historic-Preservation-Commission-Minutes.pdf"
      },
      {
        "label": "Additional City-linked memo copy",
        "url": "https://www.cityofpasadena.net/public-works/wp-content/uploads/sites/29/2021-04-20-Historic-Preservation-Commission-Memo-1.pdf"
      }
    ],
    "note": "",
    "kind": "Project meeting"
  },
  {
    "id": "meeting-2021-05-11",
    "date": "2021-05-11",
    "body": "Design Commission",
    "title": "Design concepts and advisory review",
    "links": [
      {
        "label": "Presentation",
        "url": "https://www.cityofpasadena.net/public-works/wp-content/uploads/sites/29/2021-05-11-Design-Commission-Presentation.pdf"
      },
      {
        "label": "Staff memo",
        "url": "https://www.cityofpasadena.net/public-works/wp-content/uploads/sites/29/2021-05-11-Design-Commision-Memo.pdf"
      },
      {
        "label": "Minutes",
        "url": "https://www.cityofpasadena.net/public-works/wp-content/uploads/sites/29/2021-05-11-Design-Commission-Minutes.pdf"
      }
    ],
    "note": "",
    "kind": "Project meeting"
  },
  {
    "id": "meeting-2021-08-18",
    "date": "2021-08-18",
    "body": "Public Safety Committee",
    "title": "Recommendation of a barrier design option",
    "links": [
      {
        "label": "Recording",
        "source": "v2021"
      },
      {
        "label": "Staff report and attachments · Scanned PDF · 28 pages",
        "source": "r2021"
      },
      {
        "label": "Searchable copy, unverified text layer",
        "source": "ocr2021"
      },
      {
        "label": "Hand-checked survey, police, and fiscal tables",
        "source": "transcriptions"
      },
      {
        "label": "Minutes",
        "source": "m2021"
      }
    ],
    "note": "",
    "kind": "Project meeting"
  },
  {
    "id": "meeting-2022-09-21",
    "date": "2022-09-21",
    "body": "Public Safety Committee",
    "title": "Project status and next design phase",
    "links": [
      {
        "label": "Staff report · Scanned PDF · 4 pages",
        "source": "r2022"
      },
      {
        "label": "Searchable copy, unverified text layer",
        "source": "ocr2022"
      },
      {
        "label": "Hand-checked schedule and fiscal transcription",
        "url": "https://coloradostreetbridgeproject.com/preserved-records/tables.html#schedule-2022"
      }
    ],
    "note": "",
    "kind": "Project meeting"
  },
  {
    "id": "meeting-2023-02-22",
    "date": "2023-02-22",
    "body": "Community meeting",
    "title": "Community outreach on the next design phase",
    "links": [
      {
        "label": "Recording on Zoom",
        "url": "https://us02web.zoom.us/rec/share/gzTld8ZUtAQsW4Whr_091UtnK_6ItwVHh6qOdW7gA-QdFQkWYrd5rTkZAvp1u2-7.uj6ZtRON1D2DrjYW?startTime=1677119497000"
      },
      {
        "label": "Presentation",
        "url": "https://www.cityofpasadena.net/public-works/wp-content/uploads/sites/29/2023-02-22-Community-Outreach-Meeting-Presentation.pdf"
      }
    ],
    "note": "The recording link is the one listed by the City. Its playback and continuing availability were not verified in this update.",
    "kind": "Project meeting"
  },
  {
    "id": "meeting-2023-08-29",
    "date": "2023-08-29",
    "body": "Community meeting",
    "title": "Community engagement on new concepts",
    "links": [
      {
        "label": "Recording",
        "url": "https://vimeo.com/859416891"
      },
      {
        "label": "Presentation via City project page",
        "url": "https://www.cityofpasadena.net/public-works/engineering-and-construction/construction/colorado-street-bridge/",
        "note": "The City lists this document, but its direct file could not be recovered in this update."
      },
      {
        "label": "Meeting postcard",
        "url": "https://www.cityofpasadena.net/public-works/wp-content/uploads/sites/29/2023-08-29-Community-Engagement-Postcard.pdf"
      }
    ],
    "note": "",
    "kind": "Project meeting"
  },
  {
    "id": "meeting-2023-10-26",
    "date": "2023-10-26",
    "body": "Community meeting",
    "title": "Further development of the concepts",
    "links": [
      {
        "label": "Recording",
        "url": "https://vimeo.com/878820144/1a78d5b55e"
      },
      {
        "label": "Presentation via City project page",
        "url": "https://www.cityofpasadena.net/public-works/engineering-and-construction/construction/colorado-street-bridge/",
        "note": "The City lists this document, but its direct file could not be recovered in this update."
      }
    ],
    "note": "The linked meeting and recording are dated October 26. An introductory paragraph on the City page instead says October 27.",
    "kind": "Project meeting"
  },
  {
    "id": "meeting-2023-11-15",
    "date": "2023-11-15",
    "body": "Public Safety Committee",
    "title": "Three new concepts, alternatives, and further direction",
    "links": [
      {
        "label": "Recording",
        "source": "v2023"
      },
      {
        "label": "Agenda",
        "url": "https://www.cityofpasadena.net/public-works/wp-content/uploads/sites/29/2023-11-15-Public-Safety-Committee-Agenda.pdf"
      },
      {
        "label": "Presentation",
        "source": "p2023"
      }
    ],
    "note": "",
    "kind": "Project meeting"
  },
  {
    "id": "meeting-2023-12-05",
    "date": "2023-12-05",
    "body": "Historic Preservation Commission",
    "title": "Review of the three new designs",
    "links": [
      {
        "label": "Presentation via City project page",
        "url": "https://www.cityofpasadena.net/public-works/engineering-and-construction/construction/colorado-street-bridge/",
        "note": "The City lists this document, but its direct file could not be recovered in this update."
      },
      {
        "label": "Minutes",
        "url": "https://www.cityofpasadena.net/commissions/wp-content/uploads/sites/31/2023-12-05-Historic-Preservation-Commission-Minutes.pdf"
      }
    ],
    "note": "",
    "kind": "Project meeting"
  },
  {
    "id": "meeting-2024-01-09",
    "date": "2024-01-09",
    "body": "Design Commission",
    "title": "Designs and renewed questions about alternatives",
    "links": [
      {
        "label": "Recording",
        "source": "vjan24"
      },
      {
        "label": "Agenda",
        "url": "https://www.cityofpasadena.net/commissions/wp-content/uploads/sites/31/2024-01-09-Design-Commission-Agenda.pdf"
      },
      {
        "label": "Staff memo",
        "source": "jan24memo"
      },
      {
        "label": "Presentation via City project page",
        "url": "https://www.cityofpasadena.net/public-works/engineering-and-construction/construction/colorado-street-bridge/",
        "note": "The City lists this document, but its direct file could not be recovered in this update."
      },
      {
        "label": "Minutes",
        "source": "mjan24"
      }
    ],
    "note": "",
    "kind": "Project meeting"
  },
  {
    "id": "meeting-2024-07-17",
    "date": "2024-07-17",
    "body": "Public Safety Committee",
    "title": "Designs, netting, staffing, survey, and rescue review",
    "links": [
      {
        "label": "Recording",
        "source": "v2024"
      },
      {
        "label": "Revised agenda and staff report",
        "url": "https://www.cityofpasadena.net/public-works/wp-content/uploads/sites/29/2024-07-17-Public-Safety-Committee-Agenda.pdf"
      },
      {
        "label": "Presentation",
        "source": "p2024"
      },
      {
        "label": "Minutes",
        "source": "m2024"
      }
    ],
    "note": "",
    "kind": "Project meeting"
  },
  {
    "id": "meeting-2025-09-08",
    "date": "2025-09-08",
    "body": "Finance & Audit Committee",
    "title": "FY2025 fourth-quarter project report",
    "links": [
      {
        "label": "Agenda packet · Bridge row, p. 33",
        "url": "https://www.cityofpasadena.net/commissions/wp-content/uploads/sites/31/2025-09-08-Finance-Audit-Committee-Agenda.pdf#page=33"
      }
    ],
    "note": "",
    "kind": "Funding and milestone record"
  },
  {
    "id": "meeting-2025-10-27",
    "date": "2025-10-27",
    "body": "Finance & Audit Committee",
    "title": "FY2026 first-quarter project report",
    "links": [
      {
        "label": "Agenda packet · Bridge row, p. 80",
        "url": "https://www.cityofpasadena.net/commissions/wp-content/uploads/sites/31/2025-10-27-Finance-Audit-Committee-Meeting-Agenda.pdf#page=80"
      }
    ],
    "note": "",
    "kind": "Funding and milestone record"
  },
  {
    "id": "meeting-2026-02-23",
    "date": "2026-02-23",
    "body": "Finance Committee",
    "title": "FY2026 second-quarter project report",
    "links": [
      {
        "label": "Agenda packet · Bridge row, p. 41",
        "url": "https://www.cityofpasadena.net/commissions/wp-content/uploads/sites/31/2026-02-23-Finance-Committee-Agenda.pdf#page=41"
      }
    ],
    "note": "",
    "kind": "Funding and milestone record"
  },
  {
    "id": "meeting-2026-04-20",
    "date": "2026-04-20",
    "body": "Finance Committee / City Council",
    "title": "Capital budget and Bridge funding discussion",
    "links": [
      {
        "label": "Recording",
        "source": "v2026"
      },
      {
        "label": "Revised agenda",
        "url": "https://www.cityofpasadena.net/commissions/wp-content/uploads/sites/31/2026-04-20-Joint-Meeting-of-the-Finance-Committee-and-or-City-Council-Revised.pdf"
      },
      {
        "label": "Supplemental available-balance sheet · p. 2",
        "url": "https://www.cityofpasadena.net/commissions/wp-content/uploads/sites/31/2026-04-20-Finance-Committee-and-or-City-Council-Agenda-Supplemental-Correspondence-Item-1-FY26-CIP-Available-Balance.pdf#page=2"
      }
    ],
    "note": "Selected recording locators include 00:08:10, 00:09:15, 01:59:13, and 02:00:24. The funding program, shortlist amount, and match remain unreconciled. The supplemental sheet’s note-to-row association awaits visual verification.",
    "kind": "Funding discussion"
  },
  {
    "id": "meeting-2026-05-11",
    "date": "2026-05-11",
    "body": "Finance Committee",
    "title": "FY2026 third-quarter project report",
    "links": [
      {
        "label": "Agenda packet · report starts p. 12",
        "url": "https://www.cityofpasadena.net/commissions/wp-content/uploads/sites/31/2026-05-11-Finance-Committee-Agenda.pdf#page=12"
      }
    ],
    "note": "",
    "kind": "Funding and milestone record"
  },
  {
    "id": "meeting-2026-05-20",
    "date": "2026-05-20",
    "body": "Public Safety Committee",
    "title": "Related Fire equipment presentation",
    "links": [
      {
        "label": "Agenda packet · equipment list, p. 22",
        "source": "fire2026"
      }
    ],
    "note": "The equipment list names a rescue cushion but gives no height rating. It does not answer the 2024 higher-capacity question.",
    "kind": "Related operational record"
  },
  {
    "id": "meeting-2026-08-24",
    "date": "2026-08-24",
    "body": "Finance & Audit Committee",
    "title": "FY2026 fourth-quarter project report",
    "links": [
      {
        "label": "Full agenda packet · Bridge row · PDF p. 184 (report p. 4)",
        "source": "q426"
      },
      {
        "label": "Single-page excerpt · PDF p. 184",
        "source": "financeExcerpt"
      },
      {
        "label": "Hand-checked project 73324 row",
        "url": "https://coloradostreetbridgeproject.com/preserved-records/tables.html#finance-2026"
      }
    ],
    "note": "The report covers activity through June 30, 2026. The excerpt preserves the entire source page and adds the packet date, page locator, and capture date outside the original page.",
    "kind": "Funding and milestone record"
  },
  {
    "id": "meeting-2026-09-16",
    "date": "2026-09-16",
    "body": "Public Safety Committee",
    "title": "Agenda monitored for a possible Bridge return",
    "links": [
      {
        "label": "Agenda packet · 160 pages",
        "url": "https://www.cityofpasadena.net/commissions/wp-content/uploads/sites/31/2026-09-16-Public-Safety-Committee-Meeting-Agenda.pdf"
      }
    ],
    "note": "Agenda review for the September 16, 2026 meeting: no Bridge-specific item was listed on pages 1–6, read September 12. No meeting outcome is established by that agenda review. The full 160-page packet was not read for this guide.",
    "kind": "Agenda monitoring"
  }
];
const newsRecords = [
  {
    "id": "lat-1989",
    "date": "1989-09-03",
    "publisher": "Los Angeles Times",
    "title": "Fixing Bridges, Pasadena Restores Links to Past",
    "url": "https://www.latimes.com/archives/la-xpm-1989-09-03-ga-2388-story.html",
    "kind": "Historical reporting",
    "note": ""
  },
  {
    "id": "lat-1992",
    "date": "1992-11-26",
    "publisher": "Los Angeles Times",
    "title": "When Angels Saved Her",
    "url": "https://www.latimes.com/archives/la-xpm-1992-11-26-gl-1128-story.html",
    "kind": "Historical reporting",
    "note": ""
  },
  {
    "id": "gnp-2013",
    "date": "2013-06-21",
    "publisher": "Glendale News-Press / Los Angeles Times",
    "title": "Pasadena seeks to curb suicides at Colorado Street Bridge with messages of hope",
    "url": "https://www.latimes.com/socal/glendale-news-press/news/tn-gnp-xpm-2013-06-21-pasadenasu-pasadena-hopes-to-curb-suicides-from-colorado-street-bridge-with-messages-of-hope-20130621-story.html",
    "kind": "News report",
    "note": ""
  },
  {
    "id": "lat-2017",
    "date": "2017-07-19",
    "publisher": "Los Angeles Times",
    "title": "People keep leaping to their deaths from iconic Pasadena bridge. How do we stop them?",
    "url": "https://www.latimes.com/local/california/la-me-lopez-bridge-suicide-07192017-story.html",
    "kind": "Steve Lopez column",
    "note": ""
  },
  {
    "id": "lamag-2018",
    "date": "2018-06-18",
    "publisher": "Los Angeles magazine",
    "title": "The Complicated Case of the Colorado Street Bridge",
    "url": "https://lamag.com/architecture/colorado-street-bridge/",
    "kind": "Interview and reporting",
    "note": ""
  },
  {
    "id": "pnow-2018",
    "date": "2018-09-04",
    "publisher": "Pasadena Now",
    "title": "Pasadena to Install Emergency Fencing Along Entire Length of Colorado Street Bridge to Prevent Suicides",
    "url": "https://pasadenanow.com/main/pasadena-to-install-emergency-fencing-along-entire-length-of-colorado-street-bridge-to-prevent-suicides",
    "kind": "News report",
    "note": ""
  },
  {
    "id": "pnow-2024",
    "date": "2024-07-15",
    "publisher": "Pasadena Now",
    "title": "Pasadena City Council Committee to Review Update on Colorado Street Bridge Barrier Designs",
    "url": "https://pasadenanow.com/main/pasadena-city-council-committee-to-review-update-on-colorado-street-bridge-barrier-designs",
    "kind": "Meeting preview",
    "note": ""
  },
  {
    "id": "wpra-2026",
    "date": "2026 Winter",
    "publisher": "West Pasadena Residents’ Association",
    "title": "Observe the three A’s and P’s for critical preservation issues",
    "url": "https://wpra.net/wp-content/uploads/2025/12/2026-A-Winter-newsletter.pdf#page=8",
    "kind": "Sue Mossman commentary",
    "note": "Winter 2026 newsletter, page 8. This is a preservation perspective, not a City decision."
  }
];
