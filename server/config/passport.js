/**
 * Created by Aditech on 1/12/2016.
 */
var LocalStrategy = require('passport-local').Strategy;

var User = require('../models/users/user');


module.exports = function (passport) {

    passport.serializeUser(function(user, done){
       done(null, user.id);
    });
    passport.deserializeUser(function(id, done){
       User.findById(id,function(err, user){
           done(err, user);
       });
    });
    passport.use('local-login', new LocalStrategy({
        usernameField: 'email',
        passwordField: 'password',
        passReqToCallback: true
    },
        function (req, email, password, done) {
            process.nextTick(function () {
                User.findOne({'email': email}, function (err, em) {
                    if(err)
                        return done(err);
                    if(!em){
                        User.findOne({'username': email}, function (err, user ) {
                            if(err)
                                return done(err);
                            if (!user) {
                                return done(null, false, { message: 'Username/Email and password combination is incorrect.' });
                            }else{
                                if (!user.validPassword(password)) {
                                    return done(null, false, { message: 'Username/Email and password combination is incorrect.' });
                                }
                                return done(null, user);
                            }
                        })
                    }else{
                        if (!em.validPassword(password)) {
                            return done(null, false, { message: 'Username/Email and password combination is incorrect.' });
                        }
                        return done(null, em);
                    }
                })
            });
        }
    ));
};