# Projecto Website + Billing Backend

projecto is a Next.js web app that acts as the source of truth for:

- user accounts
- Google and Apple sign-in through Firebase Authentication
- Dodo Payments checkout and billing portal
- subscription records in Firestore
- desktop auth token exchange
- Electron subscription verification for Windows, macOS, and Linux

The desktop app should trust this backend for effective Free/Pro entitlement checks, archived project reconciliation, and secure desktop session verification.

## Stack

- Next.js 16 App Router
- TypeScript
- Tailwind CSS 4
- Firebase Authentication
- Firebase Admin SDK
- Firestore
- Dodo Payments TypeScript SDK
- Vitest + Testing Library

## Local setup

1. Install dependencies:

```bash
npm install
```

2. Copy the example environment file and fill it in:

```bash
cp .env.example .env.local
```

3. Start the app:

```bash
npm run dev
```

Main pages:

- `/`
- `/pricing`
- `/login`
- `/desktop-login`
- `/checkout/success`
- `/account`

## 1. Configure Firebase

### Create the Firebase project

1. Create a Firebase project.
2. Enable Firestore in Native mode.
3. Enable Authentication.

### Add Google sign-in

1. In Firebase Console, open `Authentication > Sign-in method`.
2. Enable `Google`.
3. Set your support email.

### Add Apple sign-in

1. Join the Apple Developer Program.
2. Create or choose:
   - an App ID
   - a Services ID for web sign-in
   - a Sign in with Apple private key
3. In Apple Developer settings, configure the web domain and return URL for Firebase Auth.
4. In Firebase Console, enable `Apple` and enter:
   - Services ID
   - Apple Team ID
   - Key ID
   - private key value
5. Add your production domain and local dev domain to Firebase authorized domains.

### Add the Firebase web app config

Copy these values into the public env vars:

- `NEXT_PUBLIC_FIREBASE_API_KEY`
- `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`
- `NEXT_PUBLIC_FIREBASE_PROJECT_ID`
- `NEXT_PUBLIC_FIREBASE_APP_ID`

### Add Firebase Admin credentials

For local development, set:

- `FIREBASE_ADMIN_PROJECT_ID`
- `FIREBASE_ADMIN_CLIENT_EMAIL`
- `FIREBASE_ADMIN_PRIVATE_KEY`

On Firebase App Hosting, the app can also use the runtime service account when explicit Admin credentials are not set.

## 2. Configure Dodo Payments

1. Create two Dodo products:
   - Pro Monthly at `$8`
   - Pro Yearly at `$80`
2. Save their product IDs into:
   - `DODO_PRO_MONTHLY_PRODUCT_ID`
   - `DODO_PRO_YEARLY_PRODUCT_ID`
3. Create an API key and set `DODO_API_KEY`.
4. If you are using sandbox mode, set `DODO_ENVIRONMENT=test_mode`.
5. Create a webhook endpoint pointing to:

```text
https://YOUR_DOMAIN/api/webhooks/dodo
```

6. Save the webhook signing secret as `DODO_WEBHOOK_SECRET`.
7. Enable the subscription and payment lifecycle events you want Dodo to send.

## 3. How Dodo webhooks update subscriptions

`POST /api/webhooks/dodo`:

1. Reads the raw request body.
2. Verifies the webhook signature using the Dodo signing secret.
3. Handles subscription and payment lifecycle events such as:
   - `subscription.active`
   - `subscription.renewed`
   - `subscription.cancelled`
   - `subscription.on_hold`
   - `subscription.failed`
   - `subscription.expired`
   - `payment.failed`
   - `payment.succeeded`
4. Maps Dodo data into Firestore `subscriptions`.
5. Reconciles effective project visibility after subscription changes.
6. Applies paid-through access rules:
   - cancelled or failed subscriptions remain usable until `currentPeriodEnd`
   - after the paid period ends, Projecto returns `expired`

The checkout flow attaches `userId`, `email`, `plan`, and `billingCycle` as Dodo metadata so webhook events can be tied back to the correct Projecto user.

### Downgrade project retention

When a user drops from effective `Pro` to effective `Free`, the backend keeps the 5 most recent project directories visible and archives the rest instead of deleting them.

Ordering:

1. `lastLaunchedAt DESC`
2. `updatedAt DESC`
3. `createdAt DESC`

Archived records remain in Firestore with:

- `archivedByPlan`
- `archivedAt`
- `archivedReason = "free_limit"`

When the user returns to effective `Pro`, those archived projects are restored automatically.

## 4. How the Electron app redirects users to pricing

Recommended flow:

1. The Electron app opens `https://YOUR_DOMAIN/pricing`.
2. If the user is not signed in and presses `Upgrade`, the website redirects them to:

```text
/login?next=/pricing&intent=checkout&billing=monthly
```

3. After Google or Apple sign-in succeeds, the login page sends them back to pricing and automatically starts checkout.
4. Dodo handles payment collection.
5. Dodo returns the browser to `/checkout/success`.

## 5. How Google and Apple login sync with desktop

The Electron app should open:

```text
https://YOUR_DOMAIN/desktop-login
```

Flow:

