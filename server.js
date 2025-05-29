const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();
const passport = require('passport');
require('./config/passport');
const requestRoutes = require('./routes/requestRoutes');
const app = express();
const path = require('path');

// Middleware
app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use(express.urlencoded({ extended: true }));

app.use(passport.initialize());

app.use('/api/requests', requestRoutes);

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
}).then(() => {
  console.log('MongoDB connected');
  app.listen(process.env.PORT, () => {
    console.log(`Server running on port ${process.env.PORT}`);
  });
}).catch(err => console.log(err));
