# Firestore Security Specification

## 1. Data Invariants
1. A `PlayerProfile` at `/playerProfiles/{userId}` can only be read, created, or updated by the authenticated, email-verified user whose `request.auth.uid == userId`.
2. `PlayerProfile` documents contain zero PII (no email, phone, or address) and enforce strict key allowlisting (`hasAll` + `hasOnly`), immutable `uid` and `createdAt`, and server-timestamp `request.time`.
3. Every `GameRecord` under `/playerProfiles/{userId}/history/{recordId}` requires the parent `PlayerProfile` to exist (`get()`), must match `request.auth.uid == userId`, is immutable once created, and constrains `score` (`0..1000`), `solvedCount` (`0..50`), `totalCount` (`1..50`), and `elapsedSeconds` (`0..86400`).
4. Every `LeaderboardEntry` at `/leaderboard/{entryId}` is non-PII, requires `uid == request.auth.uid`, `isPublic == true`, bounded `nickname` (`1..20` chars), bounded `score` (`0..1000`), and server timestamp `request.time`. Updates and deletes are denied.
5. `allow list` rules explicitly evaluate `resource.data` without `get()`/`exists()` lookups.

## 2. Adversarial "Dirty Dozen" Payloads (Expected: PERMISSION_DENIED)
1. Unauthenticated read/write to `/playerProfiles/user1`
2. Unverified email (`email_verified == false`) creating `/playerProfiles/user1`
3. User A (`uid: "userA"`) reading or updating `/playerProfiles/userB`
4. Shadow field injection (`isAdmin: true`) on `/playerProfiles/userA` create
5. Updating immutable `uid` or `createdAt` on `/playerProfiles/userA`
6. Spoofed client timestamp (`createdAt != request.time`) on `/playerProfiles/userA`
7. Oversized `nickname` (`21+` characters) on `/playerProfiles/userA` or `/leaderboard/e1`
8. Poisoned ID (`../bad` or >128 chars) in `{userId}`, `{recordId}`, or `{entryId}`
9. Creating `/playerProfiles/userA/history/r1` without an existing parent `/playerProfiles/userA`
10. Score tampering (`score: 99999` or negative `score: -10`) on `/leaderboard/e1`
11. Updating or deleting an existing `/leaderboard/e1` or `/playerProfiles/userA/history/r1`
12. Unauthenticated or blanket list query bypassing `resource.data.isPublic == true`
