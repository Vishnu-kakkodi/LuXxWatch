const Category = require("../model/categoryModel.js");

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
        
        
    } catch (error) {
        console.log(error.message);
    }
}


// const categoryName =async(req,res)=>{
//     try {
//         console.log();
//         const categoryName = req.body.categoryName;

//         const existingCategory = await Category.findOne({ catname: categoryName });

//         if (existingCategory) {
//             res.json({ unique: true });
//         } else {
//             res.json({ unique: false });
//         }
//     } catch (error) {
//         console.log(error.message);
//         res.status(500).json({ error: 'Internal server error' });
//     } 
// }


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
    // categoryName,
    loadeditcategory,
    categoryimage,
    updatecategory,
    enableCategory,
    disableCategory
}