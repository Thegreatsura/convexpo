# Convexpo

## Convex + Better Auth + Expo (React Native) + Hero UI Native

This project was bootstrapped with **[Better-T-Stack](https://github.com/AmanVarshney01/create-better-t-stack)**, a modern TypeScript stack combining Convex, Expo/React Native, Tailwind (NativeWind), Turborepo, and more. For architecture and deeper patterns, refer to the Better-T-Stack repo and docs.

> To reproduce a similar starter, run:
>
> ```bash
> bun create better-t-stack@latest my-app \
>  --frontend native-uniwind \
>  --backend convex \
>  --runtime none --api none --auth better-auth --database none --orm none --db-setup none \
>  --package-manager bun --no-git \
>  --web-deploy none --server-deploy none \
>  --install \
>  --addons turborepo biome \
>  --examples none
> ```



## Tech Stack

* **TypeScript** — static typing for safety and DX
* **[React Native (Expo)](https://expo.dev/)** — SDK 55
* **[Tailwind (NativeWind)](https://www.nativewind.dev/)** — Tailwind for React Native
* **[Hero UI Native](https://heroui.com/docs/native)** — modern React Native UI library 🚧 *RC*
* **[Convex](https://docs.convex.dev/)** — reactive backend-as-a-service
* **[Better Auth](https://convex-better-auth.netlify.app/)** — auth primitives on Convex
* **[Biome](https://biomejs.dev/)** — fast formatting and linting
* **[Turborepo](https://turbo.build/repo/docs)** — monorepo build system

## Project Structure

```text
convexpo/
├─ apps/
│  └─ native/          # Expo App
└─ packages/
   ├─ backend/         # Convex backend
   ├─ config/          # Shared TypeScript config
   └─ env/             # Environment variables
```

## Configure Your App

Update `apps/native/app.json` with your app identity:

```json
{
  "expo": {
    "name": "Your App Name",
    "slug": "yourapp",
    "scheme": "yourapp",
    "ios": {
      "bundleIdentifier": "com.yourcompany.yourapp"
    },
    "android": {
      "package": "com.yourcompany.yourapp"
    }
  }
}
```

Deep-link backend configuration is handled later when you enable auth redirects.

> **Note:** Keep `expo.scheme` in `app.json` aligned with the backend `NATIVE_APP_URL` value (set later) for OAuth redirects.

## Authentication Providers


This starter includes multiple authentication methods using Convex + Better Auth:


- **Convex Account** — required for all forms of authentication
- **Email & Password** — requires Resend + custom domain setup
- **Google OAuth** — requires Google Cloud Console project

- **Apple OAuth** — requires Apple Developer account
	- ⚠️ Note: Apple Auth cannot be tested in Expo Go. Use a Development Build with EAS.

## Running the Example Project

1. **Clone or fork** this repo.

2. **Install root dependencies**:

   ```bash
   bun install
   ```

3. **Start dev** (Turborepo scripts will spawn native + backend):

   ```bash
   bun dev
   ```
   In the **native#dev** terminal pane you should see Metro start successfully:

    ```
   Metro waiting on ...
   ```
    > You do not need to copy an Expo Go URL for backend env setup.

4. Configure Convex Backend
In the **@app/backend** terminal pane, the Convex wizard will prompt:

   ```
   What would you like to configure (use arrow keys)
   > create a new project
     choose an existing project
   ```

    a. Choose **create a new project**.

    b. **Name** it (anything).

    c. Select **cloud development**.

     A temporary error will appear while routes initialize. Check `packages/backend/.env.local` — you should now see `CONVEX_DEPLOYMENT` and `CONVEX_URL` populated.

    **Stop the dev servers** (Ctrl + C) now that Convex credentials exist.


5. **Set Backend Environment Variables**

    `cd` into **`packages/backend`**.


    Generate and set the authentication secret:
    ```bash
    npx convex env set BETTER_AUTH_SECRET=$(openssl rand -base64 32)
      ```
    Set your native app URL for deep linking when you configure OAuth redirects.
    ```bash
    # Use the same scheme from apps/native/app.json (example: "myapp")
    npx convex env set NATIVE_APP_URL=myapp://
    ```



6. **Set Frontend Environment Varibles**

    Create `apps/native/.env.development`:

    In `packages/backend/.env.local`, locate **`CONVEX_URL`**. It should look like:

    ```ini
    CONVEX_URL=https://xxxx-xxx-xxx.convex.cloud
    ```

    now add to .env.development the following


    ```ini
    # Copy from CONVEX_URL in packages/backend/.env.local
    EXPO_PUBLIC_CONVEX_URL=https://xxxx-xxx-xxx.convex.cloud

    # Same as above but with .site instead of .cloud
    EXPO_PUBLIC_CONVEX_SITE_URL=https://xxxx-xxx-xxx.convex.site
    ```
    >  **More information about `.cloud` and `.site`**
    > - Find in Convex dashboard: Project → Settings → URL & deployment keys → Show development credentials
    > - The Deployment URL format: `https://xxxx-xxx-xxx.convex.cloud`
    > - For HTTP Actions, use the same prefix For HTTP Actions, replace .cloud with .site: `https://xxxx-xxx-xxx.convex.site`


## Choose authentication method
- **Google OAuth**
- **Apple OAuth**
- **Email & Password**

> **⚠️ IMPORTANT:** The Convex server may take a short time to warm up on first run after any method above (index creation).

## Google OAuth

### Prerequisites

* [Google Cloud Console](https://console.cloud.google.com/enable-mfa?redirectTo=%2Fwelcome%3Fproject%3Dradiant-galaxy-466314-n6&project=radiant-galaxy-466314-n6) Account + project




### Google Cloud Console Setup

Create OAuth 2.0 Credential in Google

  1. search google auth platform

  2. press `Clients`

  3. Create Client

  4. Application Type `web`

  5. name it

  6. **Add URI** to Authorized redirect Uri's

  ```
  # For development
  https://xxxx-xxx-xxx.convex.site/api/auth/callback/google

  # For production
  https://your-prod-deployment.convex.site/api/auth/callback/google
  ```
  > Replace xxxx-xxx-xxx with your Convex deployment URL (use .site not .cloud)

  7. **Save Credentials**- you'll get a **Client ID** and **Client Secret**

### Backend Setup

cd `packages/backend` & for the newly generated secrets run
```
npx convex env set GOOGLE_CLIENT_SECRET <key>
npx convex env set GOOGLE_CLIENT_ID <key>
```

In `packages/backend/convex/auth.ts`, uncomment the Google env constants and provider block:

```ts
// const googleClientId = process.env.GOOGLE_CLIENT_ID || "";
// const googleClientSecret = process.env.GOOGLE_CLIENT_SECRET || "";

// socialProviders: {
//   google: {
//     clientId: googleClientId,
//     clientSecret: googleClientSecret,
//   },
// },
```

Expo usage lives in:
```
apps/native/lib/oauth/useGoogleAuth.ts
apps/native/app/(root)/(auth)/landing.tsx
```

now done => `bun dev` from root => will take a moment for index creation if first run
## Email & Password

### Prerequisites

* A **Resend** account & API key (for transactional emails)
* A **verified domain** in Resend (required for authentication emails)

**a) Resend Setup (Domain + API Key)**
> **⚠️ IMPORTANT:** Authentication emails require a verified domain in Resend. You cannot use test mode with just an API key for auth flows. The sender email must match your verified domain.

**First, verify your domain in Resend:**

1. Go to [Resend Dashboard → Domains](https://resend.com/domains)
2. Click **Add Domain** and add your domain (e.g., `yourdomain.com`)
3. Add the required DNS records
4. Wait for verification (usually a few minutes)

**Then, create an API key:**

* Go to **Dashboard → API Keys → Create**

  * Name: any
  * Permissions: **Full access**
  * Domain: select your verified domain
* Set it in Convex:

    cd into `packages/backend`

  ```bash
  npx convex env set RESEND_API_KEY=...
  ```

* **Finally, update the sender email:**

  ```bash
  npx convex env set RESEND_AUTH_EMAIL=auth@yourdomain.com
  ```

  In `packages/backend/convex/auth.ts`, uncomment `sendResetPassword` in the `emailAndPassword` block if you want reset emails:

```ts
	// emailAndPassword: {
	// 	enabled: true,
	// 	requireEmailVerification: false,
	// 	sendResetPassword: async ({ user, url }) => {
	// 		await sendResetPassword(requireActionCtx(ctx), {
	// 			to: user.email,
	// 			url,
	// 		});
	// 	},
	// },
```
now done => `bun dev` from root => will take a moment for index creation if first run

## Apple Login

If you want Apple Sign-In with Better Auth, see: [Better Auth Apple Docs](https://www.better-auth.com/docs/authentication/apple)

### Prerequisites

* A **Dev Build** use expo EAS
* A **Apple Developer Account**

create a EAS Build it should ask you to provision ... this and that and to setup to your apple account. Then Once this is up. you go to the following

on successful EAS Build you should now see in Apple Developer > Account > Identifiers > your app with the bundle ID from app.json (e.g., `com.example.myapp`) > press on it > Sign in With Apple > Enable.

In `packages/backend/convex/auth.ts`, uncomment the Apple env constant and provider block:

set the name of com from identifiers to the appBundleIdentifier

cd `packages/backend` & for the newly generated secrets run
```
npx convex env set APPLE_APP_BUNDLE_IDENTIFIER <key>
```

```ts
// const appleBundleId = process.env.APPLE_APP_BUNDLE_IDENTIFIER || "";

// socialProviders: {
//   apple: {
//     clientId: "", // keep empty for mobile-only setup
//     clientSecret: "", // keep empty for mobile-only setup
//     appBundleIdentifier: appleBundleId,
//   },
// },
```

Expo usage lives in:
```
apps/native/lib/oauth/useAppleAuth.ts
```
now done => `bun dev` from root => will take a moment for index creation if first run

---

## License

MIT
