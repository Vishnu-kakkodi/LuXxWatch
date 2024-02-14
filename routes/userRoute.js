const express = require("express");
const user_route = express();

const session = require("express-session");

const config = require("../configuration/config");


user_route.set('view engine','ejs');
user_route.set('views','./views/user');

const bodyParser = require("body-parser");

user_route.use(bodyParser.json());
user_route.use(bodyParser.urlencoded({extended:true}));

user_route.use(express.static('public'));

// const multer = require("multer");
const path = require("path");

user_route.use(express.static('public'));

// const storage = multer.diskStorage({
//     destination:function(req,file,cb){
//         cb(null,path.join(__dirname,'../public/userImage'));
//         },
//     filename:function(req,file,cb){
//         const name = Date.now()+'-'+file.originalname;
//         cb(null,name);
//     }
// });

// const upload = multer({storage:storage});

const userController = require("../controller/userController");

user_route.use(session({
    secret: config.sessionSecret,
    resave: false,
    saveUninitialized: false 
}));


// user_route.get("/",auth.isLogout,userController.landingload);

user_route.get("/",userController.loginload);

user_route.get("/register",userController.loadRegister);

user_route.get("/otp",userController.loadOtp);

user_route.post("/resend-otp", userController.resendOTP);

user_route.post("/otp",userController.insertUser);

user_route.post("/verify",userController.getOtp);

user_route.post("/home",userController.verifyLogin);

user_route.get("/productdetails",userController.loadproductdetail);





module.exports = user_route;

