const mongoose = require("mongoose");
mongoose.connect("mongodb://127.0.0.1:27017/LuxXWatch");


const express = require("express");
const app = express();
const path = require('path');
const passport = require('passport');
const session = require('express-session');
require('./auth');



app.use(session({
    secret: 'mysitesessionsecret',
    resave: false,
    saveUninitialized: false,
    cookie: { 
        maxAge: 3600000 
    }


}));



//user router
const userRoute = require('./routes/userRoute');
app.use('/',userRoute);

//admin router
const adminRoute = require('./routes/adminRoute');
app.use('/admin',adminRoute);

app.set('view engine','ejs');
app.set('views','./views/user');


// function isLoggedin(req,res,next){
//     req.user? next(): res.sendStatus(401);
// }


// app.use(session({
//     secret: 'mysitesessionsecret',
//     resave: false,
//     saveUninitialized: true,
//     cookie: { secure: false,
//         maxAge: 3600000
//      }
//   }))

// app.use(passport.initialize());
// app.use(passport.session());

// app.get('/auth/google',
//   passport.authenticate('google', { scope: ['email', 'profile'] })
// );

// app.get('/auth/google/callback',
//   passport.authenticate('google', {
//     successRedirect: '/auth/google/success',
//     failureRedirect: '/auth/google/failure'
//   })
// );


// app.get('/auth/google/success',isLoggedin,(req,res)=>{
//     console.log(session.user);
//     res.redirect('/home');
// })

// app.get('/auth/google/failure',isLoggedin,(req,res)=>{
//     console.log(session.user);
//     res.redirect('/login');
// })



app.listen(3005,function(){
    console.log("server is running at http://localhost:3005");
});

