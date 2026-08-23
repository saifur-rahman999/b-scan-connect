# State machines

Transition checks belong in a central server-side workflow service. Unlisted transitions are rejected.

## Content

`DRAFT → SUBMITTED → PUBLISHED → CLOSED → ARCHIVED`

Review alternatives:

- `SUBMITTED → CHANGES_REQUESTED → DRAFT`
- `PUBLISHED → ARCHIVED`
- an unused `DRAFT` may be deleted

## Referral

Primary route:

`SUBMITTED → UNDER_REVIEW → MORE_INFORMATION_REQUIRED → INFORMATION_PROVIDED → REFERRED_TO_ORGANIZATION → ORGANIZATION_REVIEWING → ACCEPTED → APPOINTMENT_SCHEDULED → COMPLETED`

Alternatives:

- officer can decline from review with a user-visible explanation
- organization can decline while reviewing with a user-visible explanation
- an eligible user can move an active request to `CANCELLED`
- history and messages remain after cancellation or decline

## Job application

`INTERESTED → PREPARING → APPLIED → SHORTLISTED → INTERVIEW or ASSESSMENT → OFFERED or REJECTED`

- a draft in `INTERESTED` or `PREPARING` may be deleted
- a submitted application may move to `WITHDRAWN`
- employer representatives may only progress applications targeting their organization

## Programme application

`INTERESTED → PREPARING → SUBMITTED → UNDER_REVIEW → SHORTLISTED or ASSESSMENT → SELECTED or REJECTED`

A submitted programme application may move to `WITHDRAWN`. Each stage update creates an event and, when user-visible, a notification.
