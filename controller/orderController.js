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
const Wallet = require("../model/walletModel.js");
const Coupon = require("../model/couponModel.js");
const { Long } = require('mongodb')
require("dotenv").config();
const Razorpay = require('razorpay');

var { RAZORPAY_ID_KEY, RAZORPAY_SECRET_KEY } = process.env;

var razorpayInstance = new Razorpay({
    key_id: RAZORPAY_ID_KEY,
    key_secret: RAZORPAY_SECRET_KEY
})


const deliveryCharge = async (req, res) => {
    try {
        const addressId = req.query.selectedAddressId;
        const cartId = req.query.cartId;
        const cartItems = await Cart.findOne({ _id: cartId });
        const selectedAddress = await Address.findOne({ _id: addressId });
        let deliveryCharge;
        if (selectedAddress.state === "Kerala") {
            deliveryCharge = "No Shipping charge";
        } else {
            deliveryCharge = 100;
            if (cartItems.deliveryFee === false) {
                cartItems.total += deliveryCharge;
                cartItems.deliveryFee = true;
                await cartItems.save();
            }
        }
        res.json({ success: deliveryCharge });

    } catch (error) {
        console.log(error.message);
        res.status(500).json({ error: 'Internal servor error' });
    }
}

const placeorder = async (req, res) => {
    try {
        const email = req.session.email;
        const userData = await User.findOne({ email: email });
        const { addressId, cartId, paymentOption, couponId } = req.body;
        let deliveryCharge = req.body.deliveryCharge;
        deliveryCharge = parseInt(deliveryCharge);
        console.log(paymentOption);

        const address = await Address.findById(addressId);

        if (!address) {
            return res.status(404).json({ error: 'Address not found' });
        }

        const cart = await Cart.findById(cartId).populate('products.product');
        if (!cart) {
            return res.status(404).json({ error: 'Cart not found' });
        }

        let couponStatus;
        let couponDetail;
        let discount;
        let total = 0;
        cart.products.forEach(product => {
            total += product.subtotal;
        });
        let grandTotal = total + deliveryCharge;

        if (couponId) {
            couponStatus = true;
            couponDetail = await Coupon.findOne({ couponId: couponId });
            discount = couponDetail.discountAmount;
            grandTotal = total - couponDetail.discountAmount
        } else {
            couponStatus = false;
            discount = 0
        }

        if (paymentOption === "Cash On Delivery") {

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
                discountAmount: discount,
                total: total,
                grandTotal: grandTotal,
                shippingAddress: address,
                paymentOption: paymentOption,
                status: 'Pending',
                orderId: orderId,
                coupon_applied: couponStatus
            });
            req.session.OrderId = orderId;
            req.session.save();

            console.log(orderId);

            const savedOrder = await order.save();

            for (const product of cart.products) {
                const orderProduct = await Product.findById(product.product._id);
                orderProduct.stock -= product.quantity;
                orderProduct.popularity++
                await orderProduct.save();
            }


            await Cart.updateOne(
                { _id: cartId },
                { $set: { products: [] } }
            );

            if (couponDetail) {
                userData.appliedCoupon.push(couponDetail.couponId)
                await userData.save()

                await Coupon.updateOne(
                    { couponId: couponId },
                    { $inc: { maximumUser: -1 } }
                )
            }

            res.json({ cod_success: true, order: savedOrder });

        } else if (paymentOption === 'Razorpay') {

            // generate orderId
            const generateOrderId = () => {
                const p = randomstring.generate({
                    length: 4,
                    charset: 'numeric'
                })
                return p;
            };

            let orderId = generateOrderId();

            req.session.OrderId = orderId;
            req.session.save();

            // Create a Razorpay order
            var options = {
                amount: grandTotal * 100,
                currency: 'INR',
                receipt: orderId
            };
            razorpayInstance.orders.create(options, function (err, order) {
                if (err) {
                    console.error('Error creating Razorpay order:', err);
                    res.status(500).json({ error: 'Error creating Razorpay order' });
                } else {
                    console.log("New Order", order);
                    res.json({ success: true, razorpay: order, id: RAZORPAY_ID_KEY });
                }
            });


        }
    } catch (error) {
        console.log(error.message);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};


const createRazorpayOrder = async (req, res) => {
    try {
        console.log("jjjjjjjjjjjjj");
        const { selectedAddressId, cartId, selectedPaymentOption, couponId } = req.body;
        const address = await Address.findById(selectedAddressId);
        const cart = await Cart.findById(cartId).populate('products.product');
        let couponStatus;
        let couponDetail;
        let discount;

        if (couponId) {
            couponStatus = true;
            couponDetail = await Coupon.findOne({ couponId: couponId });
            discount = couponDetail.discountAmount;
        } else {
            couponStatus = false;
            discount = 0
        }
        const order = new Order({
            user: cart.user,
            products: cart.products,
            discountAmount: discount,
            total: cart.total,
            grandTotal: (req.body.order.amount) / 100,
            shippingAddress: address,
            paymentOption: selectedPaymentOption,
            status: "Placed",
            orderId: req.body.order.receipt,
            coupon_applied: couponStatus
        });

        await order.save();

        for (const product of cart.products) {
            const orderProduct = await Product.findById(product.product._id);
            orderProduct.stock -= product.quantity;
            orderProduct.popularity++
            await orderProduct.save();
        }


        await Cart.updateOne(
            { _id: cartId },
            { $set: { products: [] } }
        );

        res.json({ razorpay_success: true });
        console.log("555555555555");

    } catch (error) {
        console.log(error.message);
    }
}






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
        orderDetails.refund = '0'

        for (const product of orderDetails.products) {
            const orderProduct = await Product.findById(product.product._id);
            orderProduct.stock += product.quantity;
            await orderProduct.save();
        }


        await orderDetails.save();
        res.status(200).json({ success: 'Cancelled', cancelRefund: 'Refund is underprocess' });

    } catch (error) {
        console.error('Error fetching order page data:', error);
        res.status(500).send('Internal Server Error');
    }
}


const returnOrder = async (req, res) => {
    const orderId = req.params.orderId;
    const { notes } = req.body;
    console.log(notes);
    try {
        const email = req.session.email;
        const userData = await User.findOne({ email: email });
        const categories = await Category.find();
        const orderDetails = await Order.findOne({ _id: orderId }).populate('products.product');
        orderDetails.resonOfcancel = notes;
        orderDetails.status = 'Returned';
        orderDetails.refund = '0'

        for (const product of orderDetails.products) {
            const orderProduct = await Product.findById(product.product._id);
            orderProduct.stock += product.quantity;
            await orderProduct.save();
        }


        await orderDetails.save();
        res.status(200).json({ success: 'Returned', returnRefund: 'Refund is underprocess' });

    } catch (error) {
        console.error('Error fetching order page data:', error);
        res.status(500).send('Internal Server Error');
    }
}











module.exports = {

    deliveryCharge,
    placeorder,
    createRazorpayOrder,
    Orderpage,
    viewOrder,
    cancelOrder,
    returnOrder

}