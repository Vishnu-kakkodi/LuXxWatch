const User = require("../model/userModel");
const Order = require("../model/orderModel");
const Product = require("../model/productModel");
const Category = require("../model/categoryModel");
const Coupon = require("../model/couponModel");
const bcrypt = require('bcrypt');

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
        const currentDate = new Date();
        const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), + 2);
        firstDayOfMonth.setUTCHours(0, 0, 0, 0);

        const lastDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1);
        lastDayOfMonth.setUTCHours(23, 59, 59, 999);

        console.log(firstDayOfMonth);
        console.log(lastDayOfMonth);

        const order = await Order.find({
            status: { $in: ['Delivered', 'Cancelled', 'Returned', 'Return under processing'] },
            createdAt: { $gte: firstDayOfMonth, $lte: lastDayOfMonth }
        })

        console.log(order);

        const yValues = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];

        order.forEach(item => {
            const date = new Date(item.createdAt);
            const month = date.getDay();
            yValues[month - 1] += item.grandTotal;
        });

        const monthlySale = yValues.reduce((total, currentValue) => total + currentValue, 0);


        const orders = await Order.find();

        const yValue = [0, 0, 0, 0, 0, 0, 0, 0, 0];

        orders.forEach(item => {
            if (item.status === 'Pending') {
                yValue[0] += 1;
            } else if (item.status === 'Placed') {
                yValue[1] += 1;
            } else if (item.status === 'Shipped') {
                yValue[2] += 1;
            } else if (item.status === 'Delivered') {
                yValue[3] += 1;
            } else if (item.status === 'Cancelled') {
                yValue[4] += 1;
            } else if (item.status === 'Returned') {
                yValue[5] += 1;
            } else if (item.status === 'Failed') {
                yValue[6] += 1;
            } else if (item.status === 'Return under processing') {
                yValue[7] += 1;
            } else if (item.status === 'Payment pending') {
                yValue[8] += 1;
            }
        })

        const totalOrderCount = await Order.countDocuments({
            status: { $nin: ['Failed', 'Payment pending'] }
        });
        const totalProductCount = await Product.countDocuments();
        const totalCategoryCount = await Category.countDocuments();

        const topSellingProducts = await Product.find()
            .sort({ popularity: -1 })
            .limit(10);

        const topSellingCategorys = await Product.aggregate([
            { $sort: { popularity: -1 } },
            { $limit: 10 },
            { $group: { _id: "$catname", total: { $sum: 1 } } },
            { $sort: { total: -1 } }
        ]);
        const categoryNames = topSellingCategorys.map(category => category._id);

        const categoryMap = new Map();

        const categories = await Category.find({ catname: { $in: categoryNames } });

        categories.forEach(category => {
            categoryMap.set(category.catname, category);
          });

          const sortedCategories = categoryNames.map(categoryName => categoryMap.get(categoryName));
            

        res.render('home', { admin: userData, yValues, yValue, monthlySale, totalProductCount, totalCategoryCount, totalOrderCount, topSellingProducts, sortedCategories });
    } catch (error) {
        console.log(error.message);
    }
}


