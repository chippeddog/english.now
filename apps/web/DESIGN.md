# english.now design system

The marketing site and app share one idea: **English happens in conversation, in real places.** Every page is built from three things — a place (a scene), a conversation (a thread), and a correction (the moment you get it right). Everything else stays quiet so those three can carry the page.

References this system draws from:

- Linq-style framed grid: a fixed-width column with hairline rails, two-tone headlines, a phone in front of an atmospheric image, quiet logo strip.
- AutoSend-style painted scenes: product UI sitting inside a painterly landscape instead of on a flat gradient.
- Dockset-style floating objects: small, real UI fragments scattered around a centered statement.

What makes it ours: the scenes are places where people actually need English (a café counter, an airport gate, an interview room), and the signature detail is the correction — a wavy rose underline under what you said, resolved by a lime fix from Now.

---

## 1. Color

Base palette. Cool and clean, not cream; ink-blue, not tinted black.

| Name | Hex | Role |
| --- | --- | --- |
| Ink | `#172033` | Headlines, primary buttons, body text on light |
| Slate | `#5B6478` | Second clause of headlines, secondary text |
| Paper | `#FFFFFF` | Page and panel background |
| Mist | `#F5F7FA` | Section wash, scene fallbacks, input fills |
| Now lime | `#D8FF76` | The tutor's identity: Now mark, Now's highlights, success |
| Signal blue | `#007AFF` | The learner's own messages, and only those |

Supporting colors:

| Name | Value | Role |
| --- | --- | --- |
| Rule | `rgba(23,32,51,0.08)` | Hairlines, rails, dividers, panel borders |
| Rule strong | `rgba(23,32,51,0.14)` | Input borders, outline buttons |
| Lime deep | `#3F6212` (`text-now-deep`) | Text on lime, the "fix" word in corrections |
| Lime gradient | `radial-gradient(100% 100% at 50% 0%, #EFFF9B 0%, #D8FF76 60%, #C6F64D 100%)` (`bg-now-gradient`) | Now mark, `progress` button, learner wins |
| Correction rose | `#FB7185` (`rose-400`) | Wavy underline under a mistake. Never a fill, never text color |

### Rules

- **Blue means "you", lime means "Now".** Never use Signal blue for decoration or links, and never put lime on something the learner said. This mapping is the product's grammar; keep it identical in the hero, features, and the app.
- **Primary actions are Ink**, not lime. Lime CTAs (`<Button variant="progress">`) are reserved for in-app moments of progress: "Continue", "Start lesson", "Claim streak".
- Lime is never used as large background fill on marketing pages. It appears in small, meaningful doses.
- Rose only appears as a wavy underline (`decoration-wavy decoration-rose-400 underline-offset-[3px]`). Errors in forms use `destructive`, not rose.
- Black is `#000` only for device hardware (phone bezels, notch). Everything that looks "black" in UI is Ink.

### Skill-area tints

Each skill area gets one pastel tint, reused from the avatar faces. Use them for the area's icon chip and soft scene accents only.

| Area | Tint | Hex |
| --- | --- | --- |
| Conversation | sky | `#C5E0FF` |
| Pronunciation | peach | `#FFD0B5` |
| Vocabulary | amber | `#FFE3A3` |
| Grammar | violet | `#E3D4FF` |
| Review | mint | `#C8F5C4` |

### CEFR badges

Unchanged: A1 emerald, A2 teal, B1 blue, B2 indigo, C1 purple, C2 rose. Badges use the `-50` background and `-700` text of each hue, radius 6px, weight 500, sentence case ("B1", not "LEVEL B1").

---

## 2. Typography

Two clearly distinct families:

- **Geist Serif** (`font-geist-serif`, self-hosted from `public/fonts/geist-serif`, Latin only) for the hero headline and closing CTA headline only. Weight 400, tight tracking, Ink color. Cyrillic text (Ukrainian) falls back to **Lyon Display**, which is next in the font stack.
- **Geist Variable** for everything else, with Noto Sans Arabic for RTL.

The serif is rare on purpose; section headlines stay in Geist and use the two-tone treatment below.

### Scale

Based on the classic typographic scale (12, 14, 16, 18, 21, 24, 36, 48, 60).

| Token | Size / line-height | Weight | Tracking | Use |
| --- | --- | --- | --- | --- |
| `display` | 40 → 68px / 1.02 | 400 (Geist Serif) | -0.035em | Hero headline only |
| `h2` | 36px / 1.12 | 600 | -0.022em | Section headline |
| `h3` | 21px / 1.3 | 600 | -0.012em | Feature title, panel title |
| `lead` | 18px / 1.55 | 400 | -0.005em | Hero and section subtitle |
| `body` | 16px / 1.6 | 400 | 0 | Paragraphs |
| `ui` | 14px / 1.45 | 500 | 0 | Buttons, nav, labels |
| `caption` | 12px / 1.4 | 500 | 0 | Timestamps, meta, avatar counts |

