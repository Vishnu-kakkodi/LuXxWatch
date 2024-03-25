const express = require('express');
const admin_route = express();

const session = require('express-session');
const config = require('../configuration/config');
const multer = require("multer");
const bodyParser = require('body-parser');
admin_route.use(bodyParser.json());
admin_route.use(bodyParser.urlencoded({extended:true}));
admin_route.set('view engine','ejs');
admin_route.set('views','./views/admin');
const path = require("path");
admin_route.use(express.static('public'));
const storage = multer.diskStorage({

    destination:function(req,file,cb){
        cb(null,path.join(__dirname,'../public/productImages'));
        },
    filename:function(req,file,cb){
        const name = Date.now()+'-'+file.originalname;
        cb(null,name);
    }
});
const upload = multer({storage:storage});


const adminController = require("../controller/adminController");

const categoryController = require("../controller/categoryController");

const productController = require("../controller/productController");

const paymentController = require("../controller/paymentController");

const auth = require("../middleware/adminAuth");

admin_route.use(session({
    secret: config.sessionSecret,
    resave: false,
    saveUninitialized: false 
}));

admin_route.get("/",auth.isLogout,adminController.loadLogin);

admin_route.post("/",adminController.verifyLogin);

admin_route.get('/home',auth.isLogin,adminController.loadDashboard);

admin_route.get('/logout',auth.isLogin,adminController.adminLogout);

// -------------list-user-----------------//


admin_route.get("/user-account",auth.isLogin,adminController.userAccount);


// -------------block-user-----------------//

admin_route.get("/user-block/:userId",auth.isLogin,adminController.userBlock);

// -------------unblock-user-----------------//

admin_route.get("/user-unblock/:userId",auth.isLogin,adminController.userunBlock);


// -------------loadCategory-----------------//

admin_route.get("/category",auth.isLogin,categoryController.loadcategory);

admin_route.get("/categoryInsert",auth.isLogin,categoryController.categoryInsert);


// -------------addCategory-----------------//

admin_route.post("/add-category",upload.single('image'),categoryController.addcategory);

// admin_route.post("/validateCategoryName",categoryController.categoryName)



// -------------editCategory-----------------//
admin_route.get("/edit-category/:categoryId",auth.isLogin, categoryController.loadeditcategory);

admin_route.post("/categoryimage/:categoryId",categoryController.categoryimage);

admin_route.post("/update-category/:categoryId",upload.single('image'), categoryController.updatecategory);


// -------------enableCategory-----------------//
admin_route.get("/enableCategory/:categoryId",auth.isLogin, categoryController.enableCategory);


// -------------disableCategory-----------------//
admin_route.get("/disableCategory/:categoryId",auth.isLogin, categoryController.disableCategory);


// -------------deleteCategory-----------------//
// admin_route.get("/delete-category/:categoryId",auth.isLogin, categoryController.deleteCategory);



// -------------load Productlist page-----------------//

admin_route.get("/productlist",auth.isLogin,productController.productlist);



// -------------loadProduct-----------------//

admin_route.get("/product",auth.isLogin,productController.loadproduct);


// -------------loadaddProduct-----------------//

admin_route.get("/add-product",auth.isLogin,productController.loadaddproduct);


// -------------createaddProduct-----------------//


admin_route.post("/create-product", upload.array('image', 5), productController.createProduct);


// -------------editProduct-----------------//


admin_route.get("/edit-product/:productId",auth.isLogin, productController.loadeditProduct);

// -------------UpdateProduct-----------------//


admin_route.post("/editProduct/:productId", productController.updateproduct);

admin_route.patch("/replaceImage", productController.replaceImage);

admin_route.post("/addImage",upload.single('file'),productController.addImage);


// -------------enableProduct-----------------//


admin_route.get("/enableProduct/:productId",auth.isLogin, productController.enableProduct);

// -------------disableProduct-----------------//


admin_route.get("/disableProduct/:productId",auth.isLogin, productController.disableProduct);

// -------------DeleteProduct-----------------//


// admin_route.get("/delete-product/:productId",auth.isLogin, productController.deleteproduct);


// -------------Order management-----------------//


admin_route.get("/orderlist",auth.isLogin, adminController.orderList);

admin_route.get("/detailedOrder", auth.isLogin, adminController.detailedOrder);

admin_route.put("/changeStatus/:orderId", auth.isLogin, adminController.ChangeStatus);

// -------------cancelRefund-----------------//


admin_route.get("/cancelRefund/:orderId",auth.isLogin, paymentController.cancelRefund);


// -------------salesReport-----------------//

admin_route.get("/salereport",auth.isLogin, adminController.saleReport);

admin_route.post("/filterReport",auth.isLogin, adminController.filterReport);

admin_route.post("/customReport",auth.isLogin, adminController.customReport);


// -------------CouponManagement-----------------//

admin_route.get("/coupon",auth.isLogin, adminController.couponPage);

admin_route.post("/addcoupon",auth.isLogin, adminController.addCoupon);

admin_route.get("/blockCoupon/:couponId",auth.isLogin, adminController.blockCoupon);

admin_route.get("/UnblockCoupon/:couponId",auth.isLogin, adminController.unblockCoupon);

admin_route.delete("/deleteCoupon/:couponId",auth.isLogin, adminController.deleteCoupon);


// -------------OfferManagement-----------------//

admin_route.get("/productoffer",auth.isLogin, adminController.offerPage);

admin_route.post("/offerModule/:productId",auth.isLogin, adminController.offerModule);

admin_route.get("/categoryOffer",auth.isLogin, adminController.categoryOffer);

admin_route.post("/categoryOffer/:categoryId",auth.isLogin, adminController.applyCategory);


admin_route.get('*',(req,res)=>{
    res.redirect('/admin')
})


module.exports = admin_route;