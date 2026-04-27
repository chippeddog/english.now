---
name: Retention Scale Plan
overview: Finish the web + backend product around the existing daily-practice loop, then add the missing retention and scalability layers so the app becomes more useful for learners and safer to grow.
todos:
  - id: finish-core-loop
    content: Design the final daily learner loop across onboarding, home, speaking, lessons, grammar, and vocabulary.
    status: pending
  - id: replace-fluency-stub
    content: Plan the real fluency/speaking hub and connect it to recent sessions, feedback, and daily plan actions.
    status: pending
  - id: add-product-analytics
    content: Define the event taxonomy and retention dashboard for onboarding, activation, practice, review, and billing.
    status: pending
  - id: build-reengagement
    content: Add reminder preferences, missed-day nudges, and goal/checkpoint flows tied to learner progress.
    status: pending
  - id: improve-adaptive-learning
    content: Use onboarding, progress, and review data to recommend the next best activity and follow-up practice.
    status: pending
  - id: separate-workers
    content: Split API/websocket traffic from background workers and harden queue reliability and monitoring.
    status: pending
  - id: production-harden
    content: Add targeted test coverage, accessibility checks, observability, and a release checklist for web + backend.
    status: pending
isProject: false
---

# Finish Web + Backend For Retention

## What Is Already Strong
The project already has the skeleton of a good language-learning product:
- onboarding and profile capture in [apps/web/src/routes/onboarding.tsx](apps/web/src/routes/onboarding.tsx)
- dashboard gating and daily-plan creation in [apps/web/src/routes/_dashboard.tsx](apps/web/src/routes/_dashboard.tsx) and [packages/api/src/routers/practice.ts](packages/api/src/routers/practice.ts)
- a useful home surface in [apps/web/src/routes/_dashboard.home.tsx](apps/web/src/routes/_dashboard.home.tsx)
- practice, review, vocabulary, streaks, billing, and generated content already wired across the app and backend
- background jobs, auth, payments, and storage already wired in [apps/server/src/index.ts](apps/server/src/index.ts)

That means the project does not need a rewrite. It needs completion around the learner habit loop, better product measurement, and clearer scaling boundaries.

## Priority 1: Complete The Core Learner Loop
Focus first on making one obvious, high-value path that users can repeat every day.

- Turn the placeholder fluency area in [apps/web/src/routes/_dashboard.fluency.tsx](apps/web/src/routes/_dashboard.fluency.tsx) into a real speaking hub that launches the best next speaking activity, shows recent feedback, and resumes unfinished practice.
- Upgrade the home experience in [apps/web/src/routes/_dashboard.home.tsx](apps/web/src/routes/_dashboard.home.tsx) so it always answers: what should I do next, why does it matter, and what progress did I make yesterday.
- Unify lessons, grammar, vocabulary, and speaking around the same daily plan from [packages/api/src/routers/practice.ts](packages/api/src/routers/practice.ts) so the app feels like one product instead of several disconnected surfaces.
- Surface hidden/underused areas like grammar and courses from the main navigation and redirect every feature back into the daily loop.
- Add a clear progress timeline: streak, minutes, completed activities, mastered vocabulary, and weekly improvement. The current profile schema in [packages/db/src/schema/profile.ts](packages/db/src/schema/profile.ts) has streak and goal fields, but not the broader learner-health view yet.

## Priority 2: Make The Product More Useful
Once the loop is clearer, improve the learning value users feel after each session.

- Build adaptive recommendations using onboarding data from [apps/web/src/routes/onboarding.tsx](apps/web/src/routes/onboarding.tsx), recent activity, lesson performance, conversation review, and vocabulary difficulty.
- Add explicit learner goals and checkpointing: for example “improve pronunciation for interviews” or “finish 5 travel speaking sessions this week,” then show progress toward that goal on home and settings.
- Improve post-session feedback by turning reviews into follow-up actions: save weak vocabulary, retry pronunciation targets, revisit a grammar concept, or schedule a lighter/heavier next session.
- Add reminder preferences and re-engagement flows. This likely requires extending [packages/db/src/schema/profile.ts](packages/db/src/schema/profile.ts), adding jobs on the server side, and sending email nudges for missed days, plan completion, and streak recovery.
- Add better empty/error/recovery states around plan generation, course generation, and feedback so the app remains trustworthy when AI or jobs are slow.

## Priority 3: Measure What Drives Retention
Right now the repo shows strong product logic but very little behavioral analytics.

- Add product event instrumentation across onboarding, first-session activation, plan generation, session completion, review usage, vocabulary saves, subscription conversion, and churn signals.
- Define the core dashboard before coding lots of new features: onboarding completion, first practice completion, day-1/day-7 retention, weekly active learners, average sessions per week, practice minutes, review-to-repeat rate, and paid conversion.
- Add structured feedback collection in-product after the first few sessions and after subscription events, not only issue reporting.
- Use this data to decide what to build next instead of adding more surfaces blindly.

## Priority 4: Make The Backend Safe To Scale
The backend foundation is good, but the current deployment shape mixes API, WebSocket, and worker responsibilities in [apps/server/src/index.ts](apps/server/src/index.ts).

- Split API/websocket serving from background workers so queue throughput and long-running AI jobs do not compete with user-facing traffic.
- Review queue throughput and retry policy around daily-plan generation, review generation, pronunciation processing, and vocabulary extraction.
- Add operational metrics for queue backlog, failed jobs, generation latency, AI cost per learner, websocket load, and rate-limit pressure.
- Introduce clearer idempotency and failure recovery for job-driven flows so users never get stuck in “generating” states.
- Add targeted load-sensitive checks around the practice and content pipelines before scaling traffic.

## Priority 5: Raise Product Quality To Production Level
To make the app feel complete, finish the sharp edges that users notice quickly.

- Standardize copy, trust signals, and recovery UX in settings, practice, and dashboard flows.
- Add basic accessibility and keyboard checks to the main learning surfaces.
- Add focused automated coverage for the most expensive flows: onboarding completion, today-plan generation, practice completion, streak updates, and billing state refresh.
- Create a release checklist for web + backend covering build health, env validation, queue health, auth, billing, and analytics.

## Suggested Build Order
1. Finish the speaking/home/daily-plan loop.
2. Add analytics and learner goal tracking.
3. Add reminders and follow-up actions from feedback.
4. Split worker responsibilities from the API process.
5. Harden quality, observability, and release operations.

## Success Criteria
The project is closer to “complete” when:
- a new user can onboard and complete a meaningful first practice session without confusion
- returning users always have one obvious next action on home
- the app can bring users back through reminders and progress goals
- you can measure activation, retention, and churn with real event data
- background jobs and streaming traffic can scale without degrading the core learner experience