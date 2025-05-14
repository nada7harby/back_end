const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    firstname: {
      type: String,
      //required: true,
      minlength: 3
    },
    lastname: {
      type: String,
      //required: true,
      minlength: 3
    },
    email: {
      type: String,
      required: true,
      unique: true,
      match: [/^\S+@\S+\.\S+$/, 'Please enter a valid email']
    },
    password: {
      type: String,
      //required: true,
      minlength: 8,
      match: [
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&]).{8,}$/,
        'Password must be at least 8 characters and include uppercase, lowercase, number, and special character'
      ]
    },
    googleId: {
      type: String,
      unique: true,
      sparse: true
    },
    resetPasswordToken: String,
    resetPasswordExpires: Date,
  }, { timestamps: true });

const User = mongoose.model('User', userSchema);

module.exports = User;
