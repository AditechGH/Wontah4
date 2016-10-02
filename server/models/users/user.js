/**
 * Created by Aditech on 1/11/2016.
 */
var mongoose = require('mongoose');
var bcrypt   = require('bcrypt-nodejs');
var jwt = require('jsonwebtoken');

var Schema = mongoose.Schema;
var userSchema = mongoose.Schema({
    username: {type: String, unique: true},
    firstname: String,
    lastname: String,
    email: String,
    password: String,
    gender: String,
    website: String,
    contact: String,
    bio: String,
    userlevel: String,
    avatar: String,
    ip: String,
    signup: Date,
    lastlogin: Date,
    notescheck: Date,
    activated: Boolean,
    loggedIn: Boolean,
    completeprofile: Boolean,
    school: {
        status: Boolean,
        ug: Boolean,
        name: String,
        level: String,
        hall: String,
        department: Array
    }

});
// generating a hash
userSchema.methods.generateHash = function(password) {
    return bcrypt.hashSync(password, bcrypt.genSaltSync(8), null);
};
// checking if password is valid
userSchema.methods.validPassword = function(password) {
    return bcrypt.compareSync(password, this.password);
};
userSchema.methods.generateJWT = function() {
    // set expiration to 60 days
    var today = new Date();
    var exp = new Date(today);
    exp.setDate(today.getDate() + 60);
    return jwt.sign({
        _id: this._id,
        username: this.username,
        email: this.email,
        avatar: this.avatar,
        exp: parseInt(exp.getTime() / 1000)
    }, '@NMANENBALANDUNEE0100201031');
};
// create the model for users and expose it to our app
module.exports = mongoose.model('User', userSchema);
