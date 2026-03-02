# Convex RevenueCat: Follow-Up Research

> **Status:** Research Complete  
> **Created:** 2026-03-02  
> **Companion to:** [convex-revenuecat-component.md](./convex-revenuecat-component.md)

---

## 1. Existing Packages on npm

**We don't need to build this from scratch.** Two community packages already
exist that do exactly what we planned. Both are Apache-2.0 licensed, both
follow the official Convex component pattern, and both were published in
February 2026 (less than a month old).

### Package A: `convex-revenuecat`

| Detail             | Value                                                        |
| ------------------ | ------------------------------------------------------------ |
| **npm**            | [convex-revenuecat](https://npm.im/convex-revenuecat)       |
| **Version**        | 0.1.6 (7 releases, latest 2026-02-04)                       |
| **Author**         | ramonclaudio                                                 |
| **GitHub**         | https://github.com/ramonclaudio/convex-revenuecat            |
| **License**        | Apache-2.0                                                   |
| **Peer dep**       | convex ^1.31.6                                               |
| **Approach**       | **Webhook-only** (no outbound API calls)                     |

**Architecture:** Classic Convex component. Class-based client
(`new RevenueCat(components.revenuecat, config)`). All state derived from
incoming webhooks.

**Tables (6):**

| Table            | Purpose                                               |
| ---------------- | ----------------------------------------------------- |
| `customers`      | User identity, aliases, subscriber attributes         |
| `subscriptions`  | Purchase records with product and payment details     |
| `entitlements`   | Access control state (active/inactive, expiration)    |
| `experiments`    | A/B test enrollments from RevenueCat experiments      |
| `webhookEvents`  | Idempotency + audit trail (30-day auto-delete)        |
| `rateLimits`     | Webhook endpoint rate limiting (100 req/min per app)  |

**Query API:**

```typescript
const revenuecat = new RevenueCat(components.revenuecat, {
  REVENUECAT_WEBHOOK_AUTH: process.env.REVENUECAT_WEBHOOK_AUTH,
});

// Mounting
http.route({
  path: "/webhooks/revenuecat",
  method: "POST",
  handler: revenuecat.httpHandler(),
});

// Queries
await revenuecat.hasEntitlement(ctx, { appUserId, entitlementId: "premium" });
await revenuecat.getActiveEntitlements(ctx, { appUserId });
await revenuecat.getAllEntitlements(ctx, { appUserId });
await revenuecat.getActiveSubscriptions(ctx, { appUserId });
await revenuecat.getAllSubscriptions(ctx, { appUserId });
await revenuecat.getCustomer(ctx, { appUserId });
await revenuecat.getExperiment(ctx, { appUserId, experimentId });
await revenuecat.getExperiments(ctx, { appUserId });
```

**Handles all 18 webhook event types** including correct edge cases
(CANCELLATION keeps access until EXPIRATION, SUBSCRIPTION_PAUSED doesn't
revoke, etc.).

**Has test helpers:** Exports `convex-revenuecat/test` with
`revenuecatTest.register(t)` for `convex-test`.

**Strengths:**
- Simplest to integrate (only needs one env var: `REVENUECAT_WEBHOOK_AUTH`)
- No outbound network calls = no latency, no API key exposure
- Rate limiting built-in
- Experiment tracking
- Richer schema (separate customers, subscriptions, entitlements tables)
- Test helpers follow official Convex pattern

**Weaknesses:**
- No initial sync mechanism (existing subscribers before webhook setup won't
  appear until they trigger a new event)
- Webhook-only means if an event is lost and retries exhausted, state can drift
- Single community maintainer
- Note: it uses `appUserId` (RevenueCat's ID), not our Convex auth user ID
  directly -- we'd need our own bridging layer on top

---

### Package B: `@flyweightdev/convex-revenuecat`

| Detail             | Value                                                                 |
| ------------------ | --------------------------------------------------------------------- |
| **npm**            | [@flyweightdev/convex-revenuecat](https://npm.im/@flyweightdev/convex-revenuecat) |
| **Version**        | 0.1.3 (4 releases, latest 2026-02-16)                                |
| **Author**         | laxell (Flyweight Dev)                                                |
| **GitHub**         | https://github.com/flyweightdev/convex-revenuecat                    |
| **License**        | Apache-2.0                                                            |
| **Peer dep**       | convex ^1.31.7                                                        |
| **Approach**       | **Webhook + REST API v2 full resync** on every event                  |

**Architecture:** Convex component with a `RevenueCatSync` class client. On
every webhook event, it calls the RevenueCat REST API v2 to get a full
subscriber snapshot and reconciles that into the local DB. Also supports
post-purchase polling and virtual currency.

**Tables (4):**

| Table                       | Purpose                                              |
| --------------------------- | ---------------------------------------------------- |
| `subscribers`               | Cached full subscriber JSON from RC API v2           |
| `entitlements`              | Active/inactive entitlement state per user           |
| `virtual_currency_balances` | Virtual currency balances (new RC feature)           |
| `webhook_events`            | Idempotency + event log                              |

**Query API:**

```typescript
const rcClient = new RevenueCatSync(components.revenuecat, {
  REVENUECAT_API_KEY: "sk_...",        // optional, defaults to process.env
  REVENUECAT_PROJECT_ID: "proj_...",   // optional, defaults to process.env
});

// Route registration (functional style)
registerRoutes(http, components.revenuecat, {
  webhookPath: "/revenuecat/webhook",
  REVENUECAT_WEBHOOK_AUTH_KEY: "...",
  events: {
    INITIAL_PURCHASE: async (ctx, event) => { /* custom handler */ },
  },
  onEvent: async (ctx, event) => { /* catch-all */ },
});

// Actions (outbound API calls)
await rcClient.syncSubscriber(ctx, { appUserId });
await rcClient.pollForEntitlement(ctx, { appUserId, entitlementId, maxAttempts?, intervalMs? });
await rcClient.syncVirtualCurrencyBalances(ctx, { appUserId });
await rcClient.spendVirtualCurrency(ctx, { appUserId, adjustments, idempotencyKey? });

// Component queries (reactive)
await ctx.runQuery(components.revenuecat.public.getActiveEntitlements, { appUserId });
await ctx.runQuery(components.revenuecat.public.hasActiveEntitlement, { appUserId, entitlementId });
```

**Strengths:**
- REST API sync means state is always consistent with RevenueCat
- Virtual currency support (new RC feature)
- Post-purchase polling for web checkout flows (Paddle integration)
- Cross-platform architecture: mobile IAP + web Paddle, unified via RC
- Per-event custom handlers (`events.INITIAL_PURCHASE: async (ctx, event) => {}`)
- Designed to work with Clerk auth (easy to adapt to BetterAuth)

**Weaknesses:**
- Requires 3 env vars: `REVENUECAT_API_KEY`, `REVENUECAT_WEBHOOK_AUTH_KEY`,
  `REVENUECAT_PROJECT_ID`
- Makes outbound API calls on every webhook = added latency + API key in env
- Newer / fewer releases (4 vs 7)
- Simpler schema (stores raw subscriber JSON blob instead of structured tables)
- No separate subscription tracking -- just entitlements and raw JSON
- No built-in rate limiting
- No test helpers exported

---

### Head-to-Head Comparison

| Feature                       | `convex-revenuecat`      | `@flyweightdev/convex-revenuecat` |
| ----------------------------- | ------------------------ | --------------------------------- |
| Approach                      | Webhook-only             | Webhook + REST API v2 sync        |
| Env vars needed               | 1                        | 3                                 |
| Outbound API calls            | None                     | On every webhook event            |
| Tables                        | 6 (structured)           | 4 (raw JSON + structured)         |
| Handles all 18 events         | Yes                      | Yes                               |
| Rate limiting                 | Built-in                 | No                                |
| Experiment tracking           | Yes                      | No (logged only)                  |
| Virtual currency              | No                       | Yes                               |
| Post-purchase polling         | No                       | Yes                               |
| Custom per-event handlers     | No (catch-all only)      | Yes                               |
| Initial sync / backfill       | No                       | Yes (via `syncSubscriber()`)      |
| Test helpers                  | Yes (`/test` export)     | No                                |
| Subscription detail queries   | Yes (structured)         | No (raw JSON only)                |
| Auth assumption               | None (you pass appUserId)| Designed for Clerk (adaptable)    |

---

## 2. Convex Component Authoring: Key Constraints

The official Convex docs at
[docs.convex.dev/components/authoring](https://docs.convex.dev/components/authoring)
reveal several constraints that affect our architecture. These are important
regardless of whether we use an existing package or build our own.

### Environment Variables

> **Component functions are isolated from the app's environment variables and
> cannot access `process.env`.**

This is the biggest gotcha. The webhook handler needs the auth header secret to
validate incoming requests, but component code can't read `process.env`.

**How existing packages solve this:** Both packages instantiate their client in
the app's code (e.g., `convex/http.ts`) where `process.env` IS available, then
pass the secret as a constructor argument. The class stores it and passes it
into component function calls as regular arguments.

```typescript
// This runs in app context (http.ts), NOT inside the component
const revenuecat = new RevenueCat(components.revenuecat, {
  REVENUECAT_WEBHOOK_AUTH: process.env.REVENUECAT_WEBHOOK_AUTH,  // <-- works here
});
```

**Impact on our first doc:** The architecture in our planning doc is correct.
The `registerRoutes` / class constructor pattern is the standard way to handle
this. No changes needed.

### HTTP Actions

> **A component cannot expose HTTP actions itself because the routes could
> conflict with the main app's routes.**

The component defines HTTP action *handlers*, but the app mounts them at
specific routes in its own `http.ts`. Both existing packages follow this
pattern correctly.

### Authentication (ctx.auth)

> **Within a component, `ctx.auth` is not available.** You typically do
> authentication in the app, then pass identifiers like `userId` to the
> component.

This means: you authenticate the user in your Convex query/mutation (using
BetterAuth), get their user ID, then pass it to the RevenueCat component's
query methods. Both packages do this correctly -- they accept `appUserId` as a
string argument, not via `ctx.auth`.

### Id Types

> **All `Id<"table_name">` types within a component become simple string types
> outside of the component.**

This means when the component returns a customer record with a
`_id: Id<"customers">`, your app receives it as a plain `string`. This is fine
for our use case since we're primarily querying by `appUserId` (a string), not
by component-internal IDs.

### Local Components

> **The recommended pattern for local components is to organize them in a
> `convex/components` folder.**

If we build our own instead of using an npm package, the convention is:

```
packages/backend/convex/
  components/
    revenuecat/
      convex.config.ts    # defineComponent("revenuecat")
      schema.ts
      webhookProcessor.ts
      queries.ts
  convex.config.ts        # app.use(revenuecat) via local import
```

### Pagination

> **The built-in `.paginate()` doesn't work in components.**

Not a concern for us (entitlement lookups are small result sets), but worth
knowing if we ever need to list all webhook events.

---

## 3. RevenueCat Expo SDK

The Expo-specific docs at
[revenuecat.com/docs/getting-started/installation/expo](https://www.revenuecat.com/docs/getting-started/installation/expo)
confirm the client-side integration is straightforward.

### Installation

```bash
npx expo install react-native-purchases react-native-purchases-ui
```

### Key Details

- **Requires Expo development build** -- Expo Go has a built-in "Preview API
  Mode" that mocks native calls (good for UI development), but real purchases
  require a dev build via EAS.
- **Per-platform API keys:**
  ```typescript
  if (Platform.OS === "ios") {
    Purchases.configure({ apiKey: APPLE_API_KEY });
  } else if (Platform.OS === "android") {
    Purchases.configure({ apiKey: GOOGLE_API_KEY });
  }
  ```
- **User identification:** After BetterAuth login, call
  `Purchases.logIn(convexUserId)` to link the RC anonymous user to our auth
  user ID. This is the bridge that makes webhook `app_user_id` match our
  Convex user ID.
- **Entitlement checking (client-side):**
  ```typescript
  const customerInfo = await Purchases.getCustomerInfo();
  if (customerInfo.entitlements.active["pro"] !== undefined) {
    // User has "pro" entitlement
  }
  ```
- **Paywall UI:** `react-native-purchases-ui` provides RC's remote paywall
  builder (configurable from the RC dashboard without code changes).

### Expo Go Preview Mode

When running in Expo Go, the SDK automatically replaces native calls with
JavaScript mocks. This means:
- Paywall UI will render
- Subscription logic will execute without errors
- But **no real purchases** will happen

To test real purchases, build with `eas build --platform ios --profile ios-simulator`.

---

## 4. Recommendation: Build vs. Use Existing

### Decision Matrix

| Option | Effort | Risk | Control | Maintenance |
| ------ | ------ | ---- | ------- | ----------- |
| **A: Use `convex-revenuecat` as-is** | Low | Medium (community dep) | Low | External |
| **B: Use `@flyweightdev/convex-revenuecat` as-is** | Low | Medium (community dep) | Low | External |
| **C: Build our own from scratch** | High | Low (no external dep) | Full | Internal |
| **D: Start with existing, fork if needed** | Low initially | Low | Full when forked | Hybrid |

### Recommendation: Option D with Package A (`convex-revenuecat`)

**Start by installing `convex-revenuecat` (by ramonclaudio):**

1. It's the simpler of the two (webhook-only, 1 env var).
2. It has the richer schema (structured subscription + entitlement tables vs
   raw JSON blob).
3. It handles all 18 event types correctly with proper edge cases.
4. It has test helpers that follow the official Convex pattern.
5. It has no outbound network dependencies (important for Convex function
   execution time limits).
6. Its API surface is almost identical to what we designed in the first
   planning doc.

**What we'd build on top:**

The package uses `appUserId` (RevenueCat's user ID) for all queries. We need a
thin wrapper that maps our BetterAuth user ID to the RC `appUserId`. This is
just one function:

```typescript
// packages/backend/convex/revenueCat.ts
import { RevenueCat } from "convex-revenuecat";
import { components } from "./_generated/api";
import { authComponent } from "./auth";

const revenuecat = new RevenueCat(components.revenuecat, {
  REVENUECAT_WEBHOOK_AUTH: process.env.REVENUECAT_WEBHOOK_AUTH,
});

// Wrapper that bridges BetterAuth user -> RevenueCat appUserId
export async function hasEntitlement(
  ctx: any,
  entitlementId: string,
): Promise<boolean> {
  const authUser = await authComponent.safeGetAuthUser(ctx);
  if (!authUser) return false;

  // We set RC's app_user_id to the Convex user ID on the client
  // via Purchases.logIn(user._id), so they match directly.
  return await revenuecat.hasEntitlement(ctx, {
    appUserId: authUser.user._id,
    entitlementId,
  });
}
```

**When to fork:** If the package becomes unmaintained, or if we need features
it doesn't have (initial sync/backfill, virtual currency), we can fork the
repo and bring it in-house. The Apache-2.0 license explicitly allows this, and
the code follows standard Convex component patterns we already understand.

**Why not Package B (`@flyweightdev/convex-revenuecat`):** It's designed around
a Paddle + Clerk + RevenueCat stack, which adds complexity we don't need. The
REST API sync on every webhook is nice for consistency but adds latency,
requires more env vars, and means our Convex functions make outbound HTTP calls
(which must be `action`s, not `mutation`s -- limiting reactivity). If we later
need the API sync, it's easy to add as a separate scheduled job.

---

## 5. Corrections to the First Planning Doc

Based on this research, several things in the first planning doc should be
updated when we move to implementation:

### 5a. No need to author a component from scratch

The first doc designed a full component from scratch. With `convex-revenuecat`
available, we skip all of that and just `npm install` + configure.

### 5b. Environment variable handling

The first doc used `process.env.REVENUECAT_WEBHOOK_AUTH_HEADER` inside a
`registerRoutes` call, which is correct -- but only because that code runs in
app context (`http.ts`), not inside the component. The Convex authoring docs
confirm component code cannot access `process.env`. The existing packages
handle this correctly, and our wrapper code will too.

### 5c. HTTP route mounting

The first doc's `registerRoutes` pattern is correct in spirit, but the actual
API from `convex-revenuecat` uses `revenuecat.httpHandler()` returned as a
handler for `http.route()`. Minor API difference, same concept.

### 5d. Schema is external (component-managed)

The first doc included a full schema definition. With the npm package, those
tables are managed by the component and isolated from our app schema. We don't
need to define them -- just `app.use(revenuecat)` in `convex.config.ts`.

### 5e. User ID bridging is still required

Both existing packages accept `appUserId` as a string. The bridging strategy
from the first doc (call `Purchases.logIn(convexUserId)` on the client) is
still the correct approach.

---

## 6. Updated Implementation Phases

Given the research, here's the revised plan:

### Phase 1: Install & Wire Up (1-2 hours)

- [ ] `npm install convex-revenuecat`
- [ ] Add `app.use(revenuecat)` to `convex.config.ts`
- [ ] Mount webhook handler in `http.ts`
- [ ] Set `REVENUECAT_WEBHOOK_AUTH` env var
- [ ] Configure webhook URL in RevenueCat dashboard
- [ ] Send test event from RC dashboard to verify

### Phase 2: Auth Bridge (1 hour)

- [ ] Create `packages/backend/convex/revenueCat.ts` wrapper
- [ ] Wire `hasEntitlement()` into a protected query
- [ ] Test: auth user -> entitlement check flow

### Phase 3: Client-Side (2-3 hours)

- [ ] `npx expo install react-native-purchases react-native-purchases-ui`
- [ ] Configure RC SDK in app entry point (per-platform API keys)
- [ ] After BetterAuth login, call `Purchases.logIn(user._id)`
- [ ] Build paywall screen using RC's offerings
- [ ] Gate premium features on both client (RC SDK) and server (Convex query)

### Phase 4: Testing & Hardening (1-2 hours)

- [ ] Register component in `convex-test` using `convex-revenuecat/test`
- [ ] Write test for webhook -> entitlement flow
- [ ] Test sandbox purchases via Expo dev build
- [ ] Verify idempotency (send duplicate webhooks)

### Phase 5: Production (when ready)

- [ ] Switch RC webhook from sandbox to production
- [ ] Add monitoring for webhook failures
- [ ] Consider adding a scheduled reconciliation job (optional)

**Total estimated effort: ~6-8 hours** (down from building from scratch which
would have been 20-30+ hours).

---

## References

- [`convex-revenuecat` on npm](https://npm.im/convex-revenuecat)
- [`convex-revenuecat` source on GitHub](https://github.com/ramonclaudio/convex-revenuecat)
- [`@flyweightdev/convex-revenuecat` on npm](https://npm.im/@flyweightdev/convex-revenuecat)
- [`@flyweightdev/convex-revenuecat` source on GitHub](https://github.com/flyweightdev/convex-revenuecat)
- [Convex: Authoring Components](https://docs.convex.dev/components/authoring)
- [Convex: Using Components](https://docs.convex.dev/components/using)
- [RevenueCat Expo SDK](https://www.revenuecat.com/docs/getting-started/installation/expo)
- [RevenueCat React Native SDK](https://www.revenuecat.com/docs/getting-started/installation/reactnative)
