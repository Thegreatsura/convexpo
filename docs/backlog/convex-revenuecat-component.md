# Convex RevenueCat Component

> **Status:** Backlog / Research  
> **Created:** 2026-03-02  
> **Depends on:** `@convex-dev/better-auth` (already integrated)

---

## Problem

This is an Expo + Convex app. In-app purchases and subscriptions are handled
client-side through the App Store / Google Play, but the Convex backend has
**zero visibility** into a user's subscription state. We need a server-side
source of truth so that Convex queries and mutations can gate features behind
entitlements ("is this user a Pro subscriber?") without trusting the client.

RevenueCat solves the cross-platform purchase abstraction on the client and
provides a webhook system to push subscription lifecycle events to our server.
The goal is to build a **Convex component** (following the same pattern as the
existing `@convex-dev/better-auth` component) that:

1. Receives RevenueCat webhooks into Convex via an HTTP endpoint.
2. Maintains subscription and entitlement state in isolated component tables.
3. Exposes simple query helpers (`hasEntitlement`, `isActive`, etc.) that any
   Convex function can call to gate features.

---

## Why This Mirrors the Stripe Component Pattern

RevenueCat and Stripe occupy the same architectural slot for a Convex backend:

| Concern                  | Stripe                                    | RevenueCat                                              |
| ------------------------ | ----------------------------------------- | ------------------------------------------------------- |
| Where purchases happen   | Client (Checkout / Elements)              | Client (native store via RC SDK)                        |
| Server source of truth   | Stripe webhooks                           | RevenueCat webhooks                                     |
| Webhook authentication   | Cryptographic signature (`stripe-signature`) | Static authorization header (configured in RC dashboard) |
| What server stores       | Customer, subscription, payment records   | Customer, subscription, entitlement records              |
| How server gates access  | Check subscription status from local DB   | Check entitlement status from local DB                  |
| Recommended post-webhook | N/A (Stripe event is complete)            | Call `GET /subscribers` REST API for consistent snapshot |

The key insight is the same: **the client initiates purchases, but the server
must independently verify and persist the state via webhooks.** Neither system
should trust the client to report its own subscription status.

---

## RevenueCat Webhook Overview

### Endpoint Requirements

- RevenueCat sends `POST` requests to a configured HTTPS URL.
- Your server must return **HTTP 200** within **60 seconds**.
- On failure: retries up to 5 times at 5, 10, 20, 40, 80 minute intervals.
- An **authorization header** (static bearer token) is configured in the RC
  dashboard and sent with every request. The server must validate it.

### Event Payload Structure

```jsonc
{
  "api_version": "1.0",
  "event": {
    "type": "INITIAL_PURCHASE",         // event type
    "id": "UniqueIdentifierOfEvent",    // idempotency key
    "app_id": "yourAppID",
    "app_user_id": "yourCustomerAppUserID",
    "original_app_user_id": "OriginalAppUserID",
    "aliases": ["..."],

    // Subscription details
    "product_id": "onemonth_no_trial",
    "entitlement_ids": ["pro"],
    "period_type": "NORMAL",            // TRIAL | INTRO | NORMAL | PROMOTIONAL
    "purchased_at_ms": 1591121853000,
    "expiration_at_ms": 1591726653000,
    "store": "APP_STORE",               // APP_STORE | PLAY_STORE | AMAZON | STRIPE | ...
    "environment": "PRODUCTION",        // PRODUCTION | SANDBOX
    "transaction_id": "170000869511114",
    "original_transaction_id": "1530648507000",

    // Pricing
    "price": 2.49,
    "price_in_purchased_currency": 2.49,
    "currency": "USD",
    "country_code": "US",

    // Metadata
    "event_timestamp_ms": 1591121855319,
    "subscriber_attributes": { ... },
    "is_family_share": false,
    "offer_code": null,
    "presented_offering_id": "OfferingID"
  }
}
```

### Event Types

