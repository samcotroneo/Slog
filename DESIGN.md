---
name: Slog
description: A calm, local-first sage health workspace for weight, habits, and profile check-ins.
colors:
  accent: "#7f9d77"
  accent-dark: "#5f7f5b"
  accent-soft: "#e7efe6"
  accent-wash: "#f4f8f2"
  danger: "#c96b69"
  danger-soft: "#fff2f1"
  bg: "#f6f7f8"
  surface: "#ffffff"
  surface-subtle: "#f6f7f8"
  border: "#e4e9e6"
  border-strong: "#d3ddd4"
  text: "#1f2933"
  muted: "#6b7280"
  muted-light: "#7c8793"
typography:
  headline:
    fontFamily: "Inter, ui-sans-serif, -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif"
    fontSize: "clamp(2rem, 4vw, 3.25rem)"
    fontWeight: 760
    lineHeight: 1
    letterSpacing: "-0.055em"
  title:
    fontFamily: "Inter, ui-sans-serif, -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif"
    fontSize: "1rem"
    fontWeight: 720
    lineHeight: 1.3
  body:
    fontFamily: "Inter, ui-sans-serif, -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif"
    fontSize: "1rem"
    fontWeight: 400
    lineHeight: 1.55
  label:
    fontFamily: "Inter, ui-sans-serif, -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif"
    fontSize: "0.78rem"
    fontWeight: 700
    letterSpacing: "normal"
rounded:
  xs: "8px"
  sm: "10px"
  md: "12px"
  lg: "16px"
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
    textColor: "#1f2933"
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
    rounded: "16px"
    padding: "26px"
  input:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.text}"
    rounded: "{rounded.sm}"
    padding: "12px 13px"
---

# Design System: Slog

## Overview

**Creative North Star: "Sage Health Notebook"**

Slog reads as a calm health notebook: sage actions, charcoal ink, cloud-gray canvas, compact white cards, and practical line icons. Surfaces stay white on `--bg: #f6f7f8`, borders are quiet hairlines, and shadows are soft ambient lift rather than directional depth. Icons are hand-drawn inline SVG strokes (1.8px stroke, 17–18px box) — never glyph icon fonts.

Density is spacious and generous: cards carry 26–28px internal padding, the page shell runs on a 1180px-capped centered rail, and vertical rhythm between page sections is a wide 20–28px gap. Typography does the hierarchy work instead of color or multiple type families: one font stack throughout, differentiated by precise non-standard weight steps (650/720/750/760) and tight negative letter-spacing on the largest sizes, never by switching typeface.

**Key Characteristics:**
- Sage primary actions against cloud-gray neutrals and charcoal text
- One font family for the entire interface; hierarchy comes from size, weight, and letter-spacing only
- Flat, hairline-bordered cards lifted only by one soft ambient shadow, never a hard or offset one
- Inline stroke-SVG line icons only, never glyph icon fonts
- Generous, uncluttered spacing with a task-first page composition and responsive entry/chart grid per tab

## Colors

The palette pairs a muted sage primary with charcoal text, cloud-gray canvas, pale leaf surfaces, and a strictly functional blush-red destructive state.

### Primary
- **Sage** (`#7f9d77`, `--accent`): the primary action color used on active navigation, sync, submit buttons, and progress.
- **Sage Dark** (`#5f7f5b`, `--accent-dark`): the readable hover and active depth of the primary.
- **Leaf / Mist** (`#e7efe6` / `#f4f8f2`, `--accent-soft` / `--accent-wash`): pale backgrounds for selected controls, progress tracks, and privacy context.

### Neutral
- **Cloud** (`#f6f7f8`, `--bg`): the page background; matches the `<html>` background so there is no visible seam before content paints.
- **Pure Surface** (`#ffffff`, `--surface`): every card, form panel, and input background.
- **Cloud Subtle** (`#f6f7f8`, `--surface-subtle`): the recessed track background of the trend metric tabs.
- **Soft Border** (`#e4e9e6`, `--border`) / **Border Strong** (`#d3ddd4`, `--border-strong`): quiet strokes for cards, header, dividers, and inputs.
- **Charcoal** (`#1f2933`, `--text`): all primary text and headings.
- **Stone** (`#6b7280`) / **Stone Light** (`#7c8793`): secondary copy, labels, and metadata.

### Status
- **Blush Danger** (`#c96b69`, `--danger`) / `#fff2f1` (`--danger-soft`): reserved exclusively for destructive actions.

### Named Rules
**The One Accent Rule.** Sage is the only brand color in the system. Every other color is either a neutral (white/cloud/charcoal/stone) or the single functional blush reserved for destructive actions. No second brand accent exists.

## Typography

**Body/Display Font:** Inter (with ui-sans-serif, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif fallback)

