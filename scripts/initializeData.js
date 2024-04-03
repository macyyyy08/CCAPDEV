const User = require('../models/users');
const UserReview = require('../models/reviews');
const Stall = require('../models/stalls');

const dataModuleAccount = require('../data/dataUsers');
const dataModuleUserReviews = require('../data/dataReviews');
const dataModuleStall = require('../data/dataStalls');

const usersData = dataModuleAccount.getDataUser();
const reviewsData = dataModuleUserReviews.getReviewList();
const stallsData = dataModuleStall.getDataStall();

Promise.all([
    User.insertMany(usersData),
    UserReview.insertMany(reviewsData),
    Stall.insertMany(stallsData)
])
.then(results => {
    console.log('Data inserted successfully:', results);
})
.catch(err => {
    console.error('Error inserting data:', err);
});
