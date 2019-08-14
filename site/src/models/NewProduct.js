const mongoose = require('mongoose');

const newProductSchema = new mongoose.Schema({
  url: String,
  image: String,
  dateAdded: Date,
  site: String,
  title: String,
  price: String
});

const NewProduct = mongoose.model('NewProduct', newProductSchema);
module.exports = NewProduct;
