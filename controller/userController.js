
const User = require('../model/userModel')
const Product = require("../model/productModel.js")
const session = require("express-session")
const bcrypt = require("bcrypt")
const nodemailer = require("nodemailer")
const randomstring = require('randomstring');
const config=require("../configuration/config");
const express = require('express');
const bodyParser = require('body-parser');
const app = express();
const Category = require("../model/categoryModel.js");
const Address = require("../model/addressModel.js");
const { Long } = require('mongodb')

// const generateOTP=require("../controller/otpGenerate")


const transporter=nodemailer.createTransport({
    host:"smtp.gmail.com",
    port:587,
    secure:false,
    requireTLS:true,
    auth:{
        user:config.emailUser,
        pass:config.emailPassword
    }
})

app.use(bodyParser.urlencoded({ extended: true }));

//++++++++ */ password hashing */ +++++++++//
const securePassword=async(password)=>{
    try {
        const saltRounds = 10;
        const passwordHash=await bcrypt.hash(password,saltRounds);
        return passwordHash;
    } catch (error) {
        console.log(error)
    }
}

//++++++++ */ landingload */ +++++++++//

// const landingload = async(req,res)=>{
//     try{
//         res.render('landing');
//     }catch(error){
//         console.log(error.message);
//     }
// }

//++++++++ */ logingload */ +++++++++//

const loginload = async(req,res)=>{
    try{
        res.render('login');
    }catch(error){
        console.log(error.message);
    }
}

//++++++++ */ loadRegister */ +++++++++//

const loadRegister=async(req,res)=>{
    try {
        res.render('register')
    } catch (error) {
        console.log(error)
    }
}

//++++++++ */ otpGenerate */ +++++++++//

const generateOTP = () => {
    const p = randomstring.generate({
        length: 6,
        charset: 'numeric'
    })
    return p;
};

//++++++++ */ insertUser */ +++++++++//

const insertUser = async (req, res) => {
    try {
            const otp = generateOTP();
            console.log(otp);
            const { name, mobile, email, password } = req.body;
            const data = {
                name,
                mobile,
                email,
                password,
                otp
            };
            req.session.Data = data;
            req.session.save();
            console.log(otp, 'this is otp');


            const mailOptions = {
                from: config.emailUser,
                to: email,
                subject: 'Your OTP for Verification',
                text: `your otp ${otp}`
            };
            if (mailOptions) {
                transporter.sendMail(mailOptions, (err) => {
                    if (err) {
                        console.log(err.message);
                    } else {
                        console.log("mail send successful");
                    }
                });
            }
            res.redirect('/otp');
    } catch (error) {
        console.log(error);
    }
};

//++++++++ */ loadOtp */ +++++++++//

const loadOtp = async (req, res) => {
    try {
        res.render("otp");
    } catch (error) {
        console.log(error.message);
    }
};

const resendOTP = async (req, res) => {
    try {
        const newOTP = generateOTP(); 
        req.session.Data.otp = newOTP; 
        req.session.save();

        
        const mailOptions = {
            from: config.emailUser,
            to: req.session.Data.email,
            subject: 'Your New OTP for Verification',
            text: `Your new OTP is: ${newOTP}`
        };

        transporter.sendMail(mailOptions, (err) => {
            if (err) {
                console.log(err.message);
            } else {
                console.log("New OTP sent successfully");
                console.log(newOTP);
                res.redirect("/otp");
            }
        });
    } catch (error) {
        console.log(error.message);
    }
};



//++++++++ */ getOtp */ +++++++++//

const getOtp=async(req,res)=>{
    try {
        const userOtp = req.body.otp.filter(Boolean).join('');
        const genOtp = await req.session.Data.otp;
        console.log("n",genOtp);
        if(genOtp===userOtp){
            const hashedPassword = await securePassword(req.session.Data.password)
            const user=new User({
                name:req.session.Data.name,
                mobile:req.session.Data.mobile,
                email:req.session.Data.email,
                password:hashedPassword,
                is_admin:0,
                is_verified:1
            })
            const userData=await user.save()
            
            if(userData){
                res.render('login',{message:"Register Successfully"});
            }
            }else{
            res.render('otp',{message:"OTP is incorrect!"});            
            }      
        
    } catch (error) {
        console.log(error.message)
    }
}