| Event                         | What It Means                                                             |
| ----------------------------- | ------------------------------------------------------------------------- |
| `INITIAL_PURCHASE`            | New subscription purchased                                                |
| `RENEWAL`                     | Existing subscription renewed (or resubscribed after lapse)               |
| `CANCELLATION`                | Subscription cancelled or refunded (check `cancel_reason`)                |
| `UNCANCELLATION`              | Cancelled subscription re-enabled before expiration                       |
| `EXPIRATION`                  | Subscription expired -- **revoke access**                                 |
| `BILLING_ISSUE`               | Payment method failed (does NOT mean expired yet)                         |
| `PRODUCT_CHANGE`              | User switched subscription product (upgrade/downgrade)                    |
| `NON_RENEWING_PURCHASE`       | One-time purchase (lifetime, consumable, etc.)                            |
| `SUBSCRIPTION_PAUSED`         | Android-only: subscription will pause at end of period                    |
| `SUBSCRIPTION_EXTENDED`       | Expiration date pushed forward (store API extension)                      |
| `TRANSFER`                    | Entitlements transferred between user IDs                                 |
| `TEMPORARY_ENTITLEMENT_GRANT` | Store outage -- RC grants short-term access while validating              |
| `REFUND_REVERSED`             | A previous refund was reversed (Apple only)                               |
| `INVOICE_ISSUANCE`            | Web Billing invoice created (RC Billing only)                             |

### Common Lifecycle Flows

```
Purchase:     INITIAL_PURCHASE -> RENEWAL -> RENEWAL -> ...
Cancel:       CANCELLATION -> EXPIRATION (at period end)
Uncancel:     CANCELLATION -> UNCANCELLATION -> RENEWAL -> ...
Trial:        INITIAL_PURCHASE (period_type=TRIAL) -> RENEWAL (is_trial_conversion=true)
Billing fail: BILLING_ISSUE -> CANCELLATION (cancel_reason=BILLING_ERROR) -> EXPIRATION
                           OR -> RENEWAL (if payment recovered during grace period)
Refund:       CANCELLATION (cancel_reason=CUSTOMER_SUPPORT, price is negative)
```

### Security Considerations

- **Validate the authorization header** on every webhook request.
- **Deduplicate by event `id`** -- RC guarantees "at least once" delivery.
- **Respond quickly** -- do processing asynchronously after returning 200.
- **Handle unknown event types gracefully** -- RC may add new types without
  API version changes.

---

## Proposed Component Architecture

This follows the exact same layered pattern as `@convex-dev/better-auth`:

```
packages/backend/convex/
  convex.config.ts          -- app.use(revenueCat)
  revenueCat.ts             -- createClient + createRevenueCatConfig
  http.ts                   -- revenueCatComponent.registerRoutes(http, config)
  schema.ts                 -- (unchanged, component tables are isolated)

Component internals (npm package or local):
  convex.config.ts          -- defineComponent("revenueCat")
  schema.ts                 -- component-isolated tables
  webhookProcessor.ts       -- internal mutations for processing events
  queries.ts                -- internal queries for reading state
```

### Layer 1: Component Tables (Isolated)

