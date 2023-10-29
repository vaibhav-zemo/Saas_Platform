const mongoose = require('mongoose');
require('dotenv').config();

mongoose.connect(process.env.MONGOD_URI, { useNewUrlParser: true, useUnifiedTopology: true }).then(() => { console.log("Database is connected") }).catch((error) => { console.log("MongoDB Error:", error) })

module.exports = mongoose;