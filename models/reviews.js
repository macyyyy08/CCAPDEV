const mongoose = require('mongoose');

const userReviewSchema = new mongoose.Schema({
    reviewID: { type: Number, required: true , unique: true},
    userID: { type: Number, required: true },
    'stall-number': { type: Number, required: true },
    'average-rating': { type: Number, required: true },
    'user-qual-rating': { type: Number, required: true },
    'user-serv-rating': { type: Number, required: true },
    'user-price-rating': { type: Number, required: true },
    'review-date': { type: Date, required: true },
    'review-comment': { type: String, required: true },
    'review-image': { type: String, default: '' },
    'review-reco': { type: String, required: true }
});

const UserReview = mongoose.model('userReview', userReviewSchema);

module.exports = UserReview;