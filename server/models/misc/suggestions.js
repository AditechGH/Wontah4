/**
 * Created by Aditech on 1/13/2016.
 */
var mongoose = require('mongoose');
var suggestionSchema = mongoose.Schema({
    message: String,
    name: String,
    username: String,
    time: Date
});
module.exports = mongoose.model('Suggestion', suggestionSchema);
