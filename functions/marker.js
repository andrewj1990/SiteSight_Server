'use strict';

const user = require('../models/user').User;
const marker = require('../models/user').Mark;
const bcrypt = require('bcryptjs');

function getRandomArbitrary(min, max) {
  return Math.random() * (max - min) + min;
}

exports.newMarker = (email,latitude,longitude, radius, imageLocation) => 

	new Promise((resolve,reject) => {
		user.find({email: email})
		.then(users => {
			if (users.length == 0) {
				console.log("user not found..");
				reject({ status: 404, message: 'User Not Found !' });
			} else {

				// var r = getRandomArbitrary(0, radius / 1000); // meters
				var r = getRandomArbitrary(0, radius);	// km
				var theta = getRandomArbitrary(0, 360) * Math.PI / 180;
				// r = 1;
				// var theta = 45 * Math.PI / 180;

				var dx = r * Math.cos(theta);
				var dy = r * Math.sin(theta);
				var r_earth = 6371;

				var clatitude  = latitude  + (dy / r_earth) * (180 / Math.PI);
				var clongitude = longitude + (dx / r_earth) * (180 / Math.PI) / Math.cos(latitude * Math.PI / 180);

				console.log("r : " + r + " | theta : " + theta);
				console.log(" lat : " + latitude + " |  long : " + longitude);
				console.log("rlat : " + clatitude + " | rlong : " + clongitude);

				// console.log(users[0]);
				const newMarker = new marker({
					latitude : latitude,
					longitude : longitude,
					circle_lat : clatitude,
					circle_lon : clongitude,
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