const chartRender = async (req, res) => {

    try {
        const choice = req.body.chooseValue;
        console.log(choice);
        if (choice === 'currentMonth') {
            const currentDate = new Date();
            const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), + 2);
            firstDayOfMonth.setUTCHours(0, 0, 0, 0);

            const lastDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1);
            lastDayOfMonth.setUTCHours(23, 59, 59, 999);

            console.log(firstDayOfMonth);
            console.log(lastDayOfMonth);

            const order = await Order.find({
                status: { $in: ['Delivered', 'Cancelled', 'Returned', 'Return under processing'] },
                createdAt: { $gte: firstDayOfMonth, $lte: lastDayOfMonth }
            }).populate('products.product').populate('user');

            console.log(order);

            const yValues = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];

            order.forEach(item => {
                const date = new Date(item.createdAt);
                const month = date.getDay();
                yValues[month - 1] += item.grandTotal;
            });

            console.log(yValues);

            function generateBarColors(daysInMonth) {
                const barColors = [];
                const hueStep = 360 / daysInMonth;
                for (let i = 0; i < daysInMonth; i++) {
                    const hue = i * hueStep;
                    const color = `hsl(${hue}, 70%, 50%)`;
                    barColors.push(color);
                }
                return barColors;
            }
            const daysInMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate();
            console.log(daysInMonth);
            const xValues = [];
            for (let i = 1; i <= daysInMonth; i++) {
                xValues.push(i.toString());
            }
            const barColors = generateBarColors(daysInMonth);

            const Data = {
                xValues: xValues,
                yValues: yValues,
                barColors: barColors
            };

            res.status(200).json({ success: Data });
        } else if (choice === 'monthly') {
            const currentDate = new Date();
            const financialYearStart = new Date(currentDate.getFullYear(), 3, 1);
            const financialYearEnd = new Date(currentDate.getFullYear() + 1, 2, 31);

            const order = await Order.find({
                status: { $in: ['Delivered', 'Cancelled', 'Returned', 'Return under processing'] },
                createdAt: { $gte: financialYearStart, $lte: financialYearEnd }
            }).populate('products.product').populate('user');

            const monthlySales = Array(12).fill(0);

            order.forEach(item => {
                const date = new Date(item.createdAt);
                let month = date.getMonth();

                month = (month + 9) % 12;

                monthlySales[month] += item.grandTotal;
            });

            function generateBarColors(numBars) {
                const barColors = [];
                const hueStep = 360 / numBars;
                for (let i = 0; i < numBars; i++) {
                    const hue = i * hueStep;
                    const color = `hsl(${hue}, 70%, 50%)`;
                    barColors.push(color);
                }
                return barColors;
            }

            const xValues = [];
            const yValues = monthlySales;
            const barColors = generateBarColors(monthlySales.length);


            for (let i = 3; i < 15; i++) {
                const monthName = new Date(currentDate.getFullYear(), i, 1).toLocaleString('default', { month: 'short' });
                xValues.push(monthName);
            }

            const Data = {
                xValues: xValues,
                yValues: yValues,
                barColors: barColors
            };

            res.status(200).json({ success: Data });

        } else if (choice === 'yearly') {

        }
    } catch (error) {
        console.log(error.message)
    }
}


const adminLogout = async (req, res) => {

    try {
        req.session.destroy();
        res.redirect('/');
    } catch (error) {
        console.log(error.message)
    }
}


// ---------------list-user-----------------//

const userAccount = async (req, res) => {
    try {
        var page = 1;
        if (req.query.page) {
            page = req.query.page;
        }
        const limit = 4;

        const usersData = await User.find({ is_admin: 0 })
            .limit(limit * 1)
            .skip((page - 1) * limit)
            .exec()

        const count = await User.countDocuments({ is_admin: 0 });

        res.render('user-account', { users: usersData, totalPages: Math.ceil(count / limit), currentPage: page });
    } catch (error) {
        console.log(error.message);
    }
}


// ---------------list-user-----------------//

