const User = require("../model/userModel");
const Order = require("../model/orderModel");
const Wallet = require("../model/walletModel");
const Coupon = require("../model/couponModel");
const bcrypt = require('bcrypt');

const securePassword = async (password) => {
    try {
        const passwordHash = await bcrypt.hash(password, 10);
        return passwordHash;
    } catch (error) {
        console.log(error.message);
    }
}

const loadLogin = async (req, res) => {
    try {
        res.render('login');
    } catch (error) {
        console.log(error.message);
    }
}

const verifyLogin = async (req, res) => {
    try {
        const email = req.body.email;
        const password = req.body.password;

        const userData = await User.findOne({ email: email });
        if (userData) {
            const passwordMatch = await bcrypt.compare(password, userData.password);
            if (passwordMatch) {
                if (userData.is_admin === 0) {
                    res.render('login');
                } else {
                    req.session.user_id = userData._id;
                    res.redirect("/admin/home");
                }
            } else {
                res.render('login');
            }
        } else {
            res.render('login');
        }

    } catch (error) {
        console.log(error.message);
    }
}

const loadDashboard = async (req, res) => {
    try {
        const userData = await User.findById({ _id: req.session.user_id });
        res.render('home', { admin: userData });
    } catch (error) {
        console.log(error.message);
    }
}


const adminLogout = async(req,res)=>{

    try{
        req.session.destroy();
        res.redirect('/');
    }catch(error){
        console.log(error.message)
    }
}


// ---------------list-user-----------------//

const userAccount = async (req, res) => {
    try {
        const usersData = await User.find({ is_admin: 0 });
        res.render('user-account', { users: usersData });
    } catch (error) {
        console.log(error.message);
    }
}


// ---------------list-user-----------------//

const userBlock = async (req, res) => {

    const userId = req.params.userId;
    console.log("hai");

    try {
        const user = await User.findById(userId);
        console.log(user);

        user.is_blocked = 1;
        await user.save();
        await User.findByIdAndUpdate(userId, { $set: { is_blocked: 1 } });
        res.redirect('/admin/user-account');
    } catch (error) {
        console.log(error.message);
    }

}


const userunBlock = async (req, res) => {

    const userId = req.params.userId;

    try {
        const user = await User.findById(userId);
        user.is_blocked = 0;
        await user.save();
        await User.findByIdAndUpdate(userId, { $set: { is_blocked: 0 } });
        res.redirect('/admin/user-account');

    } catch (error) {
        console.log(error.message);
    }
}


// ---------------list-order-----------------//


const orderList = async (req,res)=>{
    try{
        const orders = await Order.find().populate('products.product').populate('user');
        res.render('listOrder', {orders});

    }catch(error){
        console.log(error.message);
    }
}


const detailedOrder = async (req,res)=>{
    const orderId = req.query.orderId;
    try{
        const orders = await Order.findOne({_id:orderId}).populate('products.product').populate('user');
        res.render('detailedOrder', { orders});

    }catch(error){
        console.log(error.message);
    }
}


const ChangeStatus = async (req,res)=>{
    const orderId = req.params.orderId;
    const { action } = req.body;
    try{
        const order = await Order.findOne({_id:orderId});
        order.status = action;
        const newStatus = order.status;
        await order.save();
        return res.status(200).json({newStatus});

    }catch(error){
        console.log(error.message);
        res.status(500).json({ error: 'Internal Server Error' });
    }
}


const saleReport = async(req,res)=>{
    try{
        res.render('salesreport');
    }catch(error){
        console.log(error.message);
    }
}


const couponPage = async(req,res)=>{
    try{
        const coupon = await Coupon.find();
        res.render('coupon',{coupon});
    }catch(error){
        console.log(error.message);
    }
}


const addCoupon = async(req,res)=>{
    try{
        const {couponId,description,maximumDiscount,minimumAmount,maximumAmount,expireDate,maximumUser,discountAmount} = req.body;
        const coupon = new Coupon ({
            couponId,
            description,
            maximumDiscount,
            minimumAmount,
            maximumAmount,
            expireDate,
            is_active:1,
            maximumUser,
            discountAmount,
            maximumUser
        })
        await coupon.save();
        res.json({ success: true });
    }catch(error){
        console.log(error.message);
    }
}


const blockCoupon = async(req,res)=>{
    try{
        const couponId = req.params.couponId;
        const coupon = await Coupon.findById({_id:couponId})
        coupon.is_active = 0
        await coupon.save();
        await Coupon.findByIdAndUpdate(couponId, { $set: { is_active: 0 } });
        res.status(200).json({ Success: true });
    }catch(error){
        console.log(error.message);
        res.status(500).json({ error: 'Failed to block' });
    }
}


const unblockCoupon = async(req,res)=>{
    try{
        const couponId = req.params.couponId;
        const coupon = await Coupon.findById({_id:couponId})
        coupon.is_active = 1
        await coupon.save();
        await Coupon.findByIdAndUpdate(couponId, { $set: { is_active: 1 } });
        res.status(200).json({ Success: true });
    }catch(error){
        console.log(error.message);
        res.status(500).json({ error: 'Failed to unblock' });
    }
}


module.exports = {
    securePassword,
    loadLogin,
    verifyLogin,
    loadDashboard,
    adminLogout,
    userAccount,
    userBlock,
    userunBlock,
    orderList,
    detailedOrder,
    ChangeStatus,
    saleReport,
    couponPage,
    addCoupon,
    blockCoupon,
    unblockCoupon
}