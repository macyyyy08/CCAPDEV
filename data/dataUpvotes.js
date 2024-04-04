const path = require('path');
const fs = require('fs');

function getDataUpvote(){
    const filePath = path.join(__dirname, 'dataUpvotes.json');
	let rawdata = fs.readFileSync(filePath);
	return JSON.parse(rawdata);
}

module.exports.getDataUpvote = getDataUpvote;