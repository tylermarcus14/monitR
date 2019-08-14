const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
	url: String,
	image: String,
	title: String,
	seller: {
		type: mongoose.Schema.Types.ObjectId,
		ref: 'Seller'
	},
	dateAdded: Date,
	lastModification: String
});

const Product = mongoose.model('Product', productSchema);
module.exports = Product;