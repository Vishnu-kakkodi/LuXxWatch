const mongoose = require("mongoose");
const userSchema = new mongoose.Schema({
    name:{
        type:String,
        required:true
    },
    mobile:{
        type:String,
        required:false
    },
    email:{
        type:String,
        required:true
    },
    password:{
        type:String,
        required:true
    },
    otp:{
        type:String,
        required:false
    },
    // image:{
    //     type:String,
    //     required:true
    // },
    is_admin:{
        type:String,
        required:true
    },
    is_verified:{
        type:Number,
        default:0
    },
    is_blocked:{
        type:Number,
        required:true,
        default:0
    },
    appliedCoupon : [{
        type: String,
        required: false
    }],
    referralCode: {
        type: String,
        required:true
    }

});

module.exports = mongoose.model('User',userSchema);