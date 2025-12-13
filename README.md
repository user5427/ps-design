



## Stripe Setup (Local Development)

### 1. Create a Stripe Account

* Create a Stripe account and switch to **Sandbox / Test mode**.
* In the Stripe Dashboard, locate the following keys:

  * **`STRIPE_SECRET_KEY`** (secret)
  * **`VITE_STRIPE_PUBLISHABLE_KEY`** (public)
* Save both values in your `.env` file.

---

### 2. Configure Webhooks for Local Development

Our backend uses **Stripe webhooks**, which means Stripe must be able to reach your local server.

To enable this locally, use the **Stripe CLI**.

#### Install Stripe CLI

Follow the official installation guide:
[https://docs.stripe.com/stripe-cli](https://docs.stripe.com/stripe-cli)

#### Log in

```bash
stripe login
```

#### Start Webhook Forwarding

Run the following command:

```bash
stripe listen --forward-to localhost:400/api/payments/webhook
```

* After starting the listener, Stripe will output a **webhook signing secret**.
* Save this value as:

  * **`STRIPE_WEBHOOK_SECRET`** in your `.env` file.

Once this is set up, Stripe events will be forwarded to your local backend.

---

### 3. Test Payments

Use Stripe’s official test cards to simulate payments:
[https://docs.stripe.com/testing](https://docs.stripe.com/testing)

These cards allow you to test successful payments, failures, and authentication flows (e.g. 3D Secure).

---
