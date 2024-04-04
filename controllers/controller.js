const User = require('../models/users');
const UserReview = require('../models/reviews');
const Stall = require('../models/stalls');
const Upvote = require('../models/upvotes');
const bcrypt = require('bcrypt');
const multer = require('multer');
const path = require('path');

let { userID, stall_id, isLoggedIn, isEdit } = require('../app');

isLoggedIn = false;

function errorFn(err){
    console.log('Error fond. Please trace!');
    console.error(err);
}

function add(server){
    //webpages part
    const e = require('express');

    var storage = multer.diskStorage({
        destination: function (req, file, cb) {
            cb(null, 'uploads/'); // Destination folder for profile pictures
        },
        filename: function (req, file, cb) {
            let ext = path.extname(file.originalname)
            cb(null, Date.now() + ext)
        }
    });
    
    var upload = multer({
        storage: storage,
        fileFilter: function(req, file, callback) {
            const fileExtension = path.extname(file.originalname).toLowerCase();

            // Allowed file extensions
            const allowedExtensions = ['.png', '.jpg', '.jpeg'];

            // Check if the file extension is allowed
            if (allowedExtensions.includes(fileExtension)) {
                callback(null, true);
            } else {
                console.log('JPG & PNG only.')
                callback(null, false)
            }
        },
        limits: {
            fileSize: 1024 * 1024 * 2
        }

    });

    server.get(['/', '/main'], async function(req, resp){
        try {
            const data_stall = await Stall.find().lean();

            isEdit = false;
            console.log(isLoggedIn);

            resp.render('main', {
                layout: 'index',
                title: 'TaftChoice',
                data_stall: data_stall,
                isLoggedIn: isLoggedIn,
                isEdit: isEdit,
            });

        } catch (err) {
            console.error('Error fetching stalls:', err);
            // Handle the error
        }
    });


    //display review [raiki]
    server.get('/storereview', async function(req, res) {
        let stallId = parseInt(req.query.stallId);
        stall_id = stallId;

        try {
            const data_stall = await Stall.findOne({ 'stall-number': stall_id }).lean();
            const all_stall_data = await Stall.find().lean();
            const review_data = await UserReview.find({ 'stall-number': stallId }).lean();
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
            console.log(isLoggedIn);

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
                stall_id        : stallId,
                isLoggedIn      : isLoggedIn,
                isEdit          : isEdit,
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

            stall_id = stallId;
        
            const data_stall = await Stall.findOne({ 'stall-number': stall_id });      //isolated info the current stall clicked
            
            console.log(stall_id);
            console.log(data_stall); //empty array output
        
            const stall_name = data_stall['stall-name'];
            const stall_image = data_stall['stall-image'];
            
            console.log(stall_image);
        
            res.render('AddReview', {
                layout          : 'ReviewManagement',
                title           :  'Review: ' + stall_name,
                userID          :  userID,
                stall_image     :  stall_image,
                data_stall      :  data_stall,
                stall_id        :  stall_id,
                stall_name     :  stall_name,
                isLoggedIn      : isLoggedIn,
                isEdit          : isEdit
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
                userID: userID,
                'stall-number': stall_id, // Assuming stall_id is accessible here
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
    
            const data_stall = await Stall.findOne({ 'stall-number': stall_id }); 
            const data_review = await UserReview.find({ 'stall-number': stall_id }); 

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
            res.redirect(`/storereview?stallId=${stall_id}`);
    
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
            stall_id = stall_number;
        
            const stall_data = await Stall.findOne({ 'stall-number': stall_number });
            const stall_name = stall_data['stall-name'];
        
            isEdit = false;
        
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
                isLoggedIn      : isLoggedIn,
                isEdit          : isEdit,
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
    server.post('/save-review-changes',upload.single('profilePicture'), async function(req, resp){
        const reviewId = parseInt(req.query.reviewId);
        const updateQuery ={reviewID: reviewId};

        const submittedPic = req.file ? req.file.path : null;
        const averageRating = (parseInt(req.body.rating1) + parseInt(req.body.rating2) + parseInt(req.body.rating3)) / 3;

        UserReview.findOne(updateQuery).then(function(reviewResult){    
            console.log('Update Successful!');

            reviewResult['review-comment'] = req.body.review;
            reviewResult['average-rating'] = averageRating.toFixed(1);
            reviewResult['user-qual-rating'] = parseInt(req.body.rating1);
            reviewResult['user-serv-rating'] = parseInt(req.body.rating2);
            reviewResult['user-price-rating'] = parseInt(req.body.rating3);
            reviewResult['review-reco'] = req.body.recom;
            reviewResult['review-image'] = submittedPic;

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
        stall_id = review_data['stall-number'];

        console.log(stall_id);

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
                    userID = user.userID;
                    console.log(userID);
    
                    isLoggedIn = true;
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
        userID = null;
        isEdit = false;
        isLoggedIn = false;
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
                userID = user.userID;
                isLoggedIn = true;

                userID = user.userID;
                console.log(userID);

                isLoggedIn = true;
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

    server.post('/signup', upload.single('profilePicture'), async function(req, res) {
        let hashedPassword;
        console.log(req.file);

        const submittedFullName = req.body.fullName;
        const submittedEmail = req.body.email;
        const submittedUsername = req.body.username;
        const submittedPass1 = req.body.password;
        const submittedBio = req.body.review;
        const submittedPic = req.file ? req.file.path : null;

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
        if (isLoggedIn) {
            const reviewID = parseInt(req.query.reviewID);
            const upvote = req.query.vote;
            const upvoteData = await Upvote.findOne({reviewID: reviewID, userID: userID});
    
            try {
                if (upvoteData) {
                    if (upvote === upvoteData.helpful) {
<<<<<<< HEAD
                        await upvoteData.deleteOne();
=======
                        await Upvote.deleteOne({ reviewID: reviewID, userID: userID });
>>>>>>> refs/remotes/origin/main
                        res.redirect(`/storereview?stallId=${stall_id}`);
                    } else {
                        upvoteData.helpful = upvote;
                        await upvoteData.save();
        
                        res.redirect(`/storereview?stallId=${stall_id}`);
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
                        userID: userID,
                        helpful: upvote
                    });
    
                    await newUpvote.save();
                    res.redirect(`/storereview?stallId=${stall_id}`);
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

        if (user.userID === userID) {
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
                        isLoggedIn      : isLoggedIn,
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

        const data_stall = await Stall.findOne({ 'stall-number': stall_id }); 
        const data_review = await UserReview.find({ 'stall-number': stall_id });
        const helpfulTrueCount = await Upvote.countDocuments({ authorID: userID, helpful: true });
        const helpfulFalseCount = await Upvote.countDocuments({ authorID: userID, helpful: false });
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

        const searchQuery = {userID: userID};
        const stallQuery = {stall_number: req.query['stall-number']};
        const review = await UserReview.find({userID:userID});

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
                        isLoggedIn      : isLoggedIn,
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
        const editQuery = {userID: userID};
        User.findOne(editQuery).lean().then(function(result){
            let name = result.name;
            let username = result.username;
            let bio = result.userBio;
            let pic = result.profilePicture;

            resp.render('edit-profile', {
                layout: 'edit-profile-index',
                title           : 'Edit Profile',
                isLoggedIn      : isLoggedIn,
                name: name,
                username: username,
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
    server.post('/save-profile-changes',upload.single('profilePicture'), function(req, resp){
        console.log(req.file);
        const updateQuery = {userID: userID};

        const submittedPic = req.file ? req.file.path : null;
        
        User.findOne(updateQuery).then(function(userResult){    
            console.log('Update Successful!');
            userResult.name = req.body.name;
            userResult.username = req.body.username;
            userResult.userBio = req.body.bio;
            userResult.profilePicture = submittedPic;

            checkForm(userResult.name, userResult.username, userResult.bio);

            userResult.save().then(function(result){
                resp.redirect('/profile');
            }).catch(errorFn);
        }).catch(errorFn);
    });
};

module.exports.add = add;
