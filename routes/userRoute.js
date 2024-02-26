const express = require("express");
const user_route = express();
const session = require("express-session");
const config = require("../configuration/config");
user_route.set('view engine','ejs');
user_route.set('views','./views/user');
user_route.set('index.ejs');
const bodyParser = require("body-parser");
user_route.use(bodyParser.json());
user_route.use(bodyParser.urlencoded({extended:true}));
user_route.use(express.static('public'));
const userController = require("../controller/userController");
const auth = require("../middleware/userAuth");

user_route.use(session({
    secret: config.sessionSecret,
    resave: false,
    saveUninitialized: false 
}));



// user_route.get("/",auth.isLogout,userController.landingload);

user_route.get("/",auth.isLogout,userController.loginload);
user_route.get("/login",auth.isLogout,userController.loginload);

user_route.get("/register",auth.isLogout,userController.loadRegister);

user_route.post("/otp",userController.insertUser);

user_route.get("/otp",auth.isLogout,userController.loadOtp);

user_route.post("/resend-otp", userController.resendOTP);

user_route.post("/verify",userController.getOtp);

user_route.post("/home",userController.verifyLogin);

user_route.get("/home",auth.isLogin,userController.loadhome);

user_route.get('/logout',auth.isLogin,userController.userLogout);

user_route.get('/profile',auth.isLogin,userController.profile);

user_route.post('/editname/:userId',userController.editname);

user_route.post('/editmobile/:userId',userController.editmobile);

user_route.get('/addAddress',auth.isLogin,userController.addAddress);

user_route.post('/createAddress',userController.createAddress);

user_route.get('/editpage/:addressId',auth.isLogin,userController.editpage);

user_route.post('/editAddress/:addressId',userController.editAddress);

user_route.get('/deleteAddress/:addressId',auth.isLogin,userController.deleteAddress);

user_route.post('/cPassword/:userId',userController.cPassword);

user_route.get('/forgot',auth.isLogout,userController.forgetLoad);

user_route.get('/forgototp',auth.isLogout,userController.forgototp);

user_route.post('/forgototp',userController.passwordchange);

user_route.post("/confirmotp",userController.verifyotp);

user_route.get("/changepassword",userController.changepassword)

user_route.post("/changepassword",userController.newPassword)

user_route.get("/productdetails",auth.isLogin,userController.loadproductdetail);

user_route.get("/shop",auth.isLogin,userController.shop);

user_route.get("/contact",auth.isLogin,userController.contact);


//------------- cart management -----------------//

user_route.get('/cart',auth.isLogin,userController.cartpage);

user_route.get('/add-cart/:productId',auth.isLogin,userController.addTocart);





module.exports = user_route;

