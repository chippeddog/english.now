<wizard-report>
# PostHog post-wizard report

The wizard has completed a deep integration of PostHog analytics into the English Now web app (TanStack Start). Here is a summary of all changes made:

- **`src/routes/__root.tsx`** — Added `PostHogProvider` wrapping the entire app body with the EU PostHog host and `capture_exceptions: true` for automatic error tracking.
- **`vite.config.ts`** — Added a reverse proxy for `/ingest` routes to forward PostHog requests through the Vite dev server (avoids ad-blocker issues and CORS).
- **`apps/web/package.json`** — Added `posthog-js` and `@posthog/react` as dependencies.
- **`apps/web/.env`** — Added `VITE_PUBLIC_POSTHOG_PROJECT_TOKEN` and `VITE_PUBLIC_POSTHOG_HOST` environment variables.
- **`src/components/auth/sign-in-form.tsx`** — Captures `user_logged_in` and calls `posthog.identify()` on successful email login.
- **`src/components/auth/sign-up-form.tsx`** — Captures `user_signed_up` and calls `posthog.identify()` on successful email registration.
- **`src/routes/onboarding.tsx`** — Captures `onboarding_completed` (with plan, level, goal, and focus area properties) and `onboarding_skipped`.
- **`src/components/dashboard/upgrade-dialog.tsx`** — Captures `upgrade_dialog_opened` when the paywall dialog opens, and `checkout_started` (with plan and price ID) when the user clicks the subscribe button.
- **`src/routes/_lesson.lesson.$lessonId.tsx`** — Captures `lesson_started` (with lesson ID, exercise count, and theory flag) and `lesson_completed` (with score, correct count, and duration).
- **`src/components/practice/conversation.tsx`** — Captures `conversation_started` (with session ID, scenario, and mode) when a new AI conversation session begins.
- **`src/components/vocabulary/practice.tsx`** — Captures `vocabulary_practice_started` and `vocabulary_practice_completed` (with activity ID, card count, and focus).

## Events instrumented

| Event | Description | File |
|-------|-------------|------|
| `user_signed_up` | User successfully completes email/password registration | `src/components/auth/sign-up-form.tsx` |
| `user_logged_in` | User successfully signs in with email/password | `src/components/auth/sign-in-form.tsx` |
| `onboarding_completed` | User finishes onboarding, optionally proceeds to Paddle checkout | `src/routes/onboarding.tsx` |
| `onboarding_skipped` | User skips onboarding paywall and goes to content generation | `src/routes/onboarding.tsx` |
| `upgrade_dialog_opened` | User opens the upgrade-to-Pro dialog | `src/components/dashboard/upgrade-dialog.tsx` |
| `checkout_started` | User clicks Subscribe/Start trial in the upgrade dialog | `src/components/dashboard/upgrade-dialog.tsx` |
| `lesson_started` | User successfully starts a curriculum lesson | `src/routes/_lesson.lesson.$lessonId.tsx` |
| `lesson_completed` | User completes all exercises and reaches the summary screen | `src/routes/_lesson.lesson.$lessonId.tsx` |
| `conversation_started` | User starts a new AI conversation practice session | `src/components/practice/conversation.tsx` |
| `vocabulary_practice_started` | User starts a vocabulary flashcard practice session | `src/components/vocabulary/practice.tsx` |
| `vocabulary_practice_completed` | User completes a vocabulary flashcard practice session | `src/components/vocabulary/practice.tsx` |

## Next steps

We've built some insights and a dashboard for you to keep an eye on user behavior, based on the events we just instrumented:

- **Dashboard — Analytics basics**: https://eu.posthog.com/project/138861/dashboard/657371
- **Signup → Onboarding → Checkout funnel**: https://eu.posthog.com/project/138861/insights/PDt8jEY6
- **New signups (daily)**: https://eu.posthog.com/project/138861/insights/mmUAzebW
- **Upgrade dialog → checkout conversion**: https://eu.posthog.com/project/138861/insights/eBj7KkEY
- **Lesson start → completion rate**: https://eu.posthog.com/project/138861/insights/TJcvnPux
- **Daily practice activity**: https://eu.posthog.com/project/138861/insights/1P2mXFoY

> **Next action required:** Run `pnpm install` from the monorepo root to install `posthog-js` and `@posthog/react`.

### Agent skill

We've left an agent skill folder in your project. You can use this context for further agent development when using Claude Code. This will help ensure the model provides the most up-to-date approaches for integrating PostHog.

</wizard-report>
