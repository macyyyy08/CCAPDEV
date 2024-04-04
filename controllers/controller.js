const User = require('../models/users');
const UserReview = require('../models/reviews');
const Stall = require('../models/stalls');
const Upvote = require('../models/upvotes');
const bcrypt = require('bcrypt');
const path = require('path');
const session = require('express-session');
const uuid = require('uuid');

let { express, server } = require('../app');


const initializeSession = session({
    secret: process.env.SESSION_KEY, // Add your secret key here
    resave: false,
    saveUninitialized: true,

    genid: function(req) {
        return uuid.v4(); // Generate a unique session ID
    },
    cookie: {
        secure: false, // Change to true if using HTTPS
        maxAge: 24 * 60 * 60 * 1000, // 1 day (adjust as needed)
        httpOnly: true, // Helps prevent XSS attacks
        sameSite: 'strict' // Helps prevent CSRF attacks
    },
});

server.use(initializeSession);

server.use((req, res, next) => {
    req.session.userID = req.session.userID || null; // Initialize or retain userID
    req.session.stall_id = req.session.stall_id || 0; // Initialize or retain stall_id
    req.session.isLoggedIn = req.session.isLoggedIn || false; // Initialize or retain isLoggedIn
    req.session.isEdit = req.session.isEdit || false; // Initialize or retain isEdit
    next();
});



function errorFn(err){
    console.log('Error fond. Please trace!');
    console.error(err);
}

