# Security Specification & Test-Driven Development (TDD) for Clinic Management

## 1. Data Invariants

1.  **Patient Invariant**: Patients must have a unique ID, valid name, parent name, native place, phone number, and gender. The `createdAt` must be set to `request.time`.
2.  **Visit Invariant**: A clinical visit must belong to an existing patient, have precise vitals, symptoms, and cannot have missing clinical notes.
3.  **Appointment Invariant**: An appointment must reference a patient, have a date/time in the future (or valid date), and a status of `scheduled`, `checked-in`, `completed`, or `cancelled`.
4.  **Immutability Invariant**: Fields like `createdAt` and `creatorId` are immutable. They cannot be modified after initial document creation.
5.  **PII Restriction**: Patient profiles must only be read and written by authenticated clinic personnel (Doctor & Front-Desk staff).

## 2. The "Dirty Dozen" Payloads (Vulnerability Test cases)

The following payloads attempt to bypass identity or integrity constraints and must be rejected with `PERMISSION_DENIED`.

1.  **Identity Spoofing - Patient Creator**: Setting the `creatorId` to another user's UID.
2.  **Privilege Escalation - Client Admin**: Setting `role` to 'admin' in a profile document when the user is not authenticated.
3.  **Temporal Integrity Bypass**: Providing a back-dated or future-dated `createdAt` timestamp instead of `request.time`.
4.  **Shadow Patient Fields**: Injecting non-existent/ghost fields like `{ "isVIP": true }` or `{ "verifiedByGov": true }` to patient profiles.
5.  **Resource Poisoning**: Registering a patient with an excessively long name (greater than 100 characters) or highly abnormal ID string.
6.  **Orphaned Visit Creation**: Creating a visit under a non-existent or malformed patient ID path.
7.  **Terminal State Shortcut - Visit**: Attempting to update clinical notes on a visit after it has been finalized.
8.  **Type Safety Violation - Vitals**: Sending a string `"50kg"` instead of a numeric value `50` for `weight`.
9.  **Anomalous State Bypass - Appointment**: Changing an appointment status directly from `scheduled` to `completed` bypassing the checklist or clinical flow.
10. **Array Injection**: Injecting an excessively large array of symptoms (size > 50) to cause resource exhaustion.
11. **PII Leakage - Unauthorized Read**: Attempting to read patient profiles without an active, verified clinic user session.
12. **Settings Override**: An unauthorized user trying to rewrite the SMS/WhatsApp integration webhook to redirect alerts.

## 3. Test Runner Concept

The tests verify that all the "Dirty Dozen" payloads fail. In a real environment, we'd run:
`npx jest firestore.rules.test.ts`

```typescript
// firestore.rules.test.ts placeholder verifying the Dirty Dozen deny cases.
describe("Clinic Management Firestore Rules", () => {
  it("denies access for unauthenticated users", () => {
    // Assert write/read is denied
  });
});
```
