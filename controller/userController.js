
const User = require('../model/userModel')
const Product = require("../model/productModel.js")
const session = require("express-session")
const bcrypt = require("bcrypt")
const nodemailer = require("nodemailer")
const randomstring = require('randomstring');
const config = require("../configuration/config");
const express = require('express');
const bodyParser = require('body-parser');
const app = express();
const Category = require("../model/categoryModel.js");
const Address = require("../model/addressModel.js");
const Cart = require("../model/cartModel.js");
const Order = require("../model/orderModel.js");
const Wallet = require("../model/walletModel.js");
const Coupon = require("../model/couponModel.js");
const Review = require("../model/reviewModel.js");
const { Long } = require('mongodb')
const mongoose = require('mongoose');
const ObjectId = mongoose.Types.ObjectId;


// const generateOTP=require("../controller/otpGenerate")


const transporter = nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 587,
    secure: false,
    requireTLS: true,
    auth: {
        user: config.emailUser,
        pass: config.emailPassword
    }
})

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

//++++++++ */ password hashing */ +++++++++//
const securePassword = async (password) => {
    try {
        const saltRounds = 10;
        const passwordHash = await bcrypt.hash(password, saltRounds);
        return passwordHash;
    } catch (error) {
        console.log(error)
    }
}

//++++++++ */ landingload */ +++++++++//

const landingload = async (req, res) => {
    try {
        const categories = await Category.find({ status: 0 });
        const products = await Product.find({ is_active: 1 }).limit(8);
        res.render('landingPage', { products, categories });
    } catch (error) {
        console.log(error.message);
    }
}

//++++++++ */ logingload */ +++++++++//

const loginload = async (req, res) => {
    try {
        res.render('login');
    } catch (error) {
        console.log(error.message);
    }
}

//++++++++ */ loadRegister */ +++++++++//

const loadRegister = async (req, res) => {
    try {
        const userData = await User.find();
        const referralArray = userData.map(user => user.referralCode);
        res.render('register', { referralArray })
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
        console.log("This is your OTP", otp);
        const { name, mobile, email, password } = req.body;
        const data = {
            name,
            mobile,
            email,
            password,
            otp,
            otpCreatedAt: Date.now()
        };
        if (req.body.referralID) {
            req.session.referralID = req.body.referralID;
        }
        req.session.Data = data;
        req.session.save();

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

        if (req.session.Data) {
            req.session.Data.otp = newOTP;
            req.session.Data.otpCreatedAt = Date.now();
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
                    console.log("New OTP sent successfully", newOTP);
                    res.status(200).json({ message: 'New otp send' });
                }
            });
        } else {
            console.log("req.session.Data is undefined");
            res.status(400).send("Session data is not available");
        }
    } catch (error) {
        console.log(error.message);
    }
};




//++++++++ */ getOtp */ +++++++++//

