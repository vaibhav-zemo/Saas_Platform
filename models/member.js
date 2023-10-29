const mongoose = require('mongoose');

const memberSchema = new mongoose.Schema({
    id: {
        type: String,
        required: true,
        unique: true,
    },
    user: {
        type: String,
        ref: 'User',
        required: true,
    },
    community: {
        type: String,
        ref: 'Community',
        required: true,
    },
    role: {
        type: String,
        ref: 'Role',
        required: true,
    },
    created_at: {
        type: Date,
        default: Date.now,
    },
});

module.exports = mongoose.model('Member', memberSchema);
