const path = require('path');
const fs = require('fs');

function getReviewList(){
    const filePath = path.join(__dirname, 'dataReviews.json');
	let rawdata = fs.readFileSync(filePath);
	return JSON.parse(rawdata);
}

function getUserReviews(userID) {
    const reviews = getReviewList();
    return reviews.filter(review => review.userID === userID);
}

function getStallReviews(stallID) {
    const reviews = getReviewList();
    return reviews.filter(review => review['stall-number'] === stallID);
}

function getReviewByReviewID(reviewID) {
    const reviews = getReviewList();
    return reviews.filter(review => review.reviewID === reviewID);
}


module.exports.getReviewList = getReviewList;
module.exports.getUserReviews = getUserReviews;
module.exports.getStallReviews = getStallReviews;
module.exports.getReviewByReviewID = getReviewByReviewID;
