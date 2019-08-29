const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
	email: String,
	password: String,
	name: String,
	date: {
		type: Date,
		default: Date.now
	  },
	userID: Number
});

const User = module.exports = mongoose.model('User', userSchema);

module.exports.createUser = function(newUser, callback){
	bcrypt.genSalt(10, function(err, salt) {
		bcrypt.hash(newUser.password, salt, function(err, hash) {
			// Store hash in your password DB.
			newUser.password = hash;
			newUser.save(callback);
		});
	});
}
