# B-SCAN Connect

B-SCAN Connect helps persons with disabilities discover accessible support services, inclusive jobs, education and training; receive explainable profile-based matches; request referrals; track applications; and follow stakeholder responses.

## Current milestone

The current release includes:

- the public product experience, searchable catalogue and listing details;
- role-aware stakeholder workspaces and accessible interface controls;
- persistent member profiles, explainable recommendations and saved items;
- organization content creation and administrator approval workflows;
- member referrals, staff queues, messages and immutable timelines;
- job and learning applications with selection-stage tracking;
- an in-app notification centre for referral and application updates;
- automated lint, production-build and route checks in GitHub Actions.

## Application surfaces

- `/` — public landing and discovery introduction
- `/discover` — searchable services, jobs and learning catalogue
- `/discover/[slug]` — complete listing details
- `/workspace` — authenticated stakeholder workspace
- `/workspace/referrals` — member referral tracking
- `/workspace/applications` — member application tracking
- `/workspace/notifications` — personal notification centre

## Stack

- Next.js-compatible Vinext application with TypeScript and React
- Tailwind CSS foundation plus product-specific accessible CSS
- Drizzle ORM with a platform-managed D1 relational database
- Platform-managed cloud deployment and source checkpoints

The platform database keeps the service self-contained and cloud-accessible without requiring separate database credentials.

## Local commands

```bash
npm run dev
npm run lint
npm run build
npm run db:generate
```

## Documentation

- `docs/ARCHITECTURE.md` — modules, authorization and implementation sequence
- `docs/STATE-MACHINES.md` — approved content, referral and application transitions
- `AGENTS.md` — project instructions for future Codex tasks

## Data and privacy principles

- Disability disclosure is voluntary.
- Matching never guarantees service, admission or employment.
- Internal referral notes must never be shown to PwD users.
- Workflow events are append-only; cancellation replaces destructive deletion after review begins.
- Passwords are never stored or displayed by application code.
- Development seed records must never contain real personal data.
