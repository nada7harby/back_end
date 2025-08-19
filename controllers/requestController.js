const Request = require('../models/requestModel');

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
        consentForm: req.files?.['consentForm']?.[0]?.location || null,
        idCard: req.files?.['idCard']?.[0]?.location || null,
        diploma: req.files?.['diploma']?.[0]?.location || null
      }
      
    });

    await newRequest.save();
    res.status(201).json({ message: 'Request submitted successfully', request: newRequest });
    
  
  
  
  
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Something went wrong' });
  }
};

const updateRequest = async (req, res) => {
  try {
    const requestId = req.params.id;
    const userId = req.userId;

    const existingRequest = await Request.findById(requestId);
    if (!existingRequest) {
      return res.status(404).json({ message: 'Request not found' });
    }

    if (existingRequest.userId.toString() !== userId) {
      return res.status(403).json({ message: 'Not authorized to update this request' });
    }

    const {
      lastName, givenLastName, firstName, birthDateDay, birthDateMonth, birthDateYear,
      email, address, phone, country, establishment, program, graduationYear,
      internalRef, company, contact, contactEmail, comment, updateMessage
    } = req.body;

    existingRequest.lastName = lastName || existingRequest.lastName;
    existingRequest.givenLastName = givenLastName || existingRequest.givenLastName;
    existingRequest.firstName = firstName || existingRequest.firstName;
    existingRequest.birthDate = {
      day: birthDateDay || existingRequest.birthDate.day,
      month: birthDateMonth || existingRequest.birthDate.month,
      year: birthDateYear || existingRequest.birthDate.year
    };
    existingRequest.email = email || existingRequest.email;
    existingRequest.address = address || existingRequest.address;
    existingRequest.phone = phone || existingRequest.phone;
    existingRequest.country = country || existingRequest.country;
    existingRequest.establishment = establishment || existingRequest.establishment;
    existingRequest.program = program || existingRequest.program;
    existingRequest.graduationYear = graduationYear || existingRequest.graduationYear;
    existingRequest.internalRef = internalRef || existingRequest.internalRef;
    existingRequest.company = company || existingRequest.company;
    existingRequest.contact = contact || existingRequest.contact;
    existingRequest.contactEmail = contactEmail || existingRequest.contactEmail;
    existingRequest.comment = comment || existingRequest.comment;

    if (updateMessage) {
      existingRequest.updateMessage = updateMessage;
      existingRequest.isUpdated = true;
    }

    if (req.files) {
      existingRequest.files.consentForm = req.files['consentForm']?.[0]?.location || existingRequest.files.consentForm;
      existingRequest.files.idCard = req.files['idCard']?.[0]?.location || existingRequest.files.idCard;
      existingRequest.files.diploma = req.files['diploma']?.[0]?.location || existingRequest.files.diploma;
    }
    existingRequest.updatedAt = new Date();
    await existingRequest.save();

    res.status(200).json({ message: 'Request updated successfully', request: existingRequest });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Something went wrong' });
  }
};
const getRequestById = async (req, res) => {
  try {
    const requestId = req.params.id;
    const request = await Request.findById(requestId);

    if (!request) {
      return res.status(404).json({ message: 'Request not found' });
    }

    res.status(200).json(request);
  } catch (error) {
    console.error('Error fetching request by ID:', error);
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
        reportFile: req.file?.location 
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
  
module.exports = {createRequest, getAllRequests, replyToRequest, getUserRequests, updateRequest, getRequestById};