function add(server){
    //webpages part
    const e = require('express');

    server.get(['/', '/main'], async function(req, resp){
        try {
            const data_stall = await Stall.find().lean();

            req.session.isEdit = false;
            console.log(req.session.isLoggedIn);
            console.log(req.session.userID);

            resp.render('main', {
                layout: 'index',
                title: 'TaftChoice',
                data_stall: data_stall,
                isLoggedIn: req.session.isLoggedIn,
                isEdit: req.session.isEdit,
            });

        } catch (err) {
            console.error('Error fetching stalls:', err);
            // Handle the error
        }
    });


    //display review [raiki]
    server.get('/storereview', async function(req, res) {
        let stallId = parseInt(req.query.stallId);
        req.session.stall_id = stallId;

        try {
            const data_stall = await Stall.findOne({ 'stall-number': req.session.stall_id }).lean();
            const all_stall_data = await Stall.find().lean();
            const review_data = await UserReview.find({ 'stall-number': req.session.stall_id }).lean();
            const avg_data = review_data.map(review => review['average-rating']);
            const total_reviews = review_data.length;

            // Calculating the average rating
            let sum = avg_data.reduce((acc, rating) => acc + rating, 0);
            let averageRating = sum / avg_data.length;

            const users = await User.find().lean();

            console.log(stallId);
            console.log(data_stall);
            console.log(all_stall_data);
            console.log(review_data);
            console.log(users);
            console.log(req.session.isLoggedIn);

            res.render('storeView', {
                layout          : 'store-review',
                title           : data_stall['stall-name'],
                stall_image     : data_stall['stall-image'],
                stall_desc      : data_stall['stall-desc'],
                stall_must_try  : data_stall['stall-must-try'],
                data_stall      : data_stall,
                all_stall_data  : all_stall_data,
                review_data     : review_data,
                users           : users,
                stall_id        : req.session.stall_id,
                isLoggedIn      : req.session.isLoggedIn,
                isEdit          : req.session.isEdit,
                averageRating   : averageRating.toFixed(1),
                total_reviews   : total_reviews
            });
        } catch (errorFn) {
            console.error(errorFn);
            // Handle error response
            res.status(500).send(errorFn);
        }
    });


    server.get('/addreview', async function(req, res) {
        try {
            let stallId = parseInt(req.query.stallId);

            req.session.stall_id = stallId;
        
            const data_stall = await Stall.findOne({ 'stall-number': req.session.stall_id });      //isolated info the current stall clicked
            
            console.log(req.session.stall_id);
            console.log(data_stall); //empty array output
        
            const stall_name = data_stall['stall-name'];
            const stall_image = data_stall['stall-image'];
            
            console.log(stall_image);
        
            res.render('AddReview', {
                layout          : 'ReviewManagement',
                title           :  'Review: ' + stall_name,
                userID          :  req.session.userID,
                stall_image     :  stall_image,
                data_stall      :  data_stall,
                stall_id        :  req.session.stall_id,
                stall_name     :  stall_name,
                isLoggedIn      : req.session.isLoggedIn,
                isEdit          : req.session.isEdit
            });

        } catch (error) {
            console.error('Error while fetching data:', error);
            res.status(500).send('Internal Server Error');
        }
    });

    server.post('/addreview', async function(req, res) {
        try {
            console.log(req.body);

            // Destructure fields from req.body
            const { review, rating1, rating2, rating3, recom } = req.body;

            const latestReview = await UserReview.findOne().sort({ reviewID: -1 }).limit(1);
            let latestReviewID = 1;

            if (latestReview) {
                latestReviewID = latestReview.reviewID + 1;
                console.log("Latest reviewID:", latestReviewID);
            } else {
                console.log("No reviews found.");
            }

            // Calculate average rating
            const averageRating = (parseInt(rating1) + parseInt(rating2) + parseInt(rating3)) / 3;
    
            // Create a new UserReview object
            const newUserReview = new UserReview({
                reviewID: latestReviewID,
                userID: req.session.userID,
                'stall-number': req.session.stall_id, // Assuming stall_id is accessible here
                'average-rating': averageRating.toFixed(1),
                'user-qual-rating': parseInt(rating1),
                'user-serv-rating': parseInt(rating2),
                'user-price-rating': parseInt(rating3),
                'review-date': new Date(),
                'review-comment': review,
                'review-image' : "",
                'review-reco' : recom
            });
    
            // Log newUserReview to check if it's being created correctly
            console.log(newUserReview);
    
            // Save the review to the database
            await newUserReview.save();
    
            const data_stall = await Stall.findOne({ 'stall-number': req.session.stall_id }); 
            const data_review = await UserReview.find({ 'stall-number': req.session.stall_id }); 

            if (data_review.length > 1) {

                let stallAverage = data_stall['stall-average'];
                let multiplier = data_review.length - 1;
                let computedAverage;

                computedAverage = ((multiplier * stallAverage) + averageRating) / data_review.length;

                let averageStallRating = computedAverage.toFixed(1);

                data_stall['stall-rating'] = data_review.length;
                data_stall['stall-average'] = averageStallRating;

                await data_stall.save();
            } else {
                let averageStallRating = averageRating.toFixed(1);

                data_stall['stall-average'] = averageStallRating;
                await data_stall.save();
            }

            // Redirect the user back to the stall page
            res.redirect(`/storereview?stallId=${req.session.stall_id}`);
    
        } catch (error) {
            console.error('Error while adding review:', error);
            res.status(500).send('Internal Server Error');
        }
    });

    server.get('/editreview',async function(req, res) {
        try {
            let reviewId = parseInt(req.query.reviewId);

            const review_data = await UserReview.findOne({ reviewID: reviewId });
        
            const stall_number = review_data['stall-number'];
            req.session.stall_id = stall_number;
        
            const stall_data = await Stall.findOne({ 'stall-number': stall_number });
            const stall_name = stall_data['stall-name'];
        
            req.session.isEdit = false;
        
            res.render('EditReview', {
                layout          : 'ReviewManagement',
                title           : 'Edit Review',
                stall_number    : stall_number,
                stall_name      : stall_name,
                review          : review_data['review-comment'],
                food            : review_data['user-qual-rating'],
                service         : review_data['user-serv-rating'],
                price           : review_data['user-price-rating'],
                recom           : review_data['review-reco'],
                isLoggedIn      : req.session.isLoggedIn,
                isEdit          : req.session.isEdit,
                reviewID        : reviewId
            });
        } catch (error) {
            console.error('Error while fetching data:', error);
            res.status(500).send('Internal Server Error');
        }
    });

    function checkEditForm(review) {
        if (review.trim() === "") {
            alert("All fields must be filled out");
            return false;
        }
        else {
            return true;
        }
    }

    //push changes on review
    server.post('/save-review-changes', async function(req, resp){
        const reviewId = parseInt(req.query.reviewId);
        const updateQuery ={reviewID: reviewId};

        const averageRating = (parseInt(req.body.rating1) + parseInt(req.body.rating2) + parseInt(req.body.rating3)) / 3;

        UserReview.findOne(updateQuery).then(function(reviewResult){    
            console.log('Update Successful!');

            reviewResult['review-comment'] = req.body.review;
            reviewResult['average-rating'] = averageRating.toFixed(1);
            reviewResult['user-qual-rating'] = parseInt(req.body.rating1);
            reviewResult['user-serv-rating'] = parseInt(req.body.rating2);
            reviewResult['user-price-rating'] = parseInt(req.body.rating3);
            reviewResult['review-reco'] = req.body.recom;
            reviewResult['review-image'] = "";

            checkEditForm(req.body.review);

            reviewResult.save().then(function(result){
                resp.redirect('/profile');
            }).catch(errorFn);
        }).catch(errorFn);

    });

    //Delete a review
    server.post('/delete-review', async function(req,resp){
        let reviewId = req.query.reviewId;
        const deleteQuery = {reviewID: reviewId};

        const review_data = await UserReview.findOne({ reviewID: reviewId });
        req.session.stall_id = review_data['stall-number'];

        console.log(req.session.stall_id);

        UserReview.deleteOne(deleteQuery).then(function(deleteResult){
            console.log('Delete successful!');
            resp.redirect('/profile');
        }).catch(errorFn);

    });

    //login part
    server.get('/login', function(req, res) {
        res.render('Login', {
            layout          : 'AccountManagement',
            title           : 'TaftChoice Login',
        });
    });

    server.post('/login', async function(req, res) {
        const { email, password } = req.body;

        try {
            // Find user by email in MongoDB
            const user = await User.findOne({ email });
    
            if (user) {
                // Compare the password provided by the user with the hashed password stored in the database
                const passwordMatch = await bcrypt.compare(password, user.password);
                
                if (passwordMatch) {
                    // Save userID for info fetching
                    req.session.userID = user.userID;
                    console.log(req.session.userID);
    
                    req.session.isLoggedIn = true;
                    res.redirect('/main'); // Redirect to main page after successful login
                } else {
                    // Handle incorrect password
                    res.render('Login', {
                        layout: 'AccountManagement',
                        title: 'TaftChoice Login',
                        error: 'Invalid email or password. Please try again.'
                    });
                }
            } else {
                res.render('Login', {
                    layout: 'AccountManagement',
                    title: 'TaftChoice Login',
                    error: 'Invalid email or password. Please try again.'
                });
            }
        } catch (error) {
            console.error('Error occurred during login:', error);
            res.status(500).send('Internal Server Error');
        }
    });


    server.post('/logout', function(req, res) {
        req.session.userID = null;
        req.session.isEdit = false;
        req.session.isLoggedIn = false;
        res.redirect('/main'); // Redirect to main page after logging out
    });


    server.get('/forgotpassword', function(req, res) {
        res.render('ForgotPassword', {
            layout          : 'AccountManagement',
            title           : 'Forgot Password',
        });
    });

    server.post('/forgotpassword', async function(req, res) {
        const { email, username } = req.body;

        try {
            // Find user by email in MongoDB
            const user = await User.findOne({ email: email, username: username });
    
            if (user) {
                // Compare the password provided by the user with the hashed password stored in the database
                req.session.userID = user.userID;
                req.session.isLoggedIn = true;

                req.session.userID = user.userID;
                console.log(req.session.userID);

                req.session.isLoggedIn = true;
                res.redirect('/main');

            } else {
                res.render('Login', {
                    layout: 'AccountManagement',
                    title: 'TaftChoice Login',
                    error: 'Invalid email or username. Please try again.'
                });
            }
        } catch (error) {
            console.error('Error occurred during login:', error);
            res.status(500).send('Internal Server Error');
        }
    });

    server.get('/signup', function(req, res) {
        res.render('SignUp', {
            layout          : 'AccountManagement',
            title           : 'TaftChoice SignUp',
        });
    });

    server.post('/signup', async function(req, res) {
        let hashedPassword;

        const submittedFullName = req.body.fullName;
        const submittedEmail = req.body.email;
        const submittedUsername = req.body.username;
        const submittedPass1 = req.body.password;
        const submittedBio = req.body.review;
        const submittedPic = req.body.profilePicture;

        try {
            const latestUser = await User.findOne().sort({ userID: -1 }).limit(1);
            let latestUserID = 1001;

            if (latestUser) {
                latestUserID = latestUser.userID + 1;
                console.log("Latest userID:", latestUserID);
            } else {
                console.log("No users found.");
            }

            hashedPassword = await bcrypt.hash(submittedPass1, 10);

            const newUser = new User({
                userID: latestUserID,
                email: submittedEmail,
                name: submittedFullName,
                username: submittedUsername,
                password: hashedPassword,
                userBio: submittedBio,
                profilePicture: submittedPic
            });
    
            await newUser.save();

            res.redirect('/Login');

        } catch (err) {
            console.error('Error saving data:', err);
            // Handle the error
        }
    });

    server.get('/registerUpvote', async function(req, res) {
        if (req.session.isLoggedIn) {
            const reviewID = parseInt(req.query.reviewID);
            const upvote = req.query.vote;
            const upvoteData = await Upvote.findOne({reviewID: reviewID, userID: req.session.userID});
    
            try {
                if (upvoteData) {
                    if (upvote === upvoteData.helpful) {
                        await upvoteData.deleteOne();
                        res.redirect(`/storereview?stallId=${req.session.stall_id}`);
                    } else {
                        upvoteData.helpful = upvote;
                        await upvoteData.save();
        
                        res.redirect(`/storereview?stallId=${req.session.stall_id}`);
                    }
                } else {
                    const latestUpvote = await Upvote.findOne().sort({ upvoteID: -1 }).limit(1);
                    let latestUpvoteID = 101;
    
                    if (latestUpvote) {
                        latestUpvoteID = latestUpvote.upvoteID + 1;
                        console.log("Latest upvoteID:", latestUpvoteID);
                    } else {
                        console.log("No users found.");
                    }

                    console.log(reviewID);
                    const reviewData = await UserReview.findOne({reviewID: reviewID});
                    
    
                    const newUpvote = new Upvote({
                        upvoteID: latestUpvoteID,
                        reviewID: reviewID,
                        authorID: reviewData.userID,
                        userID: req.session.userID,
                        helpful: upvote
                    });
    
                    await newUpvote.save();
                    res.redirect(`/storereview?stallId=${req.session.stall_id}`);
                }
    
            } catch (err) {
                console.error('Error saving data:', err);
                // Handle the error            
            }
        } else {
            res.redirect('/Login');
        }
    });



    //for Profile View-Only(Guest)
    //this loads the profile-view.html file from MCO1
    server.get('/viewProfile', async function(req, resp){

        const searchQuery = {username: req.query.username};
        const stallQuery = {stall_number: req.query['stall-number']};

        const user = await User.findOne({username  :  req.query.username});

        if (user.userID === req.session.userID) {
            resp.redirect('/profile');
        }

        const review = await UserReview.find({userID: user.userID });
        const helpfulTrueCount = await Upvote.countDocuments({ authorID: user.userID, helpful: true });
        const helpfulFalseCount = await Upvote.countDocuments({ authorID: user.userID, helpful: false });
        const totalUpvotes = helpfulTrueCount - helpfulFalseCount;

        const total_revs = review.length;

        User.findOne(searchQuery).lean().then(function(userResult){
            let userID = userResult.userID;
            UserReview.find({userID:userID}).lean().then(function(reviewResult){
                Stall.find(stallQuery).lean().then(function(stallResult){
                    const name = userResult.name;
                    const isEdit = false;
                    resp.render('profile-view', {
                        layout: 'profile-index',
                        title           : name,
                        users           : userResult,
                        data_stall      : stallResult,
                        profile_review_list: reviewResult,
                        isLoggedIn      : req.session.isLoggedIn,
                        isEdit          : isEdit,
                        total_revs      : total_revs,
                        totalUpvotes : totalUpvotes
                    });
                }).catch(errorFn);
            }).catch(errorFn);
        }).catch(errorFn);
    });

    
    //for profile owner(with additional delete and edit review buttons)
    //This loads profile.html file in MCO1
    server.get('/profile', async function(req, resp){

        const data_stall = await Stall.findOne({ 'stall-number': req.session.stall_id }); 
        const data_review = await UserReview.find({ 'stall-number': req.session.stall_id });
        const helpfulTrueCount = await Upvote.countDocuments({ authorID: req.session.userID, helpful: true });
        const helpfulFalseCount = await Upvote.countDocuments({ authorID: req.session.userID, helpful: false });
        const totalUpvotes = helpfulTrueCount - helpfulFalseCount;        

        if (data_review.length > 0) {
            let average = 0;

            for (i = 0; i < data_review.length; i++) {
                average += data_review[i]['average-rating'];
            }

            average /= data_review.length;

            data_stall['stall-rating'] = data_review.length;
            data_stall['stall-average'] = average.toFixed(1);

            await data_stall.save();
        }

        const searchQuery = {userID: req.session.userID};
        const stallQuery = {stall_number: req.query['stall-number']};
        const review = await UserReview.find({userID: req.session.userID});

        const total_revs = review.length;

        User.findOne(searchQuery).lean().then(function(userResult){
            let userID = userResult.userID;
            UserReview.find({userID:userID}).lean().then(function(reviewResult){
                Stall.find(stallQuery).lean().then(function(stallResult){
                    const name = userResult.name;
                    const isEdit = true;
                    resp.render('profile', {
                        layout: 'profile-index',
                        title           : name,
                        users           : userResult,
                        data_stall      : stallResult,
                        profile_review_list: reviewResult,
                        isLoggedIn      : req.session.isLoggedIn,
                        isEdit          : isEdit,
                        total_revs      : total_revs,
                        totalUpvotes    :  totalUpvotes
                        //userID          : userID
                    });
                }).catch(errorFn);
            }).catch(errorFn);
        }).catch(errorFn);
    });




    //edits the profile of the user
    server.get('/editProfile', function(req, resp){
        const editQuery = {userID: req.session.userID};
        User.findOne(editQuery).lean().then(function(result){
            let name = result.name;
            let username = result.username;
            let bio = result.userBio;
            let pic = result.profilePicture;

            resp.render('edit-profile', {
                layout: 'edit-profile-index',
                title           : 'Edit Profile',
                isLoggedIn      : req.session.isLoggedIn,
                name: name,
                username: username,
                pic : pic,
                bio: bio
            });
        }).catch(errorFn);
    });

    function checkForm(name, username) {
        if (name.trim() === "" || username.trim() === "") {
            alert("All necessary fields must be filled out");
            return false;
        }
        else {
            return true;
        }
    }

    //edits the profile of the user
    server.post('/save-profile-changes', function(req, resp){
        const updateQuery = {userID: req.session.userID};

        User.findOne(updateQuery).then(function(userResult){    
            console.log('Update Successful!');
            userResult.name = req.body.name;
            userResult.username = req.body.username;
            userResult.userBio = req.body.bio;
            userResult.profilePicture = req.body.profilePicture;

            console.log(req.body.name);
            console.log(req.body.username);

            checkForm(userResult.name, userResult.username);


            userResult.save().then(function(result){
                resp.redirect('/profile');
            }).catch(errorFn);
        }).catch(errorFn);
    });
};

module.exports.add = add;
