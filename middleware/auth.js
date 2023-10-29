const jwt = require('jsonwebtoken');
const secretKey = process.env.SECRET_KEY;
const { isValidToken } = require('../validators/authValidator');

module.exports = (req, res, next) => {
    const { error } = isValidToken.validate(req.headers, { allowUnknown: true });

    if (error) {
        return res.status(400).json({ status: false, error: error.details[0].message });
    }

    // Extract the access token from the "Authorization" header.
    const authorizationHeader = req.headers.authorization;
    const token = authorizationHeader.split(' ')[1];

    try {
        const decoded = jwt.verify(token, secretKey);
        req.user = decoded;
        next();
    } catch (ex) {
        res.status(400).json({ status: false, message: 'Invalid token.' });
    }
};
