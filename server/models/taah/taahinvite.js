/**
 * Created by Aditech on 1/13/2016.
 */
var mongoose = require('mongoose');
var taahinviteSchema = mongoose.Schema({
    invitor: String,
    invitee: String,
    taah: String,
    datemade: Date
});
module.exports = mongoose.model('Taahinvite', taahinviteSchema);
