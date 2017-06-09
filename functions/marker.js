'use strict';

const user = require('../models/user').User;
const marker = require('../models/user').Mark;
const bcrypt = require('bcryptjs');

exports.newMarker = (email, x, y) => 

	new Promise((resolve,reject) => {
		console.log(email);

		user.find({email: email})

		.then(users => {

			if (users.length == 0) {
				reject({ status: 404, message: 'User Not Found !' });
			} else {
				console.log(users[0]);

				const newMarker = new marker({
					x : x,
					y : y,
					markedBy : users[0]._id,
				});

				newMarker.save()

				.then(() => resolve({ status: 201, message: 'new marker added successfully !' }))

				.catch(err => {

					if (err.code == 11000) {

						reject({ status: 409, message: 'User Already Registered !' });

					} else {

						reject({ status: 500, message: 'Internal Server Error !' });
					}
				});

				return newMarker;				
			}
		})

		// .then(user => {

		// 	const hashed_password = user.hashed_password;

		// 	if (bcrypt.compareSync(password, hashed_password)) {

		// 		resolve({ status: 200, message: email });

		// 	} else {

		// 		reject({ status: 401, message: 'Invalid Credentials !' });
		// 	}
		// })

		.catch(err => reject({ status: 500, message: 'Internal Server Error !' }));

	});