```typescript
// Component schema -- these tables live in the component's namespace,
// NOT in the app's schema.ts. They are completely isolated.

import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  // Maps RevenueCat app_user_id to your Convex auth user ID.
  // This is the bridge between "who RC thinks this is" and
  // "who BetterAuth thinks this is."
  customers: defineTable({
    rcAppUserId: v.string(),          // RevenueCat's app_user_id
    convexUserId: v.string(),         // Your auth system's user ID
    originalRcAppUserId: v.string(),  // RC's original_app_user_id
    aliases: v.array(v.string()),     // All known RC aliases
    attributes: v.optional(v.any()),  // subscriber_attributes from RC
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_rc_app_user_id", ["rcAppUserId"])
    .index("by_convex_user_id", ["convexUserId"])
    .index("by_original_rc_app_user_id", ["originalRcAppUserId"]),

  // Tracks the current state of each subscription.
  // Updated by webhooks. This is the source of truth for "is this user
  // subscribed?"
  subscriptions: defineTable({
    customerId: v.id("customers"),
    rcAppUserId: v.string(),
    productId: v.string(),             // e.g. "com.app.monthly_pro"
    store: v.string(),                 // APP_STORE | PLAY_STORE | AMAZON | ...
    environment: v.string(),           // PRODUCTION | SANDBOX
    status: v.string(),                // active | cancelled | expired | paused | billing_issue | trial
    periodType: v.string(),            // NORMAL | TRIAL | INTRO | PROMOTIONAL
    purchasedAtMs: v.number(),
    expirationAtMs: v.optional(v.number()),   // null for non-renewing
    originalTransactionId: v.string(),
    latestTransactionId: v.string(),
    isFamilyShare: v.boolean(),
    cancelReason: v.optional(v.string()),
    // Pricing snapshot from last event
    price: v.optional(v.number()),
    currency: v.optional(v.string()),
    countryCode: v.optional(v.string()),
    offerCode: v.optional(v.string()),
    presentedOfferingId: v.optional(v.string()),
    renewalNumber: v.optional(v.number()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_customer_id", ["customerId"])
    .index("by_rc_app_user_id", ["rcAppUserId"])
    .index("by_original_transaction_id", ["originalTransactionId"])
    .index("by_status", ["status"]),

  // Tracks which entitlements a user currently has.
  // Entitlements are the access-control primitive. Your app checks
  // "does user X have entitlement 'pro'?" not "does user X have
  // subscription Y?"
  entitlements: defineTable({
    customerId: v.id("customers"),
    rcAppUserId: v.string(),
    entitlementId: v.string(),         // e.g. "pro", "premium"
    isActive: v.boolean(),
    productId: v.string(),             // which product grants this
    expirationAtMs: v.optional(v.number()),
    purchasedAtMs: v.number(),
    store: v.string(),
    updatedAt: v.number(),
  })
    .index("by_customer_id", ["customerId"])
    .index("by_rc_app_user_id", ["rcAppUserId"])
    .index("by_customer_and_entitlement", ["customerId", "entitlementId"])
    .index("by_rc_user_and_entitlement", ["rcAppUserId", "entitlementId"]),

  // Raw webhook event log. Used for:
  // 1. Idempotency (check event.id before processing)
  // 2. Audit trail
  // 3. Debugging
  webhookEvents: defineTable({
    eventId: v.string(),               // RC's unique event ID
    eventType: v.string(),             // INITIAL_PURCHASE, RENEWAL, etc.
    rcAppUserId: v.optional(v.string()),
    productId: v.optional(v.string()),
    rawPayload: v.string(),            // Full JSON stringified event
    processedAt: v.number(),
    environment: v.optional(v.string()),
  })
    .index("by_event_id", ["eventId"])
    .index("by_rc_app_user_id", ["rcAppUserId"])
    .index("by_event_type", ["eventType"]),
});
```

### Layer 2: Component Internal Functions

```typescript
// webhookProcessor.ts -- internal mutations called by the HTTP handler

// processWebhookEvent(ctx, { eventPayload })
//   1. Check idempotency: does webhookEvents already have this event.id?
//   2. Store raw event in webhookEvents table
//   3. Upsert customer record (create if first time seeing this app_user_id)
//   4. Route by event type:
//      - INITIAL_PURCHASE:    create/update subscription (status=active), activate entitlements
//      - RENEWAL:             update subscription (status=active, new expiration), refresh entitlements
//      - CANCELLATION:        update subscription (status=cancelled, set cancelReason)
//                             NOTE: do NOT revoke entitlements yet -- user has access until expiration
//      - UNCANCELLATION:      update subscription (status=active, clear cancelReason)
//      - EXPIRATION:          update subscription (status=expired), deactivate entitlements
//      - BILLING_ISSUE:       update subscription (status=billing_issue)
//      - NON_RENEWING_PURCHASE: create subscription (no expiration), activate entitlements
//      - SUBSCRIPTION_PAUSED: update subscription (status=paused)
//      - PRODUCT_CHANGE:      update subscription productId, handle entitlement swap
//      - TRANSFER:            reassign entitlements from old user to new user
//      - SUBSCRIPTION_EXTENDED: update expiration date
//      - TEMPORARY_ENTITLEMENT_GRANT: grant short-term entitlement
//      - REFUND_REVERSED:     reactivate entitlements
//   5. Return success

// queries.ts -- internal queries

// getCustomerByConvexUserId(ctx, { convexUserId })
// getCustomerByRcAppUserId(ctx, { rcAppUserId })
// getSubscriptionsByCustomerId(ctx, { customerId })
// getActiveEntitlements(ctx, { customerId })
// hasEntitlement(ctx, { customerId, entitlementId })
// getWebhookEvent(ctx, { eventId })
```

