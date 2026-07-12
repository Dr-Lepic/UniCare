# UniCare Design System

Refined-minimalist · light theme · system font stack · role-accented.
Single source of truth: **`client/src/index.css`** (`:root` tokens). Change a token there and it flows to every screen.
Live reference: [styleguide Artifact](https://claude.ai/code/artifact/205ca232-0f29-4f50-a081-ef3693638b6e).

---

## 01 · Color

### Neutrals
| Token | Hex | Use |
|---|---|---|
| `--bg` | `#FFFFFF` | Cards, inputs, sidebar |
| `--surface` | `#F6F7F9` | App canvas |
| `--surface-2` | `#EEF0F3` | Chips, subtle fills |
| `--border` | `#E5E8EC` | Hairline dividers |
| `--border-strong` | `#D3D8DE` | Input / button outlines |
| `--text` | `#0F1729` | Primary text |
| `--text-sub` | `#4B5565` | Secondary text |
| `--muted` | `#9AA2B1` | Labels, hints |

### Brand accent
Default `--accent`; **overridden per role** on `.panel` (see §06).

| Token | Hex | Use |
|---|---|---|
| `--accent` | `#2563EB` | Primary actions, active states |
| `--accent-strong` | `#1D4ED8` | Primary hover |
| `--accent-weak` | `#EFF4FF` | Tinted backgrounds, active nav |
| `--focus` | `rgba(37,99,235,.22)` | Focus ring |

### Status (semantic — separate from the accent)
| State | Background | Foreground |
|---|---|---|
| Pending | `#FEF3C7` | `#92610E` |
| Confirmed | `#DBEAFE` | `#1E40AF` |
| Completed | `#D1FAE5` | `#047857` |
| Cancelled | `#FEE2E2` | `#B91C1C` |

---

## 02 · Typography

System UI stack — `system-ui, -apple-system, "Segoe UI", Roboto, sans-serif`. Hierarchy comes from scale, weight, and letter-spacing (no webfont).

| Token | Size | Typical weight | Use |
|---|---|---|---|
| `--fs-2xl` | 2.25rem | 700 | Page-level display |
| `--fs-xl` | 1.75rem | 700 | Hero name, section H1 |
| `--fs-lg` | 1.375rem | 700 | Card / panel headings |
| `--fs-md` | 1.0625rem | 600 | Sub-headings |
| `--fs-base` | 0.9375rem | 400 | Body (default) |
| `--fs-sm` | 0.8125rem | 500 | Secondary text, rows |
| `--fs-xs` | 0.75rem | 600 | Uppercase labels (`letter-spacing: .06em`) |

Base line-height `1.55`; headings use `letter-spacing: -.01em` to `-.02em`.

---

## 03 · Spacing & radii

**Spacing** — 4px base: `4 · 8 · 12 · 16 · 24 · 32 · 48`. Prefer flex/grid `gap` over per-element margins.

**Radii**

| Token | Value | Use |
|---|---|---|
| `--r-sm` | 6px | Nav links, small chips |
| `--r-md` | 10px | Buttons, inputs, cards |
| `--r-lg` | 14px | Hero, large panels |
| `--pill` | 999px | Pills, badges, avatars |

---

## 04 · Elevation

Soft, low-opacity. Cards rest at `xs`; hover lifts to `md`.

| Token | Value |
|---|---|
| `--shadow-xs` | `0 1px 2px rgba(15,23,41,.04)` |
| `--shadow-sm` | `0 1px 3px rgba(15,23,41,.06), 0 1px 2px rgba(15,23,41,.04)` |
| `--shadow-md` | `0 8px 24px -8px rgba(15,23,41,.14), 0 2px 6px rgba(15,23,41,.05)` |

**Motion:** `--dur: 160ms`, `--ease: cubic-bezier(.4,0,.2,1)`. Respect `prefers-reduced-motion`.

---

## 05 · Components

| Component | Class(es) | Notes |
|---|---|---|
| Primary button | `.btn-submit` | Filled accent, full-width in forms; `:hover` → `--accent-strong` |
| Ghost button | `.slot-btn`, `.action-btn` | Bordered; `:hover` tints to `--accent-weak`. `.action-btn` is full-width, left-aligned |
| Form control | `.form-group` + `label` + `input`/`select`/`textarea` | Focus shows accent border + `--focus` ring |
| Alert | `.alert` `.alert-error` | Left severity stripe |
| Status pill | `.status-pill` + `.status-pill--{pending\|confirmed\|completed\|cancelled}` | Semantic colors above |
| Stat card | `.stat-card` | Accent top rule; hover lift |
| Panel card | `.dash-section` | Section container with `.dash-section-title` |
| Doctor card | `.doctor-card`, `.doctor-card.selected` | Selectable; selected = accent ring + weak tint |
| Sidebar nav | `.nav-link`, `.nav-link.active` | Active = `--accent-weak` bg + `--accent` text |

Every interactive element has a visible `:focus-visible` ring (`box-shadow: 0 0 0 3px var(--focus)`).

---

## 06 · Role themes

Each panel sets `--accent` **once** on its root (`PanelLayout.jsx` → `style={{ '--accent': cfg.color, ... }}`). Nav highlight, stat-card rule, focus ring, and primary buttons all inherit it — a role reskins the whole surface without touching a component.

| Role | `--accent` | `--accent-weak` |
|---|---|---|
| Student 🎓 | `#3B82F6` | `rgba(59,130,246,.15)` |
| Doctor 👨‍⚕️ | `#0D9488` | `rgba(13,148,136,.15)` |
| Pharmacist 💊 | `#7C3AED` | `rgba(124,58,237,.15)` |
| Admin ⚙️ | `#D97706` | `rgba(217,119,6,.15)` |

---

_Out of scope by design: dark mode, external fonts, CSS frameworks. Add them by extending the token layer._