Tailwind recipes:

```txt
display  font-geist-serif font-normal text-[clamp(2.5rem,5.4vw,4.25rem)] leading-[1.02] tracking-[-0.035em] text-[#172033]
h2       font-semibold text-[2.25rem] leading-[1.12] tracking-[-0.022em] text-[#172033]
h3       font-semibold text-[1.3125rem] leading-[1.3] tracking-[-0.012em]
lead     text-lg leading-[1.55] text-[#5B6478]
```

### The two-tone headline

The signature type treatment, from the Linq reference. A headline is **one short claim in Ink, followed by its explanation in Slate**, same size and weight.

```tsx
<h2 className="max-w-[22ch] font-semibold text-[2.25rem] leading-[1.12] tracking-[-0.022em] text-[#172033]">
	Just start talking.{" "}
	<span className="text-[#5B6478]">
		Now answers like a person, and fixes your English as you go.
	</span>
</h2>
```

Rules:

- Split only at a sentence boundary. The Ink part is a complete sentence; the Slate part is one or more complete sentences.
- Never color, bold, or italicize a single word or phrase inside a headline.
- Hero headlines may be one tone only when they are a single short sentence.
- Max width `22ch` for h2, `18ch` for display. Body copy max `68ch`, lead max `56ch`.

### Avoid

- All-caps labels or tracked-out eyebrows.
- Monospace for data or labels.
- Middle-dot meta strings (`A · B · C`); use separate elements with spacing.
- `→` appended to button or link text. If a link needs an affordance, use a lucide `ArrowUpRight` icon only on external links.

---

## 3. Layout

### The frame

Content lives in a single centered column, `max-w-5xl` (1024px, matching the navbar), with **two vertical hairline rails** at its edges that run the full page height. Sections are separated by horizontal hairlines that meet the rails, so the page reads as one continuous framed sheet.

```
 ┌──────────────────────────────────────────────┐   ← navbar, rails start here
 │                                              │
 │  section                                     │
 │                                              │
 ├──────────────────────────────────────────────┤   ← section rule meets rails
 │  section                                     │
 ├───────────────────────┬──────────────────────┤   ← split sections share a vertical rule
 │  copy                 │  scene / demo        │
 └───────────────────────┴──────────────────────┘
```

```tsx
<div className="mx-auto max-w-5xl border-x border-[rgba(23,32,51,0.08)]">
	<section className="border-b border-[rgba(23,32,51,0.08)] px-6 py-20 md:px-10 md:py-28">…</section>
</div>
```

- Rails are visible from `md` up. On mobile, drop the rails and keep only horizontal rules.
- Inner horizontal padding: 24px mobile, 40px desktop. Section vertical padding: 80px mobile, 112px desktop.
- Content is **left-aligned** by default. Centered alignment is used only for the hero and the closing CTA.
- Inside the frame, scenes and demos may bleed to the rails (no inner padding) — this is how panels feel "set into" the page rather than floating on it.

### Spacing

4px base. Use 4, 8, 12, 16, 24, 32, 48, 64, 80, 112. Headline to lead: 16px. Lead to actions: 32px. Section header to content: 48px.

### Radius hierarchy

Radius tells you what something is. Don't use one radius for everything.

| Radius | Use |
| --- | --- |
| 6px | Badges, icon chips, keyboard keys |
| 10px (`--radius`) | Buttons, inputs, small controls |
| 16px | Panels, app windows, demo cards |
| 24px | Scene frames (the painted image containers) |
| 18px with one 6px corner | Chat bubbles (tail corner toward the speaker) |
| full | Avatars, the phone notch, status pills |

### Elevation

Three levels only.

| Level | Value | Use |
| --- | --- | --- |
| Flat | `border border-[rgba(23,32,51,0.08)]` | Most panels inside the frame |
| Lifted | `0 0 0 1px rgba(0,0,0,.05), 0 10px 10px -5px rgba(0,0,0,.04), 0 20px 25px -5px rgba(0,0,0,.04), 0 20px 32px -12px rgba(0,0,0,.04)` | App windows and floating objects over a scene |
| Device | `0 28px 60px -16px rgba(0,0,0,0.55)` | The phone mock only |

No soft grey drop shadow (`rgba(0,0,0,.1)`) on cards, no gradient washes as decoration.

