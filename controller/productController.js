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


const loadeditProduct = async (req, res) => {
    const productId = req.query.productId;
    try {
        console.log("heee");
        const products = await Product.findById(productId);
        if (!products) {
            // Handle the case when no product is found
            return res.status(404).render('error', { message: 'Product not found' });
        }
        res.render('edit-product', { products:products });
    } catch (error) {
        console.log(error.message);
        res.status(500).render('error', { message: 'Internal Server Error' });
    }
};

const softDeleteproduct = async(req,res)=>{
    const productId = req.params.productId;

    try {
        const products = await Product.findById(productId);
        if (!products) {
            return res.status(404).send('products not found');
        }

        
        products.is_active = 1;
        await products.save();
        await Product.findByIdAndUpdate(productId, { $set: { is_active: 1 } });

        res.redirect('/admin/product');
    } catch (error) {
        console.error(error);
        res.status(500).send('Internal Server Error');
    }
};


const deleteproduct = async(req,res)=>{
    const productId = req.params.productId;
    try{
        await Product.findByIdAndDelete(productId);
        res.redirect('/admin/product');
    }catch(error){
        console.log(error.message);
        res.status(500).send('Internal Server Error');
    }   
}



module.exports = {

    loadproduct,
    loadaddproduct,
    createProduct,
    loadeditProduct,
    softDeleteproduct,
    deleteproduct
}