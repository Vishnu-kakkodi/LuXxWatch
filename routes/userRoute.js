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
const cartController = require("../controller/cartController");
const orderController = require("../controller/orderController");
const wishlistController = require("../controller/wishlistController");
const paymentController = require("../controller/paymentController");
const auth = require("../middleware/userAuth");
const nocache = require("../middleware/setNoCache");

user_route.use(session({
    secret: config.sessionSecret,
    resave: false,
    saveUninitialized: false 
}));



// user_route.get("/",auth.isLogout,userController.landingload);

user_route.get("/",nocache.user, auth.isLogout,userController.loginload);
user_route.get("/login",nocache.user, auth.isLogout,userController.loginload);

user_route.get("/register",nocache.user, auth.isLogout,userController.loadRegister);

user_route.post("/otp",nocache.user, userController.insertUser);

user_route.get("/otp",nocache.user, auth.isLogout,userController.loadOtp);

user_route.get("/resend-otp", nocache.user, userController.resendOTP);

user_route.post("/verify",nocache.user, nocache.user, userController.getOtp);

user_route.post("/home",nocache.user, userController.verifyLogin);

user_route.get("/home",nocache.user, auth.isLogin,userController.loadhome);

user_route.get('/logout',nocache.user, auth.isLogin,userController.userLogout);

user_route.get('/profile',nocache.user, auth.isLogin,userController.profile);

user_route.post('/editname/:userId',nocache.user,nocache.user, userController.editname);

user_route.post('/editmobile/:userId',nocache.user,userController.editmobile);

user_route.get('/addAddress',nocache.user,auth.isLogin,userController.addAddress);

user_route.post('/createAddress',nocache.user,userController.createAddress);

user_route.get('/editpage/:addressId',nocache.user,auth.isLogin,userController.editpage);

user_route.post('/editAddress/:addressId',nocache.user,userController.editAddress);

user_route.get('/deleteAddress/:addressId',nocache.user,auth.isLogin,userController.deleteAddress);

user_route.post('/cPassword/:userId',nocache.user,userController.cPassword);

user_route.get('/forgot',nocache.user,auth.isLogout,userController.forgetLoad);

user_route.get('/forgototp',nocache.user,auth.isLogout,userController.forgototp);

user_route.post('/forgototp',nocache.user,userController.passwordchange);

user_route.post("/confirmotp",nocache.user,userController.verifyotp);

user_route.get("/changepassword",nocache.user,userController.changepassword)

user_route.post("/changepassword",nocache.user,userController.newPassword)

user_route.get("/productdetails",nocache.user,auth.isLogin,userController.loadproductdetail);

user_route.get("/shop",nocache.user,auth.isLogin,userController.shop);

user_route.get("/contact",nocache.user,auth.isLogin,userController.contact);


//------------- cart management -----------------//

user_route.get('/cart',nocache.user,auth.isLogin,cartController.cartpage);

user_route.get('/add-cart/:productId',nocache.user,auth.isLogin,cartController.addTocart);

user_route.patch('/update-quantity/:productId',nocache.user,auth.isLogin,cartController.changeQuantity);


//------------- wishlist page -----------------//

user_route.get('/wishlist',nocache.user,auth.isLogin,wishlistController.wishlist);

user_route.get('/add-wishlist/:productId',nocache.user,auth.isLogin,wishlistController.addTowishlist);

user_route.delete('/remove-wishlistItem',nocache.user, auth.isLogin, wishlistController.removewishlistItem);

//------------- checkout page -----------------//

user_route.get('/checkout',nocache.user,auth.isLogin,cartController.checkoutpage);

user_route.delete('/remove-cartItem',nocache.user, auth.isLogin, cartController.removeCartItem);

user_route.delete('/removeall',nocache.user, auth.isLogin, cartController.removeall);

user_route.post('/shipAddress',nocache.user,cartController.shipAddress);

// user_route.get('/placeorder', auth.isLogin, cartController.placeorder);

user_route.get('/addressEdit/:addressId',nocache.user,auth.isLogin,cartController.editpage);

user_route.post('/checkoutAddress_edit/:addressId',nocache.user,cartController.editAddress);





//------------- order page -----------------//

user_route.post('/placeorder',nocache.user,auth.isLogin,orderController.placeorder);

user_route.get('/orderpage',nocache.user,auth.isLogin,orderController.Orderpage);

user_route.get('/orderView',nocache.user,auth.isLogin,orderController.viewOrder);

user_route.post('/verifyPayment', nocache.user, auth.isLogin, orderController.createRazorpayOrder);



//------------- cancel Order -----------------//

user_route.post('/cancelOrder/:orderId',nocache.user,auth.isLogin,orderController.cancelOrder);


// -------------SortPrice-----------------//

user_route.get("/sortPriceLH",nocache.user, auth.isLogin, userController.shop);

user_route.get("/sortPriceHL",nocache.user, auth.isLogin, userController.shop);

user_route.get("/sortAZ",nocache.user, auth.isLogin, userController.shop);

user_route.get("/sortZA",nocache.user, auth.isLogin, userController.shop);

user_route.get("/sortNA",nocache.user, auth.isLogin, userController.shop);


// -------------filter-----------------//


user_route.get("/brandFilter",nocache.user, auth.isLogin, userController.shop);

user_route.get("/categoryFilter",nocache.user, auth.isLogin, userController.shop);



module.exports = user_route;

