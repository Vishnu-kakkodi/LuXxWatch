const mongoose = require("mongoose");
const productSchema = new mongoose.Schema({

    brandname:{
        type:String,
        required:true
    },
    productname:{
        type:String,
        required:true
    },
    catname:{
        type:String,
        required:true
    },
    description:{
        type:String,
        required:true
    },
    price:{
        type:Number,
        required:true,
    },
    offprice:{
        type:Number,
        required:true,
    },
    image:{
        type:Array,
        required:true
    },
    is_active:{
        type:Number,
        required:true,
        default:0
    }

});

module.exports = mongoose.model('Product',productSchema);