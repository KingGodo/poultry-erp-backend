// src/utils/generateToken.js
const jwt = require('jsonwebtoken');
const {
  accessTokenSecret,
  refreshTokenSecret,
  accessTokenExpiry,
  refreshTokenExpiry,
} = require('../config/jwt');

// Helper to convert BigInt to Number in payload
const sanitizePayload = (payload) => {
  const sanitized = {};
  for (const [key, value] of Object.entries(payload)) {
    if (typeof value === 'bigint') {
      sanitized[key] = Number(value); // or value.toString() if you prefer string
    } else if (value && typeof value === 'object' && !Array.isArray(value)) {
      sanitized[key] = sanitizePayload(value);
    } else {
      sanitized[key] = value;
    }
  }
  return sanitized;
};

const generateAccessToken = (payload) => {
  const sanitized = sanitizePayload(payload);
  return jwt.sign(sanitized, accessTokenSecret, { expiresIn: accessTokenExpiry });
};

const generateRefreshToken = (payload) => {
  const sanitized = sanitizePayload(payload);
  return jwt.sign(sanitized, refreshTokenSecret, { expiresIn: refreshTokenExpiry });
};

const verifyAccessToken = (token) => {
  return jwt.verify(token, accessTokenSecret);
};

const verifyRefreshToken = (token) => {
  return jwt.verify(token, refreshTokenSecret);
};

module.exports = {
  generateAccessToken,
  generateRefreshToken,
  verifyAccessToken,
  verifyRefreshToken,
};