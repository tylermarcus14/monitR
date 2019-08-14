const {
	version
} = require('../../package');

const Seller = require('../models/Seller');
const Product = require('../models/Product');
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
			let newItemsWithColors = [];
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
								newItemsWithColors.push({
									// color: randomColors[Math.floor(Math.random() * randomColors.length)],
									url: products[i].url,
									// image: products[i].image,
									dateAdded: products[i].dateAdded,
									site: products[i].site,
									title: products[i].title
								})
							}

							if (newItemsWithColors.length > 0) {
								isEmpty = false;
							}

							return res.render('home', {
								status: global.status,
								stores: storesList,
								count: (stores.length == 1) ? '1 Store' : `${stores.length} Stores`,
								needsRestart: global.needsRestart,
								startTime: global.startTime,
								newItems: newItemsWithColors,
								isEmpty: isEmpty
							});

						});

				});

		});

		app.get('/dashboard', (req, res, next) => {

			let storesList = [];
			let newItemsWithColors = [];
			let isEmpty = true;

			Seller
				.find({})
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
						.find({})
						.sort('-dateAdded')
						.limit(3)
						.exec(function(err, products) {

							for (let i = 0; i < products.length; i++) {
								newItemsWithColors.push({
									// color: randomColors[Math.floor(Math.random() * randomColors.length)],
									url: products[i].url,
									image: products[i].image,
									dateAdded: products[i].dateAdded,
									site: products[i].site,
									title: products[i].title,
									price: products[i].price
								})
							}

							if (newItemsWithColors.length > 0) {
								isEmpty = false;
							}

							return res.render('dashboard', {
								status: global.status,
								stores: storesList,
								count: (stores.length == 1) ? '1 Store' : `${stores.length} Stores`,
								needsRestart: global.needsRestart,
								startTime: global.startTime,
								newItems: newItemsWithColors,
								isEmpty: isEmpty
							});

						});

				});

		});

		app.get('/stores', (req, res, next) => {

			Seller
				.find({})
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

		app.get('/settings', (req, res, next) => {

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

		app.get('/logs', (req, res, next) => {
			return res.render('logs', {
				logs: global.logs
			});
		});


		app.get('/features', (req, res, next) => {

			return res.render('features', {});
		});

	
		app.get('/contact', (req, res, next) => {

			return res.render('contact', {});
		});
	
		app.get('/products', (req, res, next) => {
		
			let storesList = [];
			let newItemsWithColors = [];
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
					.find({})
					.sort('-dateAdded')
					.exec(function(err, products) {

						for (let i = 0; i < products.length; i++) {
							newItemsWithColors.push({
								// color: randomColors[Math.floor(Math.random() * randomColors.length)],
								url: products[i].url,
								image: products[i].image,
								dateAdded: products[i].dateAdded,
								site: products[i].site,
								title: products[i].title,
								price: products[i].price

							})
						}

						if (newItemsWithColors.length > 0) {
							isEmpty = false;
						}

						return res.render('products', {
							status: global.status,
							stores: storesList,
							needsRestart: global.needsRestart,
							startTime: global.startTime,
							newItems: newItemsWithColors,
							isEmpty: isEmpty,
							products: productsList,
							count: (products.length == 1) ? '1 Product' : `${products.length} Products`,
							needsRestart: global.needsRestart
						});

					});

				});

		});


		app.get('/settings/sms/test', (req, res, next) => {

			Twilio();

			return res.redirect('/settings');

		});

		app.get('/settings/slack/test', (req, res, next) => {

			fs.readFile(__dirname + '/../../config.json', function(err, data) {
				Notify.slackTest(JSON.parse(data).slack.webhook_url);
			});

			return res.redirect('/settings');

		});

		app.get('/logs/clear', (req, res, next) => {
			global.logs = '';
			return res.redirect('/logs');
		});


		app.get('/products/remove', (req, res, next) => {
			NewProduct.deleteMany({}, function(err) {})
			Product.deleteMany({}, function(err) {
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
			Product.findOneAndRemove({
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

		app.post('/stores/addFile', upload.single('sitelist'), (req, res, next) => {

			if (req.body.file == '' || req.body.pollMS == '') {
				return res.json(200, {
					message: 'Missing important fields to add store, please try again',
					error: true
				})
			}

			const siteList = fs.readFileSync(req.file.path).toString().split('\n');

			for (let i = 0; i < siteList.length; i++) {
				if (siteList[i] != '') {
					let newStore = new Seller({
						url: parseUrl(siteList[i]).resource,
						lastItemAdded: null,
						lastItemCount: null,
						proxies: (req.body.proxies == '') ? [] : proxyUtil.formatList(req.body.proxies.replace(/\r/g, '').split('\n')),
						keywords: (req.body.keywords == '') ? [] : req.body.keywords.replace(/\r/g, '').split('\n'),
						pollMS: req.body.pollMS,
						dateAdded: moment(),
						storeHash: null
					});
					newStore.save();
				}
			}
			global.stopTasks();
			return res.redirect('/stores');

		});

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