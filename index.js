const mongoose = require("mongoose");
mongoose.connect("mongodb://127.0.0.1:27017/LuxXWatch");


const express = require("express");
const app = express();


const userRoute = require('./routes/userRoute');
app.use('/',userRoute);

//admin router
const adminRoute = require('./routes/adminRoute');
app.use('/admin',adminRoute);

app.listen(3005,function(){
    console.log("server is running at http://localhost:3005");
});