**Character:** One humanist sans carries the entire interface. Hierarchy is built entirely from size, precise fractional font-weight steps, and letter-spacing tightening at scale — never from a second typeface.

### Hierarchy
- **Headline** (760, `clamp(2rem, 4vw, 3.25rem)`, line-height 1, letter-spacing -0.055em): page titles (`<h1>` in the page heading of each tab).
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
- **Ambient Card** (`box-shadow: 0 10px 28px rgba(31, 41, 51, 0.055)`, `--shadow`): the only resting shadow token; applied uniformly to `.card`, `.entry-panel`, and `.form-card`.
- **Focus Ring** (`box-shadow: 0 0 0 3px rgba(127, 157, 119, 0.2)`): a soft sage halo on focused inputs, not a hard outline.
- **Chart Tooltip** (`box-shadow: 0 10px 24px rgba(31, 41, 51, 0.08)`): a slightly stronger floating shadow used only by the weight trend tooltip.
- **Segmented Tab** (`box-shadow: 0 2px 8px rgba(31, 41, 51, 0.06)`): the small lift given to the active/hovered pill inside the Weight/BMI/Waistline metric-tab track.

### Named Rules
**The One Shadow Rule.** There is exactly one resting elevation shadow in the system, applied identically to every card-like surface. The chart tooltip and the segmented metric-tab's active-state shadow are the explicit transient exceptions; depth differences between resting elements are expressed by border and background only, not by shadow variation.

## Shapes

Corners are soft and consistent: a 16px "lg" radius for card-level containers (`--radius`), a 12px "md" radius for compact cards and empty-state outlines (`--radius-sm`), a 10px "sm" radius for controls and fields, an 8px "xs" radius for row actions (`.btn-sm`), and a full pill radius (99px) for progress bars.

## Components

### Segmented Metric Tabs
The Weight/BMI/Waistline switcher on the You trend card is a three-way segmented control: a `--surface-subtle` track (10px radius, 3px inner padding, hairline border) holding equal-width pill buttons (7px radius). The inactive state is transparent with muted text; the active/hovered pill fills `--surface` white, turns `--accent-dark` text, and lifts with the small Segmented Tab shadow (see Elevation & Depth) — the only place in the system a selection state is shown by a background fill plus micro-shadow rather than an underline.

### Buttons
- **Shape:** 10px radius for primary and header controls, 8px for compact row actions, never fully square or fully pill except the small progress bar.
- **Primary:** solid `--accent` background, charcoal text, 700–750 weight, e.g. the submit buttons (`0 17px` padding, 44px min-height) and the sync button.
- **Hover / Focus:** primary buttons darken to `--accent-dark` and lift `translateY(-1px)` on hover; disabled sync state drops to 0.65 opacity with a `wait` cursor rather than graying out the color.
- **Ghost / Small:** `.btn-sm` is a bordered, transparent-background pill-corner button in muted text for row-level actions (Delete, Archive); its `.danger` variant swaps to the red border/text and fills `--danger-soft` on hover.
- **Sync accessibility:** the sync button keeps an explicit `aria-label` and matching `title` that change from “Sync backup” to “Syncing backup” while disabled; results render in a `role="status"` region with `aria-live="polite"`. On small screens the visual label is hidden, but the icon button and accessible name remain.

### Cards / Containers
- **Corner Style:** 16px radius.
- **Background:** solid white `--surface` on the cloud `--bg` page.
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
- **Do** keep the interface to one sage accent; use its soft/wash tonal steps for backgrounds only, never for text or borders.
- **Do** use the single Ambient Card shadow (`0 10px 28px rgba(31, 41, 51, 0.055)`) plus a hairline border for every raised surface — don't invent a second shadow depth.
- **Do** build hierarchy with this one font family's weight and size steps (650–800 for emphasis) rather than introducing a second typeface.
- **Do** draw icons as inline stroke SVGs (1.8px stroke, ~18px box) matching the existing user/chart/check/lock/plus set.
- **Do** reserve the red danger color strictly for destructive row actions (delete, archive), never for warnings or emphasis.
- **Do** preserve the shipped accessibility state model: `aria-current` for tabs, `aria-pressed` for the privacy toggle, explicit sync labels/titles, and polite live status updates.

### Don't:
- **Don't** introduce a hard-edged or offset drop shadow anywhere — this is a soft-ambient-shadow, hairline-border world, not a neobrutalist one.
- **Don't** add a second brand accent color; every non-neutral, non-danger color in this system is a tonal step of the one Sage.
- **Don't** use glyph icon fonts or raster icon images; the system's icons are hand-authored stroke SVGs.
- **Don't** hide the sync control's accessible name when compacting the header; only its visible text label is removed at the small breakpoint.
