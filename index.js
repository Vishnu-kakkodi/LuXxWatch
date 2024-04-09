const mongoose = require("mongoose");
mongoose.connect("mongodb://127.0.0.1:27017/LuxXWatch");


const express = require("express");
const app = express();
const path = require('path');
require('./auth');
const passport = require('passport');
const session = require('express-session');
const cookieParser = require("cookie-parser");



app.use(session({
    secret: 'mysitesessionsecret',
    resave: false,
    saveUninitialized: false
}));

app.use(passport.initialize());
app.use(passport.session());


function isLoggedin(req, res, next) {
    req.user ? next() : res.sendStatus(401);
}

// For cookie
app.use(cookieParser());

app.get('/auth/google',
    passport.authenticate('google', { scope: ['email', 'profile'] })
);

app.get('/auth/google/callback',
    passport.authenticate('google', {
        successRedirect: '/googleSignUp',
        failureRedirect: '/auth/google/failure'
    })
);

app.get('/auth/google/failure', isLoggedin, (req, res) => {
    console.log(session.user);
    res.redirect('/login');
})


//facebook

app.get('/auth/facebook',
  passport.authenticate('facebook', { scope: ['user_friends', 'manage_pages'] }));

app.get('/auth/facebook/callback',
  passport.authenticate('facebook', { failureRedirect: '/login' }),
  function(req, res) {
    // Successful authentication, redirect home.
    res.redirect('/facebookSignUp');
  });


//admin router
const adminRoute = require('./routes/adminRoute');
app.use('/admin', adminRoute);

//user router
const userRoute = require('./routes/userRoute');
app.use('/', userRoute);

app.set('view engine', 'ejs');
app.set('views', './views/user');



app.listen(3005, function () {
    console.log("server is running at http://localhost:3005");
});

