/**
 * Created by Aditech on 1/13/2016.
 */
var mongoose = require('mongoose');


var friendSchema = mongoose.Schema({
    user1: String,
    user2: String,
    datemade: Date,
    accepted: Boolean
});
module.exports = mongoose.model('Friend', friendSchema);
