const nodemailer = require('nodemailer');
require('dotenv').config();

const transporter = nodemailer.createTransport({
  host: 'mail.privateemail.com',
  port: 465, 
  secure: true, 
  auth: {
    user: process.env.EMAIL_USER, 
    pass: process.env.EMAIL_PASS,
  },
});

const sendResetEmail = async (to, subject, html) => {
  const mailOptions = {
    from: `"Spatrak info" <${process.env.EMAIL_USER}>`,
    to,
    subject,
    html,
  };

  await transporter.sendMail(mailOptions);
};

const sendContactNotification = async ({ name, email, messageText }) => {
  const mailOptions = {
    from: `"Website Contact Form" <${process.env.EMAIL_USER}>`,
    to: process.env.EMAIL_USER, 
    subject: 'New Message from Spatrak Website',
    html: `
      <h3>You have received a new message from the website contact form:</h3>
      <p><strong>Name:</strong> ${name}</p>
      <p><strong>Email:</strong> ${email}</p>
      <p><strong>Message:</strong><br/>${messageText}</p>
    `,
    replyTo: email, 
  };

  await transporter.sendMail(mailOptions);
};

const sendReplyEmail = async (toEmail, replyText) => {
  const mailOptions = {
    from: `"Spatrak info" <${process.env.EMAIL_USER}>`,
    to: toEmail,
    subject: 'Response to Your Message',
    text: replyText,
  };

  await transporter.sendMail(mailOptions);
};

  module.exports = {
    sendResetEmail,
    sendContactNotification,
    sendReplyEmail,
  };