---

## 4. Signature patterns

### Scene + thread (the memorable thing)

A painted or photographic place where English is needed, inside a 24px-radius frame, with the product placed on top: the phone mock or an app window showing a real conversation.

```
 ┌───────────────────────────────────────────┐
 │  painted café, soft and slightly blurred   │
 │                       ┌────────────┐       │
 │                       │  9:15      │       │
 │                       │  Cafe order│       │
 │                       │  ○ You're… │       │
 │                       │   I want ● │  ← wavy rose underline
 │                       │  ○ I'd like│  ← lime-deep fix
 │                       └────────────┘       │
 └───────────────────────────────────────────┘
```

- Scenes depict places, not abstract gradients: café, airport gate, office, train platform, doctor's waiting room, hotel desk. The scene and the thread must match (café scene → "Cafe order" thread).
- Style: painterly or soft-focus photography, cool daylight palette, low contrast so the UI stays readable. No people's faces in focus.
- One scene per section at most, and not every section gets one. Use scenes for the hero and at most two feature sections.
- Images: `object-cover`, served as AVIF/WebP, with a Mist fallback background so the frame never flashes white.

### The correction

The product's core moment, and the only "decorative" highlight in the system.

- The learner's mistake: wavy rose underline, shown only inside the learner's own bubble.
- Now's fix: the corrected phrase in Lime deep (`text-lime-800`), weight 600. Nothing else in the sentence is styled.
- Use the existing `RichText` / `Highlight` approach in `components/home/hero.tsx` for consistency.

### Chat bubbles

- Learner: `bg-[#007AFF] text-white`, right-aligned, `rounded-[18px] rounded-br-md`.
- Now: `bg-[#E9E9EB] text-[#172033]`, left-aligned with the Now mark, `rounded-[18px] rounded-bl-md`, sender name "Now" in caption size above.
- Copy in demo threads is real and short: realistic phrases a learner at the target CEFR level would say, including realistic mistakes.

### Floating objects

From the Dockset reference. Small, real fragments of the product scattered around a centered statement: a streak counter, a vocabulary card ("pick up — to collect someone"), a pronunciation score ring, a CEFR badge, a 5-minute lesson timer.

- Use this in **one section only** (recommended: the "everything in one app" overview or the closing CTA), never alongside a scene in the same viewport.
- 5–8 objects, each a working miniature of a real component, Lifted elevation, rotated between -4° and 4°.
- Objects never overlap the headline's text box. Hide half of them below `md`; hide all below `sm`.

### Section header

A small icon chip identifies the skill area, followed by the two-tone headline.

```tsx
<div className="flex items-center gap-2 text-sm font-medium text-[#172033]">
	<span className="flex size-6 items-center justify-center rounded-md bg-[#C5E0FF]">
		<MessagesSquare className="size-3.5" />
	</span>
	Conversations
</div>
```

- The label names a real product area (Conversations, Pronunciation, Vocabulary, Grammar, Review) and uses that area's tint. Sentence case.
- Sections that are not about a product area (FAQ, pricing, testimonials) get no label — just the headline.

### Numbering

Numbered markers only for real sequences: onboarding steps, a lesson's parts, "how it works" when the order matters. Feature grids are never numbered.

---

## 5. Components

### Buttons

