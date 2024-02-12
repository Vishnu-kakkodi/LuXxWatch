const mongoose = require("mongoose");
const userSchema = new mongoose.Schema({
    name:{
        type:String,
        required:true
    },
    mobile:{
        type:String,
        required:true
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
    }

});

module.exports = mongoose.model('User',userSchema);