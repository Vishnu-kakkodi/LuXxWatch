const Product = require("../model/productModel.js");
const Category = require("../model/categoryModel.js");
const bcrypt = require('bcrypt');
// const session = require("express-session")

const config = require("../configuration/config");
const randomstring = require("randomstring");






const loadproduct = async(req,res)=>{
    try{ 
        const products = await Product.find();
        const categories = await Category.find();     
        res.render('product', { products,categories });
    }catch(error){
        console.log(error.message);
    }
}


const loadaddproduct = async(req,res)=>{
    try{ 
        const categories = await Category.find();     
        res.render('add-product', { categories });
    }catch(error){
        console.log(error.message);
    }
}


const createProduct = async(req,res)=>{
    
    try{
        console.log("hai");
        const {brandname, productname, description, price, offprice, } = req.body;

        console.log(req.body.categories);


        
        const imageFileNames = req.files.map(file => file.filename);

        const product = new Product({
            brandname,
            productname,
            catname:req.body.catname,
            description,
            price,
            offprice,
            image:imageFileNames
         
        });

        console.log(product);

        const savedProduct = await product.save();
        if (savedProduct) {
            const products = await Product.find();
            res.render('product', { products: products });
        }
    }catch(error){
        console.log(error.message);
    }
}


module.exports = {

    loadproduct,
    loadaddproduct,
    createProduct
}