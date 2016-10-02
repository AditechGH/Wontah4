/**
 * Created by Aditech on 2/9/2016.
 */
var User = require('../models/users/user');
module.exports = function(router){

    router.get('/getAllUgStudents', function (req, res) {
        findAll(res);
    });
    router.get('/FirstFilter/:id/:name', function (req, res) {
        if(req.params.id === "1"){
            findAll(res,'-A');
        }else{
            FirstFilter(req.params.id,req.params.name,res,'A');
        }
    });

    router.get('/SecondFilter/:id1/:name1/:id2/:name2', function (req, res) {
        //A B
        if((req.params.id1 === "1" || req.params.id1 === "undefined") && (req.params.id2 === "1" || req.params.id2 === "undefined")){
            findAll(res,'A B');
        } else
        //A -B
        if((req.params.id1 === "1" || req.params.id1 === "undefined") && (req.params.id2 !== "1" || req.params.id2 !== "undefined")){
            FirstFilter(req.params.id2,req.params.name2,res,'A -B');
        } else
        //-A B
        if((req.params.id1 !== "1" || req.params.id1 !== "undefined") && (req.params.id2 === "1" || req.params.id2 === "undefined")){
            FirstFilter(req.params.id1,req.params.name1,res,'-A B');
        } else
        //-A -B
        if((req.params.id1 !== "1" || req.params.id1 !== "undefined") && (req.params.id2 !== "1" || req.params.id2 !== "undefined")){
            SecondFilter(req.params.id1,req.params.name1,req.params.id2,req.params.name2,res,"-A -B")
        }
    });

    router.get('/ThirdFilter/:id1/:name1/:id2/:name2/:id3/:name3', function (req, res) {
        //A B C
        if((req.params.id1 === "1" || req.params.id1 === "undefined") && (req.params.id2 === "1" || req.params.id2 === "undefined")
            && (req.params.id3 === "1" || req.params.id3 === "undefined")){
            findAll(res,'A B C');
        } else
        //A B -C
        if((req.params.id1 === "1" || req.params.id1 === "undefined") && (req.params.id2 === "1" || req.params.id2 === "undefined")
            && (req.params.id3 !== "1" || req.params.id3 !== "undefined")){
            FirstFilter(req.params.id3,req.params.name3,res,'A B -C');
        } else
        //A -B C
        if((req.params.id1 === "1" || req.params.id1 === "undefined") && (req.params.id2 !== "1" || req.params.id2 !== "undefined")
            && (req.params.id3 === "1" || req.params.id3 === "undefined")){
            FirstFilter(req.params.id2,req.params.name2,res,'A -B C');
        } else
        //-A B C
        if((req.params.id1 !== "1" || req.params.id1 !== "undefined") && (req.params.id2 === "1" || req.params.id2 === "undefined")
            && (req.params.id3 === "1" || req.params.id3 === "undefined")){
            FirstFilter(req.params.id1,req.params.name1,res,'-A B C');
        } else
        //A -B -C
        if((req.params.id1 === "1" || req.params.id1 === "undefined") && (req.params.id2 !== "1" || req.params.id2 !== "undefined")
            && (req.params.id3 !== "1" || req.params.id3 !== "undefined")){
            SecondFilter(req.params.id2,req.params.name2,req.params.id3,req.params.name3,res,'A -B -C')
        } else
        //-A B -C
        if((req.params.id1 !== "1" || req.params.id1 !== "undefined") && (req.params.id2 === "1" || req.params.id2 === "undefined")
            && (req.params.id3 !== "1" || req.params.id3 !== "undefined")){
            SecondFilter(req.params.id1,req.params.name1,req.params.id3,req.params.name3,res,'-A B -C');
        } else
        //-A -B C
        if((req.params.id1 !== "1" || req.params.id1 !== "undefined") && (req.params.id2 !== "1" || req.params.id2 !== "undefined")
            && (req.params.id3 === "1" || req.params.id3 === "undefined")){
            SecondFilter(req.params.id1,req.params.name1,req.params.id2,req.params.name2,res,'-A -B C')
        } else
        //-A -B -C
        if((req.params.id1 !== "1" || req.params.id1 !== "undefined") && (req.params.id2 !== "1" || req.params.id2 !== "undefined")
            && (req.params.id3 !== "1" || req.params.id3 !== "undefined")){
            ThirdFilter(req.params.id1,req.params.name1,req.params.id2,req.params.name2,req.params.id3,req.params.name3,res,'-A -B -C')
        }
    });

    router.get('/FourthFilter/:id1/:name1/:id2/:name2/:id3/:name3/:id4/:name4', function (req, res) {
        //A B C D
        if((req.params.id1 === "1" || req.params.id1 === "undefined") && (req.params.id2 === "1" || req.params.id2 === "undefined")
            && (req.params.id3 === "1" || req.params.id3 === "undefined")&& (req.params.id4 === "1" || req.params.id4 === "undefined")){
            findAll(res,'A B C D');
        } else
        //A B C -D
        if((req.params.id1 === "1" || req.params.id1 === "undefined") && (req.params.id2 === "1" || req.params.id2 === "undefined")
            && (req.params.id3 === "1" || req.params.id3 === "undefined")&& (req.params.id4 !== "1" || req.params.id4 !== "undefined")){
            FirstFilter(req.params.id4,req.params.name4,res,'A B C -D');
        } else
        //A B -C D
        if((req.params.id1 === "1" || req.params.id1 === "undefined") && (req.params.id2 === "1" || req.params.id2 === "undefined")
            && (req.params.id3 !== "1" || req.params.id3 !== "undefined")&& (req.params.id4 === "1" || req.params.id4 === "undefined")){
            FirstFilter(req.params.id3,req.params.name3,res,'A B -C D');
        } else
        //A -B C D
        if((req.params.id1 === "1" || req.params.id1 === "undefined") && (req.params.id2 !== "1" || req.params.id2 !== "undefined")
            && (req.params.id3 === "1" || req.params.id3 === "undefined")&& (req.params.id4 === "1" || req.params.id4 === "undefined")){
            FirstFilter(req.params.id2,req.params.name2,res,'A -B C D');
        } else
        //-A B C D
        if((req.params.id1 !== "1" || req.params.id1 !== "undefined") && (req.params.id2 === "1" || req.params.id2 === "undefined")
            && (req.params.id3 === "1" || req.params.id3 === "undefined")&& (req.params.id4 === "1" || req.params.id4 === "undefined")){
            FirstFilter(req.params.id1,req.params.name1,res,'-A B C D');
        } else
        //A B -C -D
        if((req.params.id1 === "1" || req.params.id1 === "undefined") && (req.params.id2 === "1" || req.params.id2 === "undefined")
            && (req.params.id3 !== "1" || req.params.id3 !== "undefined")&& (req.params.id4 !== "1" || req.params.id4 !== "undefined")){
            SecondFilter(req.params.id3,req.params.name3,req.params.id4,req.params.name4,res,'A B -C -D')
        } else
        //A -B C -D
        if((req.params.id1 === "1" || req.params.id1 === "undefined") && (req.params.id2 !== "1" || req.params.id2 !== "undefined")
            && (req.params.id3 === "1" || req.params.id3 === "undefined")&& (req.params.id4 !== "1" || req.params.id4 !== "undefined")){
            SecondFilter(req.params.id2,req.params.name2,req.params.id4,req.params.name4,res,'A -B C -D')
        } else
        //-A B C -D
        if((req.params.id1 !== "1" || req.params.id1 !== "undefined") && (req.params.id2 === "1" || req.params.id2 === "undefined")
            && (req.params.id3 === "1" || req.params.id3 === "undefined")&& (req.params.id4 !== "1" || req.params.id4 !== "undefined")){
            SecondFilter(req.params.id1,req.params.name1,req.params.id4,req.params.name4,res,'-A B C -D')
        } else
        //-A B -C D
        if((req.params.id1 !== "1" || req.params.id1 !== "undefined") && (req.params.id2 === "1" || req.params.id2 === "undefined")
            && (req.params.id3 !== "1" || req.params.id3 !== "undefined")&& (req.params.id4 === "1" || req.params.id4 === "undefined")){
            SecondFilter(req.params.id1,req.params.name1,req.params.id3,req.params.name3,res,'-A B -C D')
        } else
        //A -B -C D
        if((req.params.id1 === "1" || req.params.id1 === "undefined") && (req.params.id2 !== "1" || req.params.id2 !== "undefined")
            && (req.params.id3 !== "1" || req.params.id3 !== "undefined")&& (req.params.id4 === "1" || req.params.id4 === "undefined")){
            SecondFilter(req.params.id2,req.params.name2,req.params.id3,req.params.name3,res,'A -B -C D')
        } else
        //-A -B C D
        if((req.params.id1 !== "1" || req.params.id1 !== "undefined") && (req.params.id2 !== "1" || req.params.id2 !== "undefined")
            && (req.params.id3 === "1" || req.params.id3 === "undefined")&& (req.params.id4 === "1" || req.params.id4 === "undefined")){
            SecondFilter(req.params.id1,req.params.name1,req.params.id2,req.params.name2,res,'-A -B C D')
        } else
        //A -B -C -D
        if((req.params.id1 === "1" || req.params.id1 === "undefined") && (req.params.id2 !== "1" || req.params.id2 !== "undefined")
            && (req.params.id3 !== "1" || req.params.id3 !== "undefined")&& (req.params.id4 !== "1" || req.params.id4 !== "undefined")){
            ThirdFilter(req.params.id2,req.params.name2,req.params.id3,req.params.name3,req.params.id4,req.params.name4,res,'A -B -C -D')
        } else
        //-A B -C -D
        if((req.params.id1 !== "1" || req.params.id1 !== "undefined") && (req.params.id2 === "1" || req.params.id2 === "undefined")
            && (req.params.id3 !== "1" || req.params.id3 !== "undefined")&& (req.params.id4 !== "1" || req.params.id4 !== "undefined")){
            ThirdFilter(req.params.id1,req.params.name1,req.params.id3,req.params.name3,req.params.id4,req.params.name4,res,'-A B -C -D')
        } else
        //-A -B C -D
        if((req.params.id1 !== "1" || req.params.id1 !== "undefined") && (req.params.id2 !== "1" || req.params.id2 !== "undefined")
            && (req.params.id3 === "1" || req.params.id3 === "undefined")&& (req.params.id4 !== "1" || req.params.id4 !== "undefined")){
            ThirdFilter(req.params.id1,req.params.name1,req.params.id2,req.params.name2,req.params.id4,req.params.name4,res,'-A -B C -D')
        } else
        //-A -B -C D
        if((req.params.id1 !== "1" || req.params.id1 !== "undefined") && (req.params.id2 !== "1" || req.params.id2 !== "undefined")
            && (req.params.id3 !== "1" || req.params.id3 !== "undefined")&& (req.params.id4 === "1" || req.params.id4 === "undefined")){
            ThirdFilter(req.params.id1,req.params.name1,req.params.id2,req.params.name2,req.params.id3,req.params.name3,res,'-A -B -C D')
        } else
        //-A -B -C -D
        if((req.params.id1 !== "1" || req.params.id1 !== "undefined") && (req.params.id2 !== "1" || req.params.id2 !== "undefined")
            && (req.params.id3 !== "1" || req.params.id3 !== "undefined")&& (req.params.id4 !== "1" || req.params.id4 !== "undefined")){
            FourthFilter(req.params.id1,req.params.name1,req.params.id2,req.params.name2,req.params.id3,req.params.name3,req.params.id4,req.params.name4,res,'-A -B -C -D');
        }
    });
    //GLOBAL FUNCTIONS
    var findAll = function (res,num) {
        User.find({'school.ug':true},{bio:1,firstname:1,lastname:1,username:1,avatar:1}, function (err, ugstd) {
            if(err)
                return res.status(400).json({message:err});
            execFunc(ugstd,res,num);
        });
    };

    var FirstFilter = function (id1,name1,res,num) {
        var name2 = null,id2=null,name3=null,id3=null,name4=null,id4=null;
        if(name1 === "Department") {
            dept(name1,id1,name2,id2,name3,id3,name4,id4,res,num);
        }else{
            other(name1,id1,name2,id2,name3,id3,name4,id4,res,num);
        }
    };

    var SecondFilter = function (id1,name1,id2,name2,res,num) {
        var name3=null,id3=null,name4=null,id4=null;
        if(name1 === "Department"){
            dept(name1,id1,name2,id2,name3,id3,name4,id4,res,num);
        }else if(name2 === "Department"){
            dept(name2,id2,name1,id1,name3,id3,name4,id4,res,num);
        }else{
            other(name1,id1,name2,id2,name3,id3,name4,id4,res,num);
        }
    };

    var ThirdFilter = function (id1,name1,id2,name2,id3,name3,res,num) {
        var name4=null,id4=null;
        if(name1 === "Department"){
            dept(name1,id1,name2,id2,name3,id3,name4,id4,res,num);
        }else if(name2 === "Department"){
            dept(name2,id2,name1,id1,name3,id3,name4,id4,res,num);
        }else if(name3 === "Department"){
            dept(name3,id3,name2,id2,name1,id1,name4,id4,res,num);
        }else{
            other(name1,id1,name2,id2,name3,id3,name4,id4,res,num);
        }
    };

    var FourthFilter = function (id1,name1,id2,name2,id3,name3,id4,name4,res,num) {
        if(name1 === "Department"){
            dept(name1,id1,name2,id2,name3,id3,name4,id4,res,num);
        }else if(name2 === "Department"){
            dept(name2,id2,name1,id1,name3,id3,name4,id4,res,num);
        }else if(name3 === "Department"){
            dept(name3,id3,name2,id2,name1,id1,name4,id4,res,num);
        }else if(name4 === "Department"){
            dept(name4,id4,name3,id3,name2,id2,name1,id1,res,num);
        }else{
            other(name1,id1,name2,id2,name3,id3,name4,id4,res,num);
        }
    };

    var dept = function (name1,id1,name2,id2,name3,id3,name4,id4,res,num) {
        User.find({'school.ug': true}, {'school.department': 1}, function (err, sdpt) {
            var arr = [], i = 0;
            if (err)return res.status(400).json({message: err});
            if (sdpt.length > 0) {
                sdpt.forEach(function (item) {
                    if (isInArray(id1, item.school.department)) {
                        arr.push(item._id);
                    }
                });
            }
            if (arr.length > 0) {
                var marr = [];
                arr.forEach(function (item, index, array) {
                    User.findOne({_id:item,[name2]:id2,[name3]:id3,[name4]:id4}, {bio: 1, firstname: 1, lastname: 1, username: 1, avatar: 1}, function (err, ugstd) {
                        if (err)return res.status(400).json({message: err});
                        if(ugstd !== null){
                            marr.push(ugstd);
                        }
                        i++;
                        if (i === array.length) {
                            execFunc(marr, res,num);
                        }
                    });
                });
            } else {
                return res.status(200).json({
                    students: false,
                    message: "no students of University of Ghana available at this point",
                    num: "N U L L",
                    num1: num
                });
            }
        });
    };

    var other = function (name1,id1,name2,id2,name3,id3,name4,id4,res,num) {
        User.find({'school.ug':true,[name1]:id1,[name2]:id2,[name3]:id3,[name4]:id4},{bio:1,firstname:1,lastname:1,username:1,avatar:1}, function (err, ugstd) {
            if(err)return res.status(400).json({message:err});
            execFunc(ugstd,res,num);
        });
    };

    var execFunc = function (data,res,num) {
        if(data.length <= 0){
            return res.status(200).json({students:false,message:"no students of University of Ghana available at this point",num:num});
        }else{
            return res.status(200).json({students:true,ugstd:data,num:num});
        }
    };

    function isInArray(value, array) {
        return array.indexOf(value) > -1;
    }
};