1. The user signs in with Google or Apple via Firebase Authentication.
2. The web app calls `POST /api/auth/sync` to upsert the user record in Firestore.
3. The web app calls `POST /api/desktop/auth/create-code`.
4. The backend creates a short-lived single-use callback code plus `state`, and stores only their SHA-256 hashes in `desktopAuthTokens`.
5. The page redirects to:

```text
projecto://auth/callback?code=TEMPORARY_CODE&state=TEMPORARY_STATE
```

The long-lived desktop session token is never sent in a browser redirect, and no Firebase ID token is ever placed in the desktop callback URL.

## 6. How desktop subscription verification works

### Exchange flow

The desktop app sends the callback code to:

```text
POST /api/desktop/auth/exchange
```

with:

- `code`
- `state`
- `deviceId`
- `deviceName`
- `platform`

The backend:

1. validates the temporary token
2. marks it as used
3. issues a 30-day rolling desktop session token
4. stores only the session token hash in `desktopSessions`
5. returns:
   - user identity summary
   - current subscription plan and status

### Verification flow

The desktop app later calls:

```text
POST /api/desktop/subscription/verify
```

with:

- `desktopSessionToken`
- `deviceId`

The backend:

1. hashes the token and finds the desktop session
2. checks device match, expiry, and revocation state
3. reads the current user subscription from Firestore
4. returns the minimal entitlement payload the desktop app needs

## 7. Manual Pro overrides for developers

Projecto supports a backend-side override layer for support cases, internal testing, and manual grants without editing live Dodo subscription records.

Precedence order:

1. active manual override
2. active Dodo subscription
3. Free fallback

Override records live in Firestore:

```text
subscriptionOverrides/{userId}
```

Each record can contain:

- `plan`
- `status`
- `billingCycle`
- optional `expiresAt`
- `reason`
- `updatedBy`
- `updatedAt`
- `createdAt`
- `source = "manual_admin"`
- optional `disabled`

### Grant Pro manually

```bash
npm run admin:subscription-override -- --action grant --email user@example.com --billingCycle yearly --reason "support grant" --updatedBy "your-name"
```

You can also target a Firebase uid directly:

```bash
npm run admin:subscription-override -- --action grant --uid FIREBASE_UID --billingCycle monthly --reason "internal testing" --updatedBy "your-name"
```

Optional expiry:

```bash
npm run admin:subscription-override -- --action grant --email user@example.com --billingCycle monthly --expiresAt 2026-12-31T23:59:59.000Z --reason "promo" --updatedBy "your-name"
```

### Disable an override but keep the record

```bash
npm run admin:subscription-override -- --action disable --email user@example.com --updatedBy "your-name"
```

### Delete an override completely

```bash
npm run admin:subscription-override -- --action delete --email user@example.com --updatedBy "your-name"
```

Use manual override when you want to temporarily change effective access without modifying the user’s Dodo subscription. Once the override is disabled or deleted, Projecto falls back to the normal Dodo-backed state automatically.

## 8. Environment variables

Required:

- `NEXT_PUBLIC_FIREBASE_API_KEY`
- `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`
- `NEXT_PUBLIC_FIREBASE_PROJECT_ID`
- `NEXT_PUBLIC_FIREBASE_APP_ID`
- `NEXT_PUBLIC_APP_DOWNLOAD_URL`
- `FIREBASE_ADMIN_PROJECT_ID`
- `FIREBASE_ADMIN_CLIENT_EMAIL`
- `FIREBASE_ADMIN_PRIVATE_KEY`
- `DODO_API_KEY`
- `DODO_WEBHOOK_SECRET`
- `DODO_PRO_MONTHLY_PRODUCT_ID`
- `DODO_PRO_YEARLY_PRODUCT_ID`
- `APP_BASE_URL`
- `DESKTOP_PROTOCOL`

Optional but recommended:

- `DODO_ENVIRONMENT`
- `DESKTOP_ALLOWED_ORIGINS`

## 9. Deploy the web app

### Firebase App Hosting

1. Push this project to GitHub.
2. Connect the repo to Firebase App Hosting.
3. Add the required secrets and environment variables.
4. Set `APP_BASE_URL` to your production domain.
5. Make sure `DESKTOP_PROTOCOL` matches the custom protocol registered by your Electron app.
6. Point your Dodo webhook to the deployed `/api/webhooks/dodo` URL.
7. Add the production domain to Firebase authorized domains and Apple Sign in with Apple configuration.

### Vercel

1. Create a new Vercel project from the repo.
2. Add every environment variable from `.env.example`.
3. Set `APP_BASE_URL` to your production domain.
4. Redeploy after adding environment variables.

## API overview

### Auth and billing

- `POST /api/auth/sync`
- `POST /api/checkout/create`
- `POST /api/webhooks/dodo`
- `GET /api/subscription/status`
- `POST /api/billing/portal`

### Desktop

- `POST /api/desktop/auth/create-code`
- `POST /api/desktop/auth/exchange`
- `POST /api/desktop/subscription/verify`
- `POST /api/desktop/license/activate`

`/api/desktop/license/activate` currently returns `501` because projecto v1 is subscription-backed rather than license-key-backed.

## Verification commands

```bash
npm run lint
npm run typecheck
npm run test:run
npm run build
```
