/**
 * Created by Aditech on 1/31/2016.
 */
var
    User = require('../models/users/user'),
    UserOption = require('../models/users/userOptions'),
    Taah = require('../models/taah/taahs'),
    Status = require('../models/status/status.js'),
    Votes =  require('../models/status/votes.js'),
    dateFormat = require('dateformat'),
    Blk = require('../models/users/blockedusers'),
    Frnd = require('../models/users/friends'),
    Tinv = require('../models/taah/taahinvite'),
    Notif = require('../models/users/notifications'),
    Subs = require('../models/taah/subscribtions'),
    fs = require('fs-extra'),
    _ = require('underscore');

module.exports = function(router){
    //GET
    router.get('/gettaahbyname/:name/:user', function (req, res) {
        Taah.findOne({name:req.params.name}, function (err, taah) {
            if(err)
                return res.status(400).json({message:err});
            if(taah){
                var moderators,
                    member = false,
                    numOfUsers,
                    restricted,
                    parr,
                    members = [],
                    adarr = [],
                    admin = false,
                    u = "";
                if(taah.type === 'c'){
                    moderators = "";
                    restricted = false;
                    UserOption.findOne({username: req.params.user}, {_id: 0, subscribtions: 1}, function (err, subs) {
                        if (err)
                            return res.status(400).json({message: err});
                        if (subs) {
                            var subarr = [];
                            subs.subscribtions.forEach(function (item) {
                                subarr.push(item.name);
                            });
                            member = (isInArray(req.params.name, subarr)) ? true : false;
                            numOfUsers = taah.numOfUsers;
                            result();
                        }
                    });
                }else{
                    Subs.find({taah:req.params.name,approved:true}, function (err,subsAd) {
                        if (err)
                            return res.status(400).json({message: err});
                        if (subsAd) {
                            numOfUsers = _.size(subsAd);
                            subsAd.forEach(function(item){
                                if(item.admin === true){
                                    adarr.push(item.username);
                                }
                                if(item.username === req.params.user){
                                    u = item.username;
                                }
                            });
                            member = (u!=="");
                            moderators = adarr;
                            admin = (isInArray(req.params.user, adarr))? true :false;
                            if(taah.type === 're'){
                                restricted = true;
                                Subs.find({taah:req.params.name,approved:false},{_id:0,username:1}, function (err,resubs) {
                                    if (err)
                                        return res.status(400).json({message: err});
                                    if(resubs.length > 0){
                                        var num = _.size(resubs);
                                        var i = 0;
                                        resubs.forEach(function(item,index,array){
                                            User.findOne({username:item.username},{_id:0,firstname:1,lastname:1,avatar:1},function(err,user){
                                                i++;
                                                members.push({
                                                    username:item.username,
                                                    firstname:user.firstname,
                                                    lastname:user.lastname,
                                                    avatar:user.avatar
                                                });
                                                if(i === array.length){
                                                    parr = {size:num,members:members};
                                                    result();
                                                }
                                            });
                                        });
                                    }else{
                                        result();
                                    }
                                });
                            }else{
                                restricted = false;
                                result();
                            }
                        }
                    });
                }
                            function result() {
                                return res.json({
                                    id: taah._id,
                                    name: taah.name,
                                    title: taah.title,
                                    Description: taah.Description,
                                    createddate: dateFormat(taah.createddate, "mmmm dS, yyyy"),
                                    creator:moderators,
                                    logo:taah.logo,
                                    numOfUsers: numOfUsers,
                                    type:taah.type,
                                    coption:taah.coption,
                                    member:member,
                                    restricted:restricted,
                                    resInfo:parr,
                                    admin:admin
                                })
                            }

            }else{
                return res.status(400).json({message:"this taah does not exists"});
            }
        });
    });

    router.get('/getAllTaahs/:user', function (req, res) {
        Taah.find({type:{$ne:'pr'}},{_id:0,name:1}, function (err,taahs) {
            if(err)
                return res.status(400).json({message:err});
            if(taahs.length > 0){
                return res.json({taahs:taahs});
            }
        });
    });

    //POST
    router.post('/createTaah', function (req, res) {
        var b = new RegExp; var tname;
        b = /[^a-z0-9_]/gi;
        tname = req.body.taah.taahname.replace(b, "");
        if(tname === ""){
            return res.status(400).json({message:"You must choose a name"});
        }
        if(req.body.taah.taahtitle === ""){
            return res.status(400).json({message:"You must add title"});
        }
        if(req.body.taah.taahtype === ""){
            return res.status(400).json({message:"You must choose a type"});
        }
        if(req.body.taah.coption === ""){
            return res.status(400).json({message:"You must choose a content option"});
        }
        Taah.findOne({name:tname},{_id:1}, function (err,th) {
            if (err)
                return res.status(400).json({message: err});
            if (th) {
                return res.status(400).json({message:"This taah already exists"});
            }else{
                var taah = new Taah();
                taah.name = tname;
                taah.title = req.body.taah.taahtitle;
                taah.Description = req.body.taah.taahdesc;
                taah.type = req.body.taah.taahtype;
                taah.creator = req.body.user;
                taah.coption = req.body.taah.coption;
                taah.createddate = new Date();
                taah.save(function(err, taah){
                    if(err)
                        return res.status(400).json({message: err});
                    var subs = new Subs();
                    subs.taah = req.body.taah.taahname;
                    subs.username = req.body.user;
                    subs.approved = true;
                    subs.admin = true;
                    subs.save(function(err){
                        if(err)
                            return res.status(400).json({message: err});
                        return res.json(taah);
                    })
                });
            }
        });
    });

    router.post('/editTaah', function (req, res) {
        if(req.body.id === ""){
            return res.status(400).json({message:"Unknown Taah(community)"});
        }
        if(req.body.title === ""){
            return res.status(400).json({message:"You must add title"});
        }
        if(req.body.type === ""){
            return res.status(400).json({message:"You must choose a type"});
        }
        if(req.body.coption === ""){
            return res.status(400).json({message:"You must choose a content option"});
        }
        Subs.findOne({username:req.body.user,admin:true},{_id:1},function(err, user){
            if(err)
                return res.status(400).json({message:err});
            if(!user){
                return res.status(400).json({message:"You're not a moderator of this community"});
            }else{
                Taah.findOne({_id:req.body.id},function(err,taah){
                    if(err)
                        return res.status(400).json({message:err});
                    if(!taah){
                        return res.status(400).json({message:"This taah does not exist"});
                    }else{
                        taah.title = req.body.title;
                        taah.type = req.body.type;
                        taah.coption = req.body.coption;
                        taah.Description = req.body.desc;
                        taah.save(function(err,taah){
                           if(err)
                               return res.status(400).json({message:err});
                           return res.json(taah);
                        });

                    }
                });
            }
        });

    });

    router.post('/subscription', function (req, res) {
        Taah.findOne({name:req.body.name},{_id:0,type:1,name:1,numOfUsers:1}, function (err,taah) {
            if(err)
                return res.status(400).json({message:err});
            if(taah){
                if(taah.type === "c"){
                    UserOption.findOne({username:req.body.user},{_id:0,subscribtions:1}, function (err,subs) {
                        if(err)
                            return res.status(400).json({message:err});
                        var arr = [];
                        if(subs) {
                            if (subs.subscribtions.length > 0) {
                                subs.subscribtions.forEach(function (item) {
                                    arr.push(item.name);
                                });
                                if (req.body.status === "subscribe") {
                                    if (isInArray(req.body.name, arr)) {
                                        return res.json({success: false, message: "You've already subscribe to this taah"});
                                    }else{
                                        arr.push(req.body.name);
                                    }
                                }else if(req.body.status === "unsubscribe"){
                                    if (isInArray(req.body.name, arr)) {
                                        var index = arr.indexOf(req.body.name);
                                        arr.splice(index, 1);
                                    }else{
                                        return res.json({success:false,message:"You are not a member of this community."});
                                    }
                                }
                            }else{
                                if (req.body.status === "subscribe") {
                                    arr.push(req.body.name);
                                }else if(req.body.status === "unsubscribe"){
                                    return res.json({success:false,message:"You are not a member of this community"});
                                }
                            }
                        }else{
                            if (req.body.status === "subscribe") {
                                arr.push(req.body.name);
                            }else if(req.body.status === "unsubscribe"){
                                return res.json({success:false,message:"You are not a member of this community"});
                            }
                        }
                        var subscriptions = _.map(arr, function (item) {return {name: item}});
                        UserOption.update({username:req.body.user},{$set:{subscribtions:subscriptions}}, function(err,data){
                            if(err)
                                return res.status(400).json({message:err,err:'1'});
                            var numUsers;
                            if(req.body.status === "subscribe"){
                                numUsers = taah.numOfUsers + 1;
                            }else if(req.body.status === "unsubscribe"){
                                numUsers = taah.numOfUsers - 1;
                            }
                            Taah.update({name:req.body.name},{$set:{numOfUsers:numUsers}}, function (err) {
                                if(err)
                                    return res.status(400).json({message:err,err:'2'});
                                if(req.body.status === "subscribe"){
                                    checktype();
                                }else{
                                    return res.json({success:true,re:false,message:"Success"});
                                }
                            });
                        });
                    });
                }else{
                    Subs.findOne({username:req.body.user,taah:req.body.name},{_id:1}, function (err,sub) {
                        if(err)
                            return res.status(400).json({message:err});
                        if(sub){
                            if(req.body.status === "subscribe") {
                                return res.json({success: false, message: "You've already subscribe to this taah"})
                            }else if(req.body.status === "unsubscribe"){
                                Subs.remove({username:req.body.user,taah:req.body.name},function(err){
                                    if(err)
                                        return res.status(400).json({message:err});
                                    return res.json({success:true,message:"Success"});
                                });
                            }
                        }else{
                            if(req.body.status === "subscribe") {
                                var subs = new Subs();
                                subs.username = req.body.user;
                                subs.admin = false;
                                subs.taah = req.body.name;
                                subs.approved = (taah.type!=="re");
                                subs.save(function(err){
                                    if(err)
                                        return res.status(400).json({message:err});
                                    checktype();
                                });
                            }else if(req.body.status === "unsubscribe"){
                                return res.json({success:false,message:"You are not a member of this community"});
                            }
                        }
                    });
                }
                //CHECK IF TAAH IS FROM A FRIEND
                function checktype(){
                    if(req.body.type === "ffriend"){
                        Tinv.remove({invitee:req.body.user,taah:req.body.name}, function (err) {
                            if(err)
                                return res.status(400).json({message:err});
                            checkre();
                        })
                    }else{
                        checkre();
                    }
                }
                //CHECK IF TAAH IS RESTRICTED
               function checkre(){
                   if(taah.type === "re"){
                       return res.json({success:true,re:true,message:"Success"});
                   }else{
                       return res.json({success:true,re:false,message:"Success"});
                   }
               }
            }else{
                return res.status(400).json({message:"This taah does not exist"});
            }
        });
    });

    router.post('/InviteFrnds', function (req, res) {
        var frnds = JSON.parse(req.body.frnds);
        if(frnds.length === 0){
            return res.status(400).json({message:"You've not selected anyone"});
        }
        frnds.push('$$$');
        Taah.findOne({name:req.body.taah},{_id:0,type:1,name:1}, function (err,taah) {
            var i = 0;
            frnds.forEach(function (u,index, array) {
                User.findOne({username:u},{_id:0},function(err,us){
                    if(err)
                        return res.status(400).json({message:err});
                    if(us) {
                        Blk.findOne({
                            $or: [{blocker: u, blockee: req.body.user},
                                {blocker: req.body.user, blockee: u}]
                        }, {_id: 1}, function (err, blk) {
                            if (err)
                                return res.status(400).json({message: err});
                            if (!blk) {
                                Tinv.findOne({
                                    invitor: req.body.user,
                                    invitee: u,
                                    taah: req.body.taah
                                }, {_id: 1}, function (err, ivt) {
                                    if (err)
                                        return res.status(400).json({message: err});
                                    if (!ivt) {
                                        function saveTaahInv() {
                                            i++;
                                            var tinv = new Tinv();
                                            tinv.invitor = req.body.user;
                                            tinv.invitee = u;
                                            tinv.taah = req.body.taah;
                                            tinv.datemade = new Date();
                                            tinv.save();
                                            if (i === array.length) {
                                                return res.status(200).json({message: "Invitation was send successfully"});
                                            }
                                        }
                                        if (taah.type === 'c') {
                                            var tarr = [];
                                            UserOption.findOne({username: u}, {
                                                _id: 0,
                                                subscribtions: 1
                                            }, function (err, subs) {
                                                if (err)
                                                    return res.status(400).json({message: err});
                                                if (subs) {
                                                    subs.subscribtions.forEach(function (item) {
                                                        tarr.push(item.name);
                                                    });
                                                    if (!isInArray(req.body.taah, tarr)) {
                                                        saveTaahInv();
                                                    }
                                                }
                                            });
                                        } else {
                                            Subs.findOne({
                                                username: u,
                                                taah: req.body.taah
                                            }, {_id: 1}, function (err, subs) {
                                                if (err)
                                                    return res.status(400).json({message: err});
                                                if (!subs) {
                                                    saveTaahInv();
                                                }
                                            })
                                        }
                                    }
                                });
                            }
                        });
                    }
                });
            });
            return res.status(200).json({message:"success."});
        });
    });

    router.post('/InviteFrnd', function (req, res) {
        var taahs = JSON.parse(req.body.taahs);
        if(taahs.length === 0){
            return res.status(400).json({message:"You've not selected any taah"});
        }
        taahs.push('$$$');
        Blk.findOne({blocker: req.body.frnd, blockee: req.body.user}, {_id: 1}, function (err, fblk) {
            if (err)
                return res.status(400).json({message: err});
            if (fblk) {
                return res.status(400).json({message: req.body.frnd + " has you blocked, we cannot proceed."});
            }else{
                Blk.findOne({blocker: req.body.user, blockee: req.body.frnd}, {_id: 1}, function (err, ublk) {
                    if (err)
                        return res.status(400).json({message: err});
                    if (ublk) {
                        return res.status(400).json({message: "You must first unblock " + req.body.frnd + " in order to invite them."});
                    }else{
                        var i = 0;
                        taahs.forEach(function(t,index,array){
                            Taah.findOne({name:t},{_id:0,type:1,name:1}, function (err,taah) {
                                if(err)
                                    return res.status(400).json({message: err});
                                if(taah) {
                                    Tinv.findOne({
                                        invitor: req.body.user,
                                        invitee: req.body.frnd,
                                        taah: t
                                    }, {_id: 1}, function (err, ivt) {
                                        if (err)
                                            return res.status(400).json({message: err});
                                        if (!ivt) {
                                            function saveTaahInv() {
                                                i++;
                                                var tinv = new Tinv();
                                                tinv.invitor = req.body.user;
                                                tinv.invitee = req.body.frnd;
                                                tinv.taah = t;
                                                tinv.datemade = new Date();
                                                tinv.save();
                                                if (i === array.length) {
                                                    return res.status(200).json({message: "Invitation was send successfully"});
                                                }
                                            }

                                            if (taah.type === 'c') {
                                                var tarr = [];
                                                UserOption.findOne({username: req.body.frnd}, {
                                                    _id: 0,
                                                    subscribtions: 1
                                                }, function (err, subs) {
                                                    if (err)
                                                        return res.status(400).json({message: err});
                                                    if (subs) {
                                                        subs.subscribtions.forEach(function (item) {
                                                            tarr.push(item.name);
                                                        });
                                                        if (!isInArray(t, tarr)) {
                                                            saveTaahInv();
                                                        }
                                                    }
                                                });
                                            } else {
                                                Subs.findOne({
                                                    username: req.body.frnd,
                                                    taah: t
                                                }, {_id: 1}, function (err, subs) {
                                                    if (err)
                                                        return res.status(400).json({message: err});
                                                    if (!subs) {
                                                        saveTaahInv();
                                                    }
                                                })
                                            }
                                        }
                                    });
                                }
                            });
                        });
                        return res.status(200).json({message:"success."});
                    }
                });
            }
        });
    });

    router.post('/ignoreTaahRequest', function (req, res) {
        Tinv.remove({invitee:req.body.user,taah:req.body.taah}, function (err) {
            if(err)
                return res.status(400).json({message:err});
            return res.json({success:true,message:"Success"});
        })
    });

    router.post('/acceptSub', function (req, res) {
        Subs.findOne({taah:req.body.taah,username:req.body.user}, function (err,subs) {
            if(err)
                return res.status(400).json({message:err});
            subs.approved = true;
            subs.save(function (err) {
                if(err)
                    return res.status(400).json({message:err});
                return res.json({success:true,message:"Success"});
            });
        })
    });

    router.post('/ignoreSub', function (req, res) {
        Subs.remove({taah:req.body.taah,username:req.body.user}, function (err) {
            if(err)
                return res.status(400).json({message:err});
            return res.json({success:true,message:"Success"});
        })
    });
    //GLOBAL FUNCTIONS
    function isInArray(value, array) {
        return array.indexOf(value) > -1;
    }
};