import 'dotenv/config';
import nodemailer from 'nodemailer';

const configurations = [
    { port: 587, secure: false, name: 'Port 587 (TLS)' },
    { port: 465, secure: true, name: 'Port 465 (SSL)' },
    { port: 25, secure: false, name: 'Port 25 (Unencrypted/TLS)' },
];

const testEmail = async () => {
    console.log('🚀 Starting Comprehensive Email Test...');
    console.log(`User: ${process.env.SMTP_EMAIL}`);

    for (const config of configurations) {
        console.log(`\n----------------------------------------`);
        console.log(`Testing Configuration: ${config.name}`);
        console.log(`Host: ${process.env.SMTP_HOST}, Port: ${config.port}, Secure: ${config.secure}`);

        const transporter = nodemailer.createTransport({
            host: process.env.SMTP_HOST,
            port: config.port,
            secure: config.secure,
            auth: {
                user: process.env.SMTP_EMAIL,
                pass: process.env.SMTP_PASSWORD,
            },
            tls: {
                rejectUnauthorized: false
            },
            connectionTimeout: 10000, // 10 seconds timeout
        });

        try {
            console.log('Verifying connection...');
            await transporter.verify();
            console.log('✅ Connection Verified!');

            console.log('Sending test email...');
            const info = await transporter.sendMail({
                from: `${process.env.FROM_NAME} <${process.env.FROM_EMAIL}>`,
                to: process.env.SMTP_EMAIL,
                subject: `Finfom Test - ${config.name}`,
                text: `This is a test email using configuration: ${config.name}`,
            });

            console.log('✅ Email sent successfully!');
            console.log('Message ID:', info.messageId);
            console.log(`🎉 SUCCESS! Please update your .env file to use PORT=${config.port}`);
            return; // Stop after first success
        } catch (error: any) {
            console.error(`❌ Failed: ${error.message}`);
            if (error.code === 'ETIMEDOUT') {
                console.error('   -> Connection timed out. Firewall or ISP might be blocking this port.');
            } else if (error.response) {
                console.error(`   -> SMTP Response: ${error.response}`);
            }
        }
    }

    console.log(`\n----------------------------------------`);
    console.log('❌ All configurations failed.');
    console.log('Suggestions:');
    console.log('1. Check if your ISP blocks port 587 or 465.');
    console.log('2. Verify your App Password is correct (spaces removed).');
    console.log('3. Try using a different internet connection (e.g., mobile hotspot).');
};

testEmail();
