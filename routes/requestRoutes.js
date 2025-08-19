const express = require('express');
const router = express.Router();
const upload = require('../config/s3Storage');
const {createRequest, getAllRequests, replyToRequest, getUserRequests, updateRequest, getRequestById  } = require('../controllers/requestController');
const authMiddleware = require('../middlewares/authMiddleware');
//const authorizeAdmin = require('../middlewares/authorizeAdmin');
const { signup, login, forgotPassword, resetPassword, getAllUsers, getUserById, updateUser, getCurrentUser } = require('../controllers/authController');
const passport = require('passport');
const User = require('../models/userModel');
const {sendMessage, getAllConversations, getMessagesByConversationId} = require('../controllers/conversationController');
const {getAllMessages, sendContactMessage, replyToContactMessage} = require('../controllers/contactController');
const jwt = require('jsonwebtoken');
const JWT_SECRET = process.env.JWT_SECRET;
                          /*PAYMENT*/
const { checkout,successStatus,cancel ,markRequestPaid } = require('../controllers/payment');
 



router.get('/me', authMiddleware, getCurrentUser);
router.post('/', authMiddleware,
  upload.fields([
    { name: 'consentForm', maxCount: 1 },
    { name: 'idCard', maxCount: 1 },
    { name: 'diploma', maxCount: 1 }
  ]),
  createRequest
);
router.get('/contact', getAllMessages);
router.get('/conversations', getAllConversations);
router.get('/users', getAllUsers);
router.put('/:id', authMiddleware,
  upload.fields([
    { name: 'consentForm', maxCount: 1 },
    { name: 'idCard', maxCount: 1 },
    { name: 'diploma', maxCount: 1 }
  ]),
  updateRequest
);
router.get('/', getAllRequests);
router.put('/:id/reply', upload.single('reportFile'), replyToRequest);
router.get('/:id', getRequestById);
router.get('/user/:userId', getUserRequests);
router.post('/signup', signup);
router.post('/login', login);
       
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
    res.redirect(`https://spatrak.com/google-redirect.html?token=${token}`);
  }
);

router.get('/contact', getAllMessages);
router.post('/contact', sendContactMessage);
router.post('/contactreply/:id', replyToContactMessage);

router.post('/messages', sendMessage);

router.get('/conversation/:conversationId', getMessagesByConversationId);


                                   /*PAYMENT*/ 

router.post('/checkout', authMiddleware, checkout);
router.get('/success-status', authMiddleware, successStatus);
router.get('/cancel', authMiddleware, cancel);
router.post('/mark-request-paid', authMiddleware, markRequestPaid);

module.exports = router;