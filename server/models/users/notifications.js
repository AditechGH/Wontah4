/**
 * Created by Aditech on 1/13/2016.
 */
var mongoose = require('mongoose');
var notificationSchema = mongoose.Schema({
    username: String,
    initiator: String,
    type: String,
    app: String,
    note: String,
    name: String,
    did_read: Boolean,
    date_time: Date
});
module.exports = mongoose.model('Notification', notificationSchema);
