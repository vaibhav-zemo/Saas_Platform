const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const User = require('../models/user');
const { isValidToSignUp, isValidToSignIn, isValidToken } = require('../validators/authValidator');
const { Snowflake } = require("@theinternetfolks/snowflake");
require('dotenv').config();

const secretKey = process.env.SECRET_KEY;

exports.signUp = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    // Validate the request body
    const { error } = isValidToSignUp.validate(req.body);
    if (error) {
      return res.status(400).json({ status: false, message: error.details[0].message });
    }

    // Check if the email is already registered
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ status: false, message: 'Email already registered.' });
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Generate a unique id
    const id = Snowflake.generate();

    // Create a new user
    const newUser = new User({ id, name, email, password: hashedPassword });
    await newUser.save();

    // Generate and send an access token
    const accessToken = jwt.sign({ id: newUser.id }, secretKey);

    // Response without the password
    res.status(201).json({
      status: true,
      content: {
        data: {
          id: newUser.id,
          name: newUser.name,
          email: newUser.email,
          created_at: newUser.created_at,
        },
        meta: {
          access_token: accessToken,
        },
      },
    });
  } catch (error) {
    console.log(error)
    res.status(500).json({ status: false, message: 'Server error.' });
  }
};

exports.signIn = async (req, res) => {
  const { email, password } = req.body;

  const { error } = isValidToSignIn.validate(req.body);

  if (error) {
    return res.status(400).json({ status: false, error: error.details[0].message });
  }

  try {
    // Find the user by email.
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(401).json({ status: false, error: 'User does not exist with the given email' });
    }

    // Verify the password using bcrypt.
    const passwordMatch = await bcrypt.compare(password, user.password);

    if (!passwordMatch) {
      return res.status(401).json({ status: false, error: 'Invalid password' });
    }

    // Generate a JSON Web Token (JWT) for authentication.
    const token = jwt.sign({ id: user.id }, secretKey);

    // Return a response with the token and user data (without the password).
    const response = {
      status: true,
      content: {
        data: {
          id: user._id,
          name: user.name,
          email: user.email,
          created_at: user.created_at,
        },
        meta: {
          access_token: token,
        },
      },
    };

    res.json(response);
  } catch (error) {
    console.error(error);
    res.status(500).json({ status: false, error: 'Internal Server Error' });
  }
}

exports.getMe = async (req, res) => {
  const { error } = isValidToken.validate(req.headers, { allowUnknown: true });

  if (error) {
    return res.status(400).json({ status: false, error: error.details[0].message });
  }

  // Extract the access token from the "Authorization" header.
  const authorizationHeader = req.headers.authorization;
  const token = authorizationHeader.split(' ')[1];

  try {
    // Verify the access token and decode the user's ID.
    const decoded = jwt.verify(token, secretKey);
    
    // Fetch the user's data from your database (MongoDB in this example).
    const user = await User.findOne({id: decoded.id});

    if (!user) {
      return res.status(404).json({ status: false, error: 'User not found' });
    }

    // Return the user data without the password.
    const responseData = {
      status: true,
      content: {
        data: {
          id: user.id,
          name: user.name,
          email: user.email,
          created_at: user.created_at,
        },
      },
    };

    res.json(responseData);
  } catch (error) {
    console.error(error);
    res.status(500).json({ status: false, error: 'Internal Server Error' });
  }
}
