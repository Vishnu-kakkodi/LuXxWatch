const Category = require("../model/categoryModel.js");
const bcrypt = require('bcrypt');
// const session = require("express-session")

const config = require("../configuration/config");
const randomstring = require("randomstring");



const loadcategory = async (req, res) => {
    try {
        const categories = await Category.find();
        res.render('category', { categories: categories });
    } catch (error) {
        console.log(error.message);
    }
}

const addcategory = async (req, res) => {
    try {
        const { catname, description } = req.body;

        if (!catname.trim()) {
            const categories = await Category.find();
            return res.render('category', { message: 'Category name is required', categories });
        }

        const category = new Category({
            catname,
            description,
            status: 0
        });

        const savedCategory = await category.save();
        if (savedCategory) {
            const categories = await Category.find();
            res.render('category', { categories: categories });
        }
        
        
    } catch (error) {
        console.log(error.message);
    }
}


const loadeditcategory =async(req,res)=>{
    const categoryId = req.params.categoryId;
    try{
        const categories = await Category.find({_id:categoryId});
        res.render('edit-category', { categories: categories });
    } catch (error) {
        console.log(error.message);
    }  
}



const updatecategory = async (req, res) => {
    const categoryId = req.params.categoryId;
    const { catname, description, status } = req.body; 

    try {
        
        const category = await Category.findById(categoryId);

        if (!category) {
            return res.status(404).send('Category not found');
        }

        
        
        category.catname = catname;
        category.description = description;
        category.status = status;

        await category.save();

        res.redirect('/admin/category');
    } catch (error) {
        console.log(error.message);
        res.status(500).send('Internal Server Error');
    }
}


const softDelete = async(req,res)=>{
        const categoryId = req.params.categoryId;
    
        try {
            const category = await Category.findById(categoryId);
            if (!category) {
                return res.status(404).send('Category not found');
            }
    
            
            category.deleted = true;
            await category.save();
    
            res.redirect('/admin/category');
        } catch (error) {
            console.error(error);
            res.status(500).send('Internal Server Error');
        }
    };









module.exports = {

    loadcategory,
    addcategory,
    loadeditcategory,
    updatecategory,
    softDelete
}