const mongoose = require('mongoose');

const requestSchema = new mongoose.Schema({
  lastName: String,
  givenLastName: String,
  firstName: String,
  birthDate: {
    day: String,
    month: String,
    year: String
  },
  email: String,
  address: String,
  phone: String,
  country: String,
  establishment: String,
  program: String,
  graduationYear: String,
  internalRef: String,
  files: {
    consentForm: String,
    idCard: String,
    diploma: String
  },
  company: String,
  contact: String,
  contactEmail: String,
  comment: String,
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'accepted', 'rejected'],
    default: 'pending'
  },
  reply: {
    message: String,
    reportFile: String,
    date: Date
  },
  updateMessage: {
    type: String,
    default: null
  },
  isUpdated: {
    type: Boolean,
    default: false
  },
  updatedAt: {
    type: Date,
    default: null
  },
  paid: {
    type: Boolean,
    default: false
  }
  
}, { timestamps: true });

module.exports = mongoose.model('Request', requestSchema);