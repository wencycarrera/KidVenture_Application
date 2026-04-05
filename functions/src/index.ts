import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import { Resend } from 'resend';

// Initialize Firebase Admin
admin.initializeApp();

// Email service interface
interface EmailData {
  to: string;
  subject: string;
  text: string;
  html?: string;
}

const DEFAULT_REGION = 'us-central1';

function ensureResendConfig() {
  const resendApiKey = functions.config().resend?.api_key;
  if (!resendApiKey) {
    throw new Error(
      'Resend API key not configured. Please set resend.api_key in Firebase config.'
    );
  }
  const fromEmail = functions.config().resend?.from_email || 'onboarding@resend.dev';
  return { resendApiKey, fromEmail };
}

async function sendEmail(data: EmailData) {
  try {
    const { resendApiKey, fromEmail } = ensureResendConfig();

    const resend = new Resend(resendApiKey);

    await resend.emails.send({
      from: fromEmail,
      to: data.to,
      subject: data.subject,
      text: data.text,
      html: data.html || data.text.replace(/\n/g, '<br>'),
    });

    console.log(`Email sent`, { to: data.to, subject: data.subject });
  } catch (configError) {
    // Re-throw configuration errors with clear message
    if (configError instanceof Error && 
        configError.message.includes('Resend API key not configured')) {
      throw configError;
    }
    // Re-throw other errors
    throw configError;
  }
}

/**
 * Send Email Notification Cloud Function
 * 
 * This function accepts email data and sends emails via Resend.
 * 
 * To use this function:
 * 1. Set up Resend account at https://resend.com
 * 2. Get your API key from Resend dashboard
 * 3. Set the configuration in Firebase:
 *    firebase functions:config:set resend.api_key="YOUR_API_KEY"
 *    firebase functions:config:set resend.from_email="your-email@yourdomain.com" (optional)
 * 4. Deploy the function: npm run deploy
 * 
 * Region: us-central1 (default, can be changed)
 * To change region, replace 'us-central1' with your preferred region (e.g., 'asia-southeast1')
 */
export const sendEmailNotification = functions.runWith({
  timeoutSeconds: 60,
  memory: '256MB',
  serviceAccount: 'educational-app-52979@appspot.gserviceaccount.com',
}).region(DEFAULT_REGION).https.onCall(
  async (data: EmailData, context) => {
    // Verify that the request is authenticated (optional but recommended)
    // Uncomment the lines below to require authentication:
    // if (!context.auth) {
    //   throw new functions.https.HttpsError(
    //     'unauthenticated',
    //     'The function must be called while authenticated.'
    //   );
    // }

    // Validate input data
    if (!data.to || !data.subject || !data.text) {
      throw new functions.https.HttpsError(
        'invalid-argument',
        'Missing required fields: to, subject, and text are required.'
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(data.to)) {
      throw new functions.https.HttpsError(
        'invalid-argument',
        'Invalid email address format.'
      );
    }

    try {
      await sendEmail(data);

      return {
        success: true,
        message: 'Email sent successfully',
      };
    } catch (error: unknown) {
      let errorMessage = 'Unknown error occurred';
      let userMessage = 'Failed to send email. Please try again later.';

      if (error instanceof Error) {
        errorMessage = error.message;
        console.error('Error sending email:', errorMessage);
        console.error('Resend error details:', error);

        // Check if it's a configuration error
        if (errorMessage.includes('Resend API key not configured') || 
            errorMessage.includes('api_key')) {
          userMessage = 'Email service is not configured. Please contact support.';
        } else if (errorMessage.includes('Resend') || errorMessage.includes('resend')) {
          userMessage = 'Email service error. Please try again later.';
        }
      }

      throw new functions.https.HttpsError(
        'internal',
        userMessage,
        errorMessage
      );
    }
  }
);

// Export migration function
export { migrateUserDocuments } from './migrate-user-documents';
export { checkUserDocumentIds } from './check-user-document-ids';

