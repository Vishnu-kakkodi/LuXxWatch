
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
const { Long } = require('mongodb')
require("dotenv").config();
const Razorpay = require('razorpay');

var {RAZORPAY_ID_KEY, RAZORPAY_SECRET_KEY} = process.env;

var razorpayInstance = new Razorpay({
    key_id: RAZORPAY_ID_KEY,
    key_secret: RAZORPAY_SECRET_KEY
})




const addWallet = async (req, res) => {
    try {

        const amount = req.body.amount;

        const generateOrderId = () => {
            const p = randomstring.generate({
                length: 4,
                charset: 'numeric'
            })
            return p;
        };

        let orderId = generateOrderId();

        // Create a Razorpay order
        var options = {
            amount: amount*100, 
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


        } catch (error) {
        console.log(error.message);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};





const walletMoney = async (req, res) => {
    try {
        const email = req.session.email;
        const userData = await User.findOne({ email: email });

        const wallet = await Wallet.findOne({ user: userData._id });

        let balance = wallet ? wallet.walletbalance : 0;
        balance = balance + req.body.order.amount;

        if (wallet) {
            wallet.walletbalance = balance;
            wallet.transationHistory.push({
                createdAt: Date.now(),
                paymentType: "Razorpay",
                transationMode: "Credit",
                transationamount: req.body.order.amount
            });
            await wallet.save();
        } else {
            const newWallet = new Wallet({
                user: userData._id,
                walletbalance: balance,
                transationHistory: [{
                    createdAt: Date.now(),
                    paymentType: "Razorpay",
                    transationMode: "Credit",
                    transationamount: req.body.order.amount
                }],
                totalRefund: 0
            });
            await newWallet.save();
        }

        res.json({ razorpay_success: true });

    } catch (error) {
        console.log(error.message);
    }
};


const cancelRefund = async (req,res)=>{
    try{
        const orderId = req.params.orderId;
        console.log(orderId);
        const order = await Order.findOne({_id: orderId}).populate('user');
        const wallet = await Wallet.findOne({ user: order.user });
        wallet.walletbalance = wallet.walletbalance + order.grandTotal;
        wallet.transationHistory.push({
            createdAt: Date.now(),
            paymentType: "Refund",
            transationMode: "Credit",
            transationamount: order.grandTotal
        });
        let refund = wallet ? wallet.totalRefund : 0;
        refund = refund + order.grandTotal;
        wallet.totalRefund = refund;
        await wallet.save();
        order.refund = "1";
        await order.save();
        res.json({success: true})
    }catch(error){
        console.log(error.message);
    }
}


module.exports = {

    addWallet,
    walletMoney,
    cancelRefund

}