### Layer 3: Client API (What Your App Imports)

```typescript
// This is the public API of the component -- what you import and use
// in your Convex functions. Mirrors how authComponent works.

import { createClient } from "@your-scope/convex-revenuecat";
import { components } from "./_generated/api";

export const revenueCatComponent = createClient(components.revenueCat);

// ------------------------------------------------------------------
// The createClient function returns an object with:
// ------------------------------------------------------------------

revenueCatComponent.registerRoutes(http, {
  // The authorization header value configured in the RC dashboard.
  // MUST match what RC sends. This is how we verify the webhook is legit.
  webhookAuthorizationHeader: process.env.REVENUECAT_WEBHOOK_AUTH_HEADER!,

  // Optional: path prefix (default: "/api/revenuecat")
  pathPrefix: "/api/revenuecat",

  // Optional: filter to only process production events
  environmentFilter: "PRODUCTION", // or "SANDBOX" or undefined for both

  // Optional: callback after processing each event
  onEvent: async (ctx, event) => {
    // e.g., send a push notification on BILLING_ISSUE
  },
});

// Query helpers -- use these in your Convex functions:

// Check if a user has a specific entitlement
const isPro = await revenueCatComponent.hasEntitlement(ctx, {
  convexUserId: user._id,
  entitlementId: "pro",
});

// Get all active entitlements for a user
const entitlements = await revenueCatComponent.getActiveEntitlements(ctx, {
  convexUserId: user._id,
});

// Get the user's subscription details
const subscription = await revenueCatComponent.getSubscription(ctx, {
  convexUserId: user._id,
});

// Check if user has any active subscription
const isSubscribed = await revenueCatComponent.isSubscriptionActive(ctx, {
  convexUserId: user._id,
});
```

### Layer 4: App-Side Integration

#### Step 1 -- Register the component

```typescript
// packages/backend/convex/convex.config.ts
import betterAuth from "@convex-dev/better-auth/convex.config";
import revenueCat from "@your-scope/convex-revenuecat/convex.config";
import { defineApp } from "convex/server";

const app = defineApp();
app.use(betterAuth);
app.use(revenueCat);    // <-- add this

export default app;
```

#### Step 2 -- Create the client

```typescript
// packages/backend/convex/revenueCat.ts
import { createClient } from "@your-scope/convex-revenuecat";
import { components } from "./_generated/api";

export const revenueCatComponent = createClient(components.revenueCat);
```

#### Step 3 -- Register HTTP routes

```typescript
// packages/backend/convex/http.ts
import { httpRouter } from "convex/server";
import { authComponent, createAuth } from "./auth";
import { revenueCatComponent } from "./revenueCat";

const http = httpRouter();

// Existing auth routes
authComponent.registerRoutes(http, createAuth, { cors: true });

// RevenueCat webhook endpoint
revenueCatComponent.registerRoutes(http, {
  webhookAuthorizationHeader: process.env.REVENUECAT_WEBHOOK_AUTH_HEADER!,
});

export default http;
```

#### Step 4 -- Use in your functions

