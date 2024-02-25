const mongoose = require("mongoose");
const categorySchema = new mongoose.Schema({
    catname:{
        type:String,
        required:true
    },
    description:{
        type:String,
        required:true
    },
    status:{
        type:Number,
        required:true,
        default:0
    },
    image:{
        type:Array,
        required:true
    }

});

module.exports = mongoose.model('Category',categorySchema);