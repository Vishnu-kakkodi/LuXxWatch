const Product = require("../model/productModel.js");
const Category = require("../model/categoryModel.js");
const bcrypt = require('bcrypt');
// const session = require("express-session")

const config = require("../configuration/config");
const randomstring = require("randomstring");






const loadproduct = async(req,res)=>{
    try{ 
        const categories = await Category.find();     
        res.render('product', { categories });
    }catch(error){
        console.log(error.message);
    }
}


const addproduct = async(req,res)=>{
    try{ 
        const categories = await Category.find();     
        res.render('add-product', { categories });
    }catch(error){
        console.log(error.message);
    }
}


module.exports = {

    loadproduct,
    addproduct
}