const verifyLogin = async(req,res)=>{
    try{
        const email = req.body.email;
        const password = req.body.password;

        const userData = await User.findOne({email:email});

            req.session.userId = userData._id
            req.session.email = email;
            req.session.save();
        

        if(userData){
            const passwordMatch = await bcrypt.compare(password,userData.password);
            if(passwordMatch){
                if(userData.is_verified === 0){                   
                    res.render('login');
                }else if(userData.is_verified === 1 && userData.is_blocked === 0){
                    req.session.user_id=userData._id
                    res.redirect('/home');
                }else if(userData.is_verified === 1 && userData.is_blocked === 1){
                    res.render('login');
                }
            }else{
                res.render('login',{message:"Email and password is incorrect"})
            }
        }else{
            res.render('login',{message:"Email and password is incorrect"})
        }
    }catch(error){
        console.log(error.message);
    }
}

const loadhome = async(req,res)=>{
    try{
        const email = req.session.email;
        const userdata = await User.findOne({email:email});
        let userData
        if(userdata){
            userData=userdata;
        }else{
            userData=req.session;
        }
        const categories = await Category.find({status:0});
        const products = await Product.find({is_active:1}).limit(8);
        res.render('home', { userData,products,categories });

    }catch(error){
        console.log(error.message);
        
    }
}

const userLogout = async(req,res)=>{

    try{
        req.session.destroy();
        res.redirect('/');
    }catch(error){
        console.log(error.message)
    }
}


const profile = async(req,res)=>{

    try{
        const email = req.session.email;
        const userData = await User.findOne({email:email});
        const categories = await Category.find();
        const useraddress = await Address.find({user:userData._id});
        console.log(useraddress);
        res.locals.categories = categories;
        res.locals.userData = userData;
        // res.locals.useraddress = useraddress;
        res.render('profile',{userData,useraddress,categories});
    }catch(error){
        console.log(error.message)
    }
}


const editname = async(req,res)=>{
    const userId = req.params.userId;
    try{
        console.log(req.body);
        const {name} = req.body;
        const userData = await User.findById({_id:userId});
        userData.name = name
        await userData.save(); 
        await User.findByIdAndUpdate(userId, { $set:{name:userData.name}});
        res.redirect('/profile');
    }catch(error){
        console.log(error.message)
    }
}

const editmobile = async(req,res)=>{
    const userId = req.params.userId;
    try{
        const {mobile} = req.body;
        const userData = await User.findById({_id:userId});
        userData.mobile = mobile
        await userData.save(); 
        await User.findByIdAndUpdate(userId, { $set:{mobile:userData.mobile}});
        res.redirect('/profile');
    }catch(error){
        console.log(error.message)
    }
}

const addAddress = async(req,res)=>{

    try{
        const email = req.session.email
        const userData = await User.findOne({email:email});
        const categories = await Category.find();
        res.locals.categories = categories;
        res.locals.userData = userData;
        res.render('addAddress',userData);
    }catch(error){
        console.log(error.message);
    }
}

const createAddress = async(req,res)=>{

    try{
        const {name, email, mobile, pincode, locality,address,district,state,addressType } = req.body;

        const userId = req.session.userId;
        const userData = await User.findOne({_id:userId});

        console.log(userData);

        const useraddress = new Address({
            user:userData._id,
            name,
            email,
            mobile,
            pincode,
            locality,
            address,
            district,
            state,
            addressType
         
        });

        console.log(useraddress);

        const savedAddress = await useraddress.save();
        if (savedAddress) {
            const useraddress = await Address.find({user:userId});
            res.render('profile', {userData,useraddress: useraddress });
        }
    }catch(error){
        console.log(error.message);
    }
}


const editpage = async(req,res)=>{
    const addressId = req.params.addressId;
    try{
        const email = req.session.email
        const userData = await User.findOne({email:email});
        const categories = await Category.find();
        res.locals.categories = categories;
        res.locals.userData = userData;
        const useraddress = await Address.findById({_id:addressId});
        res.render('editAddress',{useraddress:useraddress});
    }catch(error){
        console.log(error.message);
    }
}



const editAddress = async(req,res)=>{
    const addressId = req.params.addressId;
    const {name, email, mobile, pincode, locality,address,district,state,addressType } = req.body;

    try{
        const addres = await Address.findById(addressId);
        addres.name = name;
        addres.email = email;
        addres.mobile = mobile;
        addres.pincode = pincode;
        addres.locality = locality;
        addres.address = address;
        addres.district = district;
        addres.state = state;
        addres.addressType = addressType;
        
        await addres.save();
        await Address.findByIdAndUpdate(addressId, { $set: {
            name:addres.name,email:addres.email,mobile:addres.mobile,pincode:addres.pincode,locality:addres.locality,
            address:addres.address,district:addres.district,state:addres.state,addressType:addres.addressType
         } });
        res.redirect('/profile');

    }catch(error){
        console.log(error.message);
    }
}


const deleteAddress = async(req,res)=>{
    const addressId = req.params.addressId;
    try{
        await Address.findByIdAndDelete(addressId);
        res.redirect('/profile');
    }catch(error){
        console.log(error.message);
    }   
}


