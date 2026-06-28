const Joi = require('joi');

const registerSchema = Joi.object({
  fullName: Joi.string().required().min(3).max(150),
  email: Joi.string().email().required(),
  phone: Joi.string().optional().pattern(/^[0-9+\-\s()]{10,30}$/),
  password: Joi.string().required().min(8),
  confirmPassword: Joi.string().valid(Joi.ref('password')).required().messages({
    'any.only': 'Passwords do not match'
  }),
  farm: Joi.object({
    name: Joi.string().required().max(150),
    location: Joi.string().optional(),
    contactPhone: Joi.string().optional(),
    currency: Joi.string().default('USD'),
    timezone: Joi.string().default('UTC')
  }).required()
});

const loginSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().required()
});

const refreshTokenSchema = Joi.object({
  refreshToken: Joi.string().required()
});

const changePasswordSchema = Joi.object({
  currentPassword: Joi.string().required(),
  newPassword: Joi.string().required().min(8),
  confirmNewPassword: Joi.string().valid(Joi.ref('newPassword')).required()
});

module.exports = {
  registerSchema,
  loginSchema,
  refreshTokenSchema,
  changePasswordSchema
};