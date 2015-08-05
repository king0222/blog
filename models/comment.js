//var mongodb = require('./db');
var mongodb = require('mongodb').Db;
var settings = require('../settings');

var Comment = function(obj){
	this.name = obj.name;
	this.title = obj.title;
	this.day = obj.day;
	this.comment = obj.comment;
};

module.exports = Comment;

Comment.prototype.save = function(cb) {
	var comment = {
		'name': this.name,
		'title': this.title,
		'time.day': this.day
	};
	var content = this.comment;
	mongodb.connect(settings.url, function(err, db) {
		if (err) {
			return cb (err);
		}
		db.collection('posts', function(err, collection) {
			if (err) {
				db.close();
				return cb(err);
			}
			collection.update(comment,{
				$push: {'comments': content}
			}, function(err, doc) {
				db.close();
				if (err) {
					return cb(err);
				}
				cb(null, doc);
			});
		});
	});
};