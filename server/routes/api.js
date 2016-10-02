/**
 * Created by Aditech on 1/11/2016.
 */

var User = require('../models/users/user'),
    Hall = require('../models/school/halls'),
    UserOption = require('../models/users/userOptions'),
    Department = require('../models/school/departments'),
    Blk = require('../models/users/blockedusers'),
    Frnd = require('../models/users/friends'),
    Pm = require('../models/pm/pm'),
    Notif = require('../models/users/notifications'),
    Tinv = require('../models/taah/taahinvite'),
    fs = require('fs-extra'),
    Status = require('../models/status/status.js'),
    Votes =  require('../models/status/votes.js'),
    path = require('path'),
    easyimg = require('easyimage'),
    uploadPath = path.resolve(__dirname + '/../../static/uploads/'),
    ta = require('time-ago')(),
    dateFormat = require('dateformat'),
    Suggestion = require('../models/misc/suggestions');
    _ = require('underscore');
module.exports = function(router){
    //GET

    router.get('/userInfo/:userprofile', function (req, res) {
        User.findOne({'username': req.params.userprofile}, function (err, user) {
            if(err)
                return res.status(400).json({message: err});
            if (!user || user === null) {
                return res.status(400).json({message: "This user does not exist"});
            } else {
                return res.json(user);
            }
        });
    });

    router.get('/getAllDepts', function(req, res){
        Department.find(function (err, dept) {
            if(err)
                return res.status(400).json({message:err});
            return res.json(dept);
        });
    });

    router.get('/getAllHalls', function(req, res){
        Hall.find(function (err, hall) {
            if(err)
                return res.status(400).json({message:err});
            return res.json(hall);
        })
    });

    router.get('/getSugFrnds/:sch/:username', function(req, res){
        var sFrnds = [],school = JSON.parse(req.params.sch);
        if(school.status && school.ug){
            User.find({'school.ug': true}, function (err, user) {
                if(err)
                    return res.status(400).json({message:err});
                if(Array.isArray(user) && user.length > 0){
                   user.forEach(function (val) {
                       val.school.department.forEach(function (value) {
                           if(isInArray(value, school.department)){
                               if(!isInArray(val, sFrnds)){
                                   sFrnds.push(val);
                               }
                           }
                       })
                   });
                    if(sFrnds.length < 1){
                        user.forEach(function (value) {
                            if(value.school.level === school.level){
                                if(!isInArray(value,sFrnds)){
                                    sFrnds.push(value);
                                }
                            }
                        });
                    }
                    if(sFrnds.length < 1){
                        user.forEach(function (value) {
                            if(value.school.hall === school.hall){
                                if(!isInArray(value,sFrnds)){
                                    sFrnds.push(value);
                                }
                            }
                        });
                    }
                    return res.json({message: sFrnds});
                }else{
                return res.status(400).json({message:"There no University of Ghana students in this system"});
            }
            });
        }else{
            return res.status(400).json({message:'Not a student of Ug'});
        }
    });

    router.get('/getProfileInfo/:username/:logUser', function (req, res) {
        var dptArr = [];
        User.findOne({'username': req.params.username}, function (err, user) {
            if(err)
                return res.status(400).json({message: err});
            if(!user){
                return res.status(400).json({message: "user does not exist"});
            }else{
                UserOption.findOne({'username': req.params.username},{_id:0,backgroud:1,cover_style:1,coverImages:1}
                , function (err, uopt) {
                        if(err)
                            return res.status(400).json({message: err});
                        if(!uopt){
                            return res.status(400).json({message: "user does not exist"});
                        }else{
                            Frnd.find({
                                    $or: [{user1: req.params.username, accepted: true},
                                        {accepted: true, user2: req.params.username}]
                                }, {_id: 1},
                                function (err, fcnt) {
                                    Frnd.findOne({
                                            $or: [{user1: req.params.username,user2: req.params.logUser, accepted: true},
                                                {accepted: true, user2: req.params.username, user1: req.params.logUser}]
                                        }, {_id: 1},
                                        function (err, isFriend) {
                                            Blk.findOne({'blocker': req.params.username, 'blockee': req.params.logUser},
                                                {_id: 1}, function (err, fbu) {
                                                    var isBlocked,frndBlkUser,UserBlkFrnd;
                                                    if (fbu) {
                                                        isBlocked = true;frndBlkUser = true;
                                                    } else {
                                                        isBlocked = false;frndBlkUser = false;
                                                    }
                                                    Blk.findOne({
                                                            'blocker': req.params.logUser,
                                                            'blockee': req.params.username
                                                        },
                                                        {_id: 1}, function (err, ubf) {
                                                            if (ubf) {
                                                                isBlocked = true;UserBlkFrnd = true;
                                                            } else {
                                                                isBlocked = false;UserBlkFrnd = false;
                                                            }
                                                            var friend = (isFriend) ? true : false;
                                                            var website = (user.website) ? user.website : "";
                                                            var bio = (user.bio) ? user.bio : "";
                                                            var contact = (user.contact) ? user.contact : "";
                                                            var cover_style = (uopt.cover_style) ? uopt.cover_style : "";
                                                            var info = {};
                                                            info.id = user._id;
                                                            info.username = user.username;
                                                            info.firstname = user.firstname;
                                                            info.lastname = user.lastname;
                                                            info.email = user.email;
                                                            info.password = user.password;
                                                            info.website = website;
                                                            info.bio = bio;
                                                            info.contact = contact;
                                                            info.gender = user.gender;
                                                            info.avatar = user.avatar;
                                                            info.userlevel = user.userlevel;
                                                            info.ip = user.ip;
                                                            info.signup = dateFormat(user.signup, "dddd, mmmm dS, yyyy");
                                                            info.loggedIn = user.loggedIn;
                                                            info.lastlogin = dateFormat(user.lastlogin, "dddd, mmmm dS, yyyy");
                                                            info.activated = user.activated;
                                                            info.status = user.school.status;
                                                            info.background = uopt.backgroud;
                                                            info.cover_style = cover_style;
                                                            info.coverImages = uopt.coverImages;
                                                            info.fcount = _.size(fcnt);
                                                            info.isFriend = friend;
                                                            info.isBlocked =  isBlocked;
                                                            info.UserBlkFrnd = UserBlkFrnd;
                                                            info.frndBlkUser = frndBlkUser;
                                                            var school = {};
                                                            if (user.school.status === true) {
                                                                if (user.school.ug === true) {
                                                                    Hall.findOne({_id: user.school.hall}, function (err, hall) {
                                                                        if (err)
                                                                            return res.status(400).json({message: err});
                                                                        school.ug = user.school.ug;
                                                                        school.hall = hall.name;
                                                                        school.level = user.school.level;
                                                                        school.name = user.school.name;
                                                                        var itemsProcessed = 0;
                                                                        user.school.department.forEach(function (item, index, array) {
                                                                            Department.findOne({_id: item}, function (err, dpt) {
                                                                                if (err)
                                                                                    return res.status(400).json({message: err});
                                                                                itemsProcessed++;
                                                                                if (dpt) {
                                                                                    dptArr.push(dpt.name);
                                                                                }
                                                                                if(itemsProcessed === array.length) {
                                                                                    school.department = dptArr;
                                                                                    info.school = school;
                                                                                    return res.json(info);
                                                                                }
                                                                            })
                                                                        });
                                                                    });
                                                                } else {
                                                                    school.ug = user.school.ug;
                                                                    school.name = user.school.name;
                                                                    info.school = school;
                                                                    return res.json(info);
                                                                }
                                                            } else {
                                                                return res.json(info);
                                                            }
                                                        });
                                                });
                                        });
                                });
                        }
                    })
            }
        })
    });

    router.get('/getAllUsers', function (req, res) {
        User.find({},{_id:0,username:1,firstname:1,lastname:1,avatar:1,'school.status':1,'school.ug':1},function(err, user){
            if(err)
                return res.status(400).json({message:err});
            if(!user || user === null){
                return res.status(400).json({message: "There is no user in the system"});
            }else{
                return res.json(user);
            }
        });
    });

    router.get('/getRequests/:user', function (req, res) {
        Frnd.find({user2:req.params.user,accepted:false}, function (err, freq) {
            if(err)
                return res.status(400).json({message:err});
            Tinv.find({invitee:req.params.user}, function (err, tinv) {
                if(err)
                    return res.status(400).json({message:err});
                var reqcnt = _.size(freq) + _.size(tinv);
                if(reqcnt > 0){
                    var  farray = [], tarray = [];
                    function taahinv(){
                        if(Array.isArray(tinv) && tinv.length > 0){
                            var itemsProcessed2 = 0;
                            tinv.forEach(function (item2, index2, array2) {
                                User.findOne({'username': item2.invitor},{_id:0,lastname:1,firstname:1,avatar:1}, function (err, tuinfo) {
                                    if(err)
                                        return res.status(400).json({message:err});
                                    itemsProcessed2++;
                                    tarray.push({
                                        uname: item2.invitor,
                                        taah: item2.taah,
                                        fname: tuinfo.firstname,
                                        lname: tuinfo.lastname,
                                        avatar: tuinfo.avatar,
                                        datemade: ta.ago(item2.datemade)
                                    });
                                    var farr = _.uniq(farray),tarr = _ .uniq(tarray);
                                    if(itemsProcessed2 === array2.length){
                                        return res.json({ Request:true, Rcount:reqcnt, person:farr, tinvite:tarr });
                                    }
                                });
                            });
                        }else{
                            return res.json({ Request:true, Rcount:reqcnt, person:farray, tinvite:tarray });
                        }
                    }
                    if(Array.isArray(freq) && freq.length > 0){
                        var itemsProcessed = 0;
                        freq.forEach(function (item, index, array){
                            User.findOne({'username': item.user1},{_id:0, firstname:1,lastname:1,avatar:1}, function (err, uinfo) {
                                if(err)
                                    return res.status(400).json({message:err});
                                itemsProcessed++;
                                farray.push({
                                    uname: item.user1,
                                    fname: uinfo.firstname,
                                    lname: uinfo.lastname,
                                    avatar: uinfo.avatar,
                                    datemade: ta.ago(item.datemade)
                                });
                                if(itemsProcessed === array.length) {
                                    taahinv();
                                }
                            });
                        });
                    }else{
                        taahinv();
                    }
                }else{
                    return res.json({ NoRequest:true, Rcount:reqcnt});
                }
            });
        });
    });

    router.get('/getNofications/:user', function (req, res) {
        User.findOne({username:req.params.user},{_id:0,notescheck:1}, function (err, user) {
            if(err)
                return res.status(400).json({message:err,number:"0"});
            Notif.find({username:req.params.user,did_read:false,date_time:{$gt:user.notescheck}},{_id:1}, function (err,ncount) {
                if(err)
                    return res.status(400).json({message:err,number:"1"});
                var narr = [];
                Notif.find({username:req.params.user,did_read:false},function(err, notes){
                    if(err)
                        return res.status(400).json({message:err,number:"2"});
                    if(notes){
                        if(Array.isArray(notes) && notes.length > 0){
                            var itemsProcessed = 0;
                            notes.forEach(function (item,index,array) {
                                User.findOne({'username': item.initiator},{_id:0,avatar:1}, function (err, uinfo) {
                                    if(err)
                                        return res.status(400).json({message:err,number:"3"});
                                    itemsProcessed++;
                                    narr.push({
                                        nofeid: item._id,
                                        initiator: item.initiator,
                                        type: item.type,
                                        avatar: uinfo.avatar,
                                        app: item.app,
                                        note: item.note,
                                        name: item.name,
                                        date_time: ta.ago(item.date_time)
                                    });
                                    if(itemsProcessed === array.length) {
                                        return res.json({Notication:true,Ncount:_.size(ncount),nfications:narr});
                                    }
                                });
                            });
                        }else{
                            return res.json({Notication:true,Ncount:_.size(ncount),nfications:narr});
                        }
                    }else{
                        return res.json({Notication:true,Ncount:_.size(ncount),nfications:narr});
                    }
                }).sort({date_time:-1});

            });
        });
    });

    router.get('/checkpm/:user', function (req, res) {
        Pm.find({
            $or: [{receiver: req.params.user, parent: 'x',r_unseen:true},
                {sender: req.params.user,parent: 'x', hasreplies: true,s_unseen:true}]},{_id:1}, function (err,pmcount) {
            if (err)
                return res.status(400).json({message: err});
            var msg = _.size(pmcount) !== 0;
            return res.json({msgCount:_.size(pmcount),newMsg:msg})
        });
    });

    router.get('/getfriends/:type/:user/:limit', function(req, res){
        var limit = parseInt(req.params.limit) + 5;
        var allfrnds = [],thfrnds = [];
        Frnd.find({user1: req.params.user, accepted: true},{user2: 1,_id:0}, function (err, user2) {
            if(err)
                return res.status(400).json({frnds: err});
            Frnd.find({user2: req.params.user, accepted: true}, {user1: 1,_id:0}, function (err, user1) {
                if(err)
                    return res.status(400).json({frnds: err});
                if(user2){
                    if(Array.isArray(user2) && user2.length > 0){
                        user2.forEach(function (item) {
                            allfrnds.push(item.user2);
                        });
                    }
                }
                if(user1){
                    if(Array.isArray(user1) && user1.length > 0){
                        user1.forEach(function (item) {
                            allfrnds.push(item.user1);
                        });
                    }
                }
                var arr = [];
                if (allfrnds.length > 0) {
                    var i = 0;
                    allfrnds.forEach(function (item, index, array) {
                        if(req.params.type === "onlyFriends") {
                            User.findOne({username: item}, {
                                _id: 0,
                                avatar: 1,
                                firstname: 1,
                                lastname: 1
                            }, function (err, user) {
                                if (err)
                                    return res.status(400).json({frnds: err});
                                i++;
                                if(user){
                                    arr.push({
                                        username: item,
                                        avatar: user.avatar,
                                        firstname: user.firstname,
                                        lastname: user.lastname
                                    });
                                }
                                if (i === array.length) {
                                    return res.json({frnds: arr, limit: limit, length: allfrnds.length})
                                }
                            });
                        }
                        else if(req.params.type === "frFriends"){
                            Frnd.find({user1: item, accepted: true},{user2: 1,_id:0}, function (err, muser2) {
                                if (err)
                                    return res.status(400).json({frnds: err});
                                Frnd.find({user2: item, accepted: true}, {user1: 1, _id: 0}, function (err, muser1) {
                                    i++;
                                    if (err)
                                        return res.status(400).json({frnds: err});
                                    if (Array.isArray(muser2) && user2.length > 0) {
                                        muser2.forEach(function (item) {
                                            if(item.user2 !== req.params.user){
                                                thfrnds.push(item.user2);
                                            }
                                        });
                                    }
                                    if (Array.isArray(muser1) && muser1.length > 0) {
                                        muser1.forEach(function (item) {
                                            if(item.user1 !== req.params.user){
                                                thfrnds.push(item.user1);
                                            }
                                        });
                                    }
                                    if (i === array.length) {
                                        var thfrnds2 = _.difference(_.uniq(thfrnds), allfrnds);
                                        if (thfrnds2.length > 0) {
                                            var m = 0;
                                            var marr = [];
                                            thfrnds2.forEach(function (it, ind, ar) {
                                                User.findOne({username: it}, {
                                                    _id: 0,
                                                    avatar: 1,
                                                    firstname: 1,
                                                    lastname: 1
                                                }, function (err, user) {
                                                    if (err)
                                                        return res.status(400).json({frnds: err});
                                                    m++;
                                                    if(user){
                                                        marr.push({
                                                            username: it,
                                                            avatar: user.avatar,
                                                            firstname: user.firstname,
                                                            lastname: user.lastname
                                                        });
                                                    }
                                                    if (m === ar.length) {
                                                        return res.json({frnds: marr, limit: limit, length: allfrnds.length})
                                                    }
                                                });
                                            });
                                        }
                                    }
                                })
                            })
                        }
                        else if(req.params.type === "FrOnline"){
                            User.findOne({username: item,loggedIn:true}, {
                                _id: 0,
                                avatar: 1,
                                firstname: 1,
                                lastname: 1
                            }, function (err, user) {
                                if (err)
                                    return res.status(400).json({frnds: err});
                                i++;
                                if(user){
                                    arr.push({
                                        username: item,
                                        avatar: user.avatar,
                                        firstname: user.firstname,
                                        lastname: user.lastname
                                    });
                                }
                                if (i === array.length) {
                                    return res.json({frnds: arr, limit: limit, length: allfrnds.length})
                                }
                            });
                        }
                    })
                } else {
                    return res.status(400).json({length: allfrnds.length, limit: 5});
                }
            }).limit(limit);
        }).limit(limit);

    });

    router.get('/getAllMembers/:user', function (req, res) {
        User.find({username:req.params.user,userlevel:'d'},{_id:1},function(err, user){
            if(err)
                return res.status(400).json({message:err});
            if(user.length > 0){
                User.find({completeprofile:true},function(err, us){
                    if(err)
                        return res.status(400).json({message:err});
                    var i = 0,arr = [];
                    us.forEach(function (u, index,array) {
                        i++;
                        var info = {};
                        info.num = i;
                        info.id = u._id;
                        info.username = u.username;
                        info.firstname = u.firstname;
                        info.lastname = u.lastname;
                        info.gender = u.gender === 'f' ? 'Female' : 'Male';
                        info.email = u.email;
                        info.level = u.userlevel;
                        info.ip = u.ip;
                        info.signup = dateFormat(u.signup, "mmmm dS, yyyy");
                        info.lastlogin = dateFormat(u.lastlogin, "mmmm dS, yyyy");
                        arr.push(info);
                    });
                    return res.json({'total':_.size(us),"members":arr});
                });
            }else{
                return res.status(400).json({message:"notAnAdmin"});
            }
        });
    });

    router.get('/getSuggestions/:user', function (req, res) {
        Suggestion.find(function (err,sug) {
            if(err)
                return res.status(400).json({message:err});
            if(sug.length > 0){
                var arr=[];
                  sug.forEach(function (item) {
                      var sugg = {_id : item._id, name: item.name, username: item.username,message: item.message, time : dateFormat(item.time, "mmmm dS, yyyy"),};
                      arr.push(sugg);
                  });
                return res.json({size:_.size(sug),data:arr})
            }else{
                return res.status(400).json({message:"no suggestions"});
            }
        })
    });

    //POST

    router.post('/completeProfle', function (req, res) {
        User.findOne({username: req.body.user}, function (err, user) {
            if(err)
                return res.status(400).json({message:err});
            user.completeprofile = true;
            var sch = (req.body.sch !== undefined) ? JSON.parse(req.body.sch) : "";
            var per = (req.body.per !== undefined) ? JSON.parse(req.body.per) : "";
            var sug = (req.body.frs !== undefined) ? JSON.parse(req.body.frs) : "";
            var ava = (req.body.ava !== undefined) ? JSON.parse(req.body.ava) : "";
            var AddtoUser = _.extend(user, per);
            AddtoUser.school = sch;
            AddtoUser.save(function (err) {
                if(err)
                    return res.status(400).json({message:err});
                if(sch.ug){
                    var pm = new Pm();
                    pm.parent = "x";
                    pm.receiver = req.body.user;
                    pm.sender = 'TeamWontah';
                    pm.r_unseen = true;
                    pm.senttime = new Date();
                    pm.updatetime = new Date();
                    pm.sdelete =  true;
                    pm.subject = "Wontah Dictionary";
                    pm.message = "<h3>Hello, "+req.body.user+"</h3><p><b>Wontah Dictionary</b></p><p>"+
                        "As a student of University of Ghana, Things can get very interesting for you. you have the right instrument (Wontah Dictionary)"+
                        "which helps you get to know the lady or the guy next door,( you can sort students by departments, by level , by hall of residence and"+
                        " by gender).<em>isn't that exciting!</em></p>"+
                        "<p class='text-center wt-center-content'>Happy Wontahing  #Team Wontah#</p>";
                    pm.save();
                }
                if(sug != "" && sug.length > 0 && Array.isArray(sug)){
                    var i = 0;
                    sug.forEach(function (value,index,array) {
                        if(value != req.body.user) {
                            Blk.findOne({blocker: value, blockee: req.body.user}, {_id: 1}, function (err, fblk) {
                                if (err)
                                    return res.status(400).json({message: err});
                                if (!fblk) {
                                    Blk.findOne({
                                        blocker: req.body.user,
                                        blockee: value
                                    }, {_id: 1}, function (err, ublk) {
                                        if (err)
                                            return res.status(400).json({message: err});
                                        if (!ublk) {
                                            Frnd.findOne({
                                                    $or: [{user1: req.body.user, user2: value},
                                                        {user1: value, user2: req.body.user}]
                                                }, {_id: 1},
                                                function (err, chkfndship) {
                                                    if (err)
                                                        return res.status(400).json({message: err});
                                                    if (!chkfndship || chkfndship === null) {
                                                        var frnds = new Frnd();
                                                        frnds.user1 = req.body.user;
                                                        frnds.user2 = value;
                                                        frnds.datemade = new Date();
                                                        frnds.accepted = false;
                                                        frnds.save(function (err, frnd) {
                                                            i++;
                                                            if(err)
                                                                return res.status(400).json({message: err});
                                                            if(i === array.length){
                                                                avatarSave();
                                                            }
                                                        })
                                                    }
                                                })
                                        }
                                    })
                                }
                            })
                        }
                    });
                }else{
                    avatarSave();
                }
            });
            function avatarSave(){

                if(ava != ""){
                    cropImage(ava.selection,ava.filename,req.body.user,res);
                }else{
                    return res.json({message: "success"});
                }
            }
        });
       // return res.json({message: "success"});
    });

    router.post('/saveCrop', function (req, res) {
        cropImage(req.body.selection,req.body.image,req.body.user,res);
    });

    router.post('/addfriend', function (req, res) {
        if(req.body.username === req.body.logUser) {
            return res.status(400).json({message: "You cannot send your self a request"});
        }else{
            Blk.findOne({blocker: req.body.username, blockee: req.body.logUser}, {_id: 1}, function (err, fblk) {
                if (err)
                    return res.status(400).json({message: err});
                if(fblk){
                    return res.status(400).json({message: req.body.username+" has you blocked, we cannot proceed."});
                }else{
                    Blk.findOne({blocker: req.body.logUser, blockee: req.body.username}, {_id: 1}, function (err, ublk) {
                        if (err)
                            return res.status(400).json({message: err});
                        if(ublk){
                            return res.status(400).json({message: "You must first unblock "+req.body.username+" in order to friend with them."});
                        }else{
                            Frnd.findOne({
                                    $or: [{user1: req.body.username, user2: req.body.logUser, accepted: true},
                                        {user1: req.body.logUser, user2: req.body.user, accepted: true}]
                                }, {_id: 1},
                                function (err, chkfndship) {
                                    if(err)
                                        return res.status(400).json({message: err});
                                    if(chkfndship){
                                        return res.status(400).json({message: "You are already friends with "+req.body.username+"."});
                                    }else{
                                        Frnd.findOne({user1:req.body.username, user2: req.body.logUser},{_id: 1}, function (err, pfship1) {
                                            if(err)
                                                return res.status(400).json({message: err});
                                            if(pfship1){
                                                return res.status(400).json({message: req.body.username+" has requested to friend with you first. Check your friend requests."});
                                            }else{
                                                Frnd.findOne({user1:req.body.logUser, user2: req.body.username},{_id: 1}, function (err, pfship2) {
                                                    if(err)
                                                        return res.status(400).json({message: err});
                                                    if(pfship2){
                                                        return res.status(400).json({message: "You have a pending friend request already sent to "+req.body.username+"."});
                                                    }else{
                                                        var frnds = new Frnd();
                                                        frnds.user1 = req.body.logUser;
                                                        frnds.user2 = req.body.username;
                                                        frnds.datemade = new Date();
                                                        frnds.accepted = false;
                                                        frnds.save(function (err, frnd) {
                                                            if(err)
                                                                return res.status(400).json({message: err});
                                                            return res.json({'message':"request sent"});
                                                        })
                                                    }
                                                });
                                            }
                                        });
                                    }
                                });
                        }
                    });
                }
            });
        }
    });

    router.post('/unfriend', function (req, res) {
        if(req.body.username === req.body.logUser){
            return res.status(400).json({message: "You cannot unfriend your self"});
        }else{
            Frnd.findOne({
                    $or: [{user1: req.body.username, user2: req.body.logUser, accepted: true},
                        {user1: req.body.logUser, user2: req.body.user, accepted: true}]
                }, {_id: 1},
                function (err, chkfndship) {
                    if(err)
                        return res.status(400).json({message: err});
                    if(!chkfndship){
                        return res.status(400).json({message: "No friendship could be found between you and "+ req.body.username+", therefore we cannot unfriend them."});
                    }else{
                        Frnd.remove({
                            $or: [{user1: req.body.username, user2: req.body.logUser, accepted: true},
                                {user1: req.body.logUser, user2: req.body.user, accepted: true}]
                        }, function (err, user) {
                            if(err)
                                return res.status(400).json({message: err});
                            return res.json({'message':"unfriended"});
                        })
                    }
                });
        }
    });

    router.post('/blockuser', function (req, res) {
        if(req.body.username === req.body.logUser){
            return res.status(400).json({message: "You cannot block yourself"});
        }else {
            Blk.findOne({blocker: req.body.logUser, blockee: req.body.username}, {_id: 1}, function (err, ublk) {
                if (err)
                    return res.status(400).json({message: err});
                if (ublk) {
                    return res.status(400).json({message: "You already have this member blocked."});
                }else{
                    var blk = new Blk();
                    blk.blocker = req.body.logUser;
                    blk.blockee = req.body.username;
                    blk.blockdate = new Date();
                    blk.save(function (err) {
                        if(err)
                            return res.status(400).json({message: err});
                        return res.json({message:"blocked"});
                    })
                }
            });
        }
    });

    router.post('/unblockuser', function (req, res) {
        Blk.findOne({blocker: req.body.logUser, blockee: req.body.username}, {_id: 1}, function (err, ublk) {
            if (err)
                return res.status(400).json({message: err});
            if (!ublk) {
                return res.status(400).json({message: "You do not have this user blocked, therefore we cannot unblock them."});
            }else{
                Blk.remove({blocker: req.body.logUser, blockee: req.body.username}, function (err) {
                    if (err)
                        return res.status(400).json({message: err});
                    return res.json({message: "unblocked"});
                });
            }
        });
    });

    router.post('/acceptRequest', function (req, res) {
        User.findOne({username:req.body.username},{_id:1}, function (err, user) {
            if(err) return res.status(400).json({message:err});
            if(!user){
                return res.status(400).json({message:req.body.username+" does not exixt"});
            }else{
                Frnd.findOne({
                        $or: [{user1: req.body.username, user2: req.body.logUser, accepted: true},
                            {user1: req.body.logUser, user2: req.body.user, accepted: true}]
                    }, {_id: 1},
                    function (err, chkfndship) {
                        if (err)
                            return res.status(400).json({message: err});
                        if (chkfndship) {
                            return res.status(400).json({message: "You are already friends with " + req.body.username + "."});
                        } else {
                            Frnd.update({ user1: req.body.username,user2:req.body.logUser, accepted: false }, { $set: { accepted: true } }, { multi: false } , function (err) {
                                if(err)
                                    return res.status(400).json({message: err});
                                var notif = new Notif();
                                notif.username = req.body.username;
                                notif.initiator = req.body.logUser;
                                notif.type = "a";
                                notif.app = req.body.logUser+"  Accepted your request";
                                notif.note = "Take a visit to "+req.body.logUser+"'s room";
                                notif.did_read = false;
                                notif.date_time = new Date();
                                notif.save(function (err) {
                                    if(err)
                                        return res.status(400).json({message: err});
                                    return res.json({message: 'request successfull'});
                                });
                            });
                        }
                    });
            }
        })
    });

    router.post('/ignoreRequest', function (req, res) {
        User.findOne({username:req.body.username},{_id:1}, function (err, user) {
            if (err) return res.status(400).json({message: err});
            if (!user) {
                return res.status(400).json({message: req.body.username + " does not exixt"});
            } else {
                Frnd.remove({user2: req.body.logUser, user1: req.body.username,accepted: false}, function (err) {
                    if (err)
                        return res.status(400).json({message: err});
                    return res.json({message: "rejected"});
                });
            }
        });
    });

    router.post('/markAllAsRead', function (req, res) {
        Notif.update({ username: req.body.user }, { $set: { did_read: true} }, { multi: false } , function (err) {
            if (err)
                return res.status(400).json({message: err});
            User.update({ username: req.body.user }, { $set: {notescheck: new Date() } }, { multi: false } , function (err) {
                if (err)
                    return res.status(400).json({message: err});
                return res.json({message: "updated"});
            });
        });
    });

    router.post('/MarkasRead', function (req, res) {
        Notif.update({ _id: req.body.id }, { $set: { did_read: true} }, { multi: false } , function (err) {
            if (err)
                return res.status(400).json({message: err});
            return res.json({message: "updated"});
        });
    });

    router.post('/updateCheck', function (req, res) {
        User.update({ username: req.body.user }, { $set: {notescheck: new Date() } }, { multi: false } , function (err) {
            if (err)
                return res.status(400).json({message: err});
            return res.json({message: "updated"});
        })
    });

    router.post('/saveTransition', function (req, res) {
        UserOption.update({username:req.body.user},{$set:{cover_style:req.body.type}}, function (err) {
            if(err)
                return res.status(400).json({message: err});
            return res.json({message: "updated",style:req.body.type})
        })
    });

    router.post('/saveCImgs', function (req, res) {
        var images = JSON.parse(req.body.images);var arr=[];
        UserOption.findOne({username:req.body.user},{_id:0,coverImages:1}, function (err, ci) {
            if(err)return res.status(400).json({message: err});
            if(ci.coverImages.length > 0){
                computeImgs(images,ci.coverImages);
            }else{
                computeImgs(images,arr);
            }
        });
        var computeImgs = function (imgs,arr) {
            if(_.size(_.union(imgs,arr)) > 4){
                return res.status(400).json({message: "Images has exceeded the limit required"});
            }
            if(!fs.existsSync(__dirname+"../../../static/user/"+req.body.user+"/cover/")){
                fs.mkdirSync(__dirname+"../../../static/user/"+req.body.user+"/cover/", 766, function(err){
                    if(err){
                        return res.status(400).json({message: err});
                    }
                });
            }
            var i = 0,imgArr = [],b = new RegExp;
            imgs.forEach(function (item,index,array) {
                    var date = new Date;
                    b = /[' "():+]/gi;
                    var n = date.toString().replace(b, "").substring(0, 18)+""+Math.random().toString(36).substr(2, 10);
                    fs.writeFile(__dirname+"../../../static/user/"+req.body.user+"/cover/"+n+".png", item.replace(/^data:image\/png;base64,/, ""), 'base64' , function (err) {
                        console.log(err);
                    });
                imgArr.push(n+".png");
                i++;
                if(i === array.length){
                    var imgArrr = _.union(imgArr,arr);
                    UserOption.update({ username: req.body.user }, { $set: {coverImages: imgArrr } }, { multi: false } , function (err) {
                        if (err)
                            return res.status(400).json({message: err});
                        return res.json({message: "Images saved successfully",images:imgArrr});
                    });
                }
            });
        };
    });

    router.post('/removeimage', function (req, res) {
        if(req.body.image === "coverDefault.jpg"){
            return res.status(400).json({message: "You cannot delete this image"});
        }
        UserOption.findOne({username:req.body.user},{_id:0,coverImages:1}, function (err, ci) {
            if(err)return res.status(400).json({message: err});
            if(ci.coverImages.length > 0){
                var imgs = _.without(ci.coverImages, req.body.image);
                UserOption.update({ username: req.body.user }, { $set: {coverImages: imgs } }, { multi: false } , function (err) {
                    if (err)
                        return res.status(400).json({message: err});
                    return res.json({message: "Image removed successfully",images:imgs});
                });
            }else{
                return res.status(400).json({message: "There is no image to delete"});
            }
        });
    });

    router.post('/addadmin', function (req, res) {
        if(req.body.user === req.body.username){
            res.status(400).json({message:"You cannot add yourself as an admin"});
        }else{
            User.findOne({username:req.body.user,userlevel:'d'},{_id:1}, function (err,user) {
                if(err)
                    res.status(400).json({message:err});
                if(user){
                    User.findOne({username:req.body.username},{_id:1,userlevel:1}, function (err,uname) {
                        if(err)
                            res.status(400).json({message:err});
                        if(uname){
                            if(uname.userlevel === 'd'){
                                res.status(400).json({message:"This user is already an admin"});
                            }else{
                                User.update({username:req.body.username},{$set:{userlevel:'d'}},{multi:false}, function (err,u) {
                                    if(err)
                                        res.status(400).json({message:err});
                                    res.status(200).json({message:"Success"});
                                })
                            }
                        }else{
                            res.status(400).json({message:"This user does not exist"});
                        }
                    })
                }else{
                    res.status(400).json({message:"You are not eligible to add this user as an admin"});
                }
            });
        }
    });

    router.post('/removeadmin', function (req, res) {
        User.findOne({username:req.body.user,userlevel:'d'},{_id:1}, function (err,user) {
            if(err)
                res.status(400).json({message:err});
            if(user){
                console.log(user._id+ ' === ' +req.body.id);
                    User.findOne({_id:req.body.id},{_id:1,userlevel:1,username:1}, function (err,uname) {
                        if(err)
                            res.status(400).json({message:err});
                        if(uname){
                            if(uname.userlevel !== 'd'){
                                res.status(400).json({message:"This user is not an admin"});
                            }else if (req.body.user === uname.username){
                                res.status(400).json({message:"You are not eligible to remove this user as an admin"});
                            }else{
                                User.update({_id:req.body.id},{$set:{userlevel:'a'}},{multi:false}, function (err,u) {
                                    if(err)
                                        res.status(400).json({message:err});
                                    res.status(200).json({message:"Success"});
                                })
                            }
                        }else{
                            res.status(400).json({message:"This user does not exist"});
                        }
                    });
            }else{
                res.status(400).json({message:"You are not eligible to remove this user as an admin"});
            }
        });
    });

    router.post('/deleteuser', function (req, res) {
        User.findOne({username:req.body.user,userlevel:'d'},{_id:1}, function (err,user) {
            if(err)
                res.status(400).json({message:err});
            if(user){
                User.findOne({_id:req.body.id},{_id:1,userlevel:1,username:1}, function (err,uname) {
                    if(err)
                        res.status(400).json({message:err});
                    if(uname){
                        if(uname.userlevel === 'd'){
                            res.status(400).json({message:"This user is an admin"});
                        }else{
                            User.remove({_id:req.body.id}, function (err) {
                                if(err)
                                    res.status(400).json({message:err});
                                UserOption.remove({username:uname.username}, function (err) {
                                    if(err)
                                        res.status(400).json({message:err});
                                    Blk.remove({$or:[{blocker:uname.username},{blockee:uname.username}]}, function (err) {
                                        if(err)
                                            res.status(400).json({message:err});
                                        Frnd.remove({$or:[{user1:uname.username},{user2:uname.username}]}, function (err) {
                                            if(err)
                                                res.status(400).json({message:err});
                                            Notif.remove({$or:[{username:uname.username},{initiator:uname.username}]}, function (err) {
                                                if(err)
                                                    res.status(400).json({message:err});
                                                Pm.remove({$or:[{receiver:uname.username},{sender:uname.username}]}, function (err) {
                                                    if(err)
                                                        res.status(400).json({message:err});
                                                    Status.remove({author:uname.username}, function (err) {
                                                        if(err)
                                                            res.status(400).json({message:err});
                                                        Votes.remove({username:uname.username}, function (err) {
                                                            if(err)
                                                                res.status(400).json({message:err});
                                                            res.status(200).json({message:'success'});
                                                        })
                                                    })
                                                })
                                            })
                                        })
                                    })
                                })
                            })
                        }
                    }else{
                        res.status(400).json({message:"This user does not exist"});
                    }
                })
            }else{
                res.status(400).json({message:"You are not eligible to add this user as an admin"});
            }
        })
    });

    router.post('/checkpass', function (req, res){
        User.findOne({username:req.body.username}, function (err,user) {
            if(err){
                res.status(400).json({message:err,isValid: false});
            }
            if(!user){
                res.status(400).json({isValid: false});
            }else{
                if(!user.validPassword(req.body.password)){
                    res.status(400).json({isValid: false});
                }else{
                    return res.json({isValid: true});
                }
            }
        })
    });

    //GLOBAL FUNCTIONS

    function isInArray(value, array) {
        return array.indexOf(value) > -1;
    }

    function cropImage(selection,image,user,res){
        //[x, y, x2, y2, w, h]
        easyimg.crop({
            src:uploadPath+'/'+image, dst:__dirname+"../../../static/user/"+user+"/"+image,
            x:selection[0], y:selection[1],
            cropwidth:selection[4], cropheight:selection[5],
            gravity:'NorthWest',
            quality: 90
        }).then(
            function() {
                easyimg.resize({
                    src:__dirname+"../../../static/user/"+user+"/"+image, dst:__dirname+"../../../static/user/"+user+"/"+image,
                    width:156,height:156
                }).then(
                    function () {
                        User.update({ username: user }, { $set: {avatar: image } }, { multi: false } , function (err) {
                            if (err)
                                return res.status(400).json({message: err});
                            if(fs.existsSync(uploadPath+'/'+image)){
                                fs.unlink(uploadPath+'/'+image);
                            }
                            return res.json({message: "ImageSuccess",image:image});
                        });
                    },
                    function (err) {
                        return res.status(400).json({message:err});
                    }
                )
            },
            function (err) {
                return res.status(400).json({message:err});
            }
        );
    }
};