const userBlock = async (req, res) => {

    const userId = req.params.userId;
    console.log("hai");

    try {
        const user = await User.findById(userId);
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

    try {
        const user = await User.findById(userId);
        user.is_blocked = 0;
        await user.save();
        await User.findByIdAndUpdate(userId, { $set: { is_blocked: 0 } });
        res.redirect('/admin/user-account');

    } catch (error) {
        console.log(error.message);
    }
}


// ---------------list-order-----------------//


const orderList = async (req, res) => {
    try {
        const orders = await Order.find().populate('products.product').populate('user');
        res.render('listOrder', { orders });

    } catch (error) {
        console.log(error.message);
    }
}


const detailedOrder = async (req, res) => {
    const orderId = req.query.orderId;
    try {
        const orders = await Order.findOne({ _id: orderId }).populate('products.product').populate('user');
        res.render('detailedOrder', { orders });

    } catch (error) {
        console.log(error.message);
    }
}


async function generateInvoice() {
    const order = await Order.findOne({ status: 'Delivered' })
        .sort({ deliveryDate: -1 })
        .limit(1);
    let invoiceNumber = 1;

    if (order) {
        invoiceNumber = order.invoiceNumber + 1;
    }

    return invoiceNumber;

}


const ChangeStatus = async (req, res) => {
    const orderId = req.params.orderId;
    const { action } = req.body;
    try {
        let invoiceNumber;
        const order = await Order.findOne({ _id: orderId });
        if (action === 'Delivered') {
            order.deliveryDate = Date.now();
            await order.save();
            invoiceNumber = await generateInvoice();
        }
        order.status = action;
        const newStatus = order.status;
        if (invoiceNumber) {
            order.invoiceNumber = invoiceNumber;
        }
        await order.save();
        return res.status(200).json({ newStatus });

    } catch (error) {
        console.log(error.message);
        res.status(500).json({ error: 'Internal Server Error' });
    }
}


const saleReport = async (req, res) => {
    try {
        const order = await Order.find({ status: 'Delivered' }).populate('products.product').populate('user');
        res.render('salesreport', { order });
    } catch (error) {
        console.log(error.message);
    }
}

const filterReport = async (req, res) => {
    try {
        const option = req.body.option;
        console.log(typeof (option));
        let order;
        if (option === 'today') {
            const startOfDay = new Date();
            startOfDay.setUTCHours(0, 0, 0, 0);

            const endOfDay = new Date();
            endOfDay.setUTCHours(23, 59, 59, 999);

            order = await Order.find({
                status: 'Delivered',
                createdAt: { $gte: startOfDay, $lte: endOfDay }
            }).populate('products.product').populate('user');
        }
        else if (option === 'weekly') {

            const currentDate = new Date();

            const firstDayOfWeek = new Date(currentDate);
            firstDayOfWeek.setDate(currentDate.getDate() - currentDate.getDay());

            firstDayOfWeek.setUTCHours(0, 0, 0, 0);

            const lastDayOfWeek = new Date(firstDayOfWeek);
            lastDayOfWeek.setDate(firstDayOfWeek.getDate() + 6);

            lastDayOfWeek.setUTCHours(23, 59, 59, 999);

            order = await Order.find({
                status: 'Delivered',
                createdAt: { $gte: firstDayOfWeek, $lte: lastDayOfWeek }
            }).populate('products.product').populate('user');

        }
        else if (option === 'monthly') {
            const currentDate = new Date();

            // Set the date to the first day of the current month
            const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
            firstDayOfMonth.setUTCHours(0, 0, 0, 0);

            // Set the date to the last day of the current month
            const lastDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
            lastDayOfMonth.setUTCHours(23, 59, 59, 999);

            console.log(firstDayOfMonth);
            console.log(lastDayOfMonth);

            order = await Order.find({
                status: 'Delivered',
                createdAt: { $gte: firstDayOfMonth, $lte: lastDayOfMonth }
            }).populate('products.product').populate('user');
        } else if (option === 'yearly') {
            const currentDate = new Date();

            // Set the date to the first day of the current year
            const firstDayOfYear = new Date(currentDate.getFullYear(), 0, 1);
            firstDayOfYear.setUTCHours(0, 0, 0, 0);

            // Set the date to the last day of the current year
            const lastDayOfYear = new Date(currentDate.getFullYear(), 11, 31, 23, 59, 59, 999);

            console.log(firstDayOfYear);
            console.log(lastDayOfYear);

            order = await Order.find({
                status: 'Delivered',
                createdAt: { $gte: firstDayOfYear, $lte: lastDayOfYear }
            }).populate('products.product').populate('user');
        }




        console.log(order);
        res.status(200).json({ success: order });
    } catch (error) {
        console.log(error.message);
        res.status(500).json({ error: 'Internal Server error' });
    }
};


const customReport = async (req, res) => {
    try {
        console.log("kkk");
        const { startDate, endDate } = req.body;
        const startOfDay = new Date(startDate);
        const endOfDay = new Date(endDate);

        startOfDay.setUTCHours(0, 0, 0, 0);
        endOfDay.setUTCHours(23, 59, 59, 999);
        console.log(startOfDay);
        console.log(endOfDay);

        const order = await Order.find({
            status: 'Delivered',
            createdAt: { $gte: startOfDay, $lte: endOfDay }
        }).populate('products.product').populate('user');

        console.log(order);
        res.status(200).json({ success: order });
    } catch (error) {
        console.log(error.message);
        res.status(500).json({ error: 'Internal Server error' });
    }
};



const couponPage = async (req, res) => {
    try {
        var page = 1;
        if (req.query.page) {
            page = req.query.page;
        }
        const limit = 4;

        const coupon = await Coupon.find()
            .limit(limit * 1)
            .skip((page - 1) * limit)
            .exec()

        const count = await Coupon.countDocuments();
        res.render('coupon', { coupon, totalPages: Math.ceil(count / limit), currentPage: page });
    } catch (error) {
        console.log(error.message);
    }
}


const addCoupon = async (req, res) => {
    try {
        const { couponId, description, maximumDiscount, minimumAmount, maximumAmount, expireDate, maximumUser, discountAmount } = req.body;
        const coupon = new Coupon({
            couponId,
            description,
            maximumDiscount,
            minimumAmount,
            maximumAmount,
            expireDate,
            is_active: 1,
            maximumUser,
            discountAmount,
            maximumUser
        })
        await coupon.save();
        res.json({ success: true });
    } catch (error) {
        console.log(error.message);
    }
}


const blockCoupon = async (req, res) => {
    try {
        const couponId = req.params.couponId;
        const coupon = await Coupon.findById({ _id: couponId })
        coupon.is_active = 0
        await coupon.save();
        await Coupon.findByIdAndUpdate(couponId, { $set: { is_active: 0 } });
        res.status(200).json({ Success: true });
    } catch (error) {
        console.log(error.message);
        res.status(500).json({ error: 'Failed to block' });
    }
}


const unblockCoupon = async (req, res) => {
    try {
        const couponId = req.params.couponId;
        const coupon = await Coupon.findById({ _id: couponId })
        coupon.is_active = 1
        await coupon.save();
        await Coupon.findByIdAndUpdate(couponId, { $set: { is_active: 1 } });
        res.status(200).json({ Success: true });
    } catch (error) {
        console.log(error.message);
        res.status(500).json({ error: 'Failed to unblock' });
    }
}

const deleteCoupon = async (req, res) => {
    try {
        const couponId = req.params.couponId;
        await Coupon.findByIdAndDelete(couponId);
        res.status(200).json({ success: "Coupon Delete Successfully" })
    } catch (error) {
        console.log(error.message);
        res.status(500).json({ error: "Internal servor error" })
    }
}


const updateCoupon = async (req, res) => {
    try {
        const { couponId, updatedCoupon } = req.body;

        const coupon = await Coupon.findOne({ couponId });

        if (!coupon) {
            console.log("Coupon not found");
            return res.status(404).json({ error: "Coupon not found" });
        }

        coupon.description = updatedCoupon.description;
        coupon.maximumDiscount = updatedCoupon.maximumDiscount;
        coupon.minimumAmount = updatedCoupon.minimumAmount;
        coupon.maximumAmount = updatedCoupon.maximumAmount;
        coupon.discountAmount = updatedCoupon.discountAmount;
        coupon.maximumUser = updatedCoupon.maximumUser;
        coupon.expireDate = updatedCoupon.expireDate;

        await coupon.save();

        res.status(200).json({ success: "Coupon updated successfully" });
    } catch (error) {
        console.error(error.message);
        res.status(500).json({ error: "Internal server error" });
    }
};






const offerPage = async (req, res) => {
    try {
        var page = 1;
        if (req.query.page) {
            page = req.query.page;
        }
        const limit = 8;

        const products = await Product.find()
            .limit(limit * 1)
            .skip((page - 1) * limit)
            .exec()

        const count = await Product.countDocuments();
        const categories = await Category.find();
        res.render('offer', { products, categories, totalPages: Math.ceil(count / limit), currentPage: page });
    } catch (error) {
        console.log(error.message);
    }
}


const offerModule = async (req, res) => {
    try {
        const productId = req.params.productId;
        const offerPrice = req.body.offprice;
        const product = await Product.findById({ _id: productId });
        product.productOffer = offerPrice;
        let price = product.price;
        console.log(price)
        let productOfferprice = parseInt(offerPrice);
        console.log(productOfferprice)
        if (product.categoryOffer) {
            let value = parseInt(product.categoryOffer);
            console.log(value)
            let categoryOfferprice = (price * (value / 100));
            console.log(categoryOfferprice)
            if (productOfferprice <= categoryOfferprice) {
                console.log(typeof (price))
                console.log(typeof (categoryOfferprice))
                product.offprice = price - categoryOfferprice;
                console.log(price - categoryOfferprice)
                await product.save();
            } else {
                product.offprice = price - productOfferprice;
                console.log(productOfferprice)
                await product.save();
            }
        } else {
            product.offprice = price - productOfferprice;
            await product.save();
        }

        res.status(200).json({ success: 'Offer price add successfully' });
    } catch (error) {
        console.log(error.message);
        res.status(500).json({ error: 'Internal servar error' });
    }
}

const categoryOffer = async (req, res) => {
    try {
        var page = 1;
        if (req.query.page) {
            page = req.query.page;
        }
        const limit = 3;

        const categories = await Category.find()
            .limit(limit * 1)
            .skip((page - 1) * limit)
            .exec()

        const count = await Category.countDocuments();
        const products = await Product.find();
        console.log(categories)
        res.render('categoryOffer', { products, categories, totalPages: Math.ceil(count / limit), currentPage: page });
    } catch (error) {
        console.log(error.message);
    }
}

const applyCategory = async (req, res) => {
    try {
        const categoryId = req.params.categoryId;
        const percentage = req.body.percentage;

        const category = await Category.findById(categoryId);
        if (!category) {
            return res.status(404).json({ error: 'Category not found' });
        }

        const products = await Product.find({ catname: category.catname });
        if (!products || products.length === 0) {
            return res.status(404).json({ error: 'No products found for the category' });
        }

        category.offer = percentage;
        await category.save();

        const value = parseInt(percentage);
        for (const product of products) {
            product.categoryOffer = percentage;
            const price = product.price;
            let offprice;
            const categoryOfferprice = price * (value / 100);

            if (product.productOffer) {
                const productOfferprice = parseInt(product.productOffer);
                offprice = Math.min(price - categoryOfferprice, price - productOfferprice);
                await Product.updateMany(
                    { catname: category.catname, productname: product.productname },
                    { $set: { offprice: offprice, categoryOffer: percentage } }
                );
            } else {
                offprice = price - categoryOfferprice;
                await Product.updateMany(
                    { catname: category.catname, productname: product.productname },
                    { $set: { offprice: offprice, categoryOffer: percentage } }
                );
            }

        }

        res.status(200).json({ success: 'Discount added successfully' });
    } catch (error) {
        console.error(error.message);
        res.status(500).json({ error: 'Internal server error' });
    }
}





module.exports = {
    securePassword,
    loadLogin,
    verifyLogin,
    loadDashboard,
    adminLogout,
    userAccount,
    userBlock,
    userunBlock,
    orderList,
    detailedOrder,
    ChangeStatus,
    saleReport,
    filterReport,
    customReport,
    couponPage,
    addCoupon,
    blockCoupon,
    unblockCoupon,
    deleteCoupon,
    updateCoupon,
    offerPage,
    offerModule,
    categoryOffer,
    applyCategory,
    chartRender
}