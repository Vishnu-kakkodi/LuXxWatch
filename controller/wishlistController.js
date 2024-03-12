const User = require('../model/userModel')
const Product = require("../model/productModel.js")
const session = require("express-session")
const bcrypt = require("bcrypt")
const nodemailer = require("nodemailer")
const randomstring = require('randomstring');
const config=require("../configuration/config");
const express = require('express');
const bodyParser = require('body-parser');
const app = express();
const Category = require("../model/categoryModel.js");
const Address = require("../model/addressModel.js");
const Cart = require("../model/cartModel.js");
const Order = require("../model/orderModel.js");
const Wishlist = require("../model/wishlistModel.js");
const { Long } = require('mongodb')




const wishlist = async(req,res)=>{
    try{
        const email = req.session.email;
        const categories = await Category.find();
        const userData = await User.findOne({email:email});
        const wishlistItems = await Wishlist.findOne({ user: userData._id }).populate('products.product').populate('user');
        res.render('wishlist',{categories,userData,wishlistItems});
    }catch(error){
        console.log(error.message);
    }
}


const addTowishlist = async (req, res) => {
    const productId = req.params.productId;
    try {
            const wishlistProduct = {
                product: productId
            };
    
            let wishlist = await Wishlist.findOne({ user: req.session.userId });
            if (!wishlist) {
                wishlist = new Wishlist({ user: req.session.userId, products: [] });
            }
    
            const existingProductIndex = wishlist.products.findIndex(p => p.product.toString() === productId);
            if (existingProductIndex !== -1) {
                return res.status(400).json({error: 'Already added to wishlist'})
            } else {
                wishlist.products.push(wishlistProduct);
            }
    
            await wishlist.save();

            res.status(200).json({success: 'Successfully added to wishlist' });
    
        } catch (error) {
        console.log(error.message);
        return res.status(500).json({ error: 'Internal Server Error' });
    }
};


const removewishlistItem = async (req, res) => {
    const { productId, wishlistId } = req.query;
    try {
        await Wishlist.updateOne(
            { _id: wishlistId },
            { $pull: { products: { product: productId } } } 
        );
        res.status(200).json({});
    } catch (error) {
        console.log(error.message);
        res.status(500).json({ error: 'Internal Server Error' });
    }

};





module.exports={
    wishlist,
    addTowishlist,
    removewishlistItem
}