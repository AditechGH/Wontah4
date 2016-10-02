/**
 * Created by Aditech on 1/14/2016.
 */
var User = require('../models/users/user'),
UserOption = require('../models/users/userOptions'),
Taah = require('../models/taah/taahs');

module.exports = function(router){

    router.get('/uniqueUsername/:username', function(req, res){
        User.findOne({username: req.params.username}, function(err, user){
            if(err)
                return res.status(400).json({isValid: false});
            if(user){
                return res.status(400).json({isValid: false});
            }else{
                return res.json({isValid: true});
            }
        })
    });

    router.get('/uniqueEmail/:email', function (req, res) {
        User.findOne({email: req.params.email}, function(err, user){
            if(err)
                return res.status(400).json({isValid: false});
            if(user){
                return res.status(400).json({isValid: false});
            }else{
                return res.json({isValid: true});
            }
        })
    });

    router.get('/validCredential/:email', function (req, res) {
        User.findOne({email: req.params.email}, function(err, user){
            if(err)
                return res.status(400).json({isValid: false});
            if(user){
                return res.json({isValid: true});
            }else{
                return res.status(400).json({isValid: false});
            }
        })
    });

    router.get('/uniqueTaahname/:name', function (req, res) {
        Taah.findOne({name:req.params.name},{_id:1}, function (err,taah) {
            if(err)
                return res.status(400).json({isValid: false});
            if(!taah){
                return res.json({isValid: true});
            }else{
                return res.status(400).json({isValid: false});
            }
        });
    });

    router.get('/logout/:username', function (req, res, next) {
        req.logout();
        User.update({ username: req.params.username }, { $set: { loggedIn: false} }, { multi: false } , function (err) {
            if (err)
                return res.status(400).json({message: err});
            UserOption.update({ username:req.params.username }, { $set: { token: ""} }, { multi: false } , function (err) {
                if(err) return res.status(400).json({message: err});
                res.json({message: "success"});
            });
        });
    });


    //POST
    router.post('/changePass', function (req, res) {
        if(req.body.pass.oldpass === ""){
            return res.status(400).json({message:"Enter your old password"});
        }
        if(req.body.pass.newpass1 === ""){
            return res.status(400).json({message:"Enter your new password"});
        }
        if(req.body.pass.newpass2 === ""){
            return res.status(400).json({message:"Enter your new password (again)"});
        }
        if(req.body.pass.newpass1 !== req.body.pass.newpass2){
            return res.status(400).json({message:"passwords do not match"});
        }
        User.findOne({'username': req.body.user}, function (err, user ) {
            if(err)
                return done(err);
            if (!user) {
                return res.status(400).json({message:"Username is incorrect."});
            }else{
                if (!user.validPassword(req.body.pass.oldpass)) {
                    return res.status(400).json({message:"password is incorrect."});
                }else{
                    User.update({ username: user.username }, { $set: { password:user.generateHash(req.body.pass.newpass1) } }, { multi: false } , function (err) {
                        if(err)
                            return res.status(400).json({message: err});
                        return res.status(200).json({message: "success"});
                    });
                }
            }
        });

    });

    router.post('/pInfo', function (req, res) {
        if(req.body.u.firstname === "" || req.body.u.lastname === ""){
             return res.status(400).json({message: "Fill the form data"});
        }
        User.findOne({username: req.body.user}, function (err, user) {
            if(err)
                return res.status(400).json({message: err});
            if(user){
                user.firstname = req.body.u.firstname;
                user.lastname = req.body.u.lastname;
                user.contact = req.body.u.contact;
                user.website = req.body.u.website;
                user.bio = req.body.u.bio;
                user.gender = req.body.u.gender;
                user.save(function (err,user) {
                    if(err)
                        return res.status(400).json({message: err});
                    return res.status(200).json(user);
                })
            }
        });

    });

    router.post('/SchInfo', function (req, res) {
        User.findOne({username: req.body.user}, function (err, user) {
            if (err)
                return res.status(400).json({message: err});
            user.school = req.body.sch;
            user.save(function (err,user) {
                if(err)
                    return res.status(400).json({message: err});
                return res.status(200).json(user);
            });
        });
    });
};