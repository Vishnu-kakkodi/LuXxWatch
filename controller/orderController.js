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


const placeorder = async (req, res) => {
    try {
        const { addressId, cartId, paymentOption } = req.body;

        const address = await Address.findById(addressId);
        if (!address) {
            return res.status(404).json({ error: 'Address not found' });
        }

        const cart = await Cart.findById(cartId).populate('products.product');
        if (!cart) {
            return res.status(404).json({ error: 'Cart not found' });
        }


        let total = 0;
        cart.products.forEach(product => {
            total += product.subtotal;
        });

        const generateOrderId = () => {
            const p = randomstring.generate({
                length: 4,
                charset: 'numeric'
            })
            return p;
        };

        let orderId = generateOrderId();

        const order = new Order({
            user: cart.user,
            products: cart.products,
            total: total,
            shippingAddress: address,
            paymentOption: paymentOption,
            status: 'Pending',
            orderId: orderId
        });
        req.session.OrderId = orderId;
        req.session.save();

        console.log(orderId);

        const savedOrder = await order.save();

        await Cart.updateOne(
            { _id: cartId },
            { $set: { products: [] } }
        );


        await Cart.updateOne(
            { _id: cartId },
            { $set: { products: [] } }
        );


        res.status(200).json({ success: true, order: savedOrder });
    } catch (error) {
        console.log(error.message);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};


const Orderpage = async (req, res) => {
    try {
        const email = req.session.email;
        const userData = await User.findOne({ email: email });
        const categories = await Category.find();
        const orderId = req.session.OrderId;
        const orderDetails = await Order.findOne({ orderId: orderId }).populate('products.product');
        res.render('placeorder', { userData, categories, orderDetails });

    } catch (error) {
        console.error('Error fetching order page data:', error);
        res.status(500).send('Internal Server Error');
    }
}


const viewOrder = async (req, res) => {
    const orderId = req.query.orderId;
    try {
        const email = req.session.email;
        const userData = await User.findOne({ email: email });
        const categories = await Category.find();
        const orderDetails = await Order.findOne({ _id: orderId }).populate('products.product');
        res.render('orderDetails', { userData, categories, orderDetails });

    } catch (error) {
        console.error('Error fetching order page data:', error);
        res.status(500).send('Internal Server Error');
    }
}


const cancelOrder = async (req, res) => {
    const orderId = req.params.orderId;
    const { notes } = req.body;
    console.log(notes);
    try {
        const email = req.session.email;
        const userData = await User.findOne({ email: email });
        const categories = await Category.find();
        const orderDetails = await Order.findOne({ _id: orderId }).populate('products.product');
        orderDetails.resonOfcancel = notes;
        orderDetails.status = 'Cancelled';
        await orderDetails.save();
        res.status(200).json({ success: 'Cancelled' });

    } catch (error) {
        console.error('Error fetching order page data:', error);
        res.status(500).send('Internal Server Error');
    }
}











module.exports = {

    placeorder,
    Orderpage,
    viewOrder,
    cancelOrder

}