const mongoose = require("mongoose");

const cartSchema = new mongoose.Schema({
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
    deliveryFee: {
        type:Boolean,
        required: false
    }
});

module.exports = mongoose.model('Cart', cartSchema);
