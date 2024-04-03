const mongoose = require('mongoose');

const stallSchema = new mongoose.Schema({
    'stall-number': { type: Number, required: true , unique: true},
    'stall-image': { type: String, required: true },
    'stall-name': { type: String, required: true , unique: true},
    'stall-average': { type: Number, required: true },
    'stall-rating': { type: Number, required: true },
    'stall-desc': { type: String, required: true },
    'stall-must-try': { type: String, required: true }
}, {versionKey: false});


const Stall = mongoose.model('stall', stallSchema);

module.exports = Stall;