const getOtp = async (req, res) => {
    try {
        const userOtp = req.body.otp;
        const genOtp = req.session.Data.otp;
        const otpCreatedAt = req.session.Data.otpCreatedAt;
        const otpExpirationTime = 60 * 1000;
        const currentTime = Date.now();
        if (currentTime - otpCreatedAt > otpExpirationTime) {

            return res.status(400).json({ message: 'OTP has expired. Please request a new OTP.' });
        }
        else if (genOtp === userOtp) {
            const hashedPassword = await securePassword(req.session.Data.password)
            let couponId;
            function UniqueId() {
                const generateCustomCode = length => Array.from({ length }, () => 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'[Math.floor(Math.random() * 36)]).join('');
                const generateCustomCodes = (length, count) => Array.from({ length: count }, () => generateCustomCode(length));

                const length = 8;
                const count = 1;

                const customCodes = generateCustomCodes(length, count);
                const customCode = customCodes[0];
                couponId = customCode;

            };
            UniqueId();
            const user = new User({
                name: req.session.Data.name,
                mobile: req.session.Data.mobile,
                email: req.session.Data.email,
                password: hashedPassword,
                is_admin: 0,
                is_verified: 1,
                referralCode: couponId
            })
            const userData = await user.save()

            if (req.session.referralID) {
                const referror = await User.findOne({ referralCode: req.session.referralID });
                const referrorWallet = await Wallet.findOne({ user: referror._id });
                const newWallet = new Wallet({
                    user: userData._id,
                    walletbalance: 100,
                    transationHistory: [{
                        createdAt: Date.now(),
                        paymentType: "Referral",
                        transationMode: "Credit",
                        transationamount: 100
                    }],
                    totalRefund: 0
                });
                await newWallet.save();

                let balance = referrorWallet ? referrorWallet.walletbalance : 0;
                balance = balance + 100;

                if (referrorWallet) {
                    referrorWallet.walletbalance = balance;
                    referrorWallet.transationHistory.push({
                        createdAt: Date.now(),
                        paymentType: "Referral",
                        transationMode: "Credit",
                        transationamount: 100
                    });
                    await referrorWallet.save();
                } else {
                    const walletNew = new Wallet({
                        user: referror._id,
                        walletbalance: balance,
                        transationHistory: [{
                            createdAt: Date.now(),
                            paymentType: "Referral",
                            transationMode: "Credit",
                            transationamount: 100
                        }],
                        totalRefund: 0
                    });
                    await walletNew.save();
                }
            }

            if (userData) {
                res.status(200).json({ success: true, message: 'User registered successfully.' });
            } else {
                res.status(400).json({ success: false, message: 'Error: User registration failed.' });
            }
        } else {
            res.status(400).json({ success: false, message: 'Incorrect OTP. Please try again.' });
        }
    } catch (error) {
        console.log(error.message);
        res.status(500).json({ success: false, message: 'Internal server issue' });
    }
}



const verifyLogin = async (req, res) => {
    try {
        const email = req.body.email;
        const password = req.body.password;

        const userData = await User.findOne({ email: email });

        req.session.userId = userData._id
        req.session.email = email;
        req.session.save();


        if (userData) {
            const passwordMatch = await bcrypt.compare(password, userData.password);
            if (passwordMatch) {
                if (userData.is_verified === 0) {
                    res.render('login');
                } else if (userData.is_verified === 1 && userData.is_blocked === 0) {
                    req.session.user_id = userData._id
                    res.redirect('/home');
                } else if (userData.is_verified === 1 && userData.is_blocked === 1) {
                    res.render('login');
                }
            } else {
                res.render('login', { message: "Email and password is incorrect" })
            }
        } else {
            res.render('login', { message: "Email and password is incorrect" })
        }
    } catch (error) {
        console.log(error.message);
    }
}

const loadhome = async (req, res) => {
    try {
        const email = req.session.email;
        const userData = await User.findOne({ email: email });
        const cartItems = await Cart.findOne({ user: userData._id }).populate('products.product')
        const categories = await Category.find({ status: 0 });
        const products = await Product.find({ is_active: 1 }).limit(8);
        res.render('home', { userData, products, categories, cartItems });

    } catch (error) {
        console.log(error.message);

    }
}

const userLogout = async (req, res) => {

    try {
        req.session.destroy();
        res.redirect('/');
    } catch (error) {
        console.log(error.message)
    }
}


const profile = async (req, res) => {

    try {
        const email = req.session.email;
        const userData = await User.findOne({ email: email });
        const categories = await Category.find();
        const useraddress = await Address.find({ user: userData._id });
        const wallet = await Wallet.findOne({ user: userData._id });
        const usedCoupons = userData.appliedCoupon.map(coupon => coupon);


        const coupons = await Coupon.find({
            $and: [
                { is_active: 1 },
                { couponId: { $nin: usedCoupons } }
            ]
        });

        var page = 1;
        if (req.query.page) {
            page = req.query.page;
        }

        const limit = 5;

        const order = await Order.find({ user: userData._id })
            .sort({ createdAt: -1 })
            .limit(limit * 1)
            .skip((page - 1) * limit)
            .exec()

        const count = await Order.countDocuments({ user: userData._id });

        res.locals.categories = categories;
        res.locals.userData = userData;
        res.render('profile', { userData: userData, useraddress: useraddress, categories: categories, order: order, wallet: wallet, coupons: coupons, totalPages: Math.ceil(count / limit), currentPage: page });
    } catch (error) {
        console.log(error.message)
    }
}


const editname = async (req, res) => {
    try {
        const userId = req.params.userId;
        const { name } = req.body;
        const userData = await User.findById({ _id: userId });
        userData.name = name
        await userData.save();
        await User.findByIdAndUpdate(userId, { $set: { name: userData.name } });
        res.redirect('/profile');
    } catch (error) {
        console.log(error.message)
    }
}

const editmobile = async (req, res) => {
    try {
        const userId = req.params.userId;
        const { mobile } = req.body;
        const userData = await User.findById({ _id: userId });
        userData.mobile = mobile
        await userData.save();
        await User.findByIdAndUpdate(userId, { $set: { mobile: userData.mobile } });
        res.redirect('/profile');
    } catch (error) {
        console.log(error.message)
    }
}

const addAddress = async (req, res) => {

    try {
        const email = req.session.email
        const userData = await User.findOne({ email: email });
        const categories = await Category.find();
        res.locals.categories = categories;
        res.locals.userData = userData;
        res.render('addAddress', userData);
    } catch (error) {
        console.log(error.message);
    }
}

const createAddress = async (req, res) => {

    try {
        const { name, email, mobile, pincode, locality, address, district, state, addressType } = req.body;

        const userId = req.session.userId;
        const userData = await User.findOne({ _id: userId });
        const categories = await Category.find();


        console.log(userData);

        const useraddress = new Address({
            user: userId,
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
            res.redirect('/profile');

        }
    } catch (error) {
        console.log(error.message);
    }
}


const editpage = async (req, res) => {
    try {
        const addressId = req.params.addressId;
        const email = req.session.email
        const userData = await User.findOne({ email: email });
        const categories = await Category.find();
        res.locals.categories = categories;
        res.locals.userData = userData;
        const useraddress = await Address.findById({ _id: addressId });
        res.render('editAddress', { useraddress: useraddress });
    } catch (error) {
        console.log(error.message);
    }
}



const editAddress = async (req, res) => {
    try {
        const addressId = req.params.addressId;
        const { name, email, mobile, pincode, locality, address, district, state, addressType } = req.body;
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
        await Address.findByIdAndUpdate(addressId, {
            $set: {
                name: addres.name, email: addres.email, mobile: addres.mobile, pincode: addres.pincode, locality: addres.locality,
                address: addres.address, district: addres.district, state: addres.state, addressType: addres.addressType
            }
        });
        res.redirect('/profile');

    } catch (error) {
        console.log(error.message);
    }
}


const deleteAddress = async (req, res) => {
    try {
        const addressId = req.params.addressId;
        await Address.findByIdAndDelete(addressId);
        res.redirect('/profile');
    } catch (error) {
        console.log(error.message);
    }
}


const cPassword = async (req, res) => {
    try {
        const userId = req.params.userId;
        const { currentPassword, newPassword, confirmPassword } = req.body;

        if (currentPassword == newPassword) {
            return res.status(400).json({ error: 'Current password and new password must be different' });
        }

        if (newPassword !== confirmPassword) {
            return res.status(400).json({ error: 'New password and confirm password are not match' });
        }

        const userData = await User.findById(userId);
        if (!userData) {
            return res.status(404).json({ error: 'User not found' });
        }

        const isPasswordMatch = await bcrypt.compare(currentPassword, userData.password);
        if (!isPasswordMatch) {
            return res.status(400).json({ error: 'Current password is incorrect' });
        }

        const hashedPassword = await bcrypt.hash(newPassword, 10);

        userData.password = hashedPassword;
        await userData.save();

        res.status(200).json({ message: 'Password updated successfully' });

    } catch (error) {
        console.log(error.message);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};


const forgetLoad = async (req, res) => {
    try {
        res.render('forgotpassword');
    } catch (error) {
        console.log(error.message);
    }
}

const passwordchange = async (req, res) => {
    try {
        const otp = generateOTP();
        const { email } = req.body;
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


const forgototp = async (req, res) => {
    try {
        res.render('forgototp');
    } catch (error) {
        console.log(error.message);
    }
}


const verifyotp = async (req, res) => {
    try {
        const userOtp = req.body.otp;
        const genOtp = await req.session.Data.otp;

        if (genOtp === userOtp) {
            res.redirect('/changepassword');
        }
    } catch (error) {
        console.log(error.message)
    }
}

const changepassword = async (req, res) => {
    try {
        res.render('changepassword');
    } catch (error) {
        console.log(error.message)
    }
}

const newPassword = async (req, res) => {
    try {
        const password = req.body.password;
        const hashedPassword = await securePassword(password);
        const userdata = await User.findOne({ email: req.session.Data.email });
        if (!userdata) {
            return res.status(404).send("User not found");
        }
        userdata.password = hashedPassword;
        await userdata.save();
        res.redirect('/login');
    } catch (error) {
        console.log(error.message);
        res.status(500).send("Internal Server Error");
    }
}


const loadproductdetail = async (req, res) => {

    try {
        const productId = req.query.productId;
        const email = req.session.email;
        const categories = await Category.find();
        const userdata = await User.findOne({ email: email });
        const review = await Review.findOne({ product: productId }).populate('product').populate('userReviews.user');
        let userData
        if (userdata) {
            userData = userdata;
        } else {
            userData = req.session.user;
            console.log(req.session.user);
        }
        const products = await Product.find({ _id: productId });
        if (products.length > 0) {
            const product = products[0];
            if (product.stock !== 0) {
                stock_message = "Instock";
            } else {
                stock_message = "Outstock";
            }
            res.render('productdetails', { message: stock_message, products, userData, categories, review });
        }
    } catch (error) {
        console.log(error.message);
    }
}


const shop = async (req, res) => {
    try {
        const email = req.session.email;
        const categories = await Category.find();
        const userData = await User.findOne({ email: email });

        var page = 1;
        if (req.query.page) {
            page = req.query.page;
        }

        let searchValue = "";

        if (req.query.searchItem) {
            searchValue = req.query.searchItem;
        }

        const limit = 9;

        const regex = new RegExp(searchValue);

        const products = await Product.find({ $and: [{ is_active: 1 }, { productname: { $regex: regex } }] })
            .limit(limit * 1)
            .skip((page - 1) * limit)
            .exec()

        const count = await Product.countDocuments({ $and: [{ is_active: 1 }, { productname: { $regex: regex } }] });

        res.render('shop', {
            products,
            userData,
            categories,
            totalPages: Math.ceil(count / limit),
            currentPage: page,
            searchValue
        });
    } catch (error) {
        console.log(error.message);
    }
}


const shopFilter = async (req, res) => {
    try {
        const email = req.session.email;
        const categories = await Category.find();
        const userData = await User.findOne({ email: email });

        let page = parseInt(req.query.page) || 1;

        let searchValue = '';
        let brand = [];
        let category = [];
        let sort = '';

        const conditions = req.query.conditions;

        if (req.body.conditions) {
            searchValue = req.body.conditions.search || '';
            brand = req.body.conditions.brand || [];
            category = req.body.conditions.category || [];
            sort = req.body.conditions.sort || '';
        } else if (conditions) {
            searchValue = req.query.conditions.search || '';
            brand = req.query.conditions.brand || [];
            category = req.query.conditions.category || [];
            sort = req.query.conditions.sort || '';
        }

        let filterCriteria = { is_active: 1 };

        if (brand.length > 0) {
            filterCriteria.brandname = { $in: brand };
        } else if (category.length > 0) {
            filterCriteria.catname = { $in: category };
        }

        const limit = 9;

        let sortCriteria = {};
        if (sort === 'asc') {
            if (!('offprice')) {
                sortCriteria.price = 1;
            } else {
                sortCriteria.offprice = 1;
            }
        } else if (sort === 'desc') {
            if (!('offprice')) {
                sortCriteria.price = -1;
            } else {
                sortCriteria.offprice = -1;
            }
        } else if (sort === 'az') {
            sortCriteria.productname = 1;
        } else if (sort === 'za') {
            sortCriteria.productname = -1;
        } else if (sort === 'NA') {
            sortCriteria._id = -1;
        } else if (sort === 'pop') {
            sortCriteria.popularity = -1;
        }

        const regex = new RegExp(searchValue, 'i');
        const products = await Product.find({
            $and: [
                { $or: [{ catname: { $regex: regex } }, { brandname: { $in: brand } }] },
                filterCriteria
            ]
        })
            .sort(sortCriteria)
            .limit(limit)
            .skip((page - 1) * limit)
            .exec();

        const count = await Product.countDocuments({
            $and: [
                { $or: [{ catname: { $regex: regex } }, { brandname: { $in: brand } }] },
                filterCriteria
            ]
        });

        res.json({
            products,
            userData,
            categories,
            totalPages: Math.ceil(count / limit),
            currentPage: page,
            currentSort: sort || 'asc',
            searchValue
        });
    } catch (error) {
        console.log(error.message);
        res.status(500).json({ error: error.message });
    }
};





const contact = async (req, res) => {
    try {
        const email = req.session.email;
        const categories = await Category.find();
        const userdata = await User.findOne({ email: email });
        let userData
        if (userdata) {
            userData = userdata;
        } else {
            userData = req.session;
        }
        res.render('contact', { userData, categories });
    } catch (error) {
        console.log(error.message);
    }
}


const addReview = async (req, res) => {
    try {
        const { productId, userId } = req.query;
        const comment = req.body.commentValue;
        const rating = req.body.rating;

        if (typeof comment !== 'string') {
            return res.status(400).json({ error: 'Comment must be a string' });
        }

        const userData = await User.findOne({ _id: userId });
        if (!userData) {
            return res.status(404).json({ error: 'User not found' });
        }

        const product = await Product.findOne({ _id: productId });
        if (!product) {
            return res.status(404).json({ error: 'Product not found' });
        }

        const userReview = { user: userId, comment, rating };

        let review = await Review.findOne({ product: productId });
        if (!review) {
            review = new Review({ product: productId, userReviews: [], averageReview: null });
        }

        if (review.userReviews.length === 0) {
            review.userReviews.push(userReview);
        } else {
            if (review.userReviews.length === 0) {
                review.userReviews.push(userReview);
            } else {
                let userReviewed = false;
                for (const users of review.userReviews) {
                    if (users.user.equals(new ObjectId(userId))) {
                        userReviewed = true;
                        break;
                    }
                }

                if (userReviewed) {
                    return res.status(400).json({ error: 'Already added' });
                } else {
                    review.userReviews.push(userReview);
                }

            }

        }
        review.averageRating = review.userReviews.reduce((acc, curr) => {
            return acc + curr.rating;
        }, 0) / review.userReviews.length;


        await review.save();

        res.status(200).json({ success: "Review added successfully" });
    } catch (error) {
        console.error(error.message);
        res.status(500).json({ error: "Internal server error" });
    }
}


const googleSignUp = async (req, res) => {
    try {
        const email = req.user.email;
        let userData;
        userData = await User.findOne({ email: email });
        console.log(userData);
        if (!userData) {
            let couponId;
            function UniqueId() {
                const generateCustomCode = length => Array.from({ length }, () => 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'[Math.floor(Math.random() * 36)]).join('');
                const generateCustomCodes = (length, count) => Array.from({ length: count }, () => generateCustomCode(length));

                const length = 8;
                const count = 1;

                const customCodes = generateCustomCodes(length, count);
                const customCode = customCodes[0];
                couponId = customCode;

            };
            UniqueId();
            const user = new User({
                name: req.user.name,
                mobile: "1234566543",
                email: req.user.email,
                is_admin: 0,
                is_verified: 1,
                referralCode: couponId
            })
            userData = await user.save()

        }

        req.session.user_id = userData._id
        req.session.email = email;
        req.session.save();
        res.redirect('/home');
    } catch (error) {
        console.log(error.message);
    }
}


const facebookSignUp = async (req, res) => {
    try {
        const email = req.user.email;
        let userData;
        userData = await User.findOne({ email: email });
        console.log(userData);
        if (!userData) {
            let couponId;
            function UniqueId() {
                const generateCustomCode = length => Array.from({ length }, () => 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'[Math.floor(Math.random() * 36)]).join('');
                const generateCustomCodes = (length, count) => Array.from({ length: count }, () => generateCustomCode(length));

                const length = 8;
                const count = 1;

                const customCodes = generateCustomCodes(length, count);
                const customCode = customCodes[0];
                couponId = customCode;

            };
            UniqueId();
            const user = new User({
                name: req.user.name,
                mobile: "1234566543",
                email: req.user.email,
                is_admin: 0,
                is_verified: 1,
                referralCode: couponId
            })
            userData = await user.save()

        }

        req.session.user_id = userData._id
        req.session.email = email;
        req.session.save();
        res.redirect('/home');
    } catch (error) {
        console.log(error.message);
    }
}








const page_404 = async (req, res) => {
    try {
        const email = req.session.email;
        const userData = await User.findOne({ email: email });
        res.render('error404', { userData });
    } catch (error) {
        console.log(error.message);
    }
}



module.exports = {
    landingload,
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
    shopFilter,
    contact,
    addReview,
    googleSignUp,
    facebookSignUp,
    page_404
}