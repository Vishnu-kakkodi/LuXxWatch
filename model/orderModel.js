const mongoose = require("mongoose");

const orderSchema = new mongoose.Schema({

    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    products: [{
        product: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Product',
            required: true
        },
        quantity: {
            type: Number,
            required: true,
            default: 1
        },
        subtotal: {
            type: Number,
            required: true
        }
    }],
    total:{
        type:Number,
        required: true
    },
    grandTotal:{
        type:Number,
        required: true
    },
    shippingAddress: {
        name:{
            type:String,
            required:true
        },
        mobile:{
            type:String,
            required:true
        },
        pincode:{
            type:String,
            required:true
        },
        locality:{
            type:String,
            required:true
        },
        address:{
            type:String,
            required:true
        },
        district:{
            type:String,
            required:true
        },
        state:{
            type:String,
            required:true
        },
        addressType:{
            type:String,
            required:true
        }
    },
    paymentOption: {
        type:String,
        required:true
    },
    status: {
        type: String,
        enum: ['Pending', 'Placed', 'Shipped', 'Delivered', 'Cancelled', 'Returned'],
        default: 'Pending'
    },
    resonOfcancel: {
        type: String
    },
    orderId: {
        type:String,
        required:false
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    refund: {
        type: String,
        required:false
    },
    coupon_applied: {
        type:Boolean,
        required: true
    },
    discountAmount: {
        type: Number,
        required: false
    },
    shippingCharge: {
        type:Number,
        required:false
    }
});

module.exports = mongoose.model('Order', orderSchema);

