'use strict';

const user = require('../models/user').User;
const marker = require('../models/user').Mark;
const bcrypt = require('bcryptjs');

exports.newMarker = (email,latitude,longitude, radius, imageLocation) => 

	new Promise((resolve,reject) => {
		user.find({email: email})
		.then(users => {
			if (users.length == 0) {
				console.log("user not found..");
				reject({ status: 404, message: 'User Not Found !' });
			} else {
				// console.log(users[0]);
				const newMarker = new marker({
					latitude : latitude,
					longitude : longitude,
					radius : radius,
					picture : imageLocation,
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
		.catch(err => reject({ status: 500, message: 'Internal Server Error !' }));

	});


