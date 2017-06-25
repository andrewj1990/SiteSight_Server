'use strict';

const express    = require('express');        
const app        = express();                
const session 	 = require('express-session');
const MongoStore = require('connect-mongo')(session);
const bodyParser = require('body-parser');
const busboy 	 = require('connect-busboy');
const logger 	 = require('morgan');
const mongoose 	 = require('mongoose');
const router 	 = express.Router();
const port 	   	 = process.env.PORT || 8080;
const User 		 = require('./models/user').User;

mongoose.connect('mongodb://localhost:27017/node-android');

app.use(bodyParser.json());
app.use(busboy());
app.use(logger('dev'));

app.use(session({
	secret: 'sitesight',
	store: new MongoStore({ 
		mongooseConnection: mongoose.connection,
		ttl: 14 * 24 * 60 * 60 // = 14 days. Default
	})
}));

app.use(function(req, res, next) {
	if (req.session && req.session.user) {
		User.findOne({ email: req.session.user }, function(err, user) {
			if (user) {
				req.user = user.email;
				req.session.user = user.email;
				delete req.user.password;
				res.locals.user = user.email;
			}
			next();
		});
	} else {
		next();
	}
});

require('./routes')(router);
app.use('/api/v1', router);

app.listen(port);

console.log(`App Runs on ${port}`);