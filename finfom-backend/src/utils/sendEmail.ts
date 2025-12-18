import nodemailer from 'nodemailer';

interface EmailOptions {
    email: string;
    subject: string;
    message: string;
}

const sendEmail = async (options: EmailOptions) => {

    const port = Number(process.env.SMTP_PORT);
    const secure = port === 465; // true for 465, false for other ports
    
    // Google App Passwords often have spaces (e.g. "abcd efgh ijkl mnop"), but must be sent without them.
    const userPassword = process.env.SMTP_PASSWORD ? process.env.SMTP_PASSWORD.replace(/\s+/g, '') : '';

    const transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: port,
        secure: secure,
        auth: {
            user: process.env.SMTP_EMAIL,
            pass: userPassword,
        },
        tls: {
            rejectUnauthorized: false
        }
    });

    const message = {
        from: `${process.env.FROM_NAME} <${process.env.FROM_EMAIL}>`,
        to: options.email,
        subject: options.subject,
        text: options.message,
    };

    try {
        const info = await transporter.sendMail(message);
    } catch (error) {
        console.error('Error sending email:', error);
        throw error;
    }
};


export default sendEmail;
