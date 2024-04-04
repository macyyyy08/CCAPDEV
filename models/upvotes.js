const mongoose = require('mongoose');

const upvoteSchema = new mongoose.Schema({
    upvoteID: { type: Number, required: true , unique: true},
    reviewID: { type: Number, required: true },
    authorID: { type: Number, required: true},
    userID: { type: Number, required: true },
    helpful: { type: Boolean, required: true}
}, {versionKey: false});

const Upvote = mongoose.model('upvote', upvoteSchema);

module.exports = Upvote;