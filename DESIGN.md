---
name: Slog
description: A calm, local-first green health workspace for weight, habits, and profile check-ins.
colors:
  accent: "#1b7f4d"
  accent-dark: "#176642"
  accent-soft: "#e6f3eb"
  accent-wash: "#f2faf5"
  danger: "#b84c4c"
  danger-soft: "#fff1f1"
  bg: "#f7faf7"
  surface: "#ffffff"
  surface-subtle: "#fbfdfb"
  border: "#dce8df"
  border-strong: "#c8d9cd"
  text: "#193025"
  muted: "#63756b"
  muted-light: "#5f7567"
typography:
  headline:
    fontFamily: "Avenir Next, Avenir, ui-sans-serif, -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif"
    fontSize: "clamp(2rem, 4vw, 3.25rem)"
    fontWeight: 760
    lineHeight: 1
    letterSpacing: "-0.065em"
  title:
    fontFamily: "Avenir Next, Avenir, ui-sans-serif, -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif"
    fontSize: "1rem"
    fontWeight: 720
    lineHeight: 1.3
  body:
    fontFamily: "Avenir Next, Avenir, ui-sans-serif, -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif"
    fontSize: "1rem"
    fontWeight: 400
    lineHeight: 1.55
  label:
    fontFamily: "Avenir Next, Avenir, ui-sans-serif, -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif"
    fontSize: "0.78rem"
    fontWeight: 700
    letterSpacing: "normal"
rounded:
  xs: "8px"
  sm: "10px"
  md: "12px"
  lg: "18px"
  pill: "99px"
spacing:
  xs: "8px"
  sm: "16px"
  md: "20px"
  lg: "28px"
  xl: "64px"
components:
  button-primary:
    backgroundColor: "{colors.accent}"
    textColor: "#ffffff"
    rounded: "{rounded.sm}"
    padding: "0 17px"
  button-primary-hover:
    backgroundColor: "{colors.accent-dark}"
  button-ghost:
    backgroundColor: "transparent"
    textColor: "{colors.muted}"
    rounded: "{rounded.xs}"
  button-danger-ghost:
    backgroundColor: "transparent"
    textColor: "{colors.danger}"
    rounded: "{rounded.xs}"
  card:
    backgroundColor: "{colors.surface}"
    rounded: "{rounded.lg}"
    padding: "26px"
  input:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.text}"
    rounded: "{rounded.sm}"
    padding: "12px 13px"
---

# Design System: Slog

## Overview

**Creative North Star: "The Quiet Clinic Notebook"**

Slog reads as a single calm instrument, not a dashboard: one primary green, one work surface per tab, and a heading that leads straight into its task. The build follows the direction contract's own-world (warm white surfaces, forest-green ink, thin botanical borders, quiet shadows, practical line icons) closely — every surface is `--surface: #ffffff` on a barely-tinted `--bg: #f7faf7`, every border is a hairline `1px solid var(--border)`, and every shadow is a single soft, low-opacity ambient glow rather than a directional or offset shadow. Icons are hand-drawn inline SVG strokes (1.8px stroke, 17–18px box) for user/chart/check/lock/plus — never glyph icon fonts.

Density is spacious and generous: cards carry 26–28px internal padding, the page shell runs on a 1180px-capped centered rail, and vertical rhythm between page sections is a wide 20–28px gap. Typography does the hierarchy work instead of color or multiple type families: one font stack throughout, differentiated by precise non-standard weight steps (650/720/750/760) and tight negative letter-spacing on the largest sizes, never by switching typeface.

**Key Characteristics:**
- Single-hue forest-green accent used sparingly against warm white and pale-green neutrals
- One font family for the entire interface; hierarchy comes from size, weight, and letter-spacing only
- Flat, hairline-bordered cards lifted only by one soft ambient shadow, never a hard or offset one
- Inline stroke-SVG line icons only, never glyph icon fonts
- Generous, uncluttered spacing with a task-first page composition and responsive entry/chart grid per tab

## Colors

The palette is a narrow, disciplined green-on-white system: one accent hue carried through a few tonal steps, plus a strictly functional red reserved for destructive actions.

### Primary
- **Forest Green** (`#1b7f4d`, `--accent`): the one brand color. Used on the active tab underline, the sync button, submit buttons, input focus rings, and habit progress fill. It never appears as a body-text color.
- **Forest Green Dark** (`#176642`, `--accent-dark`): the hover/active depth of the primary green — every hover state of an accent-colored element darkens to this value rather than lightening or changing hue.
- **Forest Green Soft / Wash** (`#e6f3eb` / `#f2faf5`, `--accent-soft` / `--accent-wash`): pale tonal steps of the same hue, used only as quiet backgrounds (progress-bar track, passphrase bar, active/hover wash on the privacy toggle) — never as text or borders.

