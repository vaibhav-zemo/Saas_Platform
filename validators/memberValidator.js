const Joi = require('joi');

const isValidToCreate = Joi.object({
    community: Joi.string().required(),
    user: Joi.string().required(),
    role: Joi.string().required(),
});

module.exports = { isValidToCreate };
