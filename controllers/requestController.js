const Request = require('../models/requestModel');
const multer = require('multer');
const path = require('path');

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/')
  },
  filename: function (req, file, cb) {
    cb(null, `${Date.now()}-${file.originalname}`)
  }
});
const upload = multer({ storage: storage });
const createRequest = async (req, res) => {
  try {
    const {
      lastName, givenLastName, firstName, birthDateDay, birthDateMonth, birthDateYear,
      email, address, phone, country, establishment, program, graduationYear,
      internalRef, company, contact, contactEmail, comment
    } = req.body;

    const newRequest = new Request({
      lastName,
      givenLastName,
      firstName,
      birthDate: {
        day: birthDateDay,
        month: birthDateMonth,
        year: birthDateYear
      },
      email,
      address,
      phone,
      country,
      establishment,
      program,
      graduationYear,
      internalRef,
      company,
      contact,
      contactEmail,
      comment,
      userId: req.userId,
      files: {
        consentForm: req.files['consentForm'][0]?.path,
        idCard: req.files['idCard'][0]?.path,
        diploma: req.files['diploma'][0]?.path
      }
      
    });

    await newRequest.save();
    res.status(201).json({ message: 'Request submitted successfully', request: newRequest });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Something went wrong' });
  }
};
const getAllRequests = async (req, res) => {
    try {
      const requests = await Request.find().sort({ createdAt: -1 }); 
      res.status(200).json({ requests });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  };
const replyToRequest = async (req, res) => {
    try {
      const requestId = req.params.id;
      const { status, message } = req.body;
      const request = await Request.findById(requestId);
      if (!request) {
        return res.status(404).json({ message: 'Request not found' });
      }
  
      request.status = status;
      request.reply = {
        message,
        date: new Date(),
        reportFile: req.file?.path 
      };
  
      await request.save();
  
      res.status(200).json({ message: 'Reply sent successfully', request });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Something went wrong' });
    }
  };
  const getUserRequests = async (req, res) => {
    try {
      const { userId } = req.params;
      const requests = await Request.find({ userId });
      res.status(200).json({ requests });
    } catch (error) {
      res.status(500).json({ message: 'Server error' });
    }
  };
  
module.exports = {
  upload,
  createRequest,
  getAllRequests,
  replyToRequest,
  getUserRequests
};