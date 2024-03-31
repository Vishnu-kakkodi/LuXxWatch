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
            console.log("kjkjkj");

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
            console.log("kjkjkj");

            const order = new Order({
                user: cart.user,
                products: cart.products,
                discountAmount: discount,
                total: cart.total,
                grandTotal: grandTotal,
                shippingAddress: address,
                paymentOption: "Razorpay",
                status: "Payment pending",
                orderId: orderId,
                coupon_applied: couponStatus
            });
            console.log("kjkjkj");
    
            await order.save();
            console.log("kjkjkj");

            // Create a Razorpay order
            var options = {
                amount: grandTotal * 100,
                currency: 'INR',
                receipt: orderId
            };
            razorpayInstance.orders.create(options, function (err, order) {
                if (err) {
                    console.error('Error creating Razorpay order:', err);
                    res.status(400).json({ error: 'Error creating Razorpay order' });
                } else {
                    console.log("New Order", order);
                    res.status(200).json({ success: true, razorpay: order, id: RAZORPAY_ID_KEY });
                }
            });

            await Cart.updateOne(
                { _id: cartId },
                { $set: { products: [] } }
            );

        }
    } catch (error) {
        console.log(error.message);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};


const createRazorpayOrder = async (req, res) => {
    try {
        console.log("jjjjjjjjjjjjj");
        const { cartId } = req.body;
        const orderId = req.body.order.receipt;
        const order = await Order.findOne({orderId:orderId});
        const cart = await Cart.findById(cartId).populate('products.product');
        order .status = "Placed"

        await order.save();

        for (const product of cart.products) {
            const orderProduct = await Product.findById(product.product._id);
            orderProduct.stock -= product.quantity;
            orderProduct.popularity++
            await orderProduct.save();
        }

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
        orderDetails.status = 'Return under processing';
        orderDetails.refund = '0'

        for (const product of orderDetails.products) {
            const orderProduct = await Product.findById(product.product._id);
            orderProduct.stock += product.quantity;
            await orderProduct.save();
        }


        await orderDetails.save();
        res.status(200).json({ success: 'Return under processing', returnRefund: 'Refund is underprocess' });

    } catch (error) {
        console.error('Error fetching order page data:', error);
        res.status(500).send('Internal Server Error');
    }
}

const trackOrder = async (req, res) => {
    try {
        const Id = req.query.orderId.trim(); 
        
        const order = await Order.findOne({ _id: Id });
        console.log(order);
        res.render('orderTracking', { order: order });
    } catch (error) {
        console.log(error.message);
    }
}


const continuePayment = async (req, res) => {
    try {
        const orderId = req.body.orderId;

        const order =  await Order.findOne({ orderId: orderId }).populate('products.product');

        

        order.products.forEach(item=>{
            console.log("ppppppppppp");
            if(item.product.stock < item.quantity){
                console.log("lllllooooo");
                res.status(400).json({error:'Out of stock'});
            }
        })

        let grandTotal = order.grandTotal;

        if (order.paymentOption === 'Razorpay') {

            // Create a Razorpay order
            var options = {
                amount: grandTotal * 100,
                currency: 'INR',
                receipt: orderId
            };
            razorpayInstance.orders.create(options, function (err, order) {
                if (err) {
                    console.error('Error creating Razorpay order:', err);
                    res.status(400).json({ error: 'Error creating Razorpay order' });
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


const RazorpayOrder = async (req, res) => {
    console.log("hhhhh")
    try {
        const orderId = req.body.order.receipt;
        const order = await Order.findOne({orderId:orderId});
        console.log(order);
        order.status = "Placed"

        await order.save();

        for (const product of order.products) {
            const orderProduct = await Product.findById(product.product._id);
            orderProduct.stock -= product.quantity;
            orderProduct.popularity++
            await orderProduct.save();
        }

        res.json({ razorpay_success: true });

    } catch (error) {
        console.log(error.message);
    }
}












async function deletePendingOrders() {
    try {
        await Order.deleteMany({ status: 'Payment pending' });
        console.log('Payment pending orders deleted successfully');
    } catch (error) {
        console.error('Error deleting payment pending orders:', error);
    }
}
const delayInMilliseconds = 24 * 60 * 60 * 1000;
setTimeout(deletePendingOrders, delayInMilliseconds);





module.exports = {

    deliveryCharge,
    placeorder,
    createRazorpayOrder,
    Orderpage,
    viewOrder,
    cancelOrder,
    returnOrder,
    trackOrder,
    continuePayment,
    RazorpayOrder

}