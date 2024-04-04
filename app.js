//npm init -y
//npm i express express-handlebars body-parser mongoose bcrypt multer
//node app

const express = require('express');
const server = express();

const bodyParser = require('body-parser');
server.use(bodyParser.json());
server.use(express.json()); 
server.use(express.urlencoded({ extended: true }));
const handlebars = require('express-handlebars');
const initializeData = require('./scripts/initializeData');

var hbs = require('handlebars');


module.exports = { express, server };

//adapted from: https://stackoverflow.com/questions/34252817/handlebarsjs-check-if-a-string-is-equal-to-a-value
hbs.registerHelper('ifcount', function (a, b, options) {
    if (a == b) { return options.fn(this); }
    return options.inverse(this);
});


hbs.registerHelper('startingRow', function(stall_ID) {
    return stall_ID == 1;
});

hbs.registerHelper('endingRow', function(stall_ID) {
    return stall_ID % 3 == 0;
});

hbs.registerHelper('getUserProperty', function(users, userID, property) {
    // Find the user object with the given userID
    const user = users.find(user => user.userID === userID);
    

    // Return the value of the specified property from the user object
    return user ? user[property] : undefined;
});


hbs.registerHelper('getStallProperty', function(data_stalls, stallNumber, property) {
    const data_stall = data_stalls.find(data_stall => data_stall['stall-number'] === stallNumber);
    console.log(data_stall);

    return data_stall ? data_stall[property] : undefined;
});


hbs.registerHelper('redirectToReview', function(stallId) {
    // Construct the URL with the stall ID as a query parameter
    const redirectUrl = `/storereview?stallId=${stallId}`;
    return redirectUrl;
});

hbs.registerHelper('redirectToAddReview', function(stallId, isLogged) {
    // Construct the URL with the stall ID as a query parameter
    const redirectUrl = `/addreview?stallId=${stallId}`;

    if (!isLogged) {
        return '/login';
    }
    else {
        return redirectUrl;
    }
});

hbs.registerHelper('registerUpvote', function(reviewID, upvote) {
    // Construct the URL with the stall ID as a query parameter

    const redirectUrl = `/registerUpvote?reviewID=${reviewID}&vote=${upvote}`;
    console.log(reviewID);

    return redirectUrl;
});


hbs.registerHelper('redirectToGuestProfile', function(username) {
    // Construct the URL with the stall ID as a query parameter
    const redirectUrl = `/viewProfile?username=${username}`;
    return redirectUrl;
});

server.set('view engine', 'handlebars');
server.engine('handlebars', handlebars.engine({
    extname: 'handlebars'
}));

server.use(express.static('public'));


//mongoose part
const mongoose = require('mongoose');
const mongoURI = process.env.MONGODB_URI;

mongoose.connect(mongoURI);

const controllers = ['controller'];
for(var i=0; i<controllers.length; i++){
    const model = require('./controllers/'+controllers[i]);
    model.add(server);
}


const port = process.env.PORT || 9090;
server.listen(port, function(){
    console.log('Listening at port '+port);
});
