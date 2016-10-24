/**
 * Created by Aditech on 2/26/2016.
 */
var
    multiparty = require('connect-multiparty'),
    multipartyMiddleware = multiparty(),
    fs = require('fs'),
    util = require('util'),
    path = require('path'),
    easyimg = require('easyimage');
var maxFileSize = 10000000; // in bytes
var uploadPath = path.resolve("/home/ubuntu/wontah4/static/uploads/");
module.exports = function(router){
    //GET

    //POST
    router.post('/upload',multipartyMiddleware, function(req, res) {
        var files = util.isArray(req.files.file) ? req.files.file : [req.files.file];
        res.set("Content-Type", "text/plain");
        var b = new RegExp;
        files.forEach(function (file) {
            if(isValid(file.size)) {
                if (supported(file.type)) {
                    var newName = file.name.split(".");
                    var ext = newName[1];
                    var date = new Date;
                    b = /[' "():+]/gi;
                    var datestring = date.toString().replace(b, "");
                    var n = datestring.substring(0, 18)+""+Math.random().toString(36).substr(2, 10);
                    var name = n + "." + ext;
                    fs.rename(file.path, path.resolve(uploadPath, name), function (err) {
                        if (err) throw err;
                        fs.unlink(file.path, function () {
                            if (err) throw err;
                        });
                    });
                    if(req.query.type === 'profile'){
                        easyimg.resize({
                            src:uploadPath+'/'+name, dst:uploadPath+'/t_'+name,
                            width:600, height:450,
                            x:0, y:0
                        }).then(
                            function() {
                                fs.unlink(uploadPath+'/'+name, function () {
                                    return res.json({isSuccess:true,file: 't_'+name});
                                });
                            },
                            function (err) {
                                console.log(err);
                            });
                    }else if (req.query.type = 'cover'){
                        easyimg.rescrop({
                            src:uploadPath+'/'+name, dst:uploadPath+'/t_'+name,
                            width:557, height:250,
                            cropwidth:557, cropheight:250,
                            background: 'black',
                            fill: true,
                            x:0, y:0
                        }).then(
                            function() {
                                fs.unlink(uploadPath+'/'+name, function () {
                                    return res.json({isSuccess:true,file: 't_'+name});
                                });
                            },
                            function (err) {
                                console.log(err);
                            });
                    }

                } else {
                    failWithTooBigFile(req, res);
                }
            }else{
                return res.status(400).json({message: 'file type is not supported'})
            }
        });
    });

    //GLOBAL FUNCTIONS
    function isValid(size) {
        return maxFileSize === 0 || size < maxFileSize;
    }

    function isInArray(value, array) {
        return array.indexOf(value) > -1;
    }

    function supported(type){
        var array = ['image/jpeg', 'image/png', 'image/gif','image/jpg','image/JPG','image/PNG', 'image/GIF','image/JPEG'];
        if(isInArray(type, array)){
            return true;
        }else{
            return false;
        }
    }

    function failWithTooBigFile(req, res) {
        req.error = "Too big!";
        req.preventRetry = true;
        res.json(req);
    }
};
