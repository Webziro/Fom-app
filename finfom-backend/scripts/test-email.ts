import 'dotenv/config';
import nodemailer from 'nodemailer';

const testEmail = async () => {
    console.log('Testing Email Configuration...');
    console.log('SMTP Config:', {
        host: process.env.SMTP_HOST,
        port: process.env.SMTP_PORT,
        user: process.env.SMTP_EMAIL ? '***' : 'MISSING',
        pass: process.env.SMTP_PASSWORD ? '***' : 'MISSING',
        from: process.env.FROM_EMAIL
    });

    const transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: Number(process.env.SMTP_PORT),
        secure: false,
        auth: {
            user: process.env.SMTP_EMAIL,
            pass: process.env.SMTP_PASSWORD,
        },
        tls: {
            rejectUnauthorized: false
        }
    });

    try {
        console.log('Verifying transporter connection...');
        await transporter.verify();
        console.log('✅ Transporter connection successful!');

        console.log('Sending test email...');
        const info = await transporter.sendMail({
            from: `${process.env.FROM_NAME} <${process.env.FROM_EMAIL}>`,
            to: process.env.SMTP_EMAIL, // Send to self
            subject: 'Finfom Test Email',
            text: 'If you receive this, your SMTP configuration is working correctly!',
        });

        console.log('✅ Email sent successfully!');
        console.log('Message ID:', info.messageId);
    } catch (error) {
        console.error('❌ Email Test Failed:', error);
    }
};

testEmail();
