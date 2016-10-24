/**
 * Created by Aditech on 1/11/2016.
 */
var User = require('../models/users/user'),
    UserOption = require('../models/users/userOptions'),
    Pm = require('../models/pm/pm'),
    Taah = require('../models/taah/taahs'),
    get_ip = require('ipware')().get_ip,
    fs = require('fs-extra'),
    path  = require('path'),
    Suggestion = require('../models/misc/suggestions'),
    nodemailer = require('nodemailer');
var smtpTransport = nodemailer.createTransport("SMTP",{
    service: "Gmail",
    auth: {
        user: "wontah5170@gmail.com",
        pass: "adi0100201031"
    }
});
module.exports = function(router, passport){

    router.post('/login', function(req, res, next){
        if(!req.body.email || !req.body.password){
            return res.status(400).json({message: 'Please fill out all fields'});
        }
        passport.authenticate('local-login', function(err, user, info){
            if(err){ return next(err); }
            if(user){
                login(user, req, res);
            } else {
                return res.status(401).json(info);
            }
        })(req, res, next);
    });

    router.post('/register', function (req, res, done) {
        if(!req.body.username || !req.body.email || !req.body.password || !req.body.password2){
            return res.status(400).json({message: 'Please fill out all fields'});
        }
        if(req.body.password !== req.body.password2){
            return res.status(400).json({message: 'Passwords do not match'});
        }
        User.findOne({'username': req.body.username},
            function (err, user) {
                if(err)
                    return res.status(400).json({message: err});
                if(user) {
                    return res.status(400).json({message: 'Username is already in our system'});
                }else {
                    User.findOne({'email':req.body.email},
                        function (err, user) {
                            if(err)
                                return res.status(400).json({message: err});
                            if(user) {
                                return res.status(400).json({message: 'This email is already in our system'});
                            }else{
                                var user = new User();
                                var useroption = new UserOption();
                                var pm = new Pm();
                                var ip_info = get_ip(req);
                                user.username = req.body.username;
                                user.email = req.body.email;
                                user.password = user.generateHash(req.body.password);
                                user.ip = ip_info.clientIp;
                                user.avatar = 'avatardefault.jpg';
                                user.signup = new Date();
                                user.lastlogin = new Date();
                                user.notescheck = new Date();
                                user.activated = false;
                                user.completeprofile = false;
                                user.userlevel = 'a';
                                user.save(function(err){
                                    if(err)
                                        return res.status(400).json({message: err});
                                    var tarr = [];
                                    Taah.find({ type: "c" },{ _id: 0,name:1,numOfUsers:1 },
                                        function(err, data){
                                            if(err)
                                                return res.status(400).json({message: err});
                                            data.forEach(function (item) {
                                                    tarr.push(item);
                                            });
                                            useroption.subscribtions = tarr;
                                            useroption.username = req.body.username;
                                            useroption.backgroud = 'original';
                                            useroption.save(function (err) {
                                                if(err)
                                                    return res.status(400).json({message: err});
                                                pm.parent = "x";
                                                pm.receiver = req.body.username;
                                                pm.sender = 'TeamWontah';
                                                pm.r_unseen = true;
                                                pm.senttime = new Date();
                                                pm.updatetime = new Date();
                                                pm.sdelete =  true;
                                                pm.subject = "Tips to get the most out of Wontah";
                                                pm.message = "<h3>Hello, "+req.body.username+"</h3><p>"+
                                                 "Here's some information to get you started on Wontah (<em>tips to get the most out of it</em>)</p><p>"+
                                                 "If Google is the place you go to search for information, Wontah is the place you go to see what others have found" +
                                                    ". It is timely, interactive and absorbing.</p><p>The key to enjoying it is by finding, subscribing and creating communities(taahs)" +
                                                    " that are of interest to you. it allows you to share your opinions with like minded people."+
                                                 "</p><p><b>How it works</b></p><ol>"+
                                                 "<li>Users make submissions (text or links) to taahs(communities)</li><li>Other users vote and comment on the submission</li>"+
                                                 "<li>Based on those votes, the best submission rise to the top for everyone to enjoy.</li></ol><p>"+
                                                 "<b>Thank you for joining our big family</b>"+
                                                 "</p>"+
                                                 "<p class='text-center wt-center-content'>Happy Wontahing  #Team Wontah#</p>";
                                                pm.save(function (err) {
                                                    if(err)
                                                        return res.status(400).json({message: err});
                                                    if(!fs.existsSync("/home/ubuntu/wontah4/static/user/"+req.body.username+"/")){
                                                        fs.mkdirSync("/home/ubuntu/wontah4/static/user/"+req.body.username+"/", 766, function(err){
                                                            if(err){
                                                                return res.status(400).json({message: err});
                                                            }
                                                        });
                                                    }
                                                    if(!fs.existsSync("/home/ubuntu/wontah4/static/user/"+req.body.username+"/cover/")){
                                                        fs.mkdirSync("/home/ubuntu/wontah4/static/user/"+req.body.username+"/cover/", 766, function(err){
                                                            if(err){
                                                                return res.status(400).json({message: err});
                                                            }
                                                        });
                                                    }
                                                    fs.copy("/home/ubuntu/wontah4/static/img/avatardefault.jpg", "/home/ubuntu/wontah4/static/user/"+req.body.username+"/avatardefault.jpg", function (err) {
                                                        if (err)
                                                            return res.status(400).json({message: err});
                                                    });
                                                    var mailOptions = {
                                                        from: 'TeamWontah <NoReplies@wontah.com>',
                                                        to: req.body.email,
                                                        subject: 'Wontah Account Activation',
                                                        html: '<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Wontah Message</title></head><body'
                                                            + ' style="margin:0px; font-family:Tahoma, Geneva, sans-serif;"><div style="padding:10px;'
                                                        + ' background:#0f7c67; font-size:24px; color:#FFF;"><a href="http://www.wontah.com">'
                                                        + '</a>Wontah Account Activation</div><div style="padding:24px; font-size:17px;">Hello '+req.body.username+',<br />'
                                                        + '<br />Click the link below to activate your account when ready:<br />'
                                                        + '<br /><a target="_blank" href="http://wontah.com/mail/activate?username='+req.body.username+'&email='+req.body.email+'&pass='+user.password+'">'
                                                        + 'Click here to activate your account now</a><br /><br />Login after successful activation using your:'
                                                        + '<br />* E-mail Address: <b>'+req.body.email+'</b></div></body></html>'
                                                    };
                                                    smtpTransport.sendMail(mailOptions, function(err){
                                                        //if(err){
                                                        //    return res.status(400).json({message: err});
                                                        //}
                                                    });
                                                     var i = 0;
                                                    data.forEach(function (item,index,array) {
                                                        var num = item.numOfUsers + 1;
                                                        Taah.update({name:item.name},{$set:{numOfUsers:num}},function(){
                                                            i++;
                                                            if(i === array.length){
                                                                login(user, req, res);
                                                            }
                                                        })
                                                    });
                                                })
                                            })
                                        })
                                });

                            }
                        })
                }
            })
    });

    router.post('/forgetPass', function(req, res, done){
        User.findOne({email: req.body.email}, function(err, user){
            if(err)
                return res.status(400).json({message: err});
            if(!user){
                return res.status(400).json({message: "This email is not in our system"});
            }else{
                var temppass = req.body.email.substring(0, 4)+""+Math.random().toString(36).substr(2, 5);
                var Nuser = new User();
                var  hashtemppass = Nuser.generateHash(temppass);
                UserOption.update({ username: user.username }, { $set: { temp_pass: hashtemppass } }, { multi: false } , function (err) {
                    if(err)
                        return res.status(400).json({message: err});
                    console.log(user.username);
                    var mailOptions = {
                        from: 'TeamWontah <NoReplies@wontah.com>',
                        to: req.body.email,
                        subject: 'Wontah Temporary Password',
                        html: '<h2>Hello '+user.username+'</h2><p>WONTAH PASSWORD REQUEST RESET'
                        + '</p><p>Note: Password could be modified once logged in.</p>'
                        + '<p>Your temporal password:<br /><b>'+temppass+'</b></p><p><a target="_blank" href="http://wontah.com/mail/forgotpas?username='+user.username+'&pass='+hashtemppass+'">'
                        + 'Click on this link to apply the temporary password shown above to your account.</a></p>'
                        + '<p>If you did not initiate this, please disregard this email. </p>'
                    };
                    smtpTransport.sendMail(mailOptions, function(err){
                        //if(err){
                        //    return res.status(400).json({message: err});
                        //}
                    });
                    return res.json({message: "success"});
                });
            };

        });

    });
    
    router.post('/resendActivation', function (req, res, done) {
        User.findOne({email: req.body.email}, function(err, user) {
            if (err)
                return res.status(400).json({message: err});
            if (!user) {
                return res.status(400).json({message: "This email is not in our system"});
            } else {
                if (user.activated){
                    return res.status(400).json({message: "Your account is activated"});
                }
                var mailOptions = {
                    from: 'TeamWontah <NoReplies@wontah.com>',
                    to: req.body.email,
                    subject: 'Wontah Account Activation',
                    html: '<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Wontah Message</title></head><body'
                    + ' style="margin:0px; font-family:Tahoma, Geneva, sans-serif;"><div style="padding:10px;'
                    + ' background:#0f7c67; font-size:24px; color:#FFF;"><a href="http://www.wontah.com">'
                    + '</a>Wontah Account Activation</div><div style="padding:24px; font-size:17px;">Hello '+user.username+',<br />'
                    + '<br />Click the link below to activate your account when ready:<br />'
                    + '<br /><a target="_blank" href="http://wontah.com/mail/activate?username='+user.username+'&email='+user.email+'&pass='+user.password+'">'
                    + 'Click here to activate your account now</a><br /><br />Login after successful activation using your:'
                    + '<br />* E-mail Address: <b>'+user.email+'</b></div></body></html>'
                };
                smtpTransport.sendMail(mailOptions, function(err){
                    //if(err){
                    //    return res.status(400).json({message: err});
                    //}
                });
                return res.json({message: "success"});
            }
        });
    });

    router.post('/savesuggestions', function (req, res) {
        if(req.body.msg === ""){
            res.status(400).json({message:"You cannot submit a blank message"});
        }else{
            var sug = new Suggestion();
            sug.name = req.body.uname;
            sug.username = req.body.user;
            sug.message = req.body.msg;
            sug.time = new Date();
            sug.save(function (err,su) {
                if(err)
                    res.status(400).json({message:err});
                res.status(200).json({message:'success'});
            })
        }
    });

    function login(user, req, res){
        var ip_info = get_ip(req);
        User.update({ username: user.username }, { $set: { loggedIn: true, ip:ip_info.clientIp,lastlogin: new Date() } }, { multi: false } , function (err) {
            if (err)
                return res.status(400).json({message: err});
            user.loggedIn = true;
            user.lastlogin = new Date();
            user.ip = ip_info.clientIp;
            var token = user.generateJWT();
            // set expiration to 60 days
            var today = new Date();
            var exp = new Date(today);
            exp.setDate(today.getDate() + 60);
            UserOption.update({ username: user.username }, { $set: { token: token, expire:parseInt(exp.getTime() / 1000)} }, { multi: false } , function (err) {
                if(err) return res.status(400).json({message: err});
                return res.json({token:token ,user: user});
            });
        });
    }
};
