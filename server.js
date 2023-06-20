var express = require('express');
var cors = require('cors');
var bodyParser = require("body-parser");

// Routes

var indexRouter = require('./Routes/index/Index');
var userRouter = require('./Routes/User/User');
var contactRouter = require('./Routes/Contact/Contact');

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


var port = process.env.PORT || 3000;
app.listen(port,function(){
    console.log("Server is running on port: "+port);
});