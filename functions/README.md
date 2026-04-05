# KidVenture Firebase Functions

Cloud Functions for sending email notifications.

## Quick Start

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Set up email service:**
   - See `../FIREBASE_FUNCTIONS_SETUP.md` for detailed instructions
   - Quick version: Get SendGrid API key and set config:
     ```bash
     firebase functions:config:set sendgrid.api_key="YOUR_API_KEY"
     firebase functions:config:set sendgrid.from_email="noreply@yourdomain.com"
     ```

3. **Build:**
   ```bash
   npm run build
   ```

4. **Deploy:**
   ```bash
   npm run deploy
   ```

## Local Development

Test functions locally with the emulator:

```bash
npm run serve
```

## Functions

### `sendEmailNotification`

Callable function that accepts email data and sends emails via SendGrid.

**Request:**
```typescript
{
  to: string;
  subject: string;
  text: string;
  html?: string; // Optional HTML version
}
```

**Response:**
```typescript
{
  success: boolean;
  message: string;
}
```

## Switching to Mailgun

To use Mailgun instead of SendGrid:

1. Install packages:
   ```bash
   npm install mailgun.js form-data
   ```

2. Uncomment Mailgun code in `src/index.ts`

3. Comment out SendGrid code

4. Set config:
   ```bash
   firebase functions:config:set mailgun.api_key="YOUR_KEY"
   firebase functions:config:set mailgun.domain="mg.yourdomain.com"
   ```

5. Redeploy: `npm run deploy`

