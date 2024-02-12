const express = require('express');
const category_route = express();

const session = require('express-session');
const config = require('../configuration/config');


const bodyParser = require('body-parser');
admin_route.use(bodyParser.json());
admin_route.use(bodyParser.urlencoded({extended:true}));

admin_route.set('view engine','ejs');
admin_route.set('views','./views/category');

const path = require("path");

admin_route.use(express.static('public'));

const categoryController = require("../controller/categoryController");

admin_route.use(session({
    secret: config.sessionSecret,
    resave: false,
    saveUninitialized: false 
}));