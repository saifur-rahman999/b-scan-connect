# B-SCAN Connect

B-SCAN Connect helps persons with disabilities discover accessible support services, inclusive jobs, education and training; receive explainable profile-based matches; request referrals; track applications; and follow stakeholder responses.

## Current milestone

Phase 1 established:

- the public product experience and visual design system;
- role-aware stakeholder workspaces;
- accessibility foundations, including skip navigation, visible focus, larger text, high contrast and reduced motion;
- the relational data model and initial database migration;
- role boundaries and workflow conventions.

Phase 2 adds the searchable public catalogue, listing detail pages, organization content management and the administrator approval queue.

## Application surfaces

- `/` — public landing and discovery introduction
- `/discover` — searchable services, jobs and learning catalogue
- `/discover/[slug]` — complete listing details
- `/workspace` — authenticated stakeholder workspace

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
