import * as postmark from 'postmark';
import { config } from 'dotenv';
config();

// Postmark Email Configuration
const client = new postmark.ServerClient(process.env.POSTMARK_SERVER_TOKEN || '');
const fromEmail = process.env.POSTMARK_FROM_EMAIL || 'support@cryptospinwin.app';

// Email sender function
export const sendEmail = async (to: string, subject: string, html: string): Promise<boolean> => {
    try {
        const result = await client.sendEmail({
            From: fromEmail,
            To: to,
            Subject: subject,
            HtmlBody: html,
            TextBody: html.replace(/<[^>]*>/g, ''), // Strip HTML tags for text fallback
            MessageStream: 'outbound'
        });

        console.log("Email sent successfully:", result.MessageID);
        return true;
    } catch (error) {
        console.error("Error sending email:", error);
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
