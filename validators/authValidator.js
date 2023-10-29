const Joi = require('joi');

const isValidToSignUp = Joi.object({
  name: Joi.string().required(),
  email: Joi.string().email().required(),
  password: Joi.string().min(8).required(),
});

const isValidToSignIn = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().required(),
});

const isValidToken = Joi.object({
    authorization: Joi.string()
      .regex(/^Bearer [A-Za-z0-9-_=]+\.[A-Za-z0-9-_=]+\.[A-Za-z0-9-_.+/=]+$/)
      .required(),
}).options({ allowUnknown: true });

module.exports = {isValidToSignUp, isValidToSignIn, isValidToken};
