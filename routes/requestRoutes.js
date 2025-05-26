const express = require('express');
const router = express.Router();
const { upload, createRequest, getAllRequests, replyToRequest, getUserRequests, updateRequest, getRequestById  } = require('../controllers/requestController');
const authMiddleware = require('../middlewares/authMiddleware');
//const authorizeAdmin = require('../middlewares/authorizeAdmin');
const { signup, login, forgotPassword, resetPassword, getAllUsers, getUserById, updateUser } = require('../controllers/authController');
const passport = require('passport');
const User = require('../models/userModel');
//const Conversation = require('../models/Conversation');
//const Message = require('../models/Message');
//const ContactMessage = require('../models/ContactMessage');
//const { sendContactNotification, sendReplyEmail } = require('../utils/emailService');
const jwt = require('jsonwebtoken');
const JWT_SECRET = process.env.JWT_SECRET;

router.get('/protected-route', authMiddleware, (req, res) => {
    res.status(200).json({ message: 'You have access to this route' });
  });

  router.get('/me', async (req, res) => {
    try {
      const authHeader = req.headers.authorization;
      if (!authHeader) return res.status(401).json({ message: 'No token' });
  
      const token = authHeader.split(' ')[1];
      const decoded = jwt.verify(token, JWT_SECRET);
  
      const user = await User.findById(decoded.id);
      if (!user) return res.status(404).json({ message: 'User not found' });
  
      res.json({
        user: {
          id: user._id,
          firstname: user.firstname,
          lastname: user.lastname,
          email: user.email,
          image: user.image,
          role: user.role,
          googleId: user.googleId || null,
          password: user.password ? 'set' : null
        }
      });
    } catch (err) {
      res.status(401).json({ message: 'Invalid token' });
    }
  });

router.post(
  '/',
  authMiddleware,
  upload.fields([
    { name: 'consentForm', maxCount: 1 },
    { name: 'idCard', maxCount: 1 },
    { name: 'diploma', maxCount: 1 }
  ]),
  createRequest
);

router.put(
  '/:id',
  authMiddleware,
  upload.fields([
    { name: 'consentForm', maxCount: 1 },
    { name: 'idCard', maxCount: 1 },
    { name: 'diploma', maxCount: 1 }
  ]),
  updateRequest
);
router.get('/', getAllRequests);
router.put('/:id/reply', upload.single('reportFile'), replyToRequest);
router.get('/contact', async (req, res) => {
    try {
      const messages = await ContactMessage.find().sort({ createdAt: -1 });
      res.status(200).json({ messages });
    } catch (error) {
      res.status(500).json({ message: 'Server error' });
    }
});
router.get('/:id', getRequestById);
router.get('/user/:userId', getUserRequests);
router.post('/signup', signup);
router.post('/login', login);
router.get('/users', getAllUsers);        
router.get('/users/:id', getUserById);
router.put('/users/:id', authMiddleware, updateUser);  
router.post('/forgot-password', forgotPassword);
router.post('/reset-password/:token', resetPassword);
//router.get('/reset-password/:token', serveResetForm);

/*router.get('/dashboard', authorizeAdmin, (req, res) => {
  res.json({ message: 'Welcome to the admin dashboard 🎉' });
});*/

router.get('/auth/google', passport.authenticate('google', { scope: ['profile', 'email'] }));
router.get('/auth/google/callback',
  passport.authenticate('google', { session: false, failureRedirect: '/login' }),
  (req, res) => {
    const token = jwt.sign({ id: req.user._id }, JWT_SECRET, { expiresIn: '1h' });
    res.redirect(`http://localhost:3000/google-redirect?token=${token}`);
  }
);

router.post('/messages', async (req, res) => {
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
});
router.get('/conversations', async (req, res) => {
  try {
    const conversations = await Conversation.find()
      .populate('userId', 'name email')
      .populate('requestId', 'title');

    res.status(200).json({ conversations });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});
router.get('/conversation/:conversationId', async (req, res) => {
  try {
    const { conversationId } = req.params;

    const messages = await Message.find({ conversationId }).sort({ createdAt: 1 });

    res.status(200).json({ messages });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});
router.post('/contact', async (req, res) => {
  try {
    const { name, email, messageText} = req.body;

    const message = new ContactMessage({ name, email, messageText});
    await message.save();

    await sendContactNotification({ name, email, messageText });

    res.status(201).json({ message: 'Message saved successfully' });
  } catch (error) {
    console.error('EMAIL SEND ERROR:', error.message, error.stack);
    res.status(500).json({ message: 'Server error' });
  }
});

router.post('/contactreply/:id', async (req, res) => {
  try {
    const messageId = req.params.id;
    const { replyText } = req.body;

    const message = await ContactMessage.findById(messageId);
    if (!message) {
      return res.status(404).json({ message: 'Message not found' });
    }

    message.reply = replyText;
    message.repliedAt = new Date();
    await message.save();

    await sendReplyEmail(message.email, replyText);
    res.status(200).json({ message: 'Reply sent successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;