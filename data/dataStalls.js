const path = require('path');
const fs = require('fs');

function getDataStall(){
    const filePath = path.join(__dirname, 'dataStalls.json');
	let rawdata = fs.readFileSync(filePath);
	return JSON.parse(rawdata);
}

function filterDataByStallId(stallId) {
    const data = getDataStall();
    return data.filter(entry => entry['stall-number'] === stallId);
}

module.exports.filterDataByStallId = filterDataByStallId;
module.exports.getDataStall = getDataStall;
