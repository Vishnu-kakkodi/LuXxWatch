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
    }

});

module.exports = mongoose.model('Category',categorySchema);