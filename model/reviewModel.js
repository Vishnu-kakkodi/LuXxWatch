const mongoose = require("mongoose");

const reviewSchema = new mongoose.Schema({
    
    product: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product',
        required: true
    },
        userReviews:[{
            user: {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'User',
                required: true
            },
            comment: {
                type: String,
                required:true
            },
            rating: {
                type: Number,
                required: true
            },
            createdAt: {
                type: Date,
                default: Date.now
            }
        }],
        averageRating: {
            type: Number,
            required: false
        }
    
})

module.exports = mongoose.model('Review',reviewSchema);