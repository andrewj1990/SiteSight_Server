'use strict';

const auth = require('basic-auth');
const jwt = require('jsonwebtoken');

const register = require('./functions/register');
const login = require('./functions/login');
const profile = require('./functions/profile');
const password = require('./functions/password');
const config = require('./config/config.json');
const marker = require('./functions/marker');
const fs = require('fs');
const busboy = require('connect-busboy');
const path = require('path');
const markerDB = require('./models/user').Mark;
const User = require('./models/user').User;
const ObjectId = require('mongodb').ObjectID;

const fileType = {
    html: 'text/html',
    txt: 'text/plain',
    css: 'text/css',
    gif: 'image/gif',
    jpg: 'image/jpeg',
    png: 'image/png',
    svg: 'image/svg+xml',
    js: 'application/javascript'
};

module.exports = router => {

	function requireLogin(req, res, next) {
		if (!req.user) {
			console.log('need to log in!');
			res.status(401).json({ message: 'Need to log in !'});
		} else {
			next();
		}
	}

	router.get('/', (req, res) => res.end('Welcome to Learn2Crack !'));

	router.post('/authenticate', (req, res) => {

		const credentials = auth(req);
		// console.log(req.body);
		// console.log(credentials);

		if (!credentials) {
			res.status(400).json({ message: 'Invalid Request !' });
		} else {
			// console.log(req.session);
			req.session.user = credentials.name;
			login.loginUser(credentials.name, credentials.pass)
			.then(result => {
				const token = jwt.sign(result, config.secret, { expiresIn: 1440 });			
				res.status(result.status).json({ message: result.message, token: token });

			})
			.catch(err => res.status(err.status).json({ message: err.message }));
		}
	});

	router.post('/users', (req, res) => {

		const name = req.body.name;
		const email = req.body.email;
		const password = req.body.password;

		console.log(req.body);
		console.log(req.body.name);

		if (!name || !email || !password || !name.trim() || !email.trim() || !password.trim()) {

			res.status(400).json({message: 'Invalid Request !'});

		} else {

			register.registerUser(name, email, password)

			.then(result => {

				res.setHeader('Location', '/users/'+email);
				res.status(result.status).json({ message: result.message })
			})

			.catch(err => res.status(err.status).json({ message: err.message }));
		}
	});

	router.post('/markers', requireLogin, (req, res) => {
		try {
			if(!isEmpty(req.body)){
				const email = req.user.email;
				const latitude = req.body.latitude;
				const longitude = req.body.longitude;
				const radius = req.body.r;
				const imageLocation = req.user.email + '_' + req.user.num_uploads + '.png';
				
				marker.newMarker(email, latitude, longitude, radius, imageLocation)
				.then(result => {
					// update number of uploads for user
					User.update(
						{ '_id' : ObjectId(req.user._id) }, 
						{ $set: { 'num_uploads': req.user.num_uploads + 1 } },
						function (err, result) {
							if (err) throw err;
						});

					res.setHeader('Location', '/users/' + email);
					res.status(result.status).json({ message: result.message })
				})
				.catch(err => res.status(401).json({ message: 'Invalid Token !'}));
			}
		} catch (error) {
			console.log(error);
			next();
		}

	});

	router.post('/upload', requireLogin, (req, res) => {
		try {
			var fname = req.user.email + '_' + req.user.num_uploads + '.png';
			var fstream;
			req.pipe(req.busboy);
			req.busboy.on('file', function (fieldname, file, filename) {
				console.log("Uploading: " + fname);
				fstream = fs.createWriteStream(__dirname + '/uploads/' + fname);
				file.pipe(fstream);
				fstream.on('close', function () {
					res.status(200).json({ message: fname })
				});
			});
		} catch (error) {
			console.log(error)
		}

	});

	router.get('/image/:filename', (req, res) => {
		const file = req.params.filename;
		const filePath = __dirname + '/uploads/' + file;
		console.log(filePath);

		var s = fs.createReadStream(filePath);
		var type = fileType[path.extname(file).slice(1)] || 'text/plain';

		console.log(type);

		s.on('open', function () {
			res.set('Content-Type', type);
			s.pipe(res);
		});
		s.on('error', function () {
			res.set('Content-Type', 'text/plain');
			res.status(404).end('Not found');
		});
	});

	router.get('/markers', requireLogin, (req, res) => {
        // var body = req.body;
        markerDB.find({ "_id" : { $nin : req.user.visited_sites } }, function(err, data){
            if (err) {
                console.log(err);
                return res.json(err);
            } else {
                console.log(data);
                return res.json(data);
            }
        });
	});

	router.get('/users/:id', requireLogin, (req,res) => {
		console.log(req.params.id);

		profile.getProfile(req.params.id)
		.then(result => res.json(result))
		.catch(err => res.status(err.status).json({ message: err.message }));

		// if (checkToken(req)) {

		// 	profile.getProfile(req.params.id)
		// 	.then(result => res.json(result))
		// 	.catch(err => res.status(err.status).json({ message: err.message }));

		// } else {

		// 	res.status(401).json({ message: 'Invalid Token !' });
		// }
	});

	router.put('/users/:id', (req,res) => {

		if (checkToken(req)) {

			const oldPassword = req.body.password;
			const newPassword = req.body.newPassword;

			if (!oldPassword || !newPassword || !oldPassword.trim() || !newPassword.trim()) {

				res.status(400).json({ message: 'Invalid Request !' });

			} else {

				password.changePassword(req.params.id, oldPassword, newPassword)

				.then(result => res.status(result.status).json({ message: result.message }))

				.catch(err => res.status(err.status).json({ message: err.message }));

			}
		} else {

			res.status(401).json({ message: 'Invalid Token !' });
		}
	});

	router.put('/markers/visited', requireLogin, (req,res) => {
		try {
			console.log(req.body.site_id);
			console.log(req.user);

			User.update(
				{ '_id' : ObjectId(req.user._id) }, 
				{ $push: { visited_sites : { _id : req.body.site_id } } },
				function (err, result) {
					if (err) throw err;
				});

			res.status(200).json({ message: 'Visited Site Added !' });
		} catch (error) {
			console.log(error)
			res.status(400).json({ message: 'Failed to Add Visited Site !' });
		}
	});

	router.put('/user/points', requireLogin, (req,res) => {
		try {
			console.log(req.body.points);
			console.log(req.user);

			User.update(
				{ '_id' : ObjectId(req.user._id) }, 
				{ $set: { 'points': req.user.points + req.body.points } },
				function (err, result) {
					if (err) throw err;
				});

			res.status(200).json({ message: 'Points Updated !' });
		} catch (error) {
			console.log(error)
			res.status(400).json({ message: 'Failed to update Points !' });
		}
	});

	router.post('/users/:id/password', (req,res) => {

		const email = req.params.id;
		const token = req.body.token;
		const newPassword = req.body.password;

		if (!token || !newPassword || !token.trim() || !newPassword.trim()) {

			password.resetPasswordInit(email)

			.then(result => res.status(result.status).json({ message: result.message }))

			.catch(err => res.status(err.status).json({ message: err.message }));

		} else {

			password.resetPasswordFinish(email, token, newPassword)

			.then(result => res.status(result.status).json({ message: result.message }))

			.catch(err => res.status(err.status).json({ message: err.message }));
		}
	});

	function checkToken(req) {

		const token = req.headers['x-access-token'];

		if (token) {

			try {

  				var decoded = jwt.verify(token, config.secret);

  				return decoded.message === req.params.id;

			} catch(err) {

				return false;
			}

		} else {

			return false;
		}
	}
	function isEmpty(obj) {
			for(var prop in obj) {
					if(obj.hasOwnProperty(prop))
							return false;
			}
			return JSON.stringify(obj) === JSON.stringify({});
	}

}