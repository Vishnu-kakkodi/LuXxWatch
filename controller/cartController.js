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
const Coupon = require("../model/couponModel.js");
const { Long } = require('mongodb')



//-----------------cart management-------------------//


const cartpage = async(req,res)=>{
    try{
        const email = req.session.email;
        const categories = await Category.find();
        const userData = await User.findOne({email:email});
        const cartItems = await Cart.findOne({ user: userData._id }).populate('products.product').populate('user');
        res.render('cart',{categories,userData,cartItems});
    }catch(error){
        console.log(error.message);
    }
}

const addTocart = async (req, res) => {
    const productId = req.params.productId;
    try {
        const product = await Product.findById(productId);

        if(product.stock>0){
            const cartProduct = {
                product: productId,
                quantity: 1, 
                subtotal: product.offprice 
            };
    
            let cart = await Cart.findOne({ user: req.session.userId });
            console.log("hoooo");
            if (!cart) {
                cart = new Cart({ user: req.session.userId, products: [], total: 0, coupon_applied: 'false' });
            }
            console.log("hoooo");
            await cart.save();
    
            const existingProductIndex = cart.products.findIndex(p => p.product.toString() === productId);
            if (existingProductIndex !== -1) {
                return res.status(400).json({error: 'Already added to cart'})
            } else {
                cart.products.push(cartProduct);
            }
    
            const total = cart.products.reduce((acc, product) => acc + product.subtotal, 0);
            cart.total = total;
    
            await cart.save();

            res.status(200).json({success: 'Successfully added to cart' });
    
        }else{
            return res.status(400).json({error: 'Item out of stock' });
        }
        
    } catch (error) {
        console.log(error.message);
        return res.status(500).json({ error: 'Internal Server Error' });
    }
};


const changeQuantity =  async (req, res) => {
    const productId = req.params.productId;
    const action = req.body.action; 

    try {
        const product = await Product.findById(productId);
        console.log(productId+action);
        const cartItem = await Cart.findOne({ 'products.product': productId });
        if (!cartItem) {
            return res.status(404).json({ error: 'Cart item not found' });
        }

        const productIndex = cartItem.products.findIndex(p => p.product.toString() === productId);
        if (productIndex === -1) {
            return res.status(404).json({ error: 'Product not found in cart' });
        }

        if (action === 'increment') {
            if(cartItem.products[productIndex].quantity < 5 && product.stock > cartItem.products[productIndex].quantity ){
                cartItem.products[productIndex].quantity++;
             }
            }
            
         else if (action === 'decrement') {
            if (cartItem.products[productIndex].quantity > 1) {
                cartItem.products[productIndex].quantity--;
            }
        }

        
        const newSubtotal = cartItem.products[productIndex].quantity * product.offprice;

        cartItem.products[productIndex].subtotal = newSubtotal;

        const newTotal = cartItem.products.reduce((acc, product) => acc + product.subtotal, 0);

        cartItem.total = newTotal;

        await cartItem.save();

        const CartItem = await Cart.findOne({ 'products.product': productId });

        const currentCartitem = CartItem.products[productIndex];

        const Total = CartItem.total;

        console.log(currentCartitem);

        console.log(Total);

        res.status(200).json({ currentCartitem, Total});
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};




//-----------------checkout page-------------------//


const checkoutpage = async (req,res)=>{
    try{
        console.log("hai");
        const email = req.session.email;
        const categories = await Category.find();
        const userData = await User.findOne({email:email});
        const useraddress = await Address.find({user:userData._id});
        const cartItems = await Cart.findOne({ user: userData._id }).populate('products.product');
        var totalAmount = cartItems.total;
        console.log(userData.appliedCoupon);
        const couponIds = userData.appliedCoupon.map(coupon => coupon);
        console.log(couponIds);
        let coupons;
        coupons = await Coupon.find({$and:[
            {minimumAmount:{$lte:totalAmount}},
            {maximumAmount:{$gte:totalAmount}},
            {couponId:{$nin:couponIds}}
        ]});
        console.log(coupons);
        res.render('checkout',{categories,userData,useraddress,cartItems,coupons});
        console.log("hall");
        
    }catch(error){
        console.log(error.message);
    }
}

const removeCartItem = async (req, res) => {
    const { productId, cartId } = req.query;
    try {
        await Cart.updateOne(
            { _id: cartId },
            { $pull: { products: { product: productId } } } 
        );
        res.status(200).json({});
    } catch (error) {
        console.log(error.message);
        res.status(500).json({ error: 'Internal Server Error' });
    }

};

const removeall = async (req, res) => {
    const { cartId } = req.query;
    console.log(cartId);
    try {
        await Cart.updateOne(
            { _id: cartId },
            { $set: { products: [] } }
        );
        res.status(200).json({});
    } catch (error) {
        console.log(error.message);
        res.status(500).json({ error: 'Internal Server Error' });
    }

};




const shipAddress = async(req,res)=>{

    try{
        const {name, email, mobile, pincode, locality,address,district,state,addressType } = req.body;

        const userId = req.session.userId;
        const userData = await User.findOne({_id:userId});
        const categories = await Category.find();


        console.log(userData);

        const useraddress = new Address({
            user:userId,
            name,
            mobile,
            pincode,
            locality,
            address,
            district,
            state,
            addressType
         
        });

        console.log(useraddress);

        const savedAddress = await useraddress.save();
        if (savedAddress) {
            res.redirect('/checkout');
        }
    }catch(error){
        console.log(error.message);
    }
}

const editpage = async(req,res)=>{
    const addressId = req.params.addressId;
    try{
        const email = req.session.email
        const userData = await User.findOne({email:email});
        const categories = await Category.find();
        res.locals.categories = categories;
        res.locals.userData = userData;
        const useraddress = await Address.findById({_id:addressId});
        res.render('checkoutAddress_edit',{useraddress:useraddress});
    }catch(error){
        console.log(error.message);
    }
}


const editAddress = async(req,res)=>{
    const addressId = req.params.addressId;
    const {name, email, mobile, pincode, locality,address,district,state,addressType } = req.body;

    try{
        const addres = await Address.findById(addressId);
        addres.name = name;
        addres.email = email;
        addres.mobile = mobile;
        addres.pincode = pincode;
        addres.locality = locality;
        addres.address = address;
        addres.district = district;
        addres.state = state;
        addres.addressType = addressType;
        
        await addres.save();
        await Address.findByIdAndUpdate(addressId, { $set: {
            name:addres.name,email:addres.email,mobile:addres.mobile,pincode:addres.pincode,locality:addres.locality,
            address:addres.address,district:addres.district,state:addres.state,addressType:addres.addressType
         } });
        res.redirect('/checkout');

    }catch(error){
        console.log(error.message);
    }
}



module.exports={
    cartpage,
    addTocart,
    changeQuantity,
    checkoutpage,
    removeCartItem,
    removeall,
    shipAddress,
    editpage,
    editAddress
}