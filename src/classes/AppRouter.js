const {
	version
} = require('../../package');

const Seller = require('../models/Seller');
const Product = require('../models/Product');
const User = require('../models/User');

const NewProduct = require('../models/NewProduct');

const Notify = require('../classes/Notify');
const Twilio = require('../../twilio')
const proxyUtil = require('../utils/proxy');
const moment = require('moment');
const fs = require('fs');
const parseUrl = require("parse-url");
const multer = require('multer')
const upload = multer({
	dest: 'uploads/'
})
const passport = require('passport');
require('../config/passport')(passport);

const { ensureAuthenticated, forwardAuthenticated } = require('../config/auth');

let randomColors = [
	'#007bff'
]


class AppRouter {

	constructor(app) {
		this.app = app;
		this.setupRouters();
	}

	setupRouters() {
		const app = this.app;

		app.get('/', (req, res, next) => {

			let storesList = [];
			let newItems = [];
			let isEmpty = true;

			Seller
				.find({})
				.limit(3)
				.sort('-dateAdded')
				.exec(function(err, stores) {

					for (let i = 0; i < stores.length; i++) {
						storesList.push({
							// color: randomColors[Math.floor(Math.random() * randomColors.length)],
							proxies: stores[i].proxies,
							keywords: stores[i].keywords,
							_id: stores[i]._id,
							url: stores[i].url,
							lastItemAdded: stores[i].lastItemAdded,
							lastItemCount: stores[i].lastItemCount,
							pollMS: stores[i].pollMS
						})
					}

					NewProduct
						.find({})
						.sort('-dateAdded')
						.limit(3)
						.exec(function(err, products) {

							for (let i = 0; i < products.length; i++) {
								newItems.push({
									// color: randomColors[Math.floor(Math.random() * randomColors.length)],
									url: products[i].url,
									// image: products[i].image,
									dateAdded: products[i].dateAdded,
									site: products[i].site,
									title: products[i].title
								})
							}

							if (newItems.length > 0) {
								isEmpty = false;
							}

							return res.render('home', {
								status: global.status,
								stores: storesList,
								count: (stores.length == 1) ? '1 Store' : `${stores.length} Stores`,
								needsRestart: global.needsRestart,
								startTime: global.startTime,
								newItems: newItems,
								isEmpty: isEmpty
							});

						});

				});

		});

		app.get('/login', (req, res, next) => {
			return res.render('login', {});
		});
		


			// Login
		app.post('/login/success', (req, res, next) => {
			passport.authenticate('local', {
			successRedirect: '/dashboard',
			failureRedirect: '/login',
			failureFlash: true
			})(req, res, next);
		});
		

		// Logout
		app.get('/logout/sucess', function(req, res){
			req.logout();
			res.redirect('/');
		  });

		
  


		// app.post('/login/success', (req, res, next) => {

		// 	return res.redirect('/dashboard');
		// });

		app.get('/register', (req, res, next) => {

			return res.render('register', {});
		});


		app.post('/register/success', (req, res, next) => {
			let newUser = new User({
				email: req.body.email,
				password: req.body.password,
				name: req.body.name
			});

			User.createUser(newUser, function(err, User){
				if (err) {
					return res.json({
						message: 'Please try again.',
						error: true
					})
				} else {
					User.save();
					req.flash(
					'success_msg', 'You have successfully registerd.');
					return res.redirect('/login');
			}
		});
		});

		app.get('/dashboard', ensureAuthenticated, (req, res, next) => {

			let storesList = [];
			let newItems = [];
			let isEmpty = true;

			Seller
				.find({userEmail: req.user.email})
				.limit(3)
				.sort('-dateAdded')
				.exec(function(err, stores) {

					for (let i = 0; i < stores.length; i++) {
						storesList.push({
							color: randomColors[Math.floor(Math.random() * randomColors.length)],
							proxies: stores[i].proxies,
							keywords: stores[i].keywords,
							_id: stores[i]._id,
							url: stores[i].url,
							lastItemAdded: stores[i].lastItemAdded,
							lastItemCount: stores[i].lastItemCount,
							pollMS: stores[i].pollMS
						})
					}

					NewProduct
						.find({userEmail: req.user.email})
						.sort('-dateAdded')
						.limit(3)
						.exec(function(err, products) {

							for (let i = 0; i < products.length; i++) {
								newItems.push({
									// color: randomColors[Math.floor(Math.random() * randomColors.length)],
									url: products[i].url,
									image: products[i].image,
									dateAdded: products[i].dateAdded,
									site: products[i].site,
									title: products[i].title,
									price: products[i].price
								})
							}

							if (newItems.length > 0) {
								isEmpty = false;
							}

							return res.render('dashboard', {
								status: global.status,
								stores: storesList,
								count: (stores.length == 1) ? '1 Store' : `${stores.length} Stores`,
								needsRestart: global.needsRestart,
								startTime: global.startTime,
								newItems: newItems,
								isEmpty: isEmpty
							});

						});

				});

		});


		app.get('/stores', ensureAuthenticated, (req, res, next) => {

			Seller
				.find({userEmail: req.user.email})
				.exec(function(err, stores) {

					let storesList = [];

					for (let i = 0; i < stores.length; i++) {
						storesList.push({
							// color: randomColors[Math.floor(Math.random() * randomColors.length)],
							proxies: stores[i].proxies,
							keywords: stores[i].keywords,
							_id: stores[i]._id,
							url: stores[i].url,
							lastItemAdded: stores[i].lastItemAdded,
							lastItemCount: stores[i].lastItemCount,
							pollMS: stores[i].pollMS
						})
					}

					return res.render('stores', {
						stores: storesList,
						count: (stores.length == 1) ? '1 Store' : `${stores.length} Stores`,
						needsRestart: global.needsRestart
					});

				});

		});

		app.post('/stores/add', (req, res, next) => {

			if (req.body.url == '' || req.body.pollMS == '') {
				return res.json(200, {
					message: 'Missing important fields to add store, please try again',
					error: true
				})
			}

			let newStore = new Seller({
				userEmail: req.user.email,
				url: parseUrl(req.body.url).resource,
				lastItemAdded: null,
				lastItemCount: null,
				// proxies: (req.body.proxies == '') ? [] : proxyUtil.formatList(req.body.proxies.replace(/\r/g, '').split('\n')),
				keywords: (req.body.keywords == '') ? [] : req.body.keywords.replace(/\r/g, '').split('\n'),
				pollMS: req.body.pollMS,
				dateAdded: moment(),
				storeHash: null
			});

			newStore.save();

			if (global.status == 'Active') {
				global.needsRestart = true;
			}

			return res.redirect('/stores');

		});

		app.get('/settings', ensureAuthenticated, (req, res, next) => {

			fs.readFile(__dirname + '/../../config.json', function(err, data) {
				let dataToAppend = JSON.parse(data);

				if (dataToAppend.discord.active) {
					dataToAppend.discord.active = 'checked'
				}

				if (dataToAppend.slack.active) {
					dataToAppend.slack.active = 'checked'
				}

				console.log(dataToAppend)

				return res.render('settings', {
					settings: dataToAppend
				});
			});

		});

		app.post('/settings/update', (req, res, next) => {

			fs.readFile(__dirname + '/../../config.json', function(err, data) {

				let dataToAppend = JSON.parse(data);

				let discord = false;
				let slack = false;

				if (req.body.slackBotActive == 'on') {
					slack = true;
				}

				if (req.body.discordActive == 'on') {
					discord = true;
				}

				let newConfig = {
					"port": dataToAppend.port,
					"mongodb_uri": dataToAppend.mongodb_uri,
					"slack": {
						"active": slack,
						"webhook_url": req.body.webhook_url_slack
					},
					"discord": {
						"active": discord,
						"webhook_url": req.body.webhook_url_discord
					}
				}

				global.config = newConfig;

				fs.writeFile(__dirname + '/../../config.json', JSON.stringify(newConfig, null, 4), function(err) {
					return res.redirect('/settings');
				});

			});

		});

		app.get('/restart', (req, res, next) => {
			global.stopTasks();
			setTimeout(function() {
				global.startTasks();
				return res.redirect('/');
			}, 10000);
		});

		app.get('/stop', (req, res, next) => {

			global.stopTasks();
			return res.redirect('/dashboard');

		});

		app.get('/start', (req, res, next) => {
			global.startTasks();
			return res.redirect('/dashboard');
		});



		app.get('/features', (req, res, next) => {

			return res.render('features', {});
		});

	
		app.get('/contact', (req, res, next) => {

			return res.render('contact', {});
		});
	

		app.get('/alerts', ensureAuthenticated, (req, res, next) => {
		
			let storesList = [];
			let newItems = [];
			let isEmpty = true;

			Product
				.find({userEmail: req.user.email})
				.exec(function(err, products) {

					let productsList = [];

					for (let i = 0; i < products.length; i++) {
						productsList.push({
							_id: products[i]._id,
							url: products[i].url,
							// image: products[i].res.img,
							// title: products[i].res.title,
							seller: products[i].seller,
							dateAdded: moment()
						})
					}

					NewProduct
					.find({userEmail: req.user.email})
					.sort('-dateAdded')
					.exec(function(err, products) {

						for (let i = 0; i < products.length; i++) {
							newItems.push({
								// color: randomColors[Math.floor(Math.random() * randomColors.length)],
								url: products[i].url,
								image: products[i].image,
								dateAdded: products[i].dateAdded,
								site: products[i].site,
								title: products[i].title,
								price: products[i].price,
								_id: products[i]._id


							})
						}

						if (newItems.length > 0) {
							isEmpty = false;
						}

						return res.render('alerts', {
							status: global.status,
							stores: storesList,
							needsRestart: global.needsRestart,
							startTime: global.startTime,
							newItems: newItems,
							isEmpty: isEmpty,
							products: productsList,
							count: (products.length == 1) ? '1 Product' : `${products.length} Products`,
							needsRestart: global.needsRestart
						});

					});

				});

		});


		app.get('/products', ensureAuthenticated, (req, res, next) => {
		
			let storesList = [];
			let newItems = [];
			let isEmpty = true;

			Product
				.find({userEmail: req.user.email})
				.exec(function(err, products) {

					let productsList = [];

					for (let i = 0; i < products.length; i++) {
						productsList.push({
							_id: products[i]._id,
							url: products[i].url,
							// image: products[i].res.img,
							// title: products[i].res.title,
							seller: products[i].seller,
							dateAdded: moment()
						})
					}

					NewProduct
					.find({userEmail: req.user.email})
					.sort('-dateAdded')
					.exec(function(err, products) {

						for (let i = 0; i < products.length; i++) {
							newItems.push({
								// color: randomColors[Math.floor(Math.random() * randomColors.length)],
								url: products[i].url,
								image: products[i].image,
								dateAdded: products[i].dateAdded,
								site: products[i].site,
								title: products[i].title,
								price: products[i].price,
								_id: products[i]._id


							})
						}

						if (newItems.length > 0) {
							isEmpty = false;
						}

						return res.render('products', {
							status: global.status,
							stores: storesList,
							needsRestart: global.needsRestart,
							startTime: global.startTime,
							newItems: newItems,
							isEmpty: isEmpty,
							products: productsList,
							count: (products.length == 1) ? '1 Product' : `${products.length} Products`,
							needsRestart: global.needsRestart
						});

					});

				});

		});


		app.get('/settings/sms/test', (req, res, next) => {

			Twilio(discord.webhook_url);

			return res.redirect('/settings');

		});

		app.get('/settings/slack/test', (req, res, next) => {

			fs.readFile(__dirname + '/../../config.json', function(err, data) {
				Notify.slackTest(JSON.parse(data).slack.webhook_url);
			});

			return res.redirect('/settings');

		});


		app.get('/products/remove', (req, res, next) => {
			NewProduct.deleteMany(({userEmail: req.user.email}), function(err) {})
			Product.deleteMany(({userEmail: req.user.email}), function(err) {
				if (err) {
					return res.json({
						message: 'No products to remove.',
						error: true
					})
				} else {
					global.stopTasks();
				}
				return res.redirect('/products');

			});		
		});


		
		app.get('/store/delete/:id', (req, res, next) => {
			Seller.findOneAndRemove({
				_id: req.params.id
			}, function(err) {
				if (err) {
					return res.json({
						message: 'Seller not found',
						error: true
					})
				} else {
					global.stopTasks();
					return res.redirect('/stores');
				}
			});
		});
	
	
		app.get('/product/delete/:id', (req, res, next) => {
			NewProduct.findOneAndRemove({
				_id: req.params.id
			}, function(err) {
				if (err) {
					return res.json({
						message: 'Product not found',
						error: true
					})
				} else {
					global.stopTasks();
					return res.redirect('/products');
				}
			});
		});

		app.get('/products/search', ensureAuthenticated, (req, res, next) => {
			let search2 = ('search ' + req.params.value)
			let searchterm = 'ICON Sticker Pack'
			let storesList = [];
			let newItems = [];
			let isEmpty = true;

			Product
				.find({})
				.exec(function(err, products) {

					let productsList = [];

					for (let i = 0; i < products.length; i++) {
						productsList.push({
							_id: products[i]._id,
							url: products[i].url,
							// image: products[i].res.img,
							// title: products[i].res.title,
							seller: products[i].seller,
							dateAdded: moment()
						})
					}

					NewProduct
					.find({ title: searchterm })
					.sort('-dateAdded')
					.exec(function(err, products) {
						console.log(req.body)
						console.log(searchterm)
						console.log(search2)

						for (let i = 0; i < products.length; i++) {
							newItems.push({
								// color: randomColors[Math.floor(Math.random() * randomColors.length)],
								url: products[i].url,
								image: products[i].image,
								dateAdded: products[i].dateAdded,
								site: products[i].site,
								title: products[i].title,
								price: products[i].price,
								_id: products[i]._id


							})
						}
						return res.render('products', {
							status: global.status,
							stores: storesList,
							needsRestart: global.needsRestart,
							startTime: global.startTime,
							newItems: newItems,
							isEmpty: isEmpty,
							products: productsList,
							count: (products.length == 1) ? '1 Product' : `${products.length} Products`,
							needsRestart: global.needsRestart
						});

					});
		});
	});

		app.get('/products/search', ensureAuthenticated, (req, res, next) => {
			let search2 = ('search ' + req.params.value)
			let searchterm = 'ICON Sticker Pack'
			let storesList = [];
			let newItems = [];
			let isEmpty = true;

			Product
				.find({})
				.exec(function(err, products) {

					let productsList = [];

					for (let i = 0; i < products.length; i++) {
						productsList.push({
							_id: products[i]._id,
							url: products[i].url,
							// image: products[i].res.img,
							// title: products[i].res.title,
							seller: products[i].seller,
							dateAdded: moment()
						})
					}

					NewProduct
					.find({ title: searchterm })
					.sort('-dateAdded')
					.exec(function(err, products) {
						console.log(req.body)
						console.log(searchterm)
						console.log(search2)

						for (let i = 0; i < products.length; i++) {
							newItems.push({
								// color: randomColors[Math.floor(Math.random() * randomColors.length)],
								url: products[i].url,
								image: products[i].image,
								dateAdded: products[i].dateAdded,
								site: products[i].site,
								title: products[i].title,
								price: products[i].price,
								_id: products[i]._id


							})
						}
						return res.render('products', {
							status: global.status,
							stores: storesList,
							needsRestart: global.needsRestart,
							startTime: global.startTime,
							newItems: newItems,
							isEmpty: isEmpty,
							products: productsList,
							count: (products.length == 1) ? '1 Product' : `${products.length} Products`,
							needsRestart: global.needsRestart
						});

					});
		});
	});


		// app.get('/products/:search', (req, res) => {
		// 	NewProduct.find({ title: req.body.search }, (err, s) => {
		// 		return res.render('products', s);
		// 	});

		// });

		app.get('/product/:search', (req, res) => {

			NewProduct.findById(req.params.search, (err, s) => {
				return res.render('product', s);
				
			});

		});

		app.post('/product/update/:id', (req, res) => {

			NewProduct.findById(req.params.id, (err, s) => {

				if (err) return res.redirect('/products');

				s.pollMS = parseInt(req.body.pollMS);
				s.proxies = (req.body.proxies == '') ? [] : proxyUtil.formatList(req.body.proxies.replace(/\r/g, '').split('\n'))
				s.keywords = (req.body.keywords == '') ? [] : req.body.keywords.replace(/\r/g, '').split('\n');

				s.save();
				global.stopTasks();

				setTimeout(() => {
					return res.redirect(`/product/${req.params.id}`);
				}, 1500);

			});

		});

		// app.post('/stores/addFile', upload.single('sitelist'), (req, res, next) => {

		// 	if (req.body.file == '' || req.body.pollMS == '') {
		// 		return res.json(200, {
		// 			message: 'Missing important fields to add store, please try again',
		// 			error: true
		// 		})
		// 	}

		// 	const siteList = fs.readFileSync(req.file.path).toString().split('\n');

		// 	for (let i = 0; i < siteList.length; i++) {
		// 		if (siteList[i] != '') {
		// 			let newStore = new Seller({
		// 				url: parseUrl(siteList[i]).resource,
		// 				lastItemAdded: null,
		// 				lastItemCount: null,
		// 				proxies: (req.body.proxies == '') ? [] : proxyUtil.formatList(req.body.proxies.replace(/\r/g, '').split('\n')),
		// 				keywords: (req.body.keywords == '') ? [] : req.body.keywords.replace(/\r/g, '').split('\n'),
		// 				pollMS: req.body.pollMS,
		// 				dateAdded: moment(),
		// 				storeHash: null
		// 			});
		// 			newStore.save();
		// 		}
		// 	}
		// 	global.stopTasks();
		// 	return res.redirect('/stores');

		// });

		app.get('/store/:id', (req, res) => {

			Seller.findById(req.params.id, (err, s) => {

				if (s) {
					s.keywords = s.keywords.join('\n');

					for (let i = 0; i < s.proxies.length; i++) {
						s.proxies[i] = s.proxies[i].replace("http://", "")
					}

					s.proxies = s.proxies.join('\n');

					if (err) return res.json({
						message: err,
						error: true
					});
					return res.render('store', s);
				} else {
					return res.json({
						message: 'Error Occured while trying to find: ' + req.params.id,
						error: true
					})
				}
			});

		});

		app.post('/store/update/:id', (req, res) => {

			Seller.findById(req.params.id, (err, s) => {

				if (err) return res.redirect('/stores');

				s.pollMS = parseInt(req.body.pollMS);
				s.proxies = (req.body.proxies == '') ? [] : proxyUtil.formatList(req.body.proxies.replace(/\r/g, '').split('\n'))
				s.keywords = (req.body.keywords == '') ? [] : req.body.keywords.replace(/\r/g, '').split('\n');

				s.save();
				global.stopTasks();

				setTimeout(() => {
					return res.redirect(`/store/${req.params.id}`);
				}, 1500);

			});

		});


	}

}

module.exports = AppRouter;