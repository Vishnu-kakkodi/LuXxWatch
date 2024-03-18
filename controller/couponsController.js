const Product = require("../model/productModel.js");
const Category = require("../model/categoryModel.js");
const Coupon = require("../model/couponModel.js");
const User = require("../model/userModel.js");
const Cart = require("../model/cartModel.js");



const couponPage = async (req, res) => {
    try {
        const email = req.session.email;
        const userData = await User.findOne({ email: email });
        const categories = await Category.find();
        const usedCoupons = userData.appliedCoupon.map(coupon => coupon);
        const coupons = await Coupon.find({$and:[
            {is_active:1},
            {couponId:{$nin:usedCoupons}}
        ]});
        res.render('coupons', { userData, categories, coupons });
    } catch (error) {
        console.error('Error fetching coupon page data:', error);
        res.status(500).send('Internal Server Error');
    }
}

const applyCoupon = async (req,res)=>{
    try{
        const email = req.session.email
        const userData = await User.findOne({email:email});
        const couponId = req.params.couponId;
        const cart = await Cart.findOne({user:userData._id});
        console.log(userData._id);
        const totalAmount = cart.total;
        const coupons = await Coupon.find({$and:[
            {minimumAmount:{$lte:totalAmount}},
            {maximumAmount:{$gte:totalAmount}},
        ]});

        const couponIds = coupons.map(coupon => coupon.couponId);

        if (couponIds.includes(couponId)) {
            console.log("Element exists in the array.");
        const coupon = await Coupon.findOne({couponId:couponId});
        const discountAmount = coupon.discountAmount;
        const newTotal = cart.total + discountAmount;
        res.status(200).json({success:discountAmount, newTotal:newTotal});
    } else {
        res.status(400).json({error:"Enter valid coupon code"});
        console.log("Element does not exist in the array.");
    }
    }catch(error){
        console.log(error.message);
        res.status(500).json({error:'Internal servor error'});
    }
}


const removeCoupon = async (req,res)=>{
    try{
        console.log("hhhhhhhh");
        const email = req.session.email
        const userData = await User.findOne({email:email});
        const couponId = req.params.couponId;
        const coupon = await Coupon.findOne({couponId:couponId});
        const cart = await Cart.findOne({user:userData._id});
        await Cart.findOneAndUpdate({ _id: cart._id }, { coupon_applied: false });
        const newTotal = cart.total;
        res.status(200).json({success:"No coupon", newTotal:newTotal});
    }catch(error){
        console.log(error.message);
        res.status(500).json({error:'Internal servor error'});
    }
}



    module.exports = {
        couponPage,
        applyCoupon,
        removeCoupon

    }