const ContactMessage = require('../models/ContactMessage');
const { sendContactNotification, sendReplyEmail } = require('../utils/emailService');

const getAllMessages = async (req, res) => {
  try {
    const messages = await ContactMessage.find().sort({ createdAt: -1 });
    res.status(200).json({ messages });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

const sendContactMessage = async (req, res) => {
  try {
    const { name, email, messageText } = req.body;

    const message = new ContactMessage({ name, email, messageText });
    await message.save();

    await sendContactNotification({ name, email, messageText });

    res.status(201).json({ message: 'Message saved successfully' });
  } catch (error) {
    console.error('EMAIL SEND ERROR:', error.message);
    res.status(500).json({ message: 'Server error' });
  }
};

const replyToContactMessage = async (req, res) => {
  try {
    const messageId = req.params.id;
    const { replyText } = req.body;

    const message = await ContactMessage.findById(messageId);
    if (!message) return res.status(404).json({ message: 'Message not found' });

    message.reply = replyText;
    message.repliedAt = new Date();
    await message.save();

    await sendReplyEmail(message.email, replyText);
    res.status(200).json({ message: 'Reply sent successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = {
  getAllMessages,
  sendContactMessage,
  replyToContactMessage
};
