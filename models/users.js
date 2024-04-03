const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    userID: { type: Number, required: true , unique: true},
    email: { type: String, required: true , unique: true},
    name: { type: String, required: true },
    username: { type: String, required: true , unique: true},
    password: { type: String, required: true },
    userBio: { type: String, default: '' },
    profilePicture: { type: String, default: '' }
}, {versionKey: false});

const User = mongoose.model('user', userSchema);

module.exports = User;