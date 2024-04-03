const path = require('path');
const fs = require('fs');

function getDataUser(){
    const filePath = path.join(__dirname, 'dataUsers.json');
	let rawdata = fs.readFileSync(filePath);
	return JSON.parse(rawdata);
}

function getUserByID(userID) {
    const userData = getDataUser();
    return userData.find(user => user.userID === userID);
}

function getUserIdByUsername(username) {
    const users = getDataUser();       // This assumes you have a function to get the list of users
    const user = users.find(user => user.username === username);
    return user ? user.userID : null;
}


module.exports.getDataUser = getDataUser;

module.exports.getUserByID = getUserByID;

module.exports.getUserIdByUsername = getUserIdByUsername;