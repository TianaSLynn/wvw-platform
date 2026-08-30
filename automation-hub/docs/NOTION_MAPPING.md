# Notion Mapping

Confirmed database/data-source IDs, retrieved directly from the live Notion workspace on 2026-08-03 (governance: never invent database IDs — retrieve or request them). These are the same five databases under **TRAIN OS™ → 🧠 MHFA Program Hub**.

| Code (this doc) | Notion title | Database page | Data source (query target) |
|---|---|---|---|
| MHFA-01 | 📅 Training Sessions | `89649428-f379-405d-a66f-b9215d757b42` | `c3c33947-91b5-4041-ab30-4ebbb08ceb40` |
| MHFA-02 | 📋 Learners & Registrations | `790b794d-fa82-40eb-beb1-b24be9d0ef01` | `eddb647d-50a5-44f1-b499-b2867d4c8725` |
| MHFA-03 | 🏢 Organizations & Group Opportunities | `5506b2fa-95a9-4f9e-9cd1-e83947e5c294` | `300c27f3-e414-4a1e-85f2-2872af591d90` |
| MHFA-04 | 📨 Communications Log | `cdfab2bd-1a61-4bba-bd66-4a908f84dbd0` | `ce5f2d58-8eb5-4a77-a6df-34581030d46b` |
| MHFA-05 | ⚠️ Automation & Exception Queue | `0e62593f-c1df-4cb3-a156-284947e11d43` | `14c5669c-7cd3-4d5d-8938-425f791ce3ea` |

**As of 2026-08-03, all five are empty** — 0 records in MHFA-01 through MHFA-04, 1 blank/stray record in MHFA-05. See `docs/RISK_REGISTER.md` R9.

## Known schema gap: no Correlation ID property

None of these databases has a dedicated Correlation ID field. The closest fits:
- **MHFA-02**: `Registration Code` (title, required, always visible) and `Notes` (free text)
- **MHFA-01**: `Session Code` (title)
- **MHFA-03**: `Opportunity Code` (title)
- **MHFA-04**: `Communication Code` (title)
- **MHFA-05**: `Exception Code` (title)

**Convention used by this hub's mappers**: the full correlation ID (`WVW|DOMAIN|CODE|DATE|ULID`) is written into `Notes` as a `Correlation ID: <value>` line, never into the title field (titles should stay human-readable — e.g., a registration code, not a ULID string). This is a workaround, not a real fix — **recommend Tiána approve adding a dedicated `Correlation ID` text property to each database** so this can be looked up directly instead of substring-matched out of Notes. Not done here since schema changes to her live databases require her authorization, not a unilateral change by this hub.

## Field mapping — MHFA-02 Learners & Registrations

Maps from the hub's internal `registrations` + `learners` shape (see `supabase/migrations/0002_mhfa_domain_tables.sql`) to real Notion properties confirmed live:

| Hub field | Notion property | Type |
|---|---|---|
| `learner.first_name` | `First Name` | text |
| `learner.last_name` | `Last Name` | text |
| `learner.email` | `Email` | email |
| `learner.phone` | `Phone` | phone_number |
| `learner.mhfa_connect_email` | `MHFA Connect Email` | email |
| `registration.correlation_id` | `Notes` (prefixed line) | text |
| `registration.session_id` → resolved Session page | `Session` | relation → MHFA-01 |
| `registration.organization_id` → resolved Org page | `Organization` | relation → MHFA-03 |
| `registration.payment_status` | `Payment Status` | status (`Pending`\|`Invoiced`\|`Payment Review`\|`Paid`\|`Waived`\|`Sponsored`\|`Refunded`) — hub's internal enum values do not match 1:1, see mapper |
| `registration.attendance_status` | `Attendance Status` | status (`Pending`\|`Partial`\|`Attended`\|`No Show`) |
| `registration.accommodation_requested` | `Accommodation Requested` | checkbox |

Full mapping logic (including the payment/attendance status enum translation) lives in `packages/integration-notion/src/mappers.ts`.

## Field mapping — MHFA-03 Organizations & Group Opportunities

Real live schema confirmed via Notion fetch 2026-08-07. **Self-referential**: an Organization is just a row in this same table, referenced by an Opportunity row's `Organization` relation property (which the schema itself describes as "links an opportunity record to its parent organization record in this table"). Both row "types" share the same title field, `Opportunity Code` — for an Organization row this hub's mapper puts the org's name there instead of a code, since there is no separate "org name" property in the real schema.

Real select options confirmed live:
- `Delivery Preference`: `Virtual` \| `In-Person` \| `Hybrid` \| `Flexible`
- `Source`: `Website` \| `Referral` \| `Social Media` \| `Email Campaign` \| `Partner` \| `Cold Outreach` \| `Event`
- `Stage` (status): `Inquiry` \| `Qualified` \| `Proposal` \| `Contract` \| `Active Client` \| `Closed - Won` \| `Closed - Lost` \| `Inactive`
- `Contract Status`: `Not Sent` \| `Sent` \| `Signed` \| `Expired`
- `Deposit Status`: `Not Required` \| `Pending` \| `Received` \| `Waived`
- `Requested Curriculum`: `ADULT` \| `YOUTH` \| `FIREEMS` \| `VETERAN` \| `HIGHERED` \| `PUBLICSAFETY` \| `RURAL` \| `OLDERADULT`

MHFA-GRP-01 (`FORM-MHFA-002` → MHFA-03) only sets the fields a first-contact inquiry can honestly support — `Opportunity Code`, `Organization` (relation), `Contact` (relation → MHFA-02), `Stage: Inquiry`, `Source: Website`, `Notes`, and (when the submission has them) `Estimated Learners`, `Location`, `Preferred Dates`, `Delivery Preference`. Later-pipeline fields (`Budget`, `Quote Amount`, `Probability`, `Contract Status`, `Deposit Status`, `Session`, `Follow-Up Date`, `Requested Curriculum`) are left unset by this automation — the form doesn't collect them and nothing here should guess at a sales-pipeline value. `Weighted Revenue` is a formula property and is never written to directly.

`Contact` relates to a MHFA-02 page representing the group/private inquiry's point of contact — not a course registrant, so `Payment Status` is deliberately omitted on that page (find-or-create by email; an existing registrant's page is reused as-is, never overwritten, if the same email already exists in MHFA-02).

Full mapping and orchestration logic lives in `packages/integration-notion/src/mappers.ts` (pure) and `packages/integration-notion/src/group-opportunity.ts` (the Notion calls: find-or-create Organization, find-or-create Contact, create Opportunity).
