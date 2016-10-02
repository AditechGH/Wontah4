/**
 * Created by Aditech on 1/14/2016.
 */
var mongoose = require('mongoose');
var errorlogSchema = mongoose.Schema({
    message: String,
    sender: String,
    time: Date
});
module.exports = mongoose.model('ErrorLog', errorlogSchema);
