const mongoose = require('mongoose');

const newProductSchema = new mongoose.Schema({
  userEmail: String,
  url: String,
  image: String,
  dateAdded: Date,
  site: String,
  title: String,
  price: String,
  alerts: Boolean
});

const NewProduct = mongoose.model('NewProduct', newProductSchema);
module.exports = NewProduct;
