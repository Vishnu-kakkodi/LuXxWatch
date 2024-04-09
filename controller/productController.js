const Product = require("../model/productModel.js");
const Category = require("../model/categoryModel.js");


const productlist = async (req, res) => {
    try {
        var page = 1;
        if (req.query.page) {
            page = req.query.page;
        }

        const limit = 5;
        const products = await Product.find()
            .limit(limit * 1)
            .skip((page - 1) * limit)
            .exec()
        const count = await Product.countDocuments();
        const categories = await Category.find();
        res.render('productlist', { products, categories, totalPages: Math.ceil(count / limit), currentPage: page });
    } catch (error) {
        console.log(error.message);
    }
}

const loadproduct = async (req, res) => {
    try {
        const products = await Product.find();
        const categories = await Category.find();
        res.render('product', { products, categories });
    } catch (error) {
        console.log(error.message);
    }
}


const loadaddproduct = async (req, res) => {
    try {
        const categories = await Category.find();
        res.render('add-product', { categories });
    } catch (error) {
        console.log(error.message);
    }
}


const createProduct = async (req, res) => {

    try {
        const { brandname, productname, description, price, stock, caseDiameter, bandColour, bandMaterial, warranty, movement, weight, country } = req.body;
        const categories = await Category.find();

        const imageFileNames = req.files.map(file => file.filename);

        const product = new Product({
            brandname,
            productname,
            catname: req.body.catname,
            description,
            price,
            stock,
            caseDiameter,
            bandColour,
            bandMaterial,
            warranty,
            movement,
            weight,
            country,
            image: imageFileNames

        });

        const savedProduct = await product.save();
        if (savedProduct) {
            const products = await Product.find();
            res.redirect('/admin/productlist');
        }
    } catch (error) {
        console.log(error.message);
    }
}


const loadeditProduct = async (req, res) => {
    try {
        const productId = req.params.productId;
        const categories = await Category.find();
        const products = await Product.findById(productId);
        res.render('edit-product', { products, categories });
    } catch (error) {
        console.log(error.message);
    }
};

const updateproduct = async (req, res) => {
    try {
        const productId = req.params.productId;
        const { brandname, productname, description, price, stock, caseDiameter, bandColour, bandMaterial, warranty, movement, weight, country } = req.body;
        const product = await Product.findById(productId);
        product.brandname = brandname;
        product.productname = productname;
        product.description = description;
        product.price = price;
        product.stock = stock;
        product.caseDiameter = caseDiameter;
        product.bandColour = bandColour;
        product.bandMaterial = bandMaterial;
        product.warranty = warranty;
        product.movement = movement;
        product.weight = weight;
        product.country = country;

        await product.save();
        res.redirect('/admin/productlist')

    } catch (error) {
        console.log(error.message);
    }
}


const replaceImage = async (req, res) => {
    try {
        const productId = req.body.productId;
        const index = parseInt(req.body.index);

        const product = await Product.findById({ _id: productId });
        let deleteIndex = index;
        if (deleteIndex !== -1) {
            product.image.splice(deleteIndex, 1);
            product.image.splice((product.image.length), 0, "nill")
        }
        await product.save();
        res.json({ success: 'Image remove successfully' });
    } catch (error) {
        console.log(error.message);
    }
}


const addImage = async (req, res) => {
    try {

        const { productId, index } = req.body;

        if (!productId || !index) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        const product = await Product.findById(productId);

        if (!product) {
            return res.status(404).json({ error: 'Product not found' });
        }
        product.image.splice(index, 1, req.file.filename);
        await product.save();

        res.json({ success: 'Image added successfully' });
    } catch (error) {
        console.error(error.message);
        res.status(500).json({ error: 'Internal server error' });
    }
};







const enableProduct = async (req, res) => {

    try {
        const productId = req.params.productId;
        const products = await Product.findById(productId);

        products.is_active = 1;
        await products.save();
        await Product.findByIdAndUpdate(productId, { $set: { is_active: 1 } });

        res.redirect('/admin/productlist');
    } catch (error) {
        console.error(error);
    }
};

const disableProduct = async (req, res) => {

    try {
        const productId = req.params.productId;
        const products = await Product.findById(productId);

        products.is_active = 0;
        await products.save();
        await Product.findByIdAndUpdate(productId, { $set: { is_active: 0 } });

        res.redirect('/admin/productlist');
    } catch (error) {
        console.error(error);
    }
};



module.exports = {

    productlist,
    loadproduct,
    loadaddproduct,
    createProduct,
    loadeditProduct,
    updateproduct,
    replaceImage,
    enableProduct,
    disableProduct,
    addImage
}