const User = require('../model/userModel')
const Product = require("../model/productModel.js")
const session = require("express-session")
const bcrypt = require("bcrypt")
const nodemailer = require("nodemailer")
const randomstring = require('randomstring');
const config = require("../configuration/config");
const express = require('express');
const bodyParser = require('body-parser');
const app = express();
const Category = require("../model/categoryModel.js");
const Address = require("../model/addressModel.js");
const Cart = require("../model/cartModel.js");
const Wallet = require("../model/walletModel.js");
const Coupon = require("../model/couponModel.js");
const { Long } = require('mongodb')



//-----------------cart management-------------------//


const cartpage = async (req, res) => {
    try {
        const email = req.session.email;
        const categories = await Category.find();
        const userData = await User.findOne({ email: email });
        const cartItems = await Cart.findOne({ user: userData._id }).populate('products.product').populate('user');
        res.render('cart', { categories, userData, cartItems });
    } catch (error) {
        console.log(error.message);
    }
}

const addTocart = async (req, res) => {
    try {
        const productId = req.params.productId;
        const email = req.session.email;
        const userData = await User.findOne({ email: email });
        if (userData) {
            const product = await Product.findById(productId);

            let subtotal;
            if (product.offprice) {
                subtotal = product.offprice;
            } else {
                subtotal = product.price;
            }

            if (product.stock > 0) {
                const cartProduct = {
                    product: productId,
                    quantity: 1,
                    subtotal
                };

                let cart = await Cart.findOne({ user: req.session.userId });
                if (!cart) {
                    cart = new Cart({ user: req.session.userId, products: [], total: 0, coupon_applied: 'false' });
                }
                await cart.save();

                const existingProductIndex = cart.products.findIndex(p => p.product.toString() === productId);
                if (existingProductIndex !== -1) {
                    return res.status(409).json({ error: 'Already added to cart' })
                } else {
                    cart.products.push(cartProduct);
                }

                const total = cart.products.reduce((acc, product) => acc + product.subtotal, 0);
                cart.total = total;

                await cart.save();

                res.status(200).json({ success: 'Successfully added to cart' });

            } else {
                return res.status(409).json({ error: 'Item out of stock' });
            }
        } else {
            return res.status(404).json({ error: 'User not found' });
        }

    } catch (error) {
        console.log(error.message);
        return res.status(500).json({ error: 'Internal Server Error' });
    }
};


const changeQuantity = async (req, res) => {
    try {
        const productId = req.params.productId;
        const action = req.body.action;
        const product = await Product.findById(productId);
        const cartItem = await Cart.findOne({ 'products.product': productId });
        if (!cartItem) {
            return res.status(404).json({ error: 'Cart item not found' });
        }

        const productIndex = req.body.index;
        if (productIndex === -1) {
            return res.status(404).json({ error: 'Product not found in cart' });
        }
        if (action === 'increment') {
            if (product.stock > cartItem.products[productIndex].quantity) {
                if (cartItem.products[productIndex].quantity <= 4) {
                    cartItem.products[productIndex].quantity++;
                } else {
                    console.log("hoi");
                    return res.status(400).json({ error: 'Maximum quantity limit reached' });
                }
            } else {
                return res.status(400).json({ error: 'Out of stock' });
            }
        }

        else if (action === 'decrement') {
            if (cartItem.products[productIndex].quantity > 1) {
                cartItem.products[productIndex].quantity--;
            } else {
                return res.status(400).json({ error: 'Minimum quantity limit reached' });
            }
        } else {
            return res.status(400).json({ error: 'Invalid action' });
        }

        let newSubtotal;

        if (product.offprice) {
            newSubtotal = cartItem.products[productIndex].quantity * product.offprice;
        } else {
            newSubtotal = cartItem.products[productIndex].quantity * product.price;
        }

        cartItem.products[productIndex].subtotal = newSubtotal;

        const newTotal = cartItem.products.reduce((acc, product) => acc + product.subtotal, 0);

        cartItem.total = newTotal;

        await cartItem.save();

        const CartItem = await Cart.findOne({ 'products.product': productId });

        const currentCartitem = CartItem.products[productIndex];

        const Total = CartItem.total;

        res.status(200).json({ currentCartitem, Total });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};




//-----------------checkout page-------------------//


const checkoutpage = async (req, res) => {
    try {
        const email = req.session.email;
        const categories = await Category.find();
        const userData = await User.findOne({ email: email });
        const useraddress = await Address.find({ user: userData._id });
        const cartItems = await Cart.findOne({ user: userData._id }).populate('products.product');
        var totalAmount = cartItems.total;
        const couponIds = userData.appliedCoupon.map(coupon => coupon);
        let coupons;
        coupons = await Coupon.find({
            $and: [
                { minimumAmount: { $lte: totalAmount } },
                { maximumAmount: { $gte: totalAmount } },
                { couponId: { $nin: couponIds } }
            ]
        });
        const wallet = await Wallet.findOne({ user: userData._id });
        const walletBalance = wallet.walletbalance;
        res.render('checkout', { categories, userData, useraddress, cartItems, coupons, walletBalance });
    } catch (error) {
        console.log(error.message);
    }
}

const removeCartItem = async (req, res) => {
    try {
        const { productId, cartId } = req.query;
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
    try {
        const { cartId } = req.query;
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




const shipAddress = async (req, res) => {

    try {
        const { name, email, mobile, pincode, locality, address, district, state, addressType } = req.body;

        const userId = req.session.userId;
        const userData = await User.findOne({ _id: userId });

        const useraddress = new Address({
            user: userId,
            name,
            mobile,
            pincode,
            locality,
            address,
            district,
            state,
            addressType

        });

        const savedAddress = await useraddress.save();
        if (savedAddress) {
            res.redirect('/checkout');
        }
    } catch (error) {
        console.log(error.message);
    }
}

const editpage = async (req, res) => {
    try {
        const addressId = req.params.addressId;
        const email = req.session.email
        const userData = await User.findOne({ email: email });
        const categories = await Category.find();
        res.locals.categories = categories;
        res.locals.userData = userData;
        const useraddress = await Address.findById({ _id: addressId });
        res.render('checkoutAddress_edit', { useraddress: useraddress });
    } catch (error) {
        console.log(error.message);
    }
}


const editAddress = async (req, res) => {
    try {
        const addressId = req.params.addressId;
        const { name, email, mobile, pincode, locality, address, district, state, addressType } = req.body;
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
        await Address.findByIdAndUpdate(addressId, {
            $set: {
                name: addres.name, email: addres.email, mobile: addres.mobile, pincode: addres.pincode, locality: addres.locality,
                address: addres.address, district: addres.district, state: addres.state, addressType: addres.addressType
            }
        });
        res.redirect('/checkout');

    } catch (error) {
        console.log(error.message);
    }
}


module.exports = {
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