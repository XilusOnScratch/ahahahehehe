const nodemailer = require('nodemailer');
require('dotenv').config();

async function test() {
    console.log('Testing email from:', process.env.EMAIL_USER);
    // console.log('Password length:', process.env.EMAIL_PASSWORD?.length);

    const transporter = nodemailer.createTransport({
        host: 'smtp.gmail.com',
        port: 465,
        secure: true,
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASSWORD.trim()
        }
    });

    try {
        console.log('Sending test email...');
        await transporter.sendMail({
            from: process.env.EMAIL_USER,
            to: 'ahana.virmani@gmail.com', // actual target
            subject: 'Test External',
            text: 'test from server'
        });
        console.log('Success!');
    } catch (e) {
        console.error('Failed:', e.message);
    }
}

test();
