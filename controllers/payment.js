const User = require('../models/userModel');
const Request = require('../models/requestModel');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);


const PACKAGE_LOOKUP = {
  "25": { name: "Single Pack", price: 30.99 * 100, credits: 1 },
  "50": { name: "10 Pack", price: 258 * 100, credits: 10 },
  "100": { name: "25 Pack", price: 643 * 100, credits: 25 }
};

const checkout = async (req, res) => {

  try {
    const { packageId ,requestId} = req.body;
    
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
            requestId: requestId || null
          }
    });

    res.json({ url: session.url });


  } catch (err) {
    console.log("Stripe checkout error:", err);
    res.status(500).json({ error: "Something went wrong in Stripe checkout" });
  }


}

const successStatus= async (req, res) => {

  try {
    const { session_id } = req.query;
    if (!session_id) return res.status(400).json({ error: "Missing session_id" });

    const session = await stripe.checkout.sessions.retrieve(session_id);

    // Check if paid
    if (session.payment_status === "paid") {

      const packageId = session.metadata.packageId;
      const SelectedPackage = PACKAGE_LOOKUP[packageId];
      const email = session.customer_details.email;
      let requestId = session.metadata.requestId;

      if (!SelectedPackage) {
        return res.status(400).json({ error: "Invalid package metadata" });
      }

      //  update or create user in MongoDB
      const user = await User.findOneAndUpdate(
        { email },
        { $inc: { remainingRequests: SelectedPackage.credits } },
        { upsert: true, new: true }
      );

      //update request status
      if (requestId) {
        // Mark request as paid
        await Request.findByIdAndUpdate(requestId, { paid: true });

        // Deduct 1 credit
        user.remainingRequests -= 1;
        await user.save();
      }

      res.json({
        success: true,
        email: session.customer_details.email,
        name: session.customer_details.name,
        amount: session.amount_total / 100,
        currency: session.currency,
        packageSelected: SelectedPackage.name,
        remainingRequests: user.remainingRequests,
        requestPaid: requestId || null
      });
    } else {
      res.json({ success: false });
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

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

module.exports = {
  checkout,
  successStatus,
  markRequestPaid,
  cancel
};
