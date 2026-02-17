import * as postmark from 'postmark';
import { config } from 'dotenv';
config();

// Postmark Email Configuration
const postmarkToken = process.env.POSTMARK_SERVER_TOKEN || '';
const fromEmail = process.env.POSTMARK_FROM_EMAIL || 'support@cryptospinwin.app';

// Validate email configuration on startup
if (!postmarkToken) {
    console.error("⚠️  [EMAIL SERVICE] POSTMARK_SERVER_TOKEN is not set! Emails will NOT be sent.");
} else {
    console.log("✅ [EMAIL SERVICE] Postmark configured, sending from:", fromEmail);
}

const client = new postmark.ServerClient(postmarkToken);

// Email sender function
export const sendEmail = async (to: string, subject: string, html: string): Promise<boolean> => {
    // Pre-flight validation
    if (!postmarkToken) {
        console.error("[EMAIL SERVICE] ❌ Cannot send email — POSTMARK_SERVER_TOKEN is not configured.");
        console.error("[EMAIL SERVICE] Environment:", process.env.NODE_ENV || 'unknown');
        return false;
    }

    if (!to || !subject) {
        console.error("[EMAIL SERVICE] ❌ Missing required fields — to:", to, "subject:", subject);
        return false;
    }

    try {
        const result = await client.sendEmail({
            From: fromEmail,
            To: to,
            Subject: subject,
            HtmlBody: html,
            TextBody: html.replace(/<[^>]*>/g, ''), // Strip HTML tags for text fallback
            MessageStream: 'outbound'
        });

        console.log("[EMAIL SERVICE] ✅ Email sent successfully to:", to, "| MessageID:", result.MessageID);
        return true;
    } catch (error: any) {
        console.error("[EMAIL SERVICE] ❌ Failed to send email to:", to);
        console.error("[EMAIL SERVICE] Subject:", subject);
        console.error("[EMAIL SERVICE] Environment:", process.env.NODE_ENV || 'unknown');

        if (error?.statusCode) {
            console.error("[EMAIL SERVICE] Status Code:", error.statusCode);
        }
        if (error?.code) {
            console.error("[EMAIL SERVICE] Error Code:", error.code);
        }
        if (error?.message) {
            console.error("[EMAIL SERVICE] Error Message:", error.message);
        } else {
            console.error("[EMAIL SERVICE] Error:", error);
        }

        return false;
    }
};

// OTP Email Template
export const sendOTPEmail = async (email: string, otp: number): Promise<boolean> => {
    const subject = "Your OTP Verification Code - SpinWin";
    const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #333;">OTP Verification</h2>
      <p>Your verification code is:</p>
      <h1 style="color: #007bff; font-size: 32px; letter-spacing: 5px;">${otp}</h1>
      <p>This code will expire in 5 minutes.</p>
      <p style="color: #666; font-size: 12px;">If you didn't request this code, please ignore this email.</p>
    </div>
  `;

    return sendEmail(email, subject, html);
};
