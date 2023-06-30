var express = require('express');
var cors = require('cors');
var bodyParser = require("body-parser");

// Routes 

var indexRouter = require('./Routes/Index/Index');
var userRouter = require('./Routes/User/User');
var requestRouter = require('./Routes/Request/Request');
var contactRouter = require('./Routes/Contact/Contact');
var messageRouter = require('./Routes/Message/Message');
var discussionRouter = require('./Routes/Discussion/Discussion');

process.env.SECRET_KEY = "groupe7Ifri";

var app = express();
app.use(bodyParser.json());
app.use(cors());
app.use(bodyParser.urlencoded({
    extended: false
}));


app.use('/', indexRouter);
app.use('/user', userRouter);
app.use('/user/contact', contactRouter);
app.use('/user/request', requestRouter);
app.use('/user/message', messageRouter);
app.use('/user/discussion', discussionRouter);


var port = process.env.PORT || 3000;
app.listen(port,function(){
    console.log("Server is running on port: "+port);
});