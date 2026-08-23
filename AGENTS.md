# B-SCAN Connect development instructions

## Product guardrails

- Treat the product as a production-grade service and use only non-sensitive seed records during development.
- Use respectful, person-first or identity-first language according to context; never use pity-based language or stereotypes.
- Keep jobs as a distinct first-class product area.
- Preserve the complete stakeholder handoffs for referrals, jobs and programmes.
- Never expose internal referral notes to PwD users.

## Engineering conventions

- Use TypeScript and server-side authorization for protected reads and mutations.
- Keep durable product state in D1 through the database helper; browser storage is only for local display preferences.
- Generate a migration with `npm run db:generate` after schema changes and inspect the SQL.
- Every status mutation creates an immutable event in the same transaction.
- Use soft deletion, closure, archival or cancellation once a record has workflow history.
- Keep sample dates relative or comfortably in the future.
- Never commit credentials, secrets or real personal data.

## Accessibility definition of done

- Semantic landmarks and heading order
- Keyboard reachable controls
- Visible focus states
- Explicit form labels and inline errors
- Error summary for multi-field forms
- Status conveyed through text or icon as well as colour
- Sufficient contrast and reduced-motion support
- Useful empty, loading, success and error states

## Validation

- Run `npm run lint` for focused source changes.
- The production checkpoint runs `npm run build`.
- Add an end-to-end test when implementing one of the three primary journeys.
