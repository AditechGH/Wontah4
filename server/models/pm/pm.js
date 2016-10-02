/**
 * Created by Aditech on 1/13/2016.
 */
var mongoose = require('mongoose');
var pmSchema = mongoose.Schema({
    receiver: String,
    sender: String,
    senttime: Date,
    subject: String,
    message: String,
    docs : Array,
    sdelete: {type: Boolean, default: false},
    rdelete: {type: Boolean, default: false},
    parent: {},
    hasreplies: {type: Boolean, default: false},
    s_unseen: {type: Boolean, default: false},
    r_unseen: {type: Boolean, default: false},
    updatetime: Date
});
module.exports = mongoose.model('Pm', pmSchema);
