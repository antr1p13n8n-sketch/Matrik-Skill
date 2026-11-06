# Security Specification & Threat Model (Firestore Rules)

## 1. Data Invariants
1. **Global Default Deny**: All unmatched collections and documents are strictly denied.
2. **Valid Document IDs**: Every document ID must be alphanumeric and length <= 128 characters (`isValidId`).
3. **Engineering Profiles (`/engineers/{engineerId}`)**:
   - Must have required fields `id`, `name`, `roleTitle`, `department`.
   - String fields must respect maximum length boundaries to prevent Denial of Wallet.
   - Skill levels in `skills` map must only contain valid values between 0 and 5.
   - Updates must validate `isValidEngineer` on incoming data.
4. **Audit Trail (`/auditLogs/{logId}`)**:
   - Audit trail is append-only for accountability under ISO 9001:2015 Clause 7.2.
   - Logs cannot be deleted or mutated by any regular client.
   - `previousLevel` and `newLevel` must be numbers between 0 and 5.
5. **Config (`/config/{configId}`)**:
   - Document ID must be valid (e.g. `general`).
   - `brandName` is required and limited to 100 characters.

## 2. The "Dirty Dozen" Threat Payloads
The following 12 attack vectors must be rejected by Firestore Security Rules:
1. **Oversized Document ID Injection**: Document ID with 2000 random characters (`A` * 2000).
2. **Ghost Field Poisoning**: Injecting `{ "isRootAdmin": true }` into an engineer profile during update.
3. **Negative Skill Level**: Setting `skills.cad_solid_modeling = -1`.
4. **Out-of-Bounds Skill Level**: Setting `skills.fea_static_stress = 100` (max allowed is 5).
5. **Denial of Wallet Payload**: Setting `name` to a 2MB arbitrary string.
6. **Audit Trail Deletion**: Attempting to delete a record in `/auditLogs/{logId}` to hide tampering.
7. **Audit Trail Mutation**: Attempting to update `previousLevel` or `reason` on an existing audit record.
8. **Orphaned Engineer Creation**: Missing required `roleTitle` on `/engineers/{engineerId}`.
9. **Invalid ID Character Injection**: Creating `/engineers/$$$_hack_///` containing illegal characters.
10. **Corrupted Certificate Structure**: Setting `certificates` to an invalid non-list type.
11. **Config Hijacking without Brand Name**: Wiping `brandName` to empty or null on `/config/general`.
12. **Unrestricted Collection Traversal**: Querying an unauthorized arbitrary collection like `/system_keys/passwords`.

## 3. Test Runner Design
All tests in `firestore.rules.test.ts` assert that these 12 malicious payloads and unauthorized mutations fail with `PERMISSION_DENIED`.
