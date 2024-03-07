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

// const storage1 = multer.diskStorage({
//     destination:function(req,file,cb){
//         cb(null,path.join(__dirname,'../public/categoryImages'));
//         },
//     filename:function(req,file,cb){
//         const name = Date.now()+'-'+file.originalname;
//         cb(null,name);
//     }
// });
// const uploadCategory = multer({storage:storage1});


const adminController = require("../controller/adminController");

const categoryController = require("../controller/categoryController");

const productController = require("../controller/productController");

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


// -------------addCategory-----------------//

admin_route.post("/add-category",upload.single('image'),categoryController.addcategory);



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


admin_route.post("/update-product/:productId",upload.array('image', 5), productController.updateproduct);


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



admin_route.get('*',(req,res)=>{
    res.redirect('/admin')
})


module.exports = admin_route;