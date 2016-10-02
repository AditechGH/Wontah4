/**
 * Created by Aditech on 1/27/2016.
 */
var
    User = require('../models/users/user'),
    UserOption = require('../models/users/userOptions'),
    Taah = require('../models/taah/taahs'),
    Status = require('../models/status/status.js'),
    Votes =  require('../models/status/votes.js'),
    Frnd = require('../models/users/friends'),
    Notif = require('../models/users/notifications'),
    Subs = require('../models/taah/subscribtions'),
    ta = require('time-ago')(),
    fs = require('fs-extra'),
    _ = require('underscore'),
    oembed=require("oembed-auto"),
    MetaInspector = require('node-metainspector'),
    decay = require('decay'),
    comment = decay.comments(),
    hotScore = decay.rHot();
module.exports = function(router){
    // GET
    router.get('/getutaahs/:user', function (req, res) {
        UserOption.findOne({username:req.params.user},{_id:0,subscribtions:1}, function (err, subs) {
            if(err)
                return res.status(400).json({message:err});
            Subs.find({username:req.params.user},{_id:0,taah:1}, function (err, subs1) {
                if(err)
                    return res.status(400).json({message:err});
                if(!subs1){
                    return res.json(subs);
                }else{
                    var arr = [];
                    subs.subscribtions.forEach(function (item) {
                        arr.push(item);
                    });
                    subs1.forEach(function (item) {
                        arr.push({name:item.taah});
                    });
                    return res.json({subscribtions:_.uniq(arr)});
                }
            });
        });
    });

    router.get('/getsubmissions/:type/:limit/:user/:v/:name', function (req, res) {
        var limit = parseInt(req.params.limit) + 5;

        var execute = function(item,what,size){
            var darr = [],saved;
            var i = 0;
            item.forEach(function(item22,index, array){
                Status.findOne({_id:item22._id}, function (err, data) {
                    if(err)
                        return res.status(400).json({message:err,isError:true});
                    Status.find({osid:data._id},{_id:1}, function (err, stat) {
                        if(err)
                            return res.status(400).json({message:err,isError:true});
                        Votes.findOne({mid:data._id,username:req.params.user},function(err,voted){
                            if(err)
                                return res.status(400).json({message:err,isError:true});
                            var userVoted = (voted) ? true : false;
                            if(userVoted){
                                var voteStatus = voted.vote;
                            }
                            UserOption.findOne({username: req.params.user},{_id:0,savedSubs:1}, function (err,ss) {
                                if(err)
                                    return res.status(400).json({message:err,isError:true});
                                if(ss.savedSubs.length > 0){
                                    saved = (isInArray(data._id, ss.savedSubs));
                                }else {
                                    saved = false;
                                }
                                User.findOne({username: req.params.user}, {_id:0,avatar:1}, function (err, user) {
                                    if(err)
                                        return res.status(400).json({message:err,isError:true});
                                    i++;
                                   var arr = {};
                                    arr.id= data._id;
                                    arr.osid= data.osid;
                                        arr.author= data.author;
                                        arr.anonymous= data.anonymous;
                                        arr.type= data.type;
                                        arr.ptype= data.ptype;
                                        arr.title= data.title;
                                        arr.data= data.data;
                                        arr.link= data.link;
                                        arr.taah= data.taah;
                                        arr.up= data.up;
                                        arr.down= data.down;
                                        arr.postdate= ta.ago(data.postdate);
                                        arr.avatar= user.avatar;
                                        arr.thumb= data.imgUrl;
                                        arr.userVoted= userVoted;
                                        arr.voteStatus= voteStatus;
                                        arr.saved= saved;
                                        arr.comments=  _.size(stat) - 1;
                                        arr.what= what;
                                        arr.score= data.score;
                                        arr.cont = data.cont;
                                        arr.diff = data.diff;
                                        darr.push(arr);
                                    if(i === array.length){
                                        return res.json({isError:false,data:darr,limit:limit,size:size});
                                    }
                                });
                            });
                        })
                    });
                });
            });

        };
        UserOption.findOne({username:req.params.user},{_id:0,subscribtions:1}, function (err, subs) {
            Subs.find({username:req.params.user},{_id:0,taah:1}, function (err, subs1) {
                var tarr = [];
                if(subs !== null){
                    subs.subscribtions.forEach(function (item) {
                        tarr.push(item.name);
                    });
                }
                subs1.forEach(function (item) {
                    tarr.push(item.taah);
                });
                Status.find({taah: {$in: tarr}}, {_id: 1}, function (err, num) {
                    if (err)
                        return res.status(400).json({message: err, isError: true});
                    var endDate = new Date();
                    var startDate = new Date(endDate - 24 * 60 * 60 * 1000);
                    //ALL HOT
                    if (req.params.type === "getAllHot") {
                        Status.find({type: 'a', taah: {$in: tarr}},{_id:1,score:1}, function (err, data) {
                            if (err)
                                return res.status(400).json({message: err, isError: true});
                            if (data.length > 0) {
                                execute(_.first(_.sortBy(data, data.score), limit), "h", _.size(num));
                            } else {
                                return res.status(400).json({isError: true});
                            }
                        });
                    }
                    //ALL NEW
                    if (req.params.type === "getAllNew") {
                        Status.find({type: 'a', taah: {$in: tarr}},{_id:1,postdate:1}, function (err, data) {
                            if (err)
                                return res.status(400).json({message: err, isError: true});
                            if (data.length > 0) {
                                execute(data, "n", _.size(num));
                            } else {
                                return res.status(400).json({isError: true});
                            }
                        }).sort({postdate: -1, limit:limit});
                    }
                    //ALL CONTROVERSY
                    if (req.params.type === "getAllCon") {
                        startDate = filterTime(startDate, endDate, req.params.v);
                        Status.find({type: 'a', taah: {$in: tarr}, postdate: {$gte: startDate, $lt: endDate}},{_id:1,cont:1}
                            , function (err, data) {
                                if (err)
                                    return res.status(400).json({message: err, isError: true});
                                if (data.length > 0) {
                                    execute(_.first(_.sortBy(data, data.cont), limit), "c", _.size(num));
                                } else {
                                    return res.status(400).json({message: err, isError: true});
                                }
                            });
                    }
                    //ALL TOP
                    if (req.params.type === "getAllTop") {
                        startDate = filterTime(startDate, endDate, req.params.v);
                        Status.find({type: 'a', taah: {$in: tarr}, postdate: {$gte: startDate, $lt: endDate}},{_id:1,diff:1}, function (err, data) {
                                if (err)
                                    return res.status(400).json({message: err, isError: true});
                                if (data.length > 0) {
                                    execute(_.first(_.sortBy(data, data.diff), limit), "t", _.size(num));
                                } else {
                                    return res.status(400).json({isError: true});
                                }
                            });
                    }
                    //ALL TAAH HOT
                    if (req.params.type === "getTaahHot") {
                        Status.find({type: 'a', taah: req.params.name},{_id:1,score:1}, function (err, data) {
                            if (err) {
                                return res.status(400).json({message: err, isError: true});
                            }
                            if (data.length > 0) {
                                execute(_.first(_.sortBy(data, data.score), limit), "h", _.size(num));
                            } else {
                                return res.status(400).json({isError: true});
                            }
                        });

                    }
                    //ALL TAAH NEW
                    if (req.params.type === "getTaahNew") {
                        Status.find({type: 'a', taah: req.params.name},{_id:1,postdate:1}, function (err, data) {
                            if (err)
                                return res.status(400).json({message: err, isError: true});
                            if (data.length > 0) {
                                execute(data, "n", _.size(num));
                            } else {
                                return res.status(400).json({isError: true});
                            }
                        }).sort({postdate: -1, limit:limit});;
                    }
                    //ALL TAAH CONTROVERSY
                    if (req.params.type === "getTaahCon") {
                        startDate = filterTime(startDate, endDate, req.params.v);
                        Status.find({type: 'a', taah: req.params.name, postdate: {$gte: startDate, $lt: endDate}},{_id:1,cont:1},
                            function (err, data) {
                                if (err)
                                    return res.status(400).json({message: err, isError: true});
                                if (data.length > 0) {
                                    execute(_.first(_.sortBy(data, data.cont), limit), "c", _.size(num));
                                } else {
                                    return res.status(400).json({message: err, isError: true});
                                }
                            });
                    }
                    //ALL TAAH TOP
                    if (req.params.type === "getTaahTop") {
                        startDate = filterTime(startDate, endDate, req.params.v);
                        Status.find({type: 'a', taah: req.params.name, postdate: {$gte: startDate, $lt: endDate}},{_id:1,diff:1},
                             function (err, data) {
                                if (err)
                                    return res.status(400).json({message: err, isError: true});
                                if (data.length > 0) {
                                    execute(_.first(_.sortBy(data, data.diff), limit), "t", _.size(num));
                                } else {
                                    return res.status(400).json({isError: true});
                                }
                            });
                    }
                    //ALL USER HOT
                    if (req.params.type === "getUserHot") {
                        Status.find({type: 'a', author: req.params.name},{_id:1,score:1}, function (err, data) {
                            if (err)
                                return res.status(400).json({message: err, isError: true});
                            if (data.length > 0) {
                                execute(_.first(_.sortBy(data, data.score), limit), "h", _.size(num));
                            } else {
                                return res.status(400).json({isError: true});
                            }
                        });

                    }
                    //ALL USER NEW
                    if (req.params.type === "getUserNew") {
                        Status.find({type: 'a', author: req.params.name},{_id:1,postdate:1}, function (err, data) {
                            if (err)
                                return res.status(400).json({message: err, isError: true});
                            if (data.length > 0) {
                                execute(data, "n", _.size(num));
                            } else {
                                return res.status(400).json({isError: true});
                            }
                        }).sort({postdate: -1, limit:limit});
                    }
                    //ALL USER CONTROVERSY
                    if (req.params.type === "getUserCon") {
                        startDate = filterTime(startDate, endDate, req.params.v);
                        Status.find({type: 'a', author: req.params.name, postdate: {$gte: startDate, $lt: endDate}},{_id:1,cont:1},
                             function (err, data) {
                                if (err)
                                    return res.status(400).json({message: err, isError: true});
                                if (data.length > 0) {
                                    execute(_.first(_.sortBy(data, data.cont),limit), "c", _.size(num));
                                } else {
                                    return res.status(400).json({message: err, isError: true});
                                }
                            });
                    }
                    //ALL USER TOP
                    if (req.params.type === "getUserTop") {
                        startDate = filterTime(startDate, endDate, req.params.v);
                        Status.find({type: 'a', author: req.params.name, postdate: {$gte: startDate, $lt: endDate}},{_id:1,diff:1},
                            function (err, data) {
                                if (err)
                                    return res.status(400).json({message: err, isError: true});
                                if (data.length > 0) {
                                    execute(_.first(_.sortBy(data, data.diff),limit), "t", _.size(num));
                                } else {
                                    return res.status(400).json({isError: true});
                                }
                            });
                    }
                    //ALL USER SAVED
                    if (req.params.type === "getUserSaved") {
                        UserOption.findOne({username: req.params.user}, {_id: 0, savedSubs: 1}, function (err, saved) {
                            if (err)
                                return res.status(400).json({message: err, isError: true});
                            if (saved) {
                                if (saved.savedSubs.length > 0){
                                    var arr = [];
                                    var i = 0;
                                    saved.savedSubs.forEach(function (item, index, array) {
                                        Status.findOne({_id: item},{_id:1},function (err, data) {
                                            i++;
                                            if (err)
                                                return res.status(400).json({message: err, isError: true});
                                            if(data !== null && data !== undefined){
                                                arr.push(data);
                                            }
                                            if (i === array.length) {
                                                if (arr.length > 0) {
                                                    execute(arr, "s", _.size(arr));
                                                } else {
                                                    return res.status(400).json({ isError: true});
                                                }
                                            }
                                        });
                                    })
                                }else{
                                    return res.status(400).json({ isError: true});
                                }
                            }else{
                                return res.status(400).json({ isError: true});
                            }
                        });
                    }
                });
            });
        });
    });

    router.get('/getSubmission/:id/:user', function (req, res) {
        Status.findOne({_id:req.params.id}, function (err,data) {
            Status.find({osid:req.params.id},{_id:1}, function (err, stat) {
                Votes.findOne({mid:req.params.id,username:req.params.user},function(err,voted){
                    var userVoted = (voted) ? true : false;
                    if(userVoted){
                        var voteStatus = voted.vote;
                    }
                    UserOption.findOne({username: req.params.user},{_id:0,savedSubs:1}, function (err,ss) {
                        var saved;
                        if(ss.savedSubs.length > 0){
                            saved = isInArray(req.params.id, ss.savedSubs);
                        }else {
                              saved = false;
                        }
                        User.findOne({username: req.params.user}, {_id:0,avatar:1}, function (err, user) {
                            return res.json({
                                id: req.params.id,
                                osid: data.osid,
                                author: data.author,
                                anonymous: data.anonymous,
                                type: data.type,
                                ptype: data.ptype,
                                title: data.title,
                                data: data.data,
                                link: data.link,
                                taah: data.taah,
                                up: data.up,
                                down: data.down,
                                postdate: ta.ago(data.postdate),
                                avatar: user.avatar,
                                thumb: data.imgUrl,
                                userVoted: userVoted,
                                voteStatus: voteStatus,
                                saved: saved,
                                comments:  _.size(stat) - 1
                            });
                        });
                    });
                })
            });
        });
    });

    router.get('/getcomments/:id/:user', function (req, res) {
        Status.findOne({_id:req.params.id},{_id:1}, function (err,status) {
            if (err)
                return res.status(400).json({message: err});
            Status.find({osid: status._id, type: 'b'}, function (err, reps) {
                if (err)
                    return res.status(400).json({message: err});
                if (reps) {
                    var i = 0;
                    var arr = [];
                    reps.forEach(function (item, index, array) {
                        User.findOne({username: item.author}, {_id: 0, avatar: 1}, function (err, user) {
                            if (err)
                                return res.status(400).json({message: err});
                            Votes.findOne({mid: item._id, username: item.author}, function (err, voted) {
                                i++;
                                var userVoted = (voted) ? true : false;
                                if (userVoted) {
                                    var voteStatus = voted.vote;
                                }
                                arr.push({
                                    id: item._id,
                                    osid: item.osid,
                                    chid: item.chid,
                                    author: item.author,
                                    anonymous: item.anonymous,
                                    type: item.type,
                                    ptype: item.ptype,
                                    data: item.data,
                                    up: item.up, down: item.down,
                                    postdate: ta.ago(item.postdate),
                                    avatar: user.avatar,
                                    voteStatus: voteStatus,
                                    userVoted: userVoted,
                                    childs: []
                                });
                                if (i === array.length) {
                                    var comments = [];
                                    arr.forEach(function (val) {
                                        if(val.ptype === "mrep"){
                                            comments.push(val);
                                        }
                                    });
                                    comments.forEach(function (item) {
                                        if(item.osid !== item.chid){

                                        }
                                    });
                                    return res.json(comments);
                                }
                            });
                        });
                    });
                }
            });
        })
    });
    //POST
    router.post('/submitSub', function (req, res) {
        if(req.body.post.title === "" || req.body.post.title === undefined){
            return res.status(400).json({message:"Provide a title"});
        }
        if(req.body.taah === "" || req.body.taah === undefined){
            return res.status(400).json({message:"Choose a taah to post on"});
        }
        if(req.body.type === 'link'){
            if(req.body.post.linkinput === "" || req.body.post.linkinput === undefined){
                return res.status(400).json({message:"You must add a link"});
            }
        }
        Taah.findOne({name: req.body.taah},{_id:0,coption:1}, function (err, taah) {
            if(err)
                return res.status(400).json({message:err});
            if(!taah){
                return res.status(400).json({message:"This taah("+req.body.taah+") does not exist"});
            }else{
                if(req.body.type === 'link'){
                    if(taah.coption === 't'){
                        return res.status(400).json({message:"You can only submit texts in this community"});
                    }
                }
                if(req.body.type === 'text'){
                    if(taah.coption === 'l'){
                        return res.status(400).json({message:"You can only submit links in this community"});
                    }
                }
                UserOption.findOne({username:req.body.user},{_id:0,subscribtions:1}, function (err, subs) {
                    if(err)
                        return res.status(400).json({message:err});
                    var usubs = subs.subscribtions;
                    var subarr = [];
                    if(usubs.length > 0){
                        usubs.forEach(function (item) {
                            subarr.push(item.name);
                        });
                        if(!isInArray(req.body.taah, subarr)){
                            Subs.findOne({username:req.body.user,taah:req.body.taah}, function (err,sub) {
                                if(err)
                                    return res.status(400).json({message:err});
                                if(!sub){
                                    return res.status(400).json({message:"You have not subscribed to this taah("+req.body.taah+"), subscribe to it first"});
                                }else{
                                    execMain();
                                }
                            });
                        }else{
                            execMain();
                        }
                        function execute(img){
                            var status = new Status();
                            status.author = req.body.user;
                            status.anonymous = req.body.post.anonymous;
                            status.type = "a";
                            status.ptype = req.body.type;
                            status.title = req.body.post.title;
                            status.data = req.body.post.textinput;
                            status.link = req.body.post.linkinput;
                            status.imgUrl = img;
                            status.taah = req.body.taah;
                            status.up = 1;
                            status.down = 0;
                            status.postdate = new Date();
                            status.updated = new Date();
                            status.score = hotScore(status.up, status.down, status.postdate);
                            status.cont = controversy(status.up, status.down);
                            status.diff = difference(status.up, status.down);
                            status.save(function (err,status) {
                                if(err)
                                    return res.status(400).json({message:err});
                                Status.update({ _id: status._id }, { $set: { osid: status._id, chid: status._id } }, { multi: false } , function (err) {
                                    if(err)
                                        return res.status(400).json({message:err});
                                    var votes = new Votes();
                                    votes.mid = status._id;
                                    votes.username = req.body.user;
                                    votes.vote = true;
                                    votes.save(function (err) {
                                        if(err)
                                            return res.status(400).json({message:err});
                                        if(!req.body.post.anonymous) {
                                            Frnd.findOne({$or:[{user1:req.body.user,accepted: true},{user2:req.body.user,accepted: true}]},{_id:1}, function (err, hasF) {
                                                if(err)
                                                    return res.status(400).json({frnds: err});
                                                if(hasF){
                                                    var allfrnds = [];
                                                    Frnd.find({user1: req.body.user, accepted: true},{user2: 1,_id:0}, function (err, user2) {
                                                        if (err)
                                                            return res.status(400).json({frnds: err});
                                                        Frnd.find({user2: req.body.user, accepted: true}, {user1: 1, _id: 0}, function (err, user1) {
                                                            if (err)
                                                                return res.status(400).json({frnds: err});
                                                            if (user2) {
                                                                if (Array.isArray(user2) && user2.length > 0) {
                                                                    user2.forEach(function (item) {
                                                                        allfrnds.push(item.user2);
                                                                    });
                                                                }
                                                            }
                                                            if (user1) {
                                                                if (Array.isArray(user1) && user1.length > 0) {
                                                                    user1.forEach(function (item) {
                                                                        allfrnds.push(item.user1);
                                                                    });
                                                                }
                                                            }
                                                            var notif = new Notif();
                                                            var i = 0;
                                                            notif.initiator = req.body.user;
                                                            notif.type = "s";
                                                            notif.app = req.body.user + " made a submission";
                                                            notif.note = req.body.post.title;
                                                            notif.did_read = false;
                                                            notif.name = req.body.taah;
                                                            notif.date_time = new Date();
                                                            allfrnds.forEach(function (item, index, array) {
                                                                notif.username = item;
                                                                notif.save(function (err) {
                                                                    i++;
                                                                    if (i === array.length) {
                                                                        console.log("success");
                                                                        return res.json({message: "success"});
                                                                    }
                                                                });
                                                            });
                                                        });
                                                    });
                                                }else{
                                                    return res.json({message: "success"});
                                                }
                                            });
                                        }else{
                                            return res.json({message: "success"});
                                        }
                                    });
                                });
                            })
                        }
                        function execMain(){
                            if(req.body.type === 'link'){
                                oembed(req.body.post.linkinput, function (err, result) {
                                    if(err){
                                        imgurl = "";
                                        var client = new MetaInspector(req.body.post.linkinput, { timeout: 5000 });
                                        client.on("fetch", function(){
                                            if(client.image !== undefined || client.image !== ""){
                                                imgurl = client.image;
                                            }else{
                                                imgurl = "";
                                            }
                                            execute(imgurl);
                                        });
                                        client.on("error", function(err){
                                            imgurl = "";
                                            execute(imgurl);
                                        });
                                        client.fetch();
                                    }else{
                                        if(result.thumbnail_url !== undefined || result.thumbnail_url !== ""){
                                            imgurl = result.thumbnail_url;
                                        }else{
                                            imgurl = result;
                                        }
                                        execute(imgurl)
                                    }
                                })
                            }
                            if(req.body.type === 'text'){
                                var imgurl = "";
                                execute(imgurl);
                            }
                        }
                    }else{
                        return res.status(400).json({message:"You have not subscribed to any taah, so you cannot make a submission"});
                    }
                });
            }
        })
    });

    router.post('/submitReplySub', function (req, res) {
        if(req.body.id === ""){
            return res.status(400).json({message: "submission does not exist"});
        }
        if(req.body.post.text === ""){
            return res.status(400).json({message: "type in something to reply"});
        }
        Status.find({osid:req.params.id,type:'b'}, function (err, status) {
            if(err)
                return res.status(400).json({message: err});
            var loopThrough = function (main,item,chid,id,post) {
                if(item._id === chid){
                    item.childs.push({
                        osid:id,
                        chid:chid,
                        author:req.body.user,
                        anonymous:post.anonymous,
                        type:"b",
                        data:post.text,
                        ptype:post.type,
                        up:1,
                        down:0,
                        postdate:new Date(),
                        updated: new Date(),
                        score:comment(1, 0),
                        childs:[]
                    });
                    status.save(function (err, data) {
                        if(err)
                            return res.status(400).json({message: err});
                        var executerep = function() {
                            var votes = new Votes();
                            votes.mid = status._id;
                            votes.username = req.body.user;
                            votes.vote = true;
                            votes.save(function (err) {
                                if (err)
                                    return res.status(400).json({message: err});
                                User.findOne({username: req.body.user}, {_id: 0, avatar: 1}, function (err, user) {
                                    return res.json({
                                        id: status._id,
                                        osid: status.osid,
                                        chid: status.chid,
                                        author: status.author,
                                        anonymous: status.anonymous,
                                        type: status.type,
                                        data: status.data,
                                        ptype: status.ptype,
                                        up: status.up,
                                        down: status.down,
                                        postdate: ta.ago(status.postdate),
                                        avatar: user.avatar,
                                        userVoted: true,
                                        voteStatus: true,
                                        childs: []
                                    })
                                })
                            });
                        };
                        executerep();
                    });
                }
                if(item.childs !== []){
                    item.childs.forEach(function (it) {
                        loopThrough(item.childs,it,chid,id,post);
                    });
                }
            };
            if(status.length > 0){
                status.forEach(function (item) {
                    loopThrough(status,item,req.body.chid,req.body.id,req.body.post);
                });
            }
        });
    });

    router.post('/submitReply', function (req, res) {
        if(req.body.id === ""){
            return res.status(400).json({message: "submission does not exist"});
        }
        if(req.body.post.text === ""){
            return res.status(400).json({message: "type in something to reply"});
        }
        Status.findOne({_id:req.body.id},{_id:1}, function (err,st) {
            if(err)
                return res.status(400).json({message:err});
            if(!st){
                return res.status(400).json({message: "This submission does not exist"});
            }else {
                var osid = st._id;
                if(req.body.type === "mrep"){
                    var chid = st._id;
                    main(osid,chid);
                }else if(req.body.type === "srep"){
                    Status.findOne({_id:req.body.chid},{_id:1}, function (err,stat) {
                        if(err)
                            return res.status(400).json({message:err});
                        if(!st){
                            return res.status(400).json({message: "This submission does not exist"});
                        }else {
                            var chid = stat._id;
                            main(osid,chid);
                        }
                    });
                }
            }
        });
        function main(osid,chid){
            var status = new Status();
            status.osid = osid;
            status.chid = chid;
            status.author = req.body.user;
            status.anonymous = req.body.post.anonymous;
            status.type = "b";
            status.data = req.body.post.text;
            status.ptype = req.body.type;
            status.up = 1;
            status.down = 0;
            status.postdate = new Date();
            status.updated = new Date();
            status.score = comment(status.up, status.down);
            status.save(function (err,status) {
                if (err)
                    return res.status(400).json({message: err});
                var executerep = function() {
                    var votes = new Votes();
                    votes.mid = status._id;
                    votes.username = req.body.user;
                    votes.vote = true;
                    votes.save(function (err) {
                        if (err)
                            return res.status(400).json({message: err});
                        User.findOne({username: req.body.user}, {_id: 0, avatar: 1}, function (err, user) {
                            return res.json({
                                id: status._id,
                                osid: status.osid,
                                chid: status.chid,
                                author: status.author,
                                anonymous: status.anonymous,
                                type: status.type,
                                data: status.data,
                                ptype: status.ptype,
                                up: status.up,
                                down: status.down,
                                postdate: ta.ago(status.postdate),
                                avatar: user.avatar,
                                userVoted: true,
                                voteStatus: true,
                                childs: []
                            })
                        })
                    });
                };
                executerep();
            });
        }
    });

    router.post('/vote', function (req, res) {
        if(req.body.id === ""){
            return res.status(400).json({message:"submission not selected"});
        }
        Status.findOne({_id:req.body.id}, function (err,status) {
            if(err)
                return res.status(400).json({message:err});
            Votes.findOne({mid:status._id,username:req.body.user,vote:true},{_id:1}, function (err,upvoted) {
                if(err)
                    return res.status(400).json({message:err});
                Votes.findOne({mid:status._id,username:req.body.user,vote:false},{_id:1}, function (err,downvoted) {
                    if(err)
                        return res.status(400).json({message:err});
                    if(upvoted !== null  && downvoted === null){
                        if(req.body.type === "up") {
                            status.up = status.up - 1;
                            status.score = hotScore(status.up, status.down, status.postdate);
                            status.cont = controversy(status.up, status.down);
                            status.diff = difference(status.up, status.down);
                            status.save(function (err) {
                                if (err)
                                    return res.status(400).json({message: err});
                                Votes.remove({mid: status._id, username: req.body.user}, function (err) {
                                    if (err)
                                        return res.status(400).json({message: err});
                                    return res.json({isSuccess: true});
                                });
                            })
                        } else if(req.body.type === "down"){
                            status.up = status.up - 1;
                            status.down = status.down + 1;
                            status.score = hotScore(status.up, status.down, status.postdate);
                            status.cont = controversy(status.up, status.down);
                            status.diff = difference(status.up, status.down);
                            status.save(function (err){
                                if (err)
                                    return res.status(400).json({message: err});
                                Votes.update({mid:status._id,username:req.body.user},{$set:{vote:false}},function (err) {
                                    if (err)
                                        return res.status(400).json({message: err});
                                    return res.json({isSuccess: true})
                                });
                            })
                        }
                    }else if(downvoted === null && upvoted === null){
                        var votes = new Votes();
                        if(req.body.type === "up"){
                            status.up = status.up + 1;
                            votes.vote = true;
                        }else if(req.body.type === "down"){
                            status.down = status.down + 1;
                            votes.vote = false;
                        }
                        status.score = hotScore(status.up, status.down, status.postdate);
                        status.cont = controversy(status.up, status.down);
                        status.diff = difference(status.up, status.down);
                        votes.mid = status._id;
                        votes.username = req.body.user;
                        status.save(function (err){
                            if (err)
                                return res.status(400).json({message: err});
                            votes.save(function (err) {
                                if (err)
                                    return res.status(400).json({message: err});
                                return res.json({isSuccess: true})
                            });
                        })

                    }else if(upvoted === null && downvoted !== null){
                        if(req.body.type === "up") {
                            status.up = status.up + 1;
                            status.down = status.down - 1;
                            status.score = hotScore(status.up, status.down, status.postdate);
                            status.cont = controversy(status.up, status.down);
                            status.diff = difference(status.up, status.down);
                            status.save(function (err) {
                                if (err)
                                    return res.status(400).json({message: err});
                                Votes.update({
                                    mid: status._id,
                                    username: req.body.user
                                }, {$set: {vote: true}}, function (err) {
                                    if (err)
                                        return res.status(400).json({message: err});
                                    return res.json({isSuccess: true})
                                });
                            })
                        }else if(req.body.type === "down"){
                            status.down = status.down - 1;
                            status.score = hotScore(status.up, status.down, status.postdate);
                            status.cont = controversy(status.up, status.down);
                            status.diff = difference(status.up, status.down);
                            status.save(function (err) {
                                if (err)
                                    return res.status(400).json({message: err});
                                Votes.remove({mid: status._id, username: req.body.user}, function (err) {
                                    if (err)
                                        return res.status(400).json({message: err});
                                    return res.json({isSuccess: true})
                                });
                            })
                        }
                    }
                })
            });
        });
    });

    router.post('/remove', function (req, res) {
        if(req.body.id === ""){
            return res.status(400).json({message:"submission not selected"});
        }
        // Check to make sure this logged in user actually owns that comment
        Status.findOne({_id:req.body.id},{_id:0,author:1}, function(err,stat){
            if(err)
                return res.status(400).json({message:err});
            if(!stat){
                return res.status(400).json({message:"This submission does not exist"});
            }else{
                if(stat.author !== req.body.user){
                    return res.status(400).json({message:"This submission doesn't belong to you"});
                }else{
                    if(req.body.type === "sub"){
                        Status.find({osid: req.body.id},{_id:1},function(err, st) {
                            if (err)
                                return res.status(400).json({message: err});
                            Status.remove({_id: req.body.id}, function (err) {
                                if (err)
                                    return res.status(400).json({message: err});
                                Status.remove({osid: req.body.id}, function (err) {
                                    if (err)
                                        return res.status(400).json({message: err});
                                    st.forEach(function (item) {
                                        Votes.remove({mid: item._id});
                                    });
                                    return res.json({isSuccess: true});
                                });
                            });
                        });
                    }

                    //else if(req.body.type === "comment"){
                    //    Status.find({chid: req.body.id},{_id:1},function(err, st){
                    //        if (err)
                    //            return res.status(400).json({message: err});
                    //        Status.remove({chid: req.body.id}, function (err) {
                    //            if (err)
                    //                return res.status(400).json({message: err});
                    //        });
                    //        st.forEach(function (item) {
                    //            Votes.remove({mid: item._id});
                    //        });
                    //        return res.json({message: "success"});
                    //    });
                    //}
                }
            }
        });
    });

    router.post('/savestatus', function (req, res) {
        UserOption.findOne({username:req.body.user},{_id:0,savedSubs:1}, function (err, saved) {
            if(err)
                return res.status(400).json({message:err});
            if(req.body.type === "save") {
                if (saved.savedSubs.length > 0) {
                    if (isInArray(req.body.id, saved.savedSubs)) {
                        return res.json({message: "This submission is already saved"});
                    } else {
                        saved.savedSubs.push(req.body.id);
                    }
                } else {
                    saved.savedSubs.push(req.body.id);
                }
            }else if(req.body.type === 'unsave'){
                if (saved.savedSubs.length > 0) {
                    if (isInArray(req.body.id, saved.savedSubs)) {
                        var index = saved.savedSubs.indexOf(req.body.id);
                        saved.savedSubs.splice(index, 1);
                    } else {
                        return res.json({message: "You have not saved this any post"});
                    }
                }else{
                    return res.json({message: "You have not saved any post"});
                }
            }
            UserOption.update({username:req.body.user},{$set:{savedSubs:saved.savedSubs}},function(err){
                if(err)
                    return res.status(400).json({message:err});
                return res.json({isSuccess: true});
            });
        });
    });
    //GLOBAL FUNCTIONS
    function isInArray(value, array) {
        return array.indexOf(value) > -1;
    }

    function controversy(ups , downs){
        if(ups > downs){
            var ul = ups;
            var dl = downs;
        }else{
            var ul = downs;
            var dl = ups;
        }
        var ratio;
        if(dl === 0 || ul === 0){
           ratio = 0;
        }else{
            ratio = ul / dl;
        }
        return (ups + downs) * ratio;
    }

    function difference(ups, downs){
        return ups - downs;
    }

    function filterTime(start, end, now){
        if(now === '24h') {
            start = new Date(end - 24 * 60 * 60 * 1000);
        }else if(now === '1h'){
            start = new Date(end - 60 * 60 * 1000);
        }else if(now === '7d'){
            start = new Date(end - 7 * 24 * 60 * 60 * 1000);
        }else if(now === '30d'){
            start = new Date(end - 30 * 24 * 60 * 60 * 1000);
        }else if(now === '1y'){
            start = new Date(end - 12 * 30 * 24 * 60 * 60 * 1000);
        }else if(now === 'all'){
            start = new Date(end - 15 * 12 * 30 * 24 * 60 * 60 * 1000);
        }else{
            start = new Date(end - 24 * 60 * 60 * 1000);
        }
        return start;
    }
};