| Variant | Recipe | Use |
| --- | --- | --- |
| Primary | `bg-[#172033] text-white hover:bg-[#172033]/90 rounded-[10px] h-10 px-5` | Main action per view (marketing) |
| Secondary | `border border-[rgba(23,32,51,0.14)] bg-white text-[#172033] hover:bg-[#F5F7FA]` | "Watch demo", "Log in" |
| Progress | `<Button variant="progress">` | In-app forward motion only |
| Logo | `<Button variant="logo">` (`bg-logo-gradient`, the Now mark's navy body) | Branded dark CTAs |
| Ghost | `hover:bg-[#F5F7FA]` | Nav links, toolbar actions |

- One primary button per view. Hero: primary + secondary, never two primaries.
- Under a hero CTA, an optional caption line in Slate states the terms plainly ("Free to start. No card needed."), like Dockset's pricing line.
- Focus: `focus-visible:ring-[3px] focus-visible:ring-[#007AFF]/40` on every interactive element.

### Inputs

Mist fill, Rule strong border, 10px radius, 40px height. On focus, white fill and a Signal blue ring. An inline "try it" input (like Linq's "Enter your website") works here as "Type a sentence you're unsure about" → Now's correction appears below it.

### Logo strip

One row, grayscale logos at 60% opacity, separated from neighbors by section rules only. No "Trusted by" label — the strip speaks for itself; if one is needed, sentence case in Slate.

### Navbar

Logo left, links centered or next to the logo, "Log in" (ghost) and "Get started" (primary Ink) right. Sticky with `bg-white/70 backdrop-blur-md`; the bottom rule appears on scroll (already implemented in `components/navbar.tsx`).

---

## 6. Page anatomy (marketing home)

```
 navbar
 ├─ hero ─────────────── centered display headline, lead, primary + secondary, caption
 │                       below: scene + thread (phone over café scene, or app window + phone)
 ├─ logo strip
 ├─ Conversations ────── split: two-tone header left, live thread demo right (bleeds to rail)
 ├─ Pronunciation ────── split reversed: waveform + score demo left, copy right
 ├─ Vocabulary ───────── full width: word cards from a real conversation, SM-2 "review in 3 days"
 ├─ everything in one ── centered statement with floating objects
 ├─ testimonials ─────── 3 columns of plain quotes with face + name + level badge, divided by rules
 ├─ pricing
 ├─ FAQ ──────────────── left: h2, right: accordion, separated by rules
 └─ closing CTA ──────── scene frame with centered headline and primary button over it
 footer
```

The hero and closing CTA bookend the page with scenes; the middle stays white and ruled.

---

## 7. Motion

- **One orchestrated moment:** in the hero, the thread plays in once on load — messages appear in order, the rose underline draws under "want", then Now's fix fades in with the lime word. Total under 3 seconds. It does not loop.
- Motion that answers an action is welcome: accordion expanding, a word card flipping, a bubble sending.
- No fade-and-slide-up on every section, no hover lift on every card, no parallax on scenes.
- `prefers-reduced-motion: reduce` shows the final state of the thread immediately.
- Easing: `cubic-bezier(0.2, 0.8, 0.2, 1)`; durations 150ms (UI), 300ms (reveals).

---

## 8. Writing

- Write from the learner's side: "Practice ordering coffee," not "Scenario-based conversational modules."
- Headlines state what you can do, plainly. The Ink clause is the promise; the Slate clause is how it works.
- CTAs say exactly what happens: "Start speaking", "Watch the demo", "Review 12 words". The same action keeps the same name through the flow ("Start lesson" → toast "Lesson started").
- Errors say what happened and how to fix it, without apology: "That email is already registered. Log in instead."
- Empty states invite action: "No saved words yet. Words you get wrong in conversations show up here."
- Sentence case everywhere, including buttons and nav.
- All copy goes through `@english.now/i18n`; design with the longest likely translation in mind (German, Ukrainian) and check RTL (Arabic) for mirrored layouts — bubble sides flip, rails don't.

---

## 9. Quality floor

- Responsive to 360px wide. Split sections stack copy-first. The phone mock stays; the desktop app window hides below `md`.
- Contrast: Slate on white is 5.7:1 (passes AA for body). Never put Slate on Mist under 14px. Lime deep on lime passes; white on lime does not — never use it.
- Visible keyboard focus on every interactive element.
- Decorative UI fragments in scenes and floating objects are `aria-hidden`; the real headline and CTA carry the meaning.
- Dark mode: Paper → `#0F1522`, Ink → `#E8ECF3`, Slate → `#98A1B3`, rules at `rgba(255,255,255,0.08)`. Blue and lime keep their roles unchanged. Scenes get a 20% darkening overlay.

---

## 10. Tokens to add to `src/index.css`

Several classes used across the app today (`font-display`, `text-marketing-ink`, `bg-success`, `bg-warning`) have no matching theme token, so they currently render nothing. Defining them here makes the system real (`--color-now`, `--color-now-deep`, and the `bg-now-gradient` utility already exist):

```css
@theme {
	--font-display:
		"Geist Variable", "Inter", ui-sans-serif, system-ui, sans-serif;

	--color-ink: #172033;
	--color-slate-ink: #5b6478;
	--color-mist: #f5f7fa;
	--color-signal: #007aff;
	--color-rule: rgb(23 32 51 / 0.08);
	--color-rule-strong: rgb(23 32 51 / 0.14);
	--color-marketing-ink: var(--color-ink);
	--color-success: #34c759;
	--color-warning: #ffcc00;

	--tint-conversation: #c5e0ff;
	--tint-pronunciation: #ffd0b5;
	--tint-vocabulary: #ffe3a3;
	--tint-grammar: #e3d4ff;
	--tint-review: #c8f5c4;
}
```

Adding these changes rendering on every page that already uses those class names, so roll it out with a visual pass over the dashboard, onboarding, and lesson screens.
