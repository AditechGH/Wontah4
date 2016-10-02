/**
 * Created by Aditech on 1/11/2016.
 */
'use strict';
var express = require('express'),
    app = express(),
    //http = require('http').Server(app),
    path = require('path'),
    port =  process.env.PORT || 8585,
    cookieParser = require('cookie-parser'),
    session = require('express-session'),
    morgan = require('morgan'),
    mongoose = require('mongoose'),
    methodOverride = require('method-override'),
    bodyParser = require('body-parser'),
    passport = require('passport'),
    flash = require('connect-flash'),
    configDB = require('./server/config/database.js');
    mongoose.connect(configDB.url);
    require('./server/config/passport')(passport);

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json({limit:'50mb'}));
app.use(function(req, res, next) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST');
    res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,content-type, Authorization');
    next();
});
app.use(morgan('dev'));
app.use(cookieParser());
app.use(session({secret: "Wontah0100201031+aditech",saveUninitialized: false, resave: true}));
app.use(methodOverride());
app.use(passport.initialize());
app.use(passport.session());
app.use(flash());

app.set('view engine', 'ejs');
app.set('views', path.resolve(__dirname,'client','views'));
app.use(express.static(path.resolve(__dirname, 'static')));
app.use(express.static(path.resolve(__dirname, 'client')));
app.use(passport.initialize());
app.use(passport.session());

var validate = express.Router(),
    uploadApi = express.Router(),
    api = express.Router(),
    subApi = express.Router(),
    taahApi = express.Router(),
    dictApi = express.Router(),
    inboxApi = express.Router(),
    auth = express.Router();

require('./server/routes/validate')(validate);
require('./server/routes/mail')(app);
require('./server/routes/uploadApi')(uploadApi);
require('./server/routes/api')(api);
require('./server/routes/subApi')(subApi);
require('./server/routes/taahApi')(taahApi);
require('./server/routes/dictApi')(dictApi);
require('./server/routes/inboxApi')(inboxApi);
require('./server/routes/auth')(auth,passport);

app.use('/auth', auth);
app.use('/validate', validate);
app.use('/uploadApi',ensureAuthorized, uploadApi);
app.use('/api',ensureAuthorized, api);
app.use('/subApi',ensureAuthorized, subApi);
app.use('/taahApi',ensureAuthorized, taahApi);
app.use('/dictApi',ensureAuthorized, dictApi);
app.use('/inboxApi',ensureAuthorized, inboxApi);

app.get('*', function (req, res) {
    res.render('index.ejs');
});

function ensureAuthorized(req, res, next) {
    var bearerToken;
    var bearerHeader = req.headers["authorization"];
    if (typeof bearerHeader !== 'undefined') {
        var bearer = bearerHeader.split(" ");
        bearerToken = bearer[1];
        req.token = bearerToken;
        next();
    } else {
        res.sendStatus(403);
    }
}

process.on('uncaughtException', function(err) {
    console.log(err);
});

app.listen(port, function(){
    console.log('Server running on port: ' + port);
});