### Neutral
- **Warm White** (`#f7faf7`, `--bg`): the page background; matches the `<html>` background so there is no visible seam before content paints.
- **Pure Surface** (`#ffffff`, `--surface`): every card, form panel, and input background.
- **Surface Subtle** (`#fbfdfb`, `--surface-subtle`): a barely-tinted step between `--surface` and `--bg`, used only as the recessed track background of the trend metric-tab segmented control — never a card or input surface.
- **Botanical Border** (`#dce8df`, `--border`) / **Border Strong** (`#c8d9cd`, `--border-strong`): the thin hairline borders on cards, header, dividers, and input strokes; the "strong" step is reserved for interactive strokes (inputs, dashed empty-state box) that need slightly more definition.
- **Ink** (`#193025`, `--text`): all primary text and headings.
- **Muted** (`#63756b`) / **Muted Light** (`#5f7567`): secondary copy, labels, and the lightest metadata text (counts, timestamps), in descending order of emphasis.

### Status
- **Danger** (`#b84c4c`, `--danger`) / **Danger Soft** (`#fff1f1`, `--danger-soft`): reserved exclusively for destructive actions (delete entry, archive habit) — border and hover-fill only, never a filled resting state.

### Named Rules
**The One Accent Rule.** Forest Green is the only saturated color in the system. Every other color is either a neutral (white/warm-white/ink/muted) or the single functional red reserved for destructive actions. No second brand accent exists.

## Typography

**Body/Display Font:** Avenir Next (with Avenir, ui-sans-serif, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif fallback)

**Character:** One humanist sans carries the entire interface. Hierarchy is built entirely from size, precise fractional font-weight steps, and letter-spacing tightening at scale — never from a second typeface.

### Hierarchy
- **Headline** (760, `clamp(2rem, 4vw, 3.25rem)`, line-height 1, letter-spacing -0.065em): page titles (`<h1>` in the page heading of each tab).
- **Title** (720, 1rem): card and section headings (panel title, chart heading, "Today").
- **Body** (400, 1rem, line-height 1.55): page-heading descriptive copy, capped at ~46ch.
- **Label** (700, 0.78rem): field labels and small metadata captions, set in muted color rather than uppercase treatment.

### Named Rules
**The One Family Rule.** Every text role uses the same font stack. Emphasis is achieved only through weight (650–800), size, and negative letter-spacing at large sizes — never a secondary display face.

## Layout

The app shell is a sticky white header over a single centered content rail capped at `min(1180px, calc(100% - 48px))`. Each tab renders one `.page` with a vertical flex rhythm of a 28px gap between the page heading, a two-column content grid (`1.4fr` primary / `0.8fr` secondary, e.g. entry form + chart), and a full-width list/card below. The page heading itself is a flex row: the `<h1>` + description on the left, a short muted right-aligned note on the right — this left-task / right-context split repeats on every tab.

At `820px` and below the header wraps, the tab bar moves to a full-width 48px row below the brand/actions, and the two-column content grid collapses to one column. At `600px` and below the rail becomes `100% - 32px`, the header drops to a 68px minimum, card padding becomes 20px, the page heading stacks, profile fields become one column, and entry/habit-builder forms stack with full-width submit buttons. The compact header hides the visual app title, privacy label, and sync label but keeps their icons and accessible names; sync status remains visible with a 90px ellipsis cap. Page-enter uses a single shared 420ms `cubic-bezier(0.16, 1, 0.3, 1)` fade+rise animation — no per-element stagger.

## Elevation & Depth

Flat-by-default with one soft ambient shadow, not a layered elevation scale. Cards sit on a hairline `1px solid var(--border)` and a single diffuse shadow. The only separate depth treatments are the smaller, transient Recharts tooltip shadow and the equally small segmented-tab active/hover shadow; nothing uses a directional/offset ("hard") shadow — that reads outside this world's quiet-shadow own-world.

### Shadow Vocabulary
- **Ambient Card** (`box-shadow: 0 14px 40px rgba(25, 48, 37, 0.06)`, `--shadow`): the only resting shadow token; applied uniformly to `.card`, `.entry-panel`, and `.form-card`. Its low 6% opacity keeps it a suggestion of lift, not a strong drop shadow.
- **Focus Ring** (`box-shadow: 0 0 0 3px rgba(35, 139, 90, 0.14)`): a soft green halo on focused inputs, not a hard outline.
- **Chart Tooltip** (`box-shadow: 0 10px 24px rgba(25, 48, 37, 0.08)`): a slightly stronger floating shadow used only by the weight trend tooltip; it does not establish a second resting elevation tier.
- **Segmented Tab** (`box-shadow: 0 2px 8px rgba(25, 48, 37, 0.06)`): the small lift given to the active/hovered pill inside the Weight/BMI/Waistline metric-tab track; same tint as the Ambient Card shadow at a much tighter blur, marking a selected control rather than a raised surface.

### Named Rules
**The One Shadow Rule.** There is exactly one resting elevation shadow in the system, applied identically to every card-like surface. The chart tooltip and the segmented metric-tab's active-state shadow are the explicit transient exceptions; depth differences between resting elements are expressed by border and background only, not by shadow variation.

