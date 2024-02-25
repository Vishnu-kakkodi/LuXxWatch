const Product = require("../model/productModel.js");
const Category = require("../model/categoryModel.js");


const productlist = async(req,res)=>{
    try{ 
        const products = await Product.find();
        const categories = await Category.find();     
        res.render('productlist', { products,categories });
    }catch(error){
        console.log(error.message);
    }
}

const loadproduct = async(req,res)=>{
    try{ 
        const products = await Product.find();
        const categories = await Category.find();     
        res.render('product', { products,categories });
    }catch(error){
        console.log(error.message);
    }
}


const loadaddproduct = async(req,res)=>{
    try{ 
        const categories = await Category.find();     
        res.render('add-product', { categories });
    }catch(error){
        console.log(error.message);
    }
}


const createProduct = async(req,res)=>{
    
    try{
        const {brandname, productname, description, price, offprice,stock,caseDiameter,bandColour,bandMaterial,warranty,movement,weight,country } = req.body;
        const categories = await Category.find();
        
        const imageFileNames = req.files.map(file => file.filename);

        const product = new Product({
            brandname,
            productname,
            catname:req.body.catname,
            description,
            price,
            offprice,
            stock,
            caseDiameter,
            bandColour,
            bandMaterial,
            warranty,
            movement,
            weight,
            country,
            image:imageFileNames
         
        });

        console.log(product);

        const savedProduct = await product.save();
        if (savedProduct) {
            const products = await Product.find();
            res.render('productlist', { products: products });
        }
    }catch(error){
        console.log(error.message);
    }
}


const loadeditProduct = async (req, res) => {
    const productId = req.params.productId;
    const categories = await Category.find();
    try {
        const products = await Product.findById(productId);
        console.log(products);
        res.render('edit-product', {products,categories});
    } catch (error) {
        console.log(error.message);
    }
};

const updateproduct = async(req,res)=>{
    const productId = req.params.productId;
    const {brandname, productname, description, price, offprice,stock,caseDiameter,bandColour,bandMaterial,warranty,movement,weight,country } = req.body;
    
    try{
        const imageFileNames = req.files.map(file => file.filename);
        const product = await Product.findById(productId);
        product.brandname = brandname;
        product.productname = productname;
        product.description = description;
        product.price = price;
        product.offprice = offprice;
        product.stock = stock;
        product.caseDiameter = caseDiameter;
        product.bandColour = bandColour;
        product.bandMaterial = bandMaterial;
        product.warranty = warranty;
        product.movement = movement;
        product.weight = weight;
        product.country = country;
        product.image = imageFileNames;
        
        await product.save();
        await Category.findByIdAndUpdate(productId, { $set: {
            brandname:product.brandname,productname:product.productname,description:product.description,price:product.price,offprice:product.offprice,stock:product.stock,image:product.image,
            caseDiameter:product.caseDiameter,bandColour:product.bandColour,bandMaterial:product.bandMaterial,warranty:product.warranty,movement:product.movement,weight:product.weight,country:product.country
         } });
        res.redirect('/admin/product');

    }catch(error){
        console.log(error.message);
    }
}




const enableProduct = async(req,res)=>{
    const productId = req.params.productId;

    try {
        const products = await Product.findById(productId);

        products.is_active = 1;
        await products.save();
        await Product.findByIdAndUpdate(productId, { $set: { is_active: 1 } });

        res.redirect('/admin/productlist');
    } catch (error) {
        console.error(error);
    }
};

const disableProduct = async(req,res)=>{
    const productId = req.params.productId;

    try {
        const products = await Product.findById(productId);

        products.is_active = 0;
        await products.save();
        await Product.findByIdAndUpdate(productId, { $set: { is_active: 0 } });

        res.redirect('/admin/productlist');
    } catch (error) {
        console.error(error);
    }
};


// const deleteproduct = async(req,res)=>{
//     const productId = req.params.productId;
//     try{
//         await Product.findByIdAndDelete(productId);
//         res.redirect('/admin/product');
//     }catch(error){
//         console.log(error.message);
//     }   
// }



module.exports = {

    productlist,
    loadproduct,
    loadaddproduct,
    createProduct,
    loadeditProduct,
    updateproduct,
    enableProduct,
    disableProduct
}