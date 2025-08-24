const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema({
    sessionId: { type: String, required: true, unique: true }, 
     
    success:{type: Boolean},

    stripeName: { type: String, required: true },
    stripeEmail: { type: String, required: true },

    name: {type: String, required: true},

    email: { type: String, required: true },

    packageSelected: { type: String, enum:['Single Pack','10 Pack','25 Pack'] ,required: true },

    amount: { type: Number, required: true },

    currency: { type: String, required: true },

    createdAt: { type: Date, default: Date.now }

})

const payment = mongoose.model('payment', paymentSchema);

module.exports = payment;