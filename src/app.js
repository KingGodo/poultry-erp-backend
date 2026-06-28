// src/app.js
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const routes = require('./routes');
const errorHandler = require('./middleware/error.middleware');

const app = express();

// ✅ Fix BigInt serialization
app.set('json replacer', (key, value) => {
  if (typeof value === 'bigint') {
    return Number(value); // or return value.toString() if you prefer string
  }
  return value;
});

// Middleware
app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan('dev'));

// Routes
app.use('/api', routes);

// Error handler (must be last)
app.use(errorHandler);

module.exports = app;