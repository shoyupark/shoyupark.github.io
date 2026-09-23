# Typography System — Shoyu Park Portfolio

Two typefaces only, everywhere on the site:

- **STIX Two Text** (serif, italic) — `var(--font-serif)` — used only for display/flourish moments: hero titles, case-study names, greetings, section dividers like "Work Experience."
- **Archivo** (sans) — `var(--font-sans)` — used for everything else: nav, labels, body copy, project titles, UI.

**Color rule, everywhere:** text is **black** (`var(--ink)`, `#102723`) when it sits on the white paper background, and **white** (`#ffffff` or a translucent white like `rgba(255,255,255,.9)` for secondary text) when it sits on the green mat background. Never any other text color family — only these two plus their opacity variants for hierarchy (e.g. 65–92% white for secondary lines on green).

Reference this table before styling any new text on any page — if a role isn't listed here, match it to the closest existing role rather than inventing a new size/weight.

## Display / hero

| Element | Example | Font | Style | Weight | Size | Spacing | Case | Color |
|---|---|---|---|---|---|---|---|---|
| Hero title | "My Work" | STIX Two Text | italic | 600 | `clamp(56px,9vw,124px)` | -1px | as typed | white |
| Case-study name | "Cambridge Redevelopment Authority" (CRA page hero) | STIX Two Text | italic | 600 | `clamp(48px,8vw,104px)` | normal | as typed | white |
| Eyebrow / kicker (hero) | "Brand Designer & Illustrator" | Archivo | normal | 600 | `clamp(14px,1.4vw,18px)` | 2.5px | UPPERCASE | white |
| Greeting | "Hello!" | STIX Two Text | italic | 600 | 22px | normal | as typed | white |
| About name | "Isabel S. Park" | Archivo | normal | 700 | `clamp(38px,5vw,56px)` | -1px | as typed | white |
| About section header | "Work Experience" / "Education" | STIX Two Text | italic, underline | 600 | 22px | normal | as typed | white |

## Project / case-study titles — the roles you asked about

| Element | Example | Font | Weight | Size | Spacing | Case | Color (white bg) | Color (green bg) |
|---|---|---|---|---|---|---|---|---|
| **Section kicker** (small label above a deliverable) | "Annual Report 2025", "Brand Systems", "Logo Design" | **Archivo** | **500 (Medium)** | **14px** | 1.5px | UPPERCASE | `var(--ink)` black | white `#fff` |
| **Section title** (the deliverable's name) | "CRA 2025 Annual Report", "Brandbook" | **Archivo** | **500 (Medium)** | **28px** | normal | as typed | `var(--ink)` black | white `#fff` |
| Section body text | "Designed the CRA's 69th Annual Report…" | Archivo | 400 | 14.5px | normal | as typed | `#33513f` | `rgba(255,255,255,.92)` |
| Card meta-title (homepage grid) | "CAMBRIDGE REDEVELOPMENT AUTHORITY" | Archivo | 700 | 19px | normal | UPPERCASE | `var(--mat-green-deep)` | — (cards always on white) |
| Card meta-desc | "Brand systems, print production & communications design" | Archivo | 400 | 13.5px | normal | as typed | `#3a5c48` | — |

Rule of thumb: **kicker = 14px Medium uppercase, title = 28px Medium sentence case**, directly under it. This pair repeats identically for every project deliverable on every case-study page.

## Navigation & UI

| Element | Example | Font | Weight | Size | Spacing | Case |
|---|---|---|---|---|---|---|
| Nav wordmark | "SHOYU PARK" | Archivo | 700 | `clamp(15px,1.2vw,19px)` | .5px | UPPERCASE (as typed); line-height .92 (tight, two lines) |
| Pill button | "ABOUT ME", "LinkedIn", "Contact" | Archivo | 600 | `clamp(14px,1.2vw,19px)` | .3px | as typed — matches nav wordmark size |
| Filter pill | "ALL WORK", "ILLUSTRATIONS" | Archivo | 500 | `clamp(16px,1.75vw,27px)` | .3px | UPPERCASE (forced via CSS); `.filters` uses `justify-content:space-between` so the row spans edge-to-edge with the grid below |
| Spec label (CRA specs) | "YEAR", "ORGANIZATION" | Archivo | 700 | 12px | .5px | UPPERCASE |
| Spec value | "2025–2026" | Archivo | 400 | 13px | normal | as typed |
| Footer | "© 2026 Shoyu Park" | Archivo | 400 | 12px | .3px | as typed |
| Ruler tick numbers | "5", "10", "15"… | Archivo | 600 | 9px | .5px | — |

## About page — work experience / education

| Element | Font | Style | Weight | Size | Color |
|---|---|---|---|---|---|
| Job title (company) | Archivo | normal | 700 | 15.5px | white |
| Job role | STIX Two Text | italic | 400 | 14px | white 90% |
| Job location/dates | Archivo | normal | 400 | 11px | white 65% |
| Job bullet | Archivo | normal | 400 | 13px | white 90% |
| School name | Archivo | normal | 700 | 15px | white |
| Degree | Archivo | normal | 400 | 13px | white 85% |
| Year | Archivo | normal | 400 | 12px | white 60% |

## Rules to keep consistent

1. Never introduce a third font. If something needs to feel "display," use STIX Two Text italic; if it needs to feel "UI/label," use Archivo.
2. A kicker/title pair is always Archivo Medium (500) for both, kicker uppercase + letter-spaced, title sentence-case + no letter-spacing.
3. Text color always follows the surface it sits on: black on white paper, white on the green mat — never a middle-tone color for primary text (secondary/muted text uses opacity on that same black or white, not a different hue).
4. When in doubt about a new text role's size, place it relative to this table by importance, not by eyeballing — e.g. a new "sub-label" role should sit between spec-label (12px) and section-kicker (14px), not invent a random value like 11.5px.
