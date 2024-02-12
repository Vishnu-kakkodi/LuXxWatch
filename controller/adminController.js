const User = require("../model/userModel");
const bcrypt = require('bcrypt');
// const session = require("express-session")

const config = require("../configuration/config");
const randomstring = require("randomstring");


const securePassword = async (password) => {
    try {
        const passwordHash = await bcrypt.hash(password, 10);
        return passwordHash;
    } catch (error) {
        console.log(error.message);
    }
}

const loadLogin = async (req, res) => {
    try {
        res.render('login');
    } catch (error) {
        console.log(error.message);
    }
}

const verifyLogin = async (req, res) => {
    try {
        const email = req.body.email;
        const password = req.body.password;

        const userData = await User.findOne({ email: email });
        if (userData) {
            const passwordMatch = await bcrypt.compare(password, userData.password);
            if (passwordMatch) {
                if (userData.is_admin === 0) {
                    res.render('login');
                } else {
                    req.session.user_id = userData._id;
                    res.redirect("/admin/home");
                }
            } else {
                res.render('login');
            }
        } else {
            res.render('login');
        }

    } catch (error) {
        console.log(error.message);
    }
}

const loadDashboard = async (req, res) => {
    try {
        const userData = await User.findById({ _id: req.session.user_id });
        res.render('home', { admin: userData });
    } catch (error) {
        console.log(error.message);
    }
}


// ---------------list-user-----------------//

const userAccount = async (req, res) => {
    try {
        const usersData = await User.find({ is_admin: 0 });
        res.render('user-account', { users: usersData });
    } catch (error) {
        console.log(error.message);
    }
}


// ---------------list-user-----------------//

const userBlock = async (req, res) => {

    const userId = req.params.userId;

    if (!userId) {
        return res.status(400).send('User ID is missing');
    }
    console.log("hai");

    try {
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).send('User not found');
        }
        console.log(user);

        user.is_blocked = 1;
        await user.save();
        await User.findByIdAndUpdate(userId, { $set: { is_blocked: 1 } });
        res.redirect('/admin/user-account');
    } catch (error) {
        console.log(error.message);
    }

}


const userunBlock = async (req, res) => {

    const userId = req.params.userId;

    if (!userId) {
        return res.status(400).send('User ID is missing');
    }

    try {
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).send('User not found');
        }

        user.is_blocked = 0;
        await user.save();
        await User.findByIdAndUpdate(userId, { $set: { is_blocked: 0 } });
        res.redirect('/admin/user-account');

    } catch (error) {
        console.log(error.message);
    }
}





module.exports = {
    securePassword,
    loadLogin,
    verifyLogin,
    loadDashboard,
    userAccount,
    userBlock,
    userunBlock
}