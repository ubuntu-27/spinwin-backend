
import { model, Schema } from "mongoose";
import { sendOTPEmail } from "../core/services/email.service.js";

const OTPSchema = new Schema({

    email: {
        type: String,
        required: true
    },
    otp: {
        type: Number,
        required: true,
    },
    createdAt: {
        type: Date,
        default: Date.now(),
        expires: 5 * 60
    },

});

// function to send email via Postmark
async function sendVerificationMail(email: string, otp: number) {
    try {
        const result = await sendOTPEmail(email, otp);
        if (result) {
            console.log("OTP email sent successfully to:", email);
        } else {
            console.log("Failed to send OTP email to:", email);
        }
    }
    catch (error) {
        console.log("error occured while sending mail ", error);
    }
}

OTPSchema.pre('save', async function (next) {

    // Only send an email when a new document is created
    if (this.isNew) {
        await sendVerificationMail(this.email, this.otp);
    } next();

})

const OTP = model('OTP', OTPSchema);

export { OTP, OTPSchema };