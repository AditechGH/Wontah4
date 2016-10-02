/**
 * Created by Aditech on 1/13/2016.
 */
var mongoose = require('mongoose');

var Schema = mongoose.Schema;
var voteSchema = mongoose.Schema({
    mid: Schema.Types.ObjectId,
    username: String,
    vote: Boolean
});
module.exports = mongoose.model('vote', voteSchema);
