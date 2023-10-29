const Joi = require('joi');

const isValidToCreate = Joi.object({
  name: Joi.string().required(),
});

module.exports = {isValidToCreate};
