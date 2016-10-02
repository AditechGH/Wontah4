/**
 * Created by Aditech on 2/15/2016.
 */
var User = require('../models/users/user'),
    Pm = require('../models/pm/pm'),
    ta = require('time-ago')(),
    dateFormat = require('dateformat'),
    _ = require('underscore');
module.exports = function(router){

    //GET
        router.get('/getMsgs/:type/:user', function (req, res) {
            Pm.find({
                $or: [{receiver: req.params.user, parent: 'x',r_unseen:true},
                    {sender: req.params.user,parent: 'x', hasreplies: true,s_unseen:true}]},{_id:1}, function (err,pmcount) {
                        if(err)
                            return res.status(400).json({message:err});
                if(req.params.type === 'ReceivedMsgs'){
                    Pm.find({
                        $or: [{receiver: req.params.user, parent: 'x',rdelete:false},
                            {sender: req.params.user, parent: 'x', hasreplies: true,sdelete:false}]
                    }, function (err,rpm ) {
                        if (err)
                            return res.status(400).json({message: err});
                        execFunction(rpm);
                    }).sort({updatetime: -1});
                }else if (req.params.type === 'SentMsgs'){
                    Pm.find({sender: req.params.user, parent: 'x',sdelete:false}, function (err, spm) {
                        if (err)
                            return res.status(400).json({message: err});
                        execFunction(spm);
                    }).sort({updatetime: -1});
                }
                function execFunction(rpm){
                    if(rpm.length < 1){
                        return res.status(200).json({onMessages:true,message:"no messages"});
                    }else{
                        var arr = [],i=0;
                        rpm.forEach(function (item, index, array) {
                            Pm.find({parent:item._id},{_id:1}, function (err, creps) {
                                if(err)
                                    return res.status(400).json({message:err});
                                i++;
                                arr.push({
                                    id:item._id,
                                    receiver:item.receiver,
                                    sender:item.sender,
                                    senttime: dateFormat(item.senttime, "mmmm dS, yyyy"),
                                    subject:item.subject,
                                    message:item.message,
                                    numReplies: _.size(creps),
                                    sdelete:item.sdelete,
                                    rdelete:item.rdelete,
                                    parent:item.parent,
                                    hasreplies:item.hasreplies,
                                    s_unseen:item.s_unseen,
                                    r_unseen:item.r_unseen
                                });
                                if(i === array.length){
                                    return res.json({onMessages:false,msgCount:_.size(pmcount),allmsg:_.size(rpm),result:arr});
                                }
                            })
                        });
                    }
            }
            });
        });

        router.get('/getMessageBody/:id/:user', function (req, res) {
            Pm.findOne({_id:req.params.id}, function (err, onepm) {
                if(err)
                    return res.status(400).json({message:err});
                if(!onepm){
                    return res.status(400).json({message:"this message does not exist"})
                }else{
                    Pm.find({parent:req.params.id},{sender:1,senttime:1,message:1}, function (err,repmsg) {
                        if(err)
                            return res.status(400).json({message:err});
                        var rarr = [],replies;
                        if(repmsg.length < 1){
                            replies = false;
                        }else{
                            replies = true;
                            repmsg.forEach(function (item) {
                                rarr.push({
                                    id:item._id,
                                    sender:item.sender,
                                    senttime:ta.ago(item.senttime),
                                    message:item.message
                                });
                            });
                        }
                        return res.json({
                            id:onepm._id,
                            receiver:onepm.receiver,
                            sender:onepm.sender,
                            senttime: dateFormat(onepm.senttime, "dddd, mmmm dS, yyyy - h:MM:ss TT"),
                            subject:onepm.subject,
                            message:onepm.message,
                            sdelete:onepm.sdelete,
                            rdelete:onepm.rdelete,
                            parent:onepm.parent,
                            hasreplies:onepm.hasreplies,
                            s_unseen:onepm.s_unseen,
                            r_unseen:onepm.r_unseen,
                            replies: rarr,
                            reps:replies
                        })
                    }).sort({senttime:1});
                }
            });
        });
    //POST
        router.post('/sendMessage', function (req, res) {
            if(req.body.to === ""){
                return res.status(400).json({message:"No recipient selected"});
            }
            if(req.body.title === ""){
                return res.status(400).json({message:"Title is required"});
            }
            if(req.body.to === req.body.user){
                return res.status(400).json({message:"You cannot send message to yourself"});
            }
            User.findOne({username:req.body.to},{_id:1}, function (err, u) {
                if(err)
                    return res.status(400).json({message:err});
                if(!u){
                    return res.status(400).json({message:"this recipient does not exist"});
                }else{
                    var pm = new Pm();
                    pm.parent = "x";
                    pm.receiver = req.body.to;
                    pm.sender = req.body.user;
                    pm.subject = req.body.title;
                    pm.message = req.body.msg;
                    pm.senttime = new Date();
                    pm.updatetime = new Date();
                    pm.r_unseen = true;
                    pm.save(function (err) {
                        if (err)
                            return res.status(400).json({message: err});
                        return res.status(200).json({message: 'success'});
                    });
                }
            })
        });

        router.post('/replymsg', function (req, res) {
            if(req.body.sender === ""){
                return res.status(400).json({message:"No recipient selected"});
            }
            if(req.body.msg === ""){
                return res.status(400).json({message:"You cannot send an empty message"});
            }
            if(req.body.id === ""){
                return res.status(400).json({message:"Try again Later"});
            }
            var pm = new Pm();
            pm.receiver = "x";
            pm.sender = req.body.user;
            pm.subject = "x";
            pm.message = req.body.msg;
            pm.parent = req.body.id;
            pm.senttime = new Date();
            pm.save(function (err,spm) {
                if (err)
                    return res.status(400).json({message: err});
                if(req.body.sender === req.body.user){
                    Pm.update({_id:req.body.id},{$set:{hasreplies:true,r_unseen:true,s_unseen:false,updatetime:new Date()}}, function (err) {
                        if(err)
                            return res.status(400).json({message:err});
                        return res.json({id:spm._id,sender:spm.sender,message:req.body.msg,senttime:ta.ago(spm.senttime)});
                    })
                }else{
                    Pm.update({_id:req.body.id},{$set:{hasreplies:true,r_unseen:false,s_unseen:true,updatetime:new Date()}}, function (err) {
                        if(err)
                            return res.status(400).json({message:err});
                        return res.json({id:spm._id,sender:spm.sender,message:req.body.msg,senttime:ta.ago(spm.senttime)});
                    })
                }
            });
        });

        router.post('/markasRead', function (req, res) {
            if(req.body.sender === req.body.user){
                Pm.update({_id:req.body.id},{$set:{s_unseen:false}}, function (err) {
                    if(err)
                        return res.status(400).json({message:err});
                    return res.json({numark:false});
                })
            }else{
                Pm.update({_id:req.body.id},{$set:{r_unseen:false}}, function (err) {
                    if(err)
                        return res.status(400).json({message:err});
                    return res.json({numark:true});
                })
            }
        });

        router.post('/deletemessage', function (req, res) {
            if(req.body.sender === req.body.user){
                Pm.findOne({_id:req.body.id,rdelete:true},{_id:1}, function (err,chud) {
                    if(err)
                        return res.status(400).json({message:err});
                    if(chud){
                        Pm.remove({$or:[{_id:req.body.id},{parent:req.body.id}]}, function (err) {
                            if(err)
                                return res.status(400).json({message:err});
                            return res.json({message:'success'});
                        });
                    }else{
                        Pm.update({_id:req.body.id},{$set:{sdelete:true}}, function (err) {
                            if(err)
                                return res.status(400).json({message:err});
                            return res.json({message:'success'});
                        })
                    }
                });
            }else{
                Pm.findOne({_id:req.body.id,sdelete:true},{_id:1}, function (err,chud) {
                    if(err)
                        return res.status(400).json({message:err});
                    if(chud){
                        Pm.remove({$or:[{_id:req.body.id},{parent:req.body.id}]}, function (err) {
                            if(err)
                                return res.status(400).json({message:err});
                            return res.json({message:'success'});
                        });
                    }else{
                        Pm.update({_id:req.body.id},{$set:{rdelete:true}}, function (err) {
                            if(err)
                                return res.status(400).json({message:err});
                            return res.json({message:'success'});
                        })
                    }
                });
            }
        });

        router.post('/deletereply', function (req, res) {
            Pm.remove({_id:req.body.id,subject:'x'}, function (err) {
                if(err)
                    return res.status(400).json({message:err});
                return res.json({message:'success'});
            });
        });

    //GLOBAL FUNCTIONS
};