/**
 * Created by Aditech on 1/16/2016.
 */
var mongoose = require('mongoose');
var departmentSchema = mongoose.Schema({
    id: String,
    name: String
});
module.exports = mongoose.model('Department', departmentSchema);