## Shapes

Corners are soft and consistent: an 18px "lg" radius for card-level containers (`--radius`), a 12px "md" radius for empty-state outlines (`--radius-sm`), a 10px "sm" radius for controls and fields, an 8px "xs" radius for row actions (`.btn-sm`), and a full pill radius (99px) for progress bars. Borders are uniformly 1px and hairline-colored; the only exception is the dashed `1px dashed var(--border-strong)` outline on empty states, which distinguishes an unfilled placeholder from a populated card without introducing a new color or weight.

## Components

### Segmented Metric Tabs
The Weight/BMI/Waistline switcher on the You trend card is a three-way segmented control: a `--surface-subtle` track (10px radius, 3px inner padding, hairline border) holding equal-width pill buttons (7px radius). The inactive state is transparent with muted text; the active/hovered pill fills `--surface` white, turns `--accent-dark` text, and lifts with the small Segmented Tab shadow (see Elevation & Depth) — the only place in the system a selection state is shown by a background fill plus micro-shadow rather than an underline.

### Buttons
- **Shape:** 10px radius for primary and header controls, 8px for compact row actions, never fully square or fully pill except the small progress bar.
- **Primary:** solid `--accent` background, white text, 700–750 weight, e.g. the submit buttons (`0 17px` padding, 44px min-height) and the sync button.
- **Hover / Focus:** primary buttons darken to `--accent-dark` and lift `translateY(-1px)` on hover; disabled sync state drops to 0.65 opacity with a `wait` cursor rather than graying out the color.
- **Ghost / Small:** `.btn-sm` is a bordered, transparent-background pill-corner button in muted text for row-level actions (Delete, Archive); its `.danger` variant swaps to the red border/text and fills `--danger-soft` on hover.
- **Sync accessibility:** the sync button keeps an explicit `aria-label` and matching `title` that change from “Sync backup” to “Syncing backup” while disabled; results render in a `role="status"` region with `aria-live="polite"`. On small screens the visual label is hidden, but the icon button and accessible name remain.

### Cards / Containers
- **Corner Style:** 18px radius.
- **Background:** solid white `--surface` on the warm-white `--bg` page.
- **Shadow Strategy:** the single Ambient Card shadow (see Elevation & Depth) plus a hairline border — never shadow alone.
- **Internal Padding:** 26–28px at desktop, 20px at ≤600px.

### Inputs / Fields
- **Style:** white background, 1px `--border-strong` stroke, 10px radius, with 12px 13px padding for standard form inputs and 10px 12px for the passphrase field.
- **Focus:** border shifts to `--accent` plus the soft green focus-ring glow (see Elevation & Depth) — no color change to background or text.
- **Labels:** small (0.78rem), 700-weight, muted-colored, stacked above the field with an 8px gap.

### Navigation
- Header tabs are borderless, transparent-background text buttons in muted color; the active and hovered label turns `--accent-dark`, while only the active state draws a 3px green underline bar anchored to the tab's bottom edge. On mobile the tab row drops to a full-width, equally-split bar under the header. The active tab exposes `aria-current="page"`, and the privacy toggle exposes `aria-pressed`.

### Progress Bar (signature component)
A thin (7px) fully-rounded track in `--accent-soft` with a solid `--accent` fill that scales via a CSS custom property (`--progress-scale`) and animates on a 300ms `cubic-bezier(0.16, 1, 0.3, 1)` transform — the habit system's one custom, distinctive visual element.

## Do's and Don'ts

### Do:
- **Do** keep the interface to one saturated accent (Forest Green); use its soft/wash tonal steps for backgrounds only, never for text or borders.
- **Do** use the single Ambient Card shadow (`0 14px 40px rgba(25, 48, 37, 0.06)`) plus a hairline border for every raised surface — don't invent a second shadow depth.
- **Do** build hierarchy with this one font family's weight and size steps (650–800 for emphasis) rather than introducing a second typeface.
- **Do** draw icons as inline stroke SVGs (1.8px stroke, ~18px box) matching the existing user/chart/check/lock/plus set.
- **Do** reserve the red danger color strictly for destructive row actions (delete, archive), never for warnings or emphasis.
- **Do** preserve the shipped accessibility state model: `aria-current` for tabs, `aria-pressed` for the privacy toggle, explicit sync labels/titles, and polite live status updates.

### Don't:
- **Don't** introduce a hard-edged or offset drop shadow anywhere — this is a soft-ambient-shadow, hairline-border world, not a neobrutalist one.
- **Don't** add a second brand accent color; every non-neutral, non-danger color in this system is a tonal step of the one Forest Green.
- **Don't** use glyph icon fonts or raster icon images; the system's icons are hand-authored stroke SVGs.
- **Don't** hide the sync control's accessible name when compacting the header; only its visible text label is removed at the small breakpoint.
