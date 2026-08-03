const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT, 10),
    secure: false, // 587 is STARTTLS, so secure should be false
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
    },
    tls: {
        rejectUnauthorized: false // bypass SSL verification issues if any
    }
});

const sendOtpEmail = async (toEmail, otp) => {
    const mailOptions = {
        from: process.env.SMTP_FROM,
        to: toEmail,
        subject: "Safety360 - Login OTP",
        html: `
            <div style="font-family: sans-serif; padding: 20px; max-width: 500px; border: 1px solid #e2e8f0; border-radius: 12px; margin: 0 auto; background-color: #ffffff;">
                <div style="text-align: center; margin-bottom: 20px;">
                    <h2 style="color: #ea580c; margin: 0; font-size: 24px;">Safety360</h2>
                    <p style="color: #64748b; font-size: 14px; margin: 5px 0 0 0;">Secure First-Time Verification</p>
                </div>
                <hr style="border: 0; border-top: 1px solid #f1f5f9; margin-bottom: 20px;" />
                <p style="color: #334155; font-size: 15px; line-height: 1.5;">Please use the following One-Time Password (OTP) to complete your first-time login verification:</p>
                <div style="font-size: 28px; font-weight: 800; background-color: #fff7ed; border: 2px dashed #ffedd5; padding: 15px; text-align: center; border-radius: 10px; letter-spacing: 5px; color: #ea580c; margin: 20px 0;">
                    ${otp}
                </div>
                <p style="font-size: 12px; color: #94a3b8; text-align: center; margin-top: 25px; line-height: 1.4;">
                    This code is valid for 10 minutes. If you did not request this, please ignore this email.
                </p>
            </div>
        `,
    };

    return transporter.sendMail(mailOptions);
};

module.exports = { sendOtpEmail };
