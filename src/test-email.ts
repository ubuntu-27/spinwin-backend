import { sendEmail } from './core/services/email.service.js';

const testEmail = async () => {
    console.log('🚀 Testing email configuration...\n');

    // Replace with your email to receive the test
    const testRecipient = process.argv[2];

    if (!testRecipient) {
        console.error('❌ Please provide a recipient email as argument');
        console.log('Usage: npx ts-node test-email.ts your-email@example.com');
        process.exit(1);
    }

    console.log(`📧 Sending test email to: ${testRecipient}`);

    const result = await sendEmail(
        testRecipient,
        '✅ SpinWin Email Test - Success!',
        `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <h2 style="color: #28a745;">🎉 Email Configuration Working!</h2>
            <p>This is a test email from your SpinWin backend.</p>
            <p>If you're seeing this, your SMTP configuration is correct.</p>
            <hr style="border: 1px solid #eee; margin: 20px 0;">
            <p style="color: #666; font-size: 12px;">
                Sent at: ${new Date().toISOString()}
            </p>
        </div>
        `
    );

    if (result) {
        console.log('\n✅ Email sent successfully! Check your inbox.');
    } else {
        console.log('\n❌ Failed to send email. Check the error above.');
    }

    process.exit(0);
};

testEmail();
