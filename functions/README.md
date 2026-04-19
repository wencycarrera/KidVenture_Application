# KidVenture Firebase Cloud Functions

---

## Overview

The KidVenture Firebase Cloud Functions handle backend server-side operations for the system, specifically focused on sending email notifications.

These functions are used by the Admin Web and Mobile Application to deliver automated emails such as:

● Account verification  
● Notifications  
● System updates  

The system is built using Firebase Functions and integrates with third-party email services such as SendGrid or Mailgun.

---

## Purpose

These Cloud Functions are responsible for:

● Sending email notifications to users  
● Handling system-triggered email events  
● Supporting SendGrid and Mailgun email services  
● Providing a secure backend for email delivery  
● Running server-side logic independent of client applications  

---

## Quick Start Guide

### 1. Install dependencies

npm install  

---

### 2. Email service setup

Before running the functions, configure your email provider.

For full setup instructions, refer to:

FIREBASE_FUNCTIONS_SETUP.md  

---

### 3. Configure SendGrid (default option)

Set Firebase function environment variables:

firebase functions:config:set sendgrid.api_key="YOUR_API_KEY"  
firebase functions:config:set sendgrid.from_email="noreply@yourdomain.com"  

---

### 4. Build the functions

npm run build  

---

### 5. Deploy to Firebase

npm run deploy  

---

## Local Development

You can test functions locally using the Firebase emulator:

npm run serve  

This allows you to simulate cloud function behavior without deploying.

---

## Available Functions

### sendEmailNotification

This is the main cloud function responsible for sending emails.

It is a callable function that receives email data and sends it through the configured provider (SendGrid or Mailgun).

---

## Request Format

```json
{
  "to": "string",
  "subject": "string",
  "text": "string",
  "html": "string (optional)"
}
```

---

## Response Format

```json
{
  "success": true,
  "message": "string"
}
```

---

## Switching Email Provider (SendGrid → Mailgun)

### Step 1: Install Required Packages

Run the following command:

npm install mailgun.js form-data  

---

### Step 2: Update Source Code

Open:

src/index.ts  

Then do the following:

● Uncomment Mailgun implementation  
● Comment out SendGrid implementation  

This will switch the email service from SendGrid to Mailgun.

---

### Step 3: Configure Mailgun in Firebase

Run these commands:

firebase functions:config:set mailgun.api_key="YOUR_KEY"  
firebase functions:config:set mailgun.domain="mg.yourdomain.com"  

Replace:
● YOUR_KEY → your Mailgun API key  
● mg.yourdomain.com → your Mailgun domain  

---

### Step 4: Redeploy Functions

Run:

npm run deploy  

---

## System Role in KidVenture

These functions are part of the KidVenture ecosystem and support:

● Admin Web System  
  ● Notifications  
  ● Approvals  
  ● System alerts  

● Mobile Application  
  ● Account verification  
  ● User updates  
  ● Notifications  

● Teacher and Parent Communication System  
  ● Messaging support  
  ● Learning updates  
  ● Progress notifications  

These act as the backend communication layer of KidVenture, ensuring smooth and reliable email delivery across all modules.

---

## Important Notes

● Always configure environment variables before deployment  
● Never expose API keys in frontend code or public repositories  
● Use Firebase Emulator for local testing  
● Monitor email provider usage limits  
● Always back up configuration before switching providers  

---

## Tech Stack

● Firebase Cloud Functions  
● Node.js  
● SendGrid / Mailgun  
● TypeScript  

---

## Developer

KidVenture Development Team

● Wency Marie D. Carrera  
● Kyla M. Ramos  
● Mar Anrew T. Tirao  