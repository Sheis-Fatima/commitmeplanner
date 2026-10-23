# commitmeplanner

A personal planning workspace built around a simple idea: **commit to what matters, then plan around real life.**

commitmeplanner helps users manage goals, recurring commitments, sleep, interruptions, and progress without forcing everything into a rigid daily checklist.

## What V1 includes

- Goal creation with deadlines, categories, and weekly or monthly check-ins
- Goal steps and milestone-based progress
- Recurring commitments that are protected in the schedule
- Emergency interruptions that consume planning capacity without automatically pausing every goal
- Sleep logging and sleep preferences
- Daily mood tracking as a separate wellbeing signal
- Adaptive time allocation based on commitments, sleep, deadlines, and available capacity
- Insights for progress, activity, goal check-ins, sleep, and mood
- Optional AI assistance for roadmap generation, milestone generation, and deliverable review

The planning engine is deterministic application logic. AI is an assistive layer, not the source of truth for the user's schedule.

## Stack

- React + TypeScript
- Vite
- Tailwind CSS
- React Router
- TanStack Query
- Supabase Authentication, Database, Storage, and Edge Functions
- Framer Motion
- Vitest

## Local development

Requirements: Node.js 20+ and npm.

```bash
git clone https://github.com/gODtECH-Ctl-Create/commitmeplanner.git
cd commitmeplanner
npm ci
cp .env.example .env
npm run dev
```

Set these values in `.env`:

```env
VITE_SUPABASE_URL=
VITE_SUPABASE_PUBLISHABLE_KEY=
VITE_BASE_PATH=/
```

## AI configuration

The AI Edge Functions are provider-neutral and use an OpenAI-compatible chat completions endpoint.

Configure these Supabase Edge Function secrets:

```text
AI_BASE_URL
AI_API_KEY
AI_MODEL
```

Example:

```text
AI_BASE_URL=https://your-provider.example/v1
AI_MODEL=your-model-id
```

No Lovable AI gateway is required by the application.

## GitHub Pages

The first public frontend build is deployed through GitHub Actions.

Repository Pages URL:

**https://godtech-ctl-create.github.io/commitmeplanner/**

The V1 frontend includes the current public Supabase browser configuration and also accepts `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY` as deployment-time overrides. The workflow supplies `VITE_BASE_PATH=/commitmeplanner/` during the production build.

Because V1 uses hash-based routing, direct navigation works on GitHub Pages without a server-side rewrite.

For Supabase Authentication, add the Pages URL to the project's allowed redirect URLs, including:

```text
https://godtech-ctl-create.github.io/commitmeplanner/
https://godtech-ctl-create.github.io/commitmeplanner/#/reset-password
```

## Product direction

The long-term product is an adaptive commitment planner:

```text
Goals + Commitments + Sleep + Interruptions
                    ↓
             Capacity engine
                    ↓
              Daily / weekly plan
                    ↓
              Check-ins + signals
                    ↓
               Insights + review
```

Mood is tracked, but does not automatically rewrite the user's plan. Cycle tracking is intentionally outside the current scope and can be introduced later as an optional module based on user feedback.

## License

License to be added before a public open-source release.
