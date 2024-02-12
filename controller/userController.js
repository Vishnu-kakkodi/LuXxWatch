// const User = require('../model/userModel');
// const bcrypt = require('bcrypt');

// const nodemailer = require("nodemailer");

// const config = require("../configuration/config");
// const randomstring = require("randomstring");

// const securePassword = async (password)=>{
//     try{
//         const passwordHash = await bcrypt.hash(password,10);
//         return passwordHash
//     }catch(error){
//         console.log(error.message);
//     }
// }

// const landingload = async(req,res)=>{
//     try{
//         res.render('landing');
//     }catch(error){
//         console.log(error.message);
//     }
// }

// const loginload = async(req,res)=>{
//     try{
//         res.render('login');
//     }catch(error){
//         console.log(error.message);
//     }
// }

// const registration = async(req,res)=>{
//     try{
//         res.render('register');
//     }catch(error){
//         console.log(error.message);
//     }
// }

// const insertUser=async(req,res)=>{
//     try {
//         if(req.body.password==req.body.ConfirmPassword){
//             res.redirect('/otp')
//         }
//         const otp = generateOTP()
//         console.log(otp);
//          const {name,email,mobile,password,confirm}=req.body
//          const data={
//             name,
//             email,
//             password,
//             ConfirmPassword,
//             otp }
//          req.session.Data=data
//          req.session.save()
       
//          console.log(otp,'this is otp');
//          console.log(req.session.Data,'this is session ')
       
//         const mailOptions=await {
//             form:email,
//             to:req.body.email,
//             subject:'Your OTP for Verification',
//             text:`your otp ${otp}`
//         }
//             if(mailOptions){
//                 transporter.sendMail(mailOptions,(err)=>{
//                     if(err){
//                         console.log(err.message);
//                     }else{
                      
//                         console.log("mail send sucessfull");
//                     }
//                 }) 
//             }
    
//     } catch (error) {
//       console.log(error)  
//     }
// }

// const loadOtp=async(req,res)=>{
//     console.log(req.session.Data+"from here");
//     try {
//         res.render("otp")
//     } catch (error) {
//         console.log(error.message)
//     }
    
// }


// // const insertUser = async(req,res)=>{
// //     try{
// //         const spassword = await securePassword(req.body.password);
// //        let user = new User({
// //             name:req.body.name,
// //             email:req.body.email,
// //             password:spassword,
// //             is_admin:0
// //         })

// //        const userData = await user.save()

       

// if(userData){
//     sendVerifyMail(req.body.name, req.body.email, userData._id);
//     res.render('home');
// }else{
//     res.render('registration', {message:"Your registration has been failed."});
// }

//     }catch(error){
//         console.log(error.message);
//     }
// }

// // const otpsend = async(req,res) => {
// //     try{
// //         if(req.body.password==req.body.ConfirmPassword){
// //             res.redirect('/otp')
// //         }
// //         const {name,email,password,ConfirmPassword}=req.body
// //          const data={
// //             name,
// //             email,
// //             password,
// //             ConfirmPassword,
// //             otp }
// //          req.session.Data=data
// //          req.session.save()
// //         const otp = randomstring.generate({
// //             length: 6,
// //             charset: 'numeric'
// //         });

// //         console.log('Generated OTP:', otp);

// //         const transporter = nodemailer.createTransport({
// //             service: 'Gmail',
// //             host:'pvishnukakkodi@gmail.com',
// //             port:587,
// //             secure:false,
// //             requireTLS:true,
// //             auth: {
// //                 user:config.emailUser,
// //                 pass:config.emailPassword
// //             }
// //         });

// //         const mailOptions = {
// //             from:config.emailUser,
// //             to:email,
// //             subject: 'OTP for Registration',
// //             text: `Your OTP for registration is: ${otp}`,
// //         };

// //         transporter.sendMail(mailOptions, (error, info) => {
// //             if (error) {
// //                 console.error('Error occurred while sending email:', error);
// //             } else {
// //                 console.log('Message sent: %s', info.messageId);
// //             }
// //         });
// //     }catch(error){
// //         console.log(error.message);
// //     }
// // };

// // const otpload = async(req,res)=>{
// //     try{
// //         res.render('otp');
// //     }catch(error){
// //         console.log(error.message);
// //     }
// // }


// module.exports = {
//     securePassword,
//     landingload,
//     loginload,
//     registration,
//     insertUser,
//     loadOtp
// }



const User = require('../model/userModel')
const session = require("express-session")
const bcrypt = require("bcrypt")
const nodemailer = require("nodemailer")
const randomstring = require('randomstring');
const config=require("../configuration/config");
const express = require('express');
const bodyParser = require('body-parser');
const app = express();

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
        const passwordHash=await bcrypt.hash(password,10)
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
            // let mno = parseInt(req.body.mno)
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
                res.render('login',{message:"Login Successfully"});
            }
            }else{
            res.render('otp',{message:"OTP is incorrect!"});            
            }      
        
    } catch (error) {
        console.log(error.message)
    }
}



const verifyLogin = async(req,res)=>{
    console.log(req.session.Data);
    try{
        const email = req.body.email;
        const password = req.body.password;

        const userData = await User.findOne({email:email});
        

        if(userData){
            const passwordMatch = await bcrypt.compare(password,userData.password);
            if(passwordMatch){
                if(userData.is_verified === 0){                   
                    res.render('login');
                }else if(userData.is_verified === 1 && userData.is_blocked === 0){
                    res.render('home');
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




module.exports={
    loginload,
    loadRegister,
    insertUser,
    loadOtp,
    resendOTP,
    getOtp,
    verifyLogin
}