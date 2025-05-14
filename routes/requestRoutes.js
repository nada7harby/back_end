const express = require('express');
const router = express.Router();
const { upload, createRequest, getAllRequests, replyToRequest, getUserRequests  } = require('../controllers/requestController');
const authMiddleware = require('../middlewares/authMiddleware');
const { signup, login, forgotPassword, resetPassword, serveResetForm } = require('../controllers/authController');
const passport = require('passport');

const jwt = require('jsonwebtoken');
const JWT_SECRET = process.env.JWT_SECRET;

router.get('/protected-route', authMiddleware, (req, res) => {
    res.status(200).json({ message: 'You have access to this route' });
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
router.get('/', getAllRequests);
router.put(
    '/:id/reply',
    upload.single('reportFile'),
    replyToRequest
  );
router.get('/user/:userId', getUserRequests);
router.post('/signup', signup);
router.post('/login', login);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password/:token', resetPassword);
router.get('/reset-password/:token', serveResetForm);

router.get('/auth/google', passport.authenticate('google', { scope: ['profile', 'email'] }));
router.get('/auth/google/callback',
  passport.authenticate('google', { session: false, failureRedirect: '/login' }),
  (req, res) => {
    const token = jwt.sign({ id: req.user._id }, JWT_SECRET, { expiresIn: '7d' });

    res.status(200).json({
      message: 'Logged in with Google successfully',
      token,
      user: {
        id: req.user._id,
        name: req.user.name,
        email: req.user.email
      }
    });
  }
);
module.exports = router;