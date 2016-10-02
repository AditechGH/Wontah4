var mongoose = require('mongoose');

var Schema = mongoose.Schema;
var statuSchema = mongoose.Schema({
    osid: Schema.Types.ObjectId,
    chid: Schema.Types.ObjectId,
    account_name: String,
    author: String,
    anonymous: Boolean,
    type: String,
    ptype: String,
    title: String,
    data: String,
    link: String,
    imgUrl: {},
    taah: String,
    up: Number,
    down: Number,
    postdate: Date,
    updated: Date,
    score: Number,
    cont: Number,
    diff: Number,
    childs: Array
});
module.exports = mongoose.model('Status', statuSchema);
