// prisma.config.js
const dotenv = require('dotenv');
dotenv.config();

module.exports = {
  datasource: {
    url: process.env.DATABASE_URL,
  },
};