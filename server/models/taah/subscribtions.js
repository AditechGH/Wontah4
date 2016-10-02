
/**
 * Created by Aditech on 1/13/2016.
 */
var mongoose = require('mongoose');
var subscriptionSchema = mongoose.Schema({
    taah: String,
    username: String,
    approved: Boolean,
    admin: Boolean
});
module.exports = mongoose.model('Subscription', subscriptionSchema);

