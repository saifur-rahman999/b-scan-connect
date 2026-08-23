# Architecture

## Role boundaries

| Capability | Guest | PwD user | Referral officer | Organization representative | Administrator |
|---|---:|---:|---:|---:|---:|
| Read published catalogue | Yes | Yes | Yes | Yes | Yes |
| Manage own profile and saved items | No | Yes | No | No | Oversight only |
| Create and respond to own referral | No | Yes | No | No | Oversight |
| Triage and assign referrals | No | No | Yes | No | Yes |
| Respond for receiving organization | No | No | Via officer workflow | Yes | Intervention only |
| Create organization content drafts | No | No | No | Yes | Yes |
| Publish public content | No | No | No | No | Yes |
| Progress organization applications | No | No | No | Yes | Oversight |
| Manage users and feedback | No | Own feedback only | No | No | Yes |

Authorization must be verified on the server for every protected read and mutation. UI visibility is not authorization.

## Modules

1. Identity and accounts
2. PwD profile and preferences
3. Organizations and representatives
4. Services
5. Jobs
6. Education, training, scholarships, internships and volunteering
7. Explainable recommendations
8. Saved items
9. Referrals, messages, appointments and events
10. Applications, interviews and events
11. Notifications
12. Feedback
13. Approval queue, activity log and analytics

## Recommendation contract

The rule-based matcher receives a profile version and a published target. It returns a score, match level, contributing factors, missing information, eligibility conflicts, confidence and a disclaimer. A profile update increments `profile_version`; older results are no longer presented as current.

## Transaction boundary

Every workflow mutation should perform these actions atomically:

1. Verify actor and ownership.
2. Verify the requested state transition.
3. Update the current record.
4. Append an immutable event.
5. Create relevant in-app notifications.
6. Append a summarized activity-log entry.

## Implementation sequence

1. Foundation and role-aware workspace
2. Public catalogue and content approval
3. PwD profile, discovery, saved items and recommendations
4. End-to-end referral workflow
5. Job and programme applications
6. Administration, notifications, feedback and analytics
7. Seed completeness, accessibility audit and journey testing
