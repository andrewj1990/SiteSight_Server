'use strict';

const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const userSchema = mongoose.Schema({ 
	name 			: String,
	email			: {type: String, unique: true}, 
	hashed_password	: String,
	created_at		: String,
	temp_password	: String,
	temp_password_time: String
});

var markSchema = mongoose.Schema({
	x : Number,
	y : Number,
	radius   : Number,
	location : String,
	markedBy : {type: mongoose.Schema.Types.ObjectId, ref: 'User'},
	pictures : []
})

var pictureSchema = mongoose.Schema({
	name : String, 
	user_id : {type: mongoose.Schema.Types.ObjectId, ref: 'User'},
	mark_info : {type: mongoose.Schema.Types.ObjectId, ref: 'Mark'},
	path : String,
})

var User = mongoose.model('User', userSchema);
var Mark = mongoose.model('Mark', markSchema);
var Picture = mongoose.model('Picture', pictureSchema);

mongoose.Promise = global.Promise;
mongoose.connect('mongodb://localhost:27017/node-android');
module.exports = {
	User : User,
	Mark : Mark,
	Picture : Picture
}

