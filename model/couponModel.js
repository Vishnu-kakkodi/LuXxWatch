const mongoose = require('mongoose');

const couponSchema = new mongoose.Schema({
    couponId: {
        type: String,
        unique: true,
        index: true
    },
    description: {
        type: String,
        required: true
    },
    maximumDiscount: {
        type: String,
        required: true
    },
    minimumAmount: {
        type: Number,
        required: true
    },
    maximumAmount: {
        type: Number,
        required: true
    },
    discountAmount: {
        type: Number,
        required: false
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    expireDate: {
        type: String,
        required: true
    },
    is_active: {
        type: Number,
        required: true,
        default: 1
    },
    maximumUser: {
        type: Number,
        required: false
    }
})

module.exports = mongoose.model('Coupon', couponSchema);