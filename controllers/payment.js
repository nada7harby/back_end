const User = require('../models/userModel');
const Request = require('../models/requestModel');
const payment = require('../models/payment');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const mongoose = require("mongoose");

const PACKAGE_LOOKUP = {
  "25": { name: "Single Pack", price: 30.99 * 100, credits: 1 },
  "50": { name: "10 Pack", price: 258 * 100, credits: 10 },
  "100": { name: "25 Pack", price: 643 * 100, credits: 25 }
};

const checkout = async (req, res) => {

  try {
    const { packageId, requestId } = req.body;
    const loggedInUser = req.userId;
    if (!loggedInUser) {
      return res.status(404).json({ error: "Logged in user not found" });
    }
    //console.log("User making payment:", loggedInUser);

    const SelectedPackage = PACKAGE_LOOKUP[packageId] || {};

    if (!SelectedPackage) {
      return res.status(400).json({ error: "Invalid package ID" });
    }

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: "eur",
            product_data: { name: SelectedPackage.name },
            unit_amount: SelectedPackage.price,
          },
          quantity: 1,

        },
      ],
      mode: 'payment',
      success_url: `https://spatrak.com/paymentSuccess.html?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `https://spatrak.com/paymentCancel.html`,
      metadata: {
        packageId: packageId,
        requestId: requestId || null,
        loggedInUserId: loggedInUser
      }
    });

    res.json({ url: session.url });


  } catch (err) {
    console.log("Stripe checkout error:", err);
    res.status(500).json({ error: "Something went wrong in Stripe checkout" });
  }


}

const successStatus = async (req, res) => {
  try {
    const loggedInUserId = req.userId;

    const { session_id } = req.query;
    //console.log("Session ID  --->  " , session_id);
    if (!session_id) {
      return res.status(400).json({ error: "Missing session_id" }); // ✅ return
    }

    const session = await stripe.checkout.sessions.retrieve(session_id);
    //console.log("Stripe session details---> " , session);

    
    // before checking if it is paid or not FIRST check if its already processed
    const alreadyProcessed = await payment.findOne({ sessionId: session_id });
    if (alreadyProcessed) 
      {
       return res.json({
        message: "Payment already processed",
      });
    }

    // Check if paid
    if (session.payment_status === "paid") {
      const packageId = session.metadata.packageId;
      const SelectedPackage = PACKAGE_LOOKUP[packageId];
      
      
      let requestId = session.metadata.requestId;

      if (!SelectedPackage)
         {
        return res.status(400).json({ error: "Invalid package metadata" }); // ✅ return
      }





      // update user in MongoDB
      if(loggedInUserId  && mongoose.Types.ObjectId.isValid(loggedInUserId))
        {
       await User.findByIdAndUpdate(
        { _id: loggedInUserId },
        { $inc: { remainingRequests: SelectedPackage.credits } },
        { new: true }
       
      );
      } else {
        
        console.log("User not found:", loggedInUserId);
        return res.status(404).json({ error: "User not found" }); 
      }
      

       const userloggedIn = await User.findById({ _id: loggedInUserId });

      if (requestId && mongoose.Types.ObjectId.isValid(requestId)) {
        // Mark request as paid
        await Request.findByIdAndUpdate(requestId, { paid: true }, { new: true } );

        // Deduct 1 credit
        userloggedIn.remainingRequests -= 1;
        await userloggedIn.save();
      } else if (requestId) {
        return res.json({   
          success: false,
          message: "Invalid request ID"
        });
      }



      //save payment with logged in user data NOT stripe data
     
      await payment.create({
        sessionId: session_id,
        success: true,
        email: userloggedIn.email,
        name: (userloggedIn.firstname + " " + userloggedIn.lastname),
        packageSelected: SelectedPackage.name,
        amount: session.amount_total / 100,
        currency: session.currency,
        stripeName: session.customer_details.name,
        stripeEmail: session.customer_details.email
      });


      return res.json({  
        success: true,
        stripeEmail: session.customer_details.email,
        stripeName: session.customer_details.name,
        name: (userloggedIn.firstname + " " + userloggedIn.lastname),
        email: userloggedIn.email,
        amount: session.amount_total / 100,
        currency: session.currency,
        packageSelected: SelectedPackage.name,
        remainingRequests: userloggedIn.remainingRequests,
        requestPaid: requestId || null
      });
    }

    else {
      return res.json({ success: false, message: "Payment not successful" }); // ✅ return
    }
  } catch (err) {
    console.error("SuccessStatus error:", err);
    return res.status(500).json({ error: err.message, message: "error in Success Status" }); // ✅ return
  }
};


// GET all payments
const payments = async (req, res) => {
  try {
    const payments = await payment.find().sort({ createdAt: -1 }); // newest first
    res.json({
      message : "Payments retrieved successfully",
      count: payments.length,
      data: payments
    });
  } catch (err) {
    console.error("Error fetching payments:", err);
    res.status(500).json({
      success: false,
      message: "Error retrieving payments",
      error: err.message
    });
  }
};

const markRequestPaid = async (req, res) => {
  try {
    const { userId, requestId } = req.body;

    if (!userId || !requestId) {
      return res.status(400).json({ error: "userId and requestId are required" });
    }

    // Find user
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ error: "User not found" });

    // Ensure the request belongs to this user
    const request = await Request.findOne({ _id: requestId, userId });
    if (!request) return res.status(404).json({ error: "Request not found for this user" });

    // If request is already paid, no need to deduct credits again
    if (request.paid) {
      return res.status(400).json({ error: "Request is already marked as paid" });
    }

    // Check if user has enough credits
    if (user.remainingRequests <= 0) {
      return res.status(403).json({ error: "No remaining credits to pay for this request" });
    }

    // Deduct 1 credit and mark request as paid
    user.remainingRequests -= 1;
    await user.save();

    request.paid = true;
    await request.save();

    res.json({
      success: true,
      message: "Request marked as paid using credits",
      remainingRequests: user.remainingRequests,
      requestId: request._id
    });

  } catch (err) {
    console.log("Error in markRequestPaid:", err);
    res.status(500).json({ error: "Internal server error in markRequestPaid" });
  }
}
const cancel = (req, res) => {
  res.json({ message: 'Payment canceled.' });
}

//delete all payments
const deleteAllPayments = async (req, res) => {
  try {
    await payment.deleteMany({});
    res.json({ message: "All payments deleted successfully." });
  } catch (err) {
    console.error("Error deleting payments:", err);
    res.status(500).json({ error: "Internal server error" });
  }
};

module.exports = {
  checkout,
  successStatus,
  markRequestPaid,
  cancel,
  payments,
  deleteAllPayments
};
