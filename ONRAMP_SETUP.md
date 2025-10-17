# Fiat Onramp Integration Setup Guide

This guide explains how to set up and configure the MoonPay fiat onramp integration for purchasing FIL tokens.

## Overview

The onramp integration allows users to purchase Filecoin (FIL) tokens directly with fiat currency (USD, EUR, GBP) using credit cards or bank transfers through MoonPay.

### Architecture

- **Frontend**: React modal component (`FiatOnrampModal`) that collects purchase details
- **Backend**: Express API endpoints that generate signed MoonPay URLs
- **MoonPay**: Third-party payment processor that handles fiat-to-crypto conversion

## MoonPay Account Setup

### 1. Create MoonPay Account

1. Go to [MoonPay Dashboard](https://www.moonpay.com/dashboard/getting-started)
2. Sign up for a developer account
3. Complete business verification (required for production)

### 2. Get API Keys

After account creation, you'll receive:

- **Publishable Key** (Public): Used in frontend API calls
- **Secret Key** (Private): Used to sign URLs on backend
- **Webhook Secret** (Private): Used to verify webhook signatures

You can find these in: Dashboard → Settings → API Keys

### 3. Configure Webhook (Optional but Recommended)

Set up a webhook to receive transaction status updates:

1. Go to Dashboard → Webhooks
2. Add webhook URL: `https://your-backend-domain.com/api/v1/onramp/moonpay-webhook`
3. Select events to listen for:
   - `transaction_created`
   - `transaction_updated`
4. Save the webhook secret provided

## Backend Configuration

### Environment Variables

Add the following to `app/backend/.env`:

```bash
# MoonPay Configuration
MOONPAY_PUBLISHABLE_KEY=pk_test_your_publishable_key_here
MOONPAY_SECRET_KEY=sk_test_your_secret_key_here
MOONPAY_WEBHOOK_SECRET=whsec_your_webhook_secret_here

# Set to true for sandbox testing, false for production
MOONPAY_SANDBOX=true

# Frontend URL for redirects after purchase
FRONTEND_URL=http://localhost:5173
```

### Testing vs Production

**Sandbox Mode (Testing):**
- Set `MOONPAY_SANDBOX=true`
- Use test API keys (prefix: `pk_test_` and `sk_test_`)
- Transactions won't process real money
- MoonPay URL: `https://buy-sandbox.moonpay.com`

**Production Mode:**
- Set `MOONPAY_SANDBOX=false`
- Use live API keys (prefix: `pk_live_` and `sk_live_`)
- Requires completed business verification with MoonPay
- MoonPay URL: `https://buy.moonpay.com`

### API Endpoints

The backend provides these endpoints:

#### Generate MoonPay URL
```
POST /api/v1/onramp/moonpay-url
Authorization: Bearer <token>

Request Body:
{
  "walletAddress": "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb",
  "email": "user@example.com",
  "currencyCode": "fil",
  "baseCurrencyCode": "usd",
  "baseCurrencyAmount": 100
}

Response:
{
  "status": "success",
  "data": {
    "url": "https://buy-sandbox.moonpay.com?apiKey=...",
    "provider": "moonpay"
  }
}
```

#### Webhook Handler
```
POST /api/v1/onramp/moonpay-webhook
Headers:
  moonpay-signature: <signature>

Body: (sent by MoonPay)
{
  "type": "transaction_updated",
  "data": { ... }
}
```

#### Supported Currencies
```
GET /api/v1/onramp/supported-currencies

Response:
{
  "status": "success",
  "data": {
    "crypto": [
      { "code": "fil", "name": "Filecoin", "network": "filecoin" },
      ...
    ],
    "fiat": [
      { "code": "usd", "name": "US Dollar", "symbol": "$" },
      ...
    ]
  }
}
```

## Frontend Integration

### 1. Import the Modal Component

The `FiatOnrampModal` component is already created at:
```
app/frontend/components/modals/fiat-onramp-modal.tsx
```

### 2. Add to Your Dashboard/Header

Example integration in your app:

```typescript
import { FiatOnrampModal } from '@/components/modals/fiat-onramp-modal';
import { useState } from 'react';

function Header() {
  const [isOnrampOpen, setIsOnrampOpen] = useState(false);

  return (
    <>
      <button onClick={() => setIsOnrampOpen(true)}>
        Buy FIL
      </button>

      {isOnrampOpen && (
        <FiatOnrampModal onClose={() => setIsOnrampOpen(false)} />
      )}
    </>
  );
}
```

### 3. Prerequisites

The onramp modal requires:
- User must be authenticated (Privy login)
- Wallet must be connected (Privy embedded or external wallet)
- Backend API must be configured with MoonPay keys

### Modal Flow

1. **Form Step**: User enters purchase amount and selects currency
2. **URL Generation**: Frontend calls backend API to generate signed MoonPay URL
3. **Payment Options**: User chooses to complete purchase in:
   - New tab (redirects to MoonPay)
   - Embedded iframe (stays on your site)
4. **MoonPay Flow**: User completes KYC and payment on MoonPay
5. **Completion**: FIL tokens sent directly to user's wallet

## Security Considerations

### URL Signing

The backend signs MoonPay URLs using HMAC-SHA256:
```javascript
const signature = crypto
  .createHmac('sha256', MOONPAY_SECRET_KEY)
  .update(new URL(url).search)
  .digest('base64');
```

This prevents URL tampering and ensures requests come from your authorized backend.

### Webhook Verification

Webhooks are verified using HMAC-SHA256:
```javascript
const expectedSignature = crypto
  .createHmac('sha256', MOONPAY_WEBHOOK_SECRET)
  .update(JSON.stringify(payload))
  .digest('hex');
```

Always verify webhook signatures before processing transaction updates.

### Best Practices

1. **Never expose secret keys in frontend code**
   - Only use `MOONPAY_PUBLISHABLE_KEY` in frontend
   - Keep `MOONPAY_SECRET_KEY` and `MOONPAY_WEBHOOK_SECRET` on backend

2. **Use HTTPS in production**
   - MoonPay requires HTTPS for production webhooks
   - Ensure your backend has valid SSL certificate

3. **Implement rate limiting**
   - Already configured in backend (`RATE_LIMIT_*` variables)
   - Prevents abuse of onramp generation endpoint

4. **Validate wallet addresses**
   - Backend validates Ethereum/Filecoin address format
   - Prevents invalid transactions

## Testing the Integration

### 1. Backend Setup
```bash
cd app/backend
npm install
# Configure .env with MoonPay sandbox keys
npm run dev
```

### 2. Frontend Setup
```bash
cd app/frontend
npm install
npm run dev
```

### 3. Test Flow

1. Login with Privy (use any method: Google, Email, etc.)
2. Connect wallet (embedded or external)
3. Open "Buy FIL" modal
4. Enter test amount: $50 USD
5. Click "Continue to MoonPay"
6. Choose "Continue here" to test iframe
7. Complete MoonPay's sandbox flow (no real money)

### Test Cards (Sandbox Only)

MoonPay provides test cards for sandbox testing:
- **Success**: `4000 0000 0000 0077`
- **Decline**: `4000 0000 0000 0002`
- CVV: Any 3 digits
- Expiry: Any future date

## Monitoring and Logs

### Backend Logs

The backend logs all onramp-related events:

```javascript
// URL generation
logger.info(`Generated MoonPay URL for user ${userId}, wallet: ${address}`);

// Webhook events
logger.info(`MoonPay transaction updated: ${transactionId}, status: ${status}`);
```

### Transaction Tracking

Monitor transactions in:
1. **MoonPay Dashboard** → Transactions
2. **Backend logs** (webhook events)
3. **User's wallet** (blockchain explorer)

## Production Deployment Checklist

- [ ] Business verification completed with MoonPay
- [ ] Production API keys obtained
- [ ] `MOONPAY_SANDBOX=false` in production `.env`
- [ ] HTTPS enabled on backend
- [ ] Webhook URL configured in MoonPay dashboard
- [ ] Frontend redirects updated to production URLs
- [ ] Rate limiting configured appropriately
- [ ] Error monitoring/alerting set up
- [ ] Test transactions completed successfully

## Supported Networks and Currencies

### Cryptocurrencies
- **Filecoin (FIL)** - Primary/Recommended
- Ethereum (ETH)
- USD Coin (USDC)

### Fiat Currencies
- USD (United States Dollar)
- EUR (Euro)
- GBP (British Pound)

## Troubleshooting

### "MoonPay service not configured"
- Check that `MOONPAY_PUBLISHABLE_KEY` is set in backend `.env`
- Restart backend after adding environment variables

### "Invalid signature"
- Verify `MOONPAY_SECRET_KEY` matches key from MoonPay dashboard
- Check that key has no extra spaces or newlines

### Webhook not receiving events
- Verify webhook URL is publicly accessible
- Check webhook secret matches MoonPay dashboard
- Ensure backend is running and endpoint is accessible

### "Wallet not connected" error
- User must connect Privy wallet before using onramp
- Check that Privy is properly configured
- Verify wallet context is providing address

## Support and Resources

- **MoonPay Documentation**: https://docs.moonpay.com
- **MoonPay Dashboard**: https://www.moonpay.com/dashboard
- **MoonPay Support**: support@moonpay.com
- **Privy Documentation**: https://docs.privy.io

## Future Enhancements

Potential improvements to consider:

1. **Multiple Providers**: Add support for Ramp, Stripe, or Transak
2. **Transaction History**: Store and display past purchases
3. **Email Notifications**: Alert users when purchase completes
4. **Price Estimation**: Show real-time FIL price before purchase
5. **Limits Management**: Enforce daily/monthly purchase limits
6. **Referral Tracking**: Track onramp conversions for analytics

## Code Structure

```
app/
├── frontend/
│   └── components/
│       └── modals/
│           └── fiat-onramp-modal.tsx       # React modal component
├── backend/
    ├── controllers/
    │   └── onrampController.js              # Business logic
    ├── routes/
    │   └── onrampRoutes.js                  # API routes
    └── .env                                  # Environment config
```

## License

This integration is part of the Cairn platform. See main LICENSE file for details.
