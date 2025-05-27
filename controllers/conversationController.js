const Conversation = require('../models/Conversation');
const Message = require('../models/Message');

const sendMessage = async (req, res) => {
  try {
    const { requestId, userId, messageText, senderRole } = req.body;
    let conversation = await Conversation.findOne({ requestId });

    if (!conversation) {
      conversation = new Conversation({ requestId, userId });
      await conversation.save();
    }

    const message = new Message({
      conversationId: conversation._id,
      senderRole,
      messageText
    });

    await message.save();

    res.status(201).json({ message: 'Message sent successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

const getAllConversations = async (req, res) => {
  try {
    const conversations = await Conversation.find()
      .populate('userId', 'name email')
      .populate('requestId', 'title');

    res.status(200).json({ conversations });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

const getMessagesByConversationId = async (req, res) => {
  try {
    const { conversationId } = req.params;
    const messages = await Message.find({ conversationId }).sort({ createdAt: 1 });
    res.status(200).json({ messages });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = {
  sendMessage,
  getAllConversations,
  getMessagesByConversationId
};