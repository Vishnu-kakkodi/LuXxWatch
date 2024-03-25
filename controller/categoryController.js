const Category = require("../model/categoryModel.js");

const loadcategory = async (req, res) => {
    try {
        var page = 1;
        if (req.query.page) {
            page = req.query.page;
        }
        const limit = 4;

        const categories = await Category.find()
        .limit(limit * 1)
        .skip((page - 1) * limit)
        .exec()

        const count = await Category.countDocuments();
        res.render('categoryList', { categories: categories,totalPages: Math.ceil(count / limit),currentPage: page });
    } catch (error) {
        console.log(error.message);
    }
}


const categoryInsert = async (req, res) => {
    try {
        res.render('category');
    } catch (error) {
        console.log(error.message);
    }
}

const addcategory = async (req, res) => {
    try {
        const { catname, description } = req.body;

        const regex = new RegExp(catname);

        const categories = await Category.find();

        const existCategory = await Category.find({ catname: { $regex: regex } });
        if(existCategory.length > 0){
            res.render('category', { errorMessage: 'Category name already exist', categories:categories });
        }else{
            const category = new Category({
                catname,
                description,
                status: 0,
                image:req.file.filename
            });
    
            const savedCategory = await category.save();
            if (savedCategory) {
                const categories = await Category.find();
                res.render('category', { categories: categories });
            }
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


const categoryimage = async(req,res)=>{
    const categoryId = req.params.categoryId;
    try{
        const categories = await Category.findById(categoryId);
        await Category.findByIdAndDelete({categories:categories.file.filename});
        res.redirect('/admin/edit-category');
    }catch(error){
        console.log(error.message);
    }
}



const updatecategory = async (req, res) => {
    const categoryId = req.params.categoryId;
    const { catname, subcategory, description} = req.body; 

    try {
        
        const category = await Category.findById(categoryId);      
        category.catname = catname;
        category.description = description;
        category.image = req.file.filename

        await category.save();
        await Category.findByIdAndUpdate(categoryId, { $set: {catname:category.catname,description:category.description,image:category.image } });
        res.redirect('/admin/category');
    } catch (error) {
        console.log(error.message);
    }
}


const enableCategory = async(req,res)=>{
    const categoryId = req.params.categoryId;

    try {
        const category = await Category.findById(categoryId);

        category.status = 0;
        await category.save();
        await Category.findByIdAndUpdate(categoryId, { $set: { status: 0 } });

        res.redirect('/admin/category');
    } catch (error) {
        console.error(error);
    }
};

const disableCategory = async(req,res)=>{
    const categoryId = req.params.categoryId;

    try {
        const category = await Category.findById(categoryId);

        category.status = 1;
        await category.save();
        await Category.findByIdAndUpdate(categoryId, { $set: { status: 1 } });

        res.redirect('/admin/category');
    } catch (error) {
        console.error(error);
    }
};


// const deleteCategory = async(req,res)=>{
//     const categoryId = req.params.categoryId;
//     try{
//         const category = await Category.findById(categoryId);
//         await Category.findByIdAndDelete(categoryId);
//         res.redirect('/admin/category');

//     }catch(error){
//         console.log(error.message);
//     }
// }









module.exports = {

    loadcategory,
    addcategory,
    categoryInsert,
    // categoryName,
    loadeditcategory,
    categoryimage,
    updatecategory,
    enableCategory,
    disableCategory
}