const cPassword = async (req, res) => {
    const userId = req.params.userId;
    try {
        console.log("hjjkh");
        const password = req.body.password;

        const hashedPassword = await securePassword(password);

        console.log("hjjkh");


        
        // Find the user by email
        const userData = await User.findOne({_id:userId });
        if (!userData) {
            // Handle case where user is not found
            return res.status(404).send("User not found");
        }

        // Update the password field in the user data
        userData.password = hashedPassword;

        // Save the updated user data
        await userData.save();

        // Redirect to login page
        res.redirect('/profile');
    } catch (error) {
        console.log(error.message);
        res.status(500).send("Internal Server Error");
    }
}


const forgetLoad = async(req,res)=>{
    try{
        res.render('forgotpassword');
    }catch(error){
        console.log(error.message);
    }
}

const passwordchange = async (req, res) => {
    try {
            const otp = generateOTP();
            const { email} = req.body;
            const data = {
                email,
                otp
            };
            req.session.Data = data;
            req.session.save();
            console.log(otp, 'this is otp');

            const mailOptions = {
                from: config.emailUser,
                to: email,
                subject: 'Your OTP for new password',
                text: `your otp ${otp}`
            };
            if (mailOptions) {
                transporter.sendMail(mailOptions, (err) => {
                    if (err) {
                        console.log(err.message);
                    } else {
                        console.log("mail send successful");
                    }
                });
            }
            res.render('forgototp');
    } catch (error) {
        console.log(error);
    }
};


const forgototp = async(req,res)=>{
    try{
        res.render('forgototp');
    }catch(error){
        console.log(error.message);
    }
}


const verifyotp = async(req,res)=>{
    try {
        const userOtp = req.body.otp;
        const genOtp = await req.session.Data.otp;

        if(genOtp===userOtp){
            res.redirect('/changepassword');
        }
    } catch (error) {
        console.log(error.message)
    }
}

const changepassword = async(req,res)=>{
    try {
        res.render('changepassword');
        }catch (error) {
        console.log(error.message)
    }
}

const newPassword = async (req, res) => {
    try {
        const password = req.body.password;
        const hashedPassword = await securePassword(password);
        
        // Find the user by email
        const userdata = await User.findOne({ email: req.session.Data.email });
        if (!userdata) {
            // Handle case where user is not found
            return res.status(404).send("User not found");
        }

        // Update the password field in the user data
        userdata.password = hashedPassword;

        // Save the updated user data
        await userdata.save();

        // Redirect to login page
        res.redirect('/login');
    } catch (error) {
        console.log(error.message);
        res.status(500).send("Internal Server Error");
    }
}






const loadproductdetail = async(req,res)=>{
    const productId = req.query.productId;
    try{
        const email = req.session.email;
        const categories = await Category.find();
        const userdata = await User.findOne({email:email});
        let userData
        if(userdata){
            userData=userdata;
        }else{
            userData=req.session;
            console.log(req.session.user);
        }
        const products = await Product.find({_id: productId});
if (products.length > 0) {
    const product = products[0];
    if (product.stock !== 0) {
        stock_message = "Instock";   
    } else {
        stock_message = "Outstock";
    }
    res.render('productdetails', { message: stock_message, products,userData,categories });
    console.log(products);
}
    }catch(error){
        console.log(error.message);
    }
}


const shop = async(req,res)=>{
    try{
        const email = req.session.email;
        const categories = await Category.find();
        const userdata = await User.findOne({email:email});
        let userData
        if(userdata){
            userData=userdata;
        }else{
            userData=req.session;
        }
        const products = await Product.find({is_active:1}).limit(9);
                    res.render('shop', { products,userData,categories});
    }catch(error){
        console.log(error.message);
    }
}


const contact = async(req,res)=>{
    try{
        const email = req.session.email;
        const categories = await Category.find();
        const userdata = await User.findOne({email:email});
        let userData
        if(userdata){
            userData=userdata;
        }else{
            userData=req.session;
        }
        const products = await Product.find({is_active:0}).limit(12);
                    res.render('contact', { products,userData,categories});
    }catch(error){
        console.log(error.message);
    }
}






module.exports={
    loginload,
    loadRegister,
    insertUser,
    loadOtp,
    resendOTP,
    getOtp,
    verifyLogin,
    loadhome,
    userLogout,
    profile,
    editname,
    editmobile,
    addAddress,
    createAddress,
    editpage,
    editAddress,
    deleteAddress,
    cPassword,
    forgetLoad,
    passwordchange,
    forgototp,
    verifyotp,
    changepassword,
    newPassword,
    loadproductdetail,
    shop,
    contact
}