```typescript
// packages/backend/convex/someFeature.ts
import { query, mutation } from "./_generated/server";
import { authComponent } from "./auth";
import { revenueCatComponent } from "./revenueCat";

export const getPremiumContent = query({
  handler: async (ctx) => {
    // 1. Authenticate the user (existing pattern)
    const authUser = await authComponent.safeGetAuthUser(ctx);
    if (!authUser) throw new Error("Not authenticated");

    // 2. Check entitlement (new pattern -- same feel)
    const isPro = await revenueCatComponent.hasEntitlement(ctx, {
      convexUserId: authUser.user._id,
      entitlementId: "pro",
    });
    if (!isPro) throw new Error("Pro subscription required");

    // 3. Return the gated content
    return ctx.db.query("premiumContent").collect();
  },
});
```

---

## User-ID Bridging: RevenueCat <-> Convex Auth

This is the critical integration point. RevenueCat identifies users by
`app_user_id` (a string you control). Convex/BetterAuth identifies users by
their internal user document `_id`.

### Strategy: Set RC's app_user_id to the Convex User ID

When configuring RevenueCat on the client (Expo), identify the user with their
Convex auth user ID:

```typescript
// In your Expo app, after the user logs in:
import Purchases from "react-native-purchases";

// After BetterAuth login, you have the user's Convex ID
await Purchases.logIn(convexUser._id);
```

This way, when RC sends webhooks, the `app_user_id` field will be the Convex
user ID, and the component can directly map it to your auth system without an
extra lookup.

If the user isn't logged in yet (anonymous), RC uses `$RCAnonymousID:xxx`. The
component should handle the `TRANSFER` event to reassign entitlements when an
anonymous user later logs in and identifies themselves.

---

## Environment Variables

```bash
# The authorization header value you configure in the RevenueCat
# dashboard. RC sends this with every webhook request; we reject
# any request that doesn't match.
REVENUECAT_WEBHOOK_AUTH_HEADER="Bearer your-secret-token-here"

# (Optional) RevenueCat REST API key -- needed only if we want to
# call the GET /subscribers endpoint for full state sync after
# each webhook (recommended by RC docs).
REVENUECAT_API_KEY="sk_xxxxxxxxxxxx"
```

---

## Webhook URL Configuration (RevenueCat Dashboard)

In the RevenueCat dashboard under Integrations > Webhooks:

- **URL:** `https://<your-convex-deployment>.convex.site/api/revenuecat/webhook`
- **Authorization Header:** The same value as `REVENUECAT_WEBHOOK_AUTH_HEADER`
- **Environment:** Both (or Production-only depending on needs)
- **Events:** All (the component handles routing internally)

---

## Open Questions & Decisions

### 1. Local component or npm package?

- **Option A: Local component** -- Define the component directly in the
  monorepo (e.g., `packages/revenuecat-component/`). Faster to iterate,
  no publishing step, but coupled to this project.
- **Option B: npm package** -- Publish as `@convexpo/convex-revenuecat` (or
  similar). Reusable across projects, follows the same distribution model
  as `@convex-dev/better-auth`.
- **Recommendation:** Start as a local component, extract to npm later if it
  proves useful beyond this project.

### 2. Should we call the RC REST API after each webhook?

RevenueCat's own docs recommend calling `GET /subscribers/{app_user_id}` after
every webhook to get a consistent full snapshot. This adds latency and a
network dependency but ensures accuracy.

- **Option A: Webhook-only** -- Derive all state from webhook events. Simpler,
  fully offline from RC after the webhook arrives. Risk: missed events or
  ordering issues could lead to stale state.
- **Option B: Webhook + REST API sync** -- After processing the webhook,
  make a Convex `action` that calls the RC REST API and reconciles the
  full subscriber state. More robust but requires the API key and adds
  latency.
- **Recommendation:** Start with webhook-only. Add optional REST API sync
  as a second phase if we encounter consistency issues.

### 3. How to handle the TRANSFER event?

