
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
const Order = require("../model/orderModel.js");
const { Long } = require('mongodb')
const Razorpay = require('razorpay');
require("dotenv").config();

var {RAZORPAY_ID_KEY, RAZORPAY_SECRET_KEY} = process.env;

var razorpayInstance = new Razorpay({
    key_id: RAZORPAY_ID_KEY,
    key_secret: RAZORPAY_SECRET_KEY
})






const createRazorpayOrder = async (req, res) => {
    try {
        const { cartId } = req.params;

        // Retrieve cart details
        const cart = await Cart.findById(cartId).populate('products.product');
        if (!cart) {
            return res.status(404).json({ error: 'Cart not found' });
        }

        // Calculate total amount
        let total = 0;
        cart.products.forEach(product => {
            total += product.subtotal;
        });

        // Create a Razorpay order
        var options = {
            amount: total * 100, // Amount in paisa
            currency: 'INR',
            receipt: 'order_receipt' // Unique receipt identifier
        };
        const order = await razorpayInstance.orders.create(options);

        // Save the order details to the session
        req.session.orderId = order.id;
        req.session.save();

        res.render('razorpay_payment_form', { orderId: order.id, amount: order.amount });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};


module.exports = {

    createRazorpayOrder

}