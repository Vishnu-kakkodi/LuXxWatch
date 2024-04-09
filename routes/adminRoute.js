const express = require('express');
const admin_route = express();

const session = require('express-session');
const config = require('../configuration/config');
const multer = require("multer");
const bodyParser = require('body-parser');
admin_route.use(bodyParser.json());
admin_route.use(bodyParser.urlencoded({ extended: true }));
admin_route.set('view engine', 'ejs');
admin_route.set('views', './views/admin');
const path = require("path");
admin_route.use(express.static('public'));
const storage = multer.diskStorage({

    destination: function (req, file, cb) {
        cb(null, path.join(__dirname, '../public/productImages'));
    },
    filename: function (req, file, cb) {
        const name = Date.now() + '-' + file.originalname;
        cb(null, name);
    }
});
const upload = multer({ storage: storage });


const adminController = require("../controller/adminController");

const categoryController = require("../controller/categoryController");

const productController = require("../controller/productController");

const paymentController = require("../controller/paymentController");

const auth = require("../middleware/adminAuth");

const nocache = require("../middleware/setNoCache");

admin_route.use(session({
    secret: config.sessionSecret,
    resave: false,
    saveUninitialized: false
}));



admin_route.get('/home', nocache.admin, auth.isLogin, adminController.loadDashboard);

admin_route.get('/logout', nocache.admin, auth.isLogin, adminController.adminLogout);

// -------------list-user-----------------//


admin_route.get("/user-account", nocache.admin, auth.isLogin, adminController.userAccount);


// -------------block-user-----------------//

admin_route.get("/user-block/:userId", nocache.admin, auth.isLogin, adminController.userBlock);

// -------------unblock-user-----------------//

admin_route.get("/user-unblock/:userId", nocache.admin, auth.isLogin, adminController.userunBlock);


// -------------loadCategory-----------------//

admin_route.get("/category", nocache.admin, auth.isLogin, categoryController.loadcategory);

admin_route.get("/categoryInsert", nocache.admin, auth.isLogin, categoryController.categoryInsert);


// -------------addCategory-----------------//

admin_route.post("/add-category", nocache.admin, upload.single('image'), categoryController.addcategory);

// admin_route.post("/validateCategoryName",categoryController.categoryName)



// -------------editCategory-----------------//
admin_route.get("/edit-category/:categoryId", nocache.admin, auth.isLogin, categoryController.loadeditcategory);

admin_route.post("/categoryimage/:categoryId", nocache.admin, categoryController.categoryimage);

admin_route.post("/update-category/:categoryId", nocache.admin, upload.single('image'), categoryController.updatecategory);


// -------------enableCategory-----------------//
admin_route.get("/enableCategory/:categoryId", nocache.admin, nocache.admin, auth.isLogin, categoryController.enableCategory);


// -------------disableCategory-----------------//
admin_route.get("/disableCategory/:categoryId", nocache.admin, auth.isLogin, categoryController.disableCategory);




// -------------load Productlist page-----------------//

admin_route.get("/productlist", nocache.admin, auth.isLogin, productController.productlist);



// -------------loadProduct-----------------//

admin_route.get("/product", nocache.admin, auth.isLogin, productController.loadproduct);


// -------------loadaddProduct-----------------//

admin_route.get("/add-product", nocache.admin, auth.isLogin, productController.loadaddproduct);


// -------------createaddProduct-----------------//


admin_route.post("/create-product", nocache.admin, upload.array('image', 5), productController.createProduct);


// -------------editProduct-----------------//


admin_route.get("/edit-product/:productId", nocache.admin, auth.isLogin, productController.loadeditProduct);

// -------------UpdateProduct-----------------//


admin_route.post("/editProduct/:productId", productController.updateproduct);

admin_route.patch("/replaceImage", productController.replaceImage);

admin_route.post("/addImage", upload.single('file'), productController.addImage);


// -------------enableProduct-----------------//


admin_route.get("/enableProduct/:productId", nocache.admin, auth.isLogin, productController.enableProduct);

// -------------disableProduct-----------------//


admin_route.get("/disableProduct/:productId", nocache.admin, auth.isLogin, productController.disableProduct);



// -------------Order management-----------------//


admin_route.get("/orderlist", nocache.admin, auth.isLogin, adminController.orderList);

admin_route.get("/detailedOrder", nocache.admin, auth.isLogin, adminController.detailedOrder);

admin_route.put("/changeStatus/:orderId", nocache.admin, auth.isLogin, adminController.ChangeStatus);

// -------------cancelRefund-----------------//


admin_route.get("/cancelRefund/:orderId", nocache.admin, auth.isLogin, paymentController.cancelRefund);


// -------------salesReport-----------------//

admin_route.get("/salereport", nocache.admin, auth.isLogin, adminController.saleReport);

admin_route.post("/filterReport", nocache.admin, auth.isLogin, adminController.filterReport);

admin_route.post("/customReport", nocache.admin, auth.isLogin, adminController.customReport);


// -------------CouponManagement-----------------//

admin_route.get("/coupon", nocache.admin, auth.isLogin, adminController.couponPage);

admin_route.post("/addcoupon", nocache.admin, auth.isLogin, adminController.addCoupon);

admin_route.get("/blockCoupon/:couponId", nocache.admin, auth.isLogin, adminController.blockCoupon);

admin_route.get("/UnblockCoupon/:couponId", nocache.admin, auth.isLogin, adminController.unblockCoupon);

admin_route.delete("/deleteCoupon/:couponId", nocache.admin, auth.isLogin, adminController.deleteCoupon);

admin_route.put("/updateCoupon", nocache.admin, auth.isLogin, adminController.updateCoupon);


// -------------OfferManagement-----------------//

admin_route.get("/productoffer", nocache.admin, auth.isLogin, adminController.offerPage);

admin_route.post("/offerModule/:productId", nocache.admin, auth.isLogin, adminController.offerModule);

admin_route.get("/categoryOffer", nocache.admin, auth.isLogin, adminController.categoryOffer);

admin_route.post("/categoryOffer/:categoryId", nocache.admin, auth.isLogin, adminController.applyCategory);


// -------------OfferManagement-----------------//

admin_route.post("/filterChart", nocache.admin, auth.isLogin, adminController.chartRender);

admin_route.get("/", nocache.admin, auth.isLogout, adminController.loadLogin);

admin_route.post("/", nocache.admin, adminController.verifyLogin);


// -------------404-page-----------------//

admin_route.get("/*", nocache.user, auth.isLogin, adminController.page_404);


module.exports = admin_route;