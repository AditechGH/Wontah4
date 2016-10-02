/**
 * Created by Aditech on 1/13/2016.
 */
var mongoose = require('mongoose');
var taahSchema = mongoose.Schema({
    type: String,
    coption: String,
    name: String,
    title: String,
    Description: String,
    createddate: Date,
    creator: String,
    logo: String,
    numOfUsers: Number
});
module.exports = mongoose.model('Taah', taahSchema);
