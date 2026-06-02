# Projecto Desktop Sessions

The web/backend is the source of truth for desktop sessions. Desktop apps never receive Firebase Admin credentials, Dodo secrets, or direct payment credentials.

## APIs

- `GET /api/account/desktop-sessions`
- `POST /api/account/desktop-sessions/revoke`
- `POST /api/desktop/sessions/list`
- `POST /api/desktop/sessions/revoke`

## Data Model

Desktop sessions live in Firestore collection `desktopSessions`. Public responses intentionally omit `tokenHash`.

Revoking a session sets:

- `revoked: true`
- `revokedAt`
- `lastSeenAt`

## UI

The account dashboard lists signed-in desktop devices and lets users revoke stale sessions.

Main files:

- `src/lib/firestore.ts`
- `src/app/api/account/desktop-sessions/route.ts`
- `src/app/api/account/desktop-sessions/revoke/route.ts`
- `src/app/api/desktop/sessions/list/route.ts`
- `src/app/api/desktop/sessions/revoke/route.ts`
- `src/components/account/account-dashboard.tsx`
