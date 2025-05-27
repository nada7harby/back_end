const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const User = require('../models/userModel');
const { sendResetEmail } = require('../utils/emailService');
const path = require('path');

const signup = async (req, res) => {
  const { firstname, lastname, email, password, confirmPassword, image } = req.body;
  if (!firstname || !lastname || !email || !password || !confirmPassword) {
    return res.status(400).json({ message: 'All fields are required' });
  }
  if (firstname.length < 3 || lastname.length < 3) {
    return res.status(400).json({ message: 'Name must be at least 3 characters' });
  }

  const emailRegex = /^\S+@\S+\.\S+$/;
  if (!emailRegex.test(email)) {
    return res.status(400).json({ message: 'Invalid email format' });
  }

  const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&]).{8,}$/;
  if (!passwordRegex.test(password)) {
    return res.status(400).json({ message: 'Password must be at least 8 characters and include uppercase, lowercase, number, and special character' });
  }

  if (password !== confirmPassword) {
    return res.status(400).json({ message: 'Passwords do not match' });
  }

  let user = await User.findOne({ email });

  if (user) {
    if (user.password) {
      return res.status(400).json({ message: 'Email already registered. Please login.' });
    } else {
      user.firstname = firstname;
      user.lastname = lastname;
      user.password = await bcrypt.hash(password, 10);
      user.image = user.image;
      return res.status(200).json({ message: 'Account completed successfully. You can now login with email and password.' });
    }
  }
  const hashedPassword = await bcrypt.hash(password, 10);
  const newUser = new User({
    firstname,
    lastname,
    email,
    password: hashedPassword,
    role: 'user',
    image: `https://ui-avatars.com/api/?name=${firstname}+${lastname}&background=random&length=1`
  });
  await newUser.save();
  res.status(201).json({ message: 'User registered successfully. Please login.' });
};

const login = async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ message: 'All fields are required' });
  }
  const user = await User.findOne({ email });
  if (!user) {
    return res.status(400).json({ message: 'Email not found' });
  }

  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) {
    return res.status(400).json({ message: 'Invalid password' });
  }

  const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '1h' });

  res.status(200).json({
    message: 'Login successful', token, user: {
      id: user._id,
      firstname: user.firstname,
      lastname: user.lastname,
      email: user.email,
      image: user.image,
      role: user.role,
      googleId: user.googleId,
      password: user.password ? 'set' : null

    }
  });
};
const updateUser = async (req, res) => {
  try {
    const userId = req.params.id;

    if (req.userId !== req.params.id) {
      return res.status(403).json({ message: 'Forbidden: You can only update your own profile' });
    }
    const { firstname, lastname, email, password, image } = req.body;

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: 'User not found' });

    if (email && email !== user.email) {
      const existingUser = await User.findOne({ email });
      if (existingUser) {
        return res.status(400).json({ message: 'Email already in use' });
      }
      user.email = email;
    }
    if (firstname) user.firstname = firstname;
    if (lastname) user.lastname = lastname;
    if (image) user.image = image;

    if (password) {
      const hashedPassword = await bcrypt.hash(password, 10);
      user.password = hashedPassword;
    }
    await user.save();
    res.json({ message: 'User updated successfully', user });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

const forgotPassword = async (req, res) => {
  const { email } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: 'Email not found' });

    const resetToken = crypto.randomBytes(20).toString('hex');

    user.resetPasswordToken = resetToken;
    user.resetPasswordExpires = Date.now() + 20 * 60 * 1000;

    await user.save();

    const resetLink = `https://nada7harby.github.io/Verfiaction/Reset_password.html?token=${resetToken}`;
    const subject = 'Reset your password';
    const html = `
        <p>We received a request to reset your password.</p>
        <p><a href="${resetLink}">Click here to reset your password</a></p>
        <p>This link will expire in 20 minutes.</p>
      `;

    await sendResetEmail(user.email, subject, html);

    res.status(200).json({ message: 'Reset link sent to your email.' });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Something went wrong' });
  }
};
const resetPassword = async (req, res) => {
  const { token } = req.params;
  const { newPassword, confirmPassword } = req.body;

  try {

    if (newPassword !== confirmPassword) {
      return res.status(400).json({ message: 'Passwords do not match' });
    }

    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&]).{8,}$/;
    if (!passwordRegex.test(newPassword)) {
      return res.status(400).json({ message: 'Password must be at least 8 characters and include uppercase, lowercase, number, and special character' });
    }

    const user = await User.findOne({
      resetPasswordToken: token,
      resetPasswordExpires: { $gt: Date.now() },
    });

    if (!user) {
      return res.status(400).json({ message: 'Invalid or expired token' });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    user.password = hashedPassword;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;

    await user.save();

    res.status(200).json({ message: 'Password has been reset successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Something went wrong' });
  }
};

const getAllUsers = async (req, res) => {
  try {
    const users = await User.find({}, '-password');
    res.status(200).json(users);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

const getUserById = async (req, res) => {
  const { id } = req.params;
  try {
    const user = await User.findById(id, '-password');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.status(200).json(user);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};
const getCurrentUser = async (req, res) => {
  try {
    const userId = req.userId; 
    const user = await User.findById(userId);
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
        password: user.password ? 'set' : null,
      },
    });
  } catch (err) {
    res.status(401).json({ message: 'Invalid token' });
  }
};

module.exports = { signup, login, resetPassword, forgotPassword, getAllUsers, getUserById, updateUser, getCurrentUser };