When a user restores purchases on a new device/account, RC fires a `TRANSFER`
event moving entitlements from one `app_user_id` to another. The component
needs to:
- Deactivate entitlements on the source customer
- Activate entitlements on the destination customer
- Handle the case where the destination customer doesn't exist in our DB yet

### 4. Sandbox vs Production separation?

Should the component store sandbox and production events in the same tables
(with an `environment` field for filtering) or separate them entirely? The
`environment` field approach is simpler and mirrors what RC does internally.

### 5. Entitlement expiration: real-time vs webhook-driven?

Entitlements have an `expirationAtMs` timestamp. Two approaches:
- **Webhook-driven:** Only update status when we receive `EXPIRATION` webhook.
  Simpler, but there's a delay (RC says up to ~1 hour without server
  notifications configured).
- **Real-time check:** Query also checks `expirationAtMs < Date.now()` in
  addition to the `isActive` flag. Belt-and-suspenders approach.
- **Recommendation:** Both. The `isActive` flag is the primary source of
  truth (set by webhooks), but the query also checks expiration time as a
  fallback safety net.

---

## Implementation Phases

### Phase 1: Webhook Receiver (MVP)

- [ ] Define component schema (customers, subscriptions, entitlements, webhookEvents)
- [ ] Implement HTTP webhook endpoint with auth header validation
- [ ] Implement event deduplication by event ID
- [ ] Process core events: INITIAL_PURCHASE, RENEWAL, CANCELLATION, EXPIRATION
- [ ] Expose `hasEntitlement()` and `isSubscriptionActive()` queries
- [ ] Wire into http.ts alongside existing auth routes
- [ ] Add `REVENUECAT_WEBHOOK_AUTH_HEADER` env var

### Phase 2: Full Event Coverage

- [ ] Handle UNCANCELLATION, BILLING_ISSUE, PRODUCT_CHANGE
- [ ] Handle SUBSCRIPTION_PAUSED, SUBSCRIPTION_EXTENDED
- [ ] Handle NON_RENEWING_PURCHASE (lifetime/consumable)
- [ ] Handle TRANSFER (user ID reassignment)
- [ ] Handle TEMPORARY_ENTITLEMENT_GRANT
- [ ] Handle REFUND_REVERSED
- [ ] Expose `getSubscription()` and `getActiveEntitlements()` queries

### Phase 3: Client-Side Integration

- [ ] Install `react-native-purchases` in the Expo app
- [ ] Configure RC SDK with API key and user identification
- [ ] Bridge RC `app_user_id` to Convex auth user ID on login
- [ ] Build paywall UI that reads offerings from RC
- [ ] Add client-side entitlement checks that read from Convex (not RC SDK)
  so the server is the source of truth even on the client

### Phase 4: Hardening & Extras

- [ ] Optional REST API sync after each webhook for consistency
- [ ] Admin query to view subscription state / audit events
- [ ] Scheduled job to reconcile stale subscriptions
- [ ] Monitoring: alert on webhook processing failures
- [ ] Extract to reusable npm package if warranted

---

## References

- [RevenueCat Webhooks Overview](https://www.revenuecat.com/docs/integrations/webhooks)
- [RevenueCat Event Types & Fields](https://www.revenuecat.com/docs/integrations/webhooks/event-types-and-fields)
- [RevenueCat Common Webhook Flows](https://www.revenuecat.com/docs/integrations/webhooks/event-flows)
- [RevenueCat Sample Events](https://www.revenuecat.com/docs/integrations/webhooks/sample-events)
- [RevenueCat React Native SDK](https://www.revenuecat.com/docs/getting-started/installation/reactnative)
- [RevenueCat Expo SDK](https://www.revenuecat.com/docs/getting-started/installation/expo)
- [RevenueCat REST API v1](https://www.revenuecat.com/docs/api-v1)
- [Convex Components (defineComponent)](https://docs.convex.dev/components)
- [`@convex-dev/better-auth` source](https://github.com/erquhart/convex-better-auth) -- the reference implementation for the component pattern used in this project
