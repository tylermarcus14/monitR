require('console-stamp')(console, {
	colors: {
		stamp: 'yellow',
		label: 'cyan',
		label: true,
		metadata: 'green'
	}
});

/* Moduless */
const mongoose = require('mongoose');
const express = require('express');
const session = require('express-session');
const nunjucks = require('nunjucks');
const bodyParser = require('body-parser');
const http = require('http');
const moment = require('moment');
const passport = require('passport');
const flash = require('connect-flash');
const LocalStrategy = require('passport-local').Strategy;
/* Classes and Models */
const Task = require('./src/classes/Task.js');
const AppRouter = require('./src/classes/AppRouter.js');
const Seller = require('./src/models/Seller');
const Product = require('./src/models/Product');

/* Express Server Setup */
const app = express();
app.server = http.createServer(app);

global.status = 'Stopped';
global.tasks = [];
global.logs = '';
global.config = require('./config')

const PORT = global.config.port;
var MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost/monitrGolden";


/* MongoDB Connection */
mongoose.set('debug', false);
mongoose.Promise = Promise;
mongoose.connect(MONGODB_URI, (err) => {
	if (!err) {

			// Product.remove({}, function(err) {
			// 	if (!err) {
			// 		console.log('All items in the Product collection have been removed.')
			// 	}
			// });

		nunjucks.configure('views', {
			autoescape: true,
			watch: true,
			express: app
		});

		app.use('/public', express.static(__dirname + '/public'));

		app.use(bodyParser.json({
			limit: '50mb'
		}));
		app.use(bodyParser.urlencoded({
			extended: true,
			limit: '50mb'
		}));

		// Sessions
		app.use(session({ 
			secret: 'secret', 
			savedUninitialized: true, 
			resave: true 
		}));
		
		// Passport init
		app.use(passport.initialize());
		app.use(passport.session());

		//Flash
		app.use(flash());

		//Flash Globals
		app.use(function (req, res, next) { 
			res.locals.success_msg = req.flash('success_msg');
			res.locals.error_msg = req.flash('error_msg');
			res.locals.error = req.flash('error');
			next();
		});

		app.set('view engine', 'html');

		new AppRouter(app);

		app.server.listen(process.env.PORT || PORT, () => {
			console.log(`App is running on at http://127.0.0.1:${app.server.address().port}`);
		});
		return;
	}
	console.error('MongoDB connection error. Please make sure MongoDB is running.\n', err);
	process.exit();
});

global.startTasks = function() {

	Product.remove({}, function(err) {
		if (!err) {
			Seller.find({}, (err, tasksQuery) => {
				for (let i = 0; i < tasksQuery.length; i++) {
					global.tasks.push(new Task(tasksQuery[i]));
					global.tasks[i].start();
				}
				global.status = 'Active';
				global.startTime = moment().format('x');
				global.needsRestart = false;
				global.stoppedTime = null
			});
		}
	});
}

global.stopTasks = function() {
	Seller.find({}, (err, tasksQuery) => {
		for (let i = 0; i < global.tasks.length; i++) {
			global.tasks[i].stop();
		}
		global.tasks = [];
		global.status = 'Stopped';
		global.needsRestart = false;
		global.stoppedTime = moment().format('x')
	});
}