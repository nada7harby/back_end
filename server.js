/*const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();
//const session = require('express-session');
const passport = require('passport');
require('./config/passport');
const requestRoutes = require('./routes/requestRoutes');
const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use('/uploads', express.static('uploads'));
app.use(express.urlencoded({ extended: true }));



app.use(passport.initialize());
//app.use(passport.session());
// Routes
app.use('/api/requests', requestRoutes);

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI).then(() => {
  console.log('MongoDB connected');
}).catch(err => console.log(err));

module.exports = app;*/

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();
const passport = require('passport');
require('./config/passport');
const requestRoutes = require('./routes/requestRoutes');

const app = express();

// Middleware
app.use(cors());
app.use(express.json({ limit: '10kb' }));
app.use('/uploads', express.static('uploads'));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));
app.use(passport.initialize());

// Timeout middleware
app.use((req, res, next) => {
  req.setTimeout(25000, () => {
    res.status(504).json({ error: 'Request timeout' });
  });
  next();
});

// Routes
app.use('/api/requests', requestRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    dbState: mongoose.connection.readyState
  });
});

// MongoDB connection
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverSelectionTimeoutMS: 5000,
  socketTimeoutMS: 30000,
  maxPoolSize: 5
})
.then(() => console.log('MongoDB connected successfully'))
.catch(err => console.error('MongoDB connection error:', err));

module.exports = app;