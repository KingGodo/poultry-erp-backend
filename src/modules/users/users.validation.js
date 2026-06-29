// src/modules/users/users.validation.js
const Joi = require('joi');

const createUserSchema = Joi.object({
  fullName: Joi.string().required().min(3).max(150),
  email: Joi.string().email().required(),
  phone: Joi.string().optional().pattern(/^[0-9+\-\s()]{10,30}$/),
  password: Joi.string().required().min(8),
  confirmPassword: Joi.string().valid(Joi.ref('password')).required().messages({
    'any.only': 'Passwords do not match',
  }),
  roleId: Joi.number().required(),
  status: Joi.string().valid('active', 'inactive', 'suspended').default('active'),
  farmAccess: Joi.array().items(
    Joi.object({
      farmId: Joi.number().required(),
      roleId: Joi.number().required(),
    })
  ).optional(),
});

const updateUserSchema = Joi.object({
  fullName: Joi.string().min(3).max(150).optional(),
  phone: Joi.string().optional().pattern(/^[0-9+\-\s()]{10,30}$/),
  status: Joi.string().valid('active', 'inactive', 'suspended').optional(),
  roleId: Joi.number().optional(),
});

const changeRoleSchema = Joi.object({
  roleId: Joi.number().required(),
});

const changeStatusSchema = Joi.object({
  status: Joi.string().valid('active', 'inactive', 'suspended').required(),
});

const farmAccessSchema = Joi.object({
  farmId: Joi.number().required(),
  roleId: Joi.number().required(),
});

const removeFarmAccessSchema = Joi.object({
  farmId: Joi.number().required(),
});

module.exports = {
  createUserSchema,
  updateUserSchema,
  changeRoleSchema,
  changeStatusSchema,
  farmAccessSchema,
  removeFarmAccessSchema,
};