/**
 * Created by Aditech on 1/13/2016.
 */
var mongoose = require('mongoose');
var productSchema = mongoose.Schema({
    seller_name: String,
    category: String,
    price: String,
    brand: String,
    contact: String,
    product_name: String,
    about_product: String,
    post_date: Date,
    pics: Array,
    negotiable : String
});
module.exports = mongoose.model('Product', productSchema);
