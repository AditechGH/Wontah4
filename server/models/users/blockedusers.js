/**
 * Created by Aditech on 1/13/2016.
 */
var mongoose = require('mongoose');
var blockeduserSchema = mongoose.Schema({
    blocker: String,
    blockee: String,
    blockdate: Date
});
module.exports = mongoose.model('Blockeduser', blockeduserSchema);
