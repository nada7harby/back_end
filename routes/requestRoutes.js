const express = require('express');
const router = express.Router();
const upload = require('../config/s3Storage');
const passport = require('passport');
const jwt = require('jsonwebtoken');
const JWT_SECRET = process.env.JWT_SECRET;

const authMiddleware = require('../middlewares/authMiddleware');
// const authorizeAdmin = require('../middlewares/authorizeAdmin');

/* Controllers */
const { 
  createRequest, 
  getAllRequests, 
  replyToRequest, 
  getUserRequests, 
  updateRequest, 
  getRequestById  
} = require('../controllers/requestController');

const { 
  signup, 
  login, 
  forgotPassword, 
  resetPassword, 
  getAllUsers, 
  getUserById, 
  updateUser, 
  getCurrentUser 
} = require('../controllers/authController');

const { 
  sendMessage, 
  getAllConversations, 
  getMessagesByConversationId 
} = require('../controllers/conversationController');

const { 
  getAllMessages, 
  sendContactMessage, 
  replyToContactMessage 
} = require('../controllers/contactController');

const { 
  checkout, 
  successStatus, 
  cancel, 
  markRequestPaid 
} = require('../controllers/payment');


/* ================= USER AUTH ================= */
router.post('/signup', signup);
router.post('/login', login);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password/:token', resetPassword);
router.get('/me', authMiddleware, getCurrentUser);

router.get('/users', getAllUsers);
router.get('/users/:id', getUserById);
router.put('/users/:id', authMiddleware, updateUser);

/* ================= GOOGLE AUTH ================= */
router.get('/auth/google', passport.authenticate('google', { scope: ['profile', 'email'] }));
router.get('/auth/google/callback',
  passport.authenticate('google', { session: false, failureRedirect: '/login' }),
  (req, res) => {
    const token = jwt.sign({ id: req.user._id }, JWT_SECRET, { expiresIn: '1h' });
    res.redirect(`https://spatrak.com/google-redirect.html?token=${token}`);
  }
);

/* ================= REQUESTS ================= */
router.post('/', authMiddleware,
  upload.fields([
    { name: 'consentForm', maxCount: 1 },
    { name: 'idCard', maxCount: 1 },
    { name: 'diploma', maxCount: 1 }
  ]),
  createRequest
);

router.put('/:id', authMiddleware,
  upload.fields([
    { name: 'consentForm', maxCount: 1 },
    { name: 'idCard', maxCount: 1 },
    { name: 'diploma', maxCount: 1 }
  ]),
  updateRequest
);

router.put('/:id/reply', upload.single('reportFile'), replyToRequest);
router.get('/', getAllRequests);
router.get('/user/:userId', getUserRequests);

/* ================= CONTACT ================= */
router.get('/contact', getAllMessages);
router.post('/contact', sendContactMessage);
router.post('/contactreply/:id', replyToContactMessage);

/* ================= CONVERSATIONS ================= */
router.get('/conversations', getAllConversations);
router.post('/messages', sendMessage);
router.get('/conversation/:conversationId', getMessagesByConversationId);

/* ================= PAYMENT ================= */
router.post('/checkout', authMiddleware, checkout);
router.get('/success-status', successStatus);
router.get('/cancel', authMiddleware, cancel);
router.post('/mark-request-paid', authMiddleware, markRequestPaid);

/* ================= DYNAMIC ROUTES (KEEP LAST) ================= */
router.get('/:id', getRequestById);

module.exports = router;
