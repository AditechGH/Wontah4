/**
 * Created by Aditech on 1/14/2016.
 */

var User = require('../models/users/user');
var ErrorLog = require('../models/misc/errorLog');
var UserOption = require('../models/users/userOptions'),
    flash = require('connect-flash');
module.exports = function(app){
    app.get('/mail/activate', function(req, res){
        req.flash('Title', "Wontah - Account Activation");
        if(req.query.username.length < 3 || req.query.email.length < 5 ||  req.query.pass === "" ){
            req.flash('eBody', "Your account information is incomplete");
            req.flash('sBody', "");
            res.render('activate.ejs', {title: req.flash('Title'), errorMsg: req.flash('eBody'),successMsg: req.flash('sBody')});
        }
        else{
                User.findOne({username: req.query.username,
                              email: req.query.email,
                              password: req.query.pass},function (err, user) {
                        if (err) {
                            req.flash('eBody', "Sorry but there seems to have been an issue activating your account at this time. We have already notified ourselves of this issue and we will notify you via email when issue has been resolved");
                            req.flash('sBody', "");
                            res.render('activate.ejs', {title: req.flash('Title'), errorMsg: req.flash('eBody'),successMsg: req.flash('sBody')});
                            ErrorLog.message = err;
                            ErrorLog.sender = req.query.username;
                            ErrorLog.save();
                        }
                        if (!user) {
                            req.flash('eBody', "Your credentials are not matching anything in our system");
                            req.flash('sBody', "");
                            res.render('activate.ejs', {title: req.flash('Title'), errorMsg: req.flash('eBody'),successMsg: req.flash('sBody')});
                        } else {
                           User.update({ username: req.query.username }, { $set: { activated: true } }, { multi: false } , function (err, user) {
                               if(err){
                                   req.flash('eBody', "Sorry but there seems to have been an issue activating your account at this time. We have already notified ourselves of this issue and we will notify you via email when issue has been resolved");
                                   req.flash('sBody', "");
                                   res.render('activate.ejs', {title: req.flash('Title'), errorMsg: req.flash('eBody'),successMsg: req.flash('sBody')});
                                   ErrorLog.message = err;
                                   ErrorLog.sender = req.query.username;
                                   ErrorLog.save();
                               }else{
                                   req.flash('sBody', "Account was activated successfully");
                                   req.flash('eBody', "");
                                   res.render('activate.ejs', {title: req.flash('Title'), errorMsg: req.flash('eBody'),successMsg: req.flash('sBody')});
                               }
                           });
                        }
                    });
        }
    });
    
    app.get('/mail/forgotpas', function (req, res) {
        req.flash('Title', "Wontah - Reset Password");
        var username = req.query.username;
        var pass = req.query.pass;
        console.log(username,pass);
        if(req.query.username.length < 3 || req.query.pass.length < 5){
            console.log('Sorry -2');
            req.flash('eBody', "Your account information is incomplete");
            req.flash('sBody', "");
            res.render('activate.ejs', { title: req.flash('Title'),errorMsg: req.flash('eBody'),successMsg: req.flash('sBody')});
        }else{
            UserOption.findOne({username: req.query.username,
                temp_pass: req.query.pass},function (err, user) {
                if (err) {
                    console.log('Sorry -1');
                    req.flash('eBody', "Sorry but there seems to have been an issue activating your account at this time. We have already notified ourselves of this issue and we will notify you via email when issue has been resolved");
                    req.flash('sBody', "");
                    res.render('activate.ejs', {title: req.flash('Title'),errorMsg: req.flash('eBody'), successMsg: req.flash('sBody')});
                    ErrorLog.message = err;
                    ErrorLog.sender = req.query.username;
                    ErrorLog.save();
                }
                if (!user) {
                    console.log('Sorry 0');
                    req.flash('eBody', "Your credentials are not matching anything in our system, try sending request again");
                    req.flash('sBody', "");
                    res.render('activate.ejs', {title: req.flash('Title'),errorMsg: req.flash('eBody'), successMsg: req.flash('sBody')});
                }else{
                    User.update({ username: req.query.username }, { $set: { password: req.query.pass } }, { multi: false } , function (err) {
                        if(err){
                            console.log('Sorry 1');
                            req.flash('eBody', "Sorry but there seems to have been an issue activating your account at this time. We have already notified ourselves of this issue and we will notify you via email when issue has been resolved");
                            req.flash('sBody', "");
                            res.render('activate.ejs', {title: req.flash('Title'), errorMsg: req.flash('eBody'),successMsg: req.flash('sBody')});
                            ErrorLog.message = err;
                            ErrorLog.sender = req.query.username;
                            ErrorLog.save();
                        }else{
                            UserOption.update({ username: req.query.username }, { $set: { temp_pass: "" } }, { multi: false } , function (err) {
                                if(err){
                                    console.log('Sorry 2');
                                    req.flash('eBody', "Sorry but there seems to have been an issue activating your account at this time. We have already notified ourselves of this issue and we will notify you via email when issue has been resolved");
                                    req.flash('sBody', "");
                                    res.render('activate.ejs', {title: req.flash('Title'), errorMsg: req.flash('eBody'),successMsg: req.flash('sBody')});
                                    ErrorLog.message = err;
                                    ErrorLog.sender = req.query.username;
                                    ErrorLog.save();
                                }else{
                                    console.log('Your Password Was Successfully Changed');
                                    req.flash('sBody', "Your Password Was Successfully Changed");
                                    req.flash('eBody', "");
                                    res.render('activate.ejs', {title: req.flash('Title'), errorMsg: req.flash('eBody'),successMsg: req.flash('sBody')});
                                }
                            });
                        }
                    });
                }
            });
        }
    })

};