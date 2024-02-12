const express = require('express');
const admin_route = express();

const session = require('express-session');
const config = require('../configuration/config');


const bodyParser = require('body-parser');
admin_route.use(bodyParser.json());
admin_route.use(bodyParser.urlencoded({extended:true}));

admin_route.set('view engine','ejs');
admin_route.set('views','./views/admin');

const path = require("path");

admin_route.use(express.static('public'));

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

// const auth = require("../middleware/adminAuth");

const adminController = require("../controller/adminController");

const categoryController = require("../controller/categoryController");

const productController = require("../controller/productController")

admin_route.use(session({
    secret: config.sessionSecret,
    resave: false,
    saveUninitialized: false 
}));

admin_route.get("/",adminController.loadLogin);

admin_route.post("/",adminController.verifyLogin);

admin_route.get('/home',adminController.loadDashboard);

// -------------list-user-----------------//


admin_route.get("/user-account",adminController.userAccount);


// -------------block-user-----------------//

admin_route.get("/user-block/:userId",adminController.userBlock);

// -------------unblock-user-----------------//

admin_route.get("/user-unblock/:userId",adminController.userunBlock);


// -------------loadCategory-----------------//

admin_route.get("/category",categoryController.loadcategory);


// -------------addCategory-----------------//

admin_route.post("/add-category",categoryController.addcategory);



// -------------editCategory-----------------//
admin_route.get("/edit-category/:categoryId", categoryController.loadeditcategory);


admin_route.post("/update-category/:categoryId", categoryController.updatecategory);


// -------------softdeleteCategory-----------------//
admin_route.get("/delete-category/:categoryId", categoryController.softDelete);




// -------------loadProduct-----------------//

admin_route.get("/product",productController.loadproduct);


// -------------addProduct-----------------//

admin_route.get("/add-product",productController.addproduct);



admin_route.get('*',(req,res)=>{
    res.redirect('/admin')
})


module.exports = admin_route;