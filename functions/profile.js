'use strict';

const user = require('../models/user').User;

exports.getProfile = email => 
	
	new Promise((resolve,reject) => {

		user.find({ email: email }, { name: 1, email: 1, created_at: 1, _id: 1, num_uploads: 1, points: 1, visited_sites: 1 })

		.then(users => resolve(users[0]))

		.catch(err => reject({ status: 500, message: 'Internal Server Error !' }))

	});