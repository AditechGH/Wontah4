/**
 * Created by Aditech on 1/13/2016.
 */
var mongoose = require('mongoose');
var useroptionSchema = mongoose.Schema({
    username: {type: String, unique: true},
    backgroud: String,
    question: String,
    answer: String,
    temp_pass: String,
    token: String,
    expire: String,
    cover_style: String,
    coverImages: Array,
    savedSubs: Array,
    subscribtions: Array
});
module.exports = mongoose.model('Useroption', useroptionSchema);
