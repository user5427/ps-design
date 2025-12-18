



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
stripe listen --forward-to localhost:4000/api/payments/webhook
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

---

## SMS Notifications with Twilio

The application sends SMS notifications to customers when appointments are created using Twilio.

### 1. Create a Twilio Account

* Sign up at [Twilio Console](https://console.twilio.com/)
* Complete the trial account setup
* Get a free Twilio phone number

### 2. Get Your Credentials

From the Twilio Console dashboard, copy:

* **Account SID**
* **Auth Token**
* **Twilio Phone Number** (the one assigned to you)

### 3. Configure Environment Variables

Add to your `backend/.env` file:

```env
TWILIO_ACCOUNT_SID=your-account-sid
TWILIO_AUTH_TOKEN=your-auth-token
TWILIO_PHONE_NUMBER=+1234567890
ENABLE_SMS_NOTIFICATIONS=true
```

### 4. Verify Phone Numbers (Trial Account)

**Important:** Trial accounts can only send SMS to verified phone numbers.

1. Go to [Verified Caller IDs](https://console.twilio.com/us1/develop/phone-numbers/manage/verified)
2. Click "Add a new number"
3. Enter your phone number in E.164 format (e.g., `+14155552671`)
4. Verify the code sent via SMS

### 5. Phone Number Format

All phone numbers must be in **E.164 format**:
- Include country code with `+` prefix
- No spaces, dashes, or parentheses
- Examples:
  - US: `+14155552671`
  - UK: `+442071838750`
  - Brazil: `+5511999999999`

### 6. How It Works

When an appointment is created with a customer phone number, they automatically receive:

```
Hi {customerName}, your appointment for {serviceName} with {employeeName} 
at {businessName} is confirmed for {date} at {time}. See you soon!
```

### 7. Disable SMS (Optional)

To disable SMS notifications during development:

```env
ENABLE_SMS_NOTIFICATIONS=false
```

---

