//var mongodb = require('./db');
var mongodb = require('mongodb').Db;
var settings = require('../settings');
//var markdown = require('markdown').markdown;

var Post = function(post){
	this.name = post.name;
	this.title = post.title;
	this.tags = post.tags;
	this.content = post.content;
	this.head = post.head;
	this.comments = [];
	this.pv = 0;
};

module.exports = Post;

Post.prototype.save = function(cb){
	var date = new Date();
	var time = {
		date: date,
		year: date.getFullYear(),
		month: date.getFullYear()+'-'+(date.getMonth()+1),
		day: date.getFullYear()+'-'+(date.getMonth()+1)+'-'+date.getDate(),
		minute: date.getFullYear()+'-'+(date.getMonth()+1)+'-'+date.getDate()+' '+date.getHours()+':'+date.getMinutes()
	};
	var post = {
		name: this.name,
		title: this.title,
		tags: this.tags,
		content: this.content,
		head: this.head,
		time: time,
		comments: this.comments,
		pv: this.pv
	};
	mongodb.connect(settings.url, function(err, db){
		if (err) {
			return cb(err);
		}
		db.collection('posts', function(err, collection){
			if (err) {
				db.close();
				return cb(err);
			}
			collection.insert(post, {safe: true}, function(err, post){
				db.close();
				if (err) {
					return cb(err);
				}
				return cb(null, post);
			});
		});
	});
};
Post.getAll = function(name, cb){
	mongodb.connect(settings.url, function(err, db) {
		if (err) {
			return cb(err);
		}
		db.collection('posts', function(err, collection){
			if (err) {
				db.close();
				return cb(err);
			}
			var post = {};
			if (name) post.name = name;
			collection.find(post).sort({date: -1}).toArray(function(err, post) {
				db.close();
				if (err) {
					return cb(err);
				}
				/*post.forEach(function(doc){
					doc.content = markdown.toHTML(doc.content);
				});*/
				cb(null, post);
			})
		});
	});
};
Post.getTen = function(options, cb) {
	mongodb.connect(settings.url, function(err, db) {
		if (err) {
			return cb(err);
		}
		db.collection('posts', function(err, collection) {
			if (err) {
				db.close();
				return cb(err);
			}
			var query = options.name ? {name: options.name} : null;
			collection.count(query, function(err, total) {
					if (err) {
						db.close();
						return cb(err);
					}
					collection.find(query, {
						skip: (options.page-1)*1,
						limit: 1
					}).sort({
						time: -1
					}).toArray(function(err, doc) {
						db.close();
						if (err) {
							cb (err);
						}
						/*doc.forEach(function(post, index) {
							post.content = markdown.toHTML(post.content);
						});*/
						cb(null, doc, total);
					});
			});
		});
	});
};
Post.getOne = function(options, cb){
	mongodb.connect(settings.url, function(err, db) {
		if (err) {
			return cb(err);
		}
		db.collection('posts', function(err, collection){
			if (err) {
				db.close();
				return cb(err);
			}
			collection.findOne({
				'name':options.name,
				'time.day': options.day,
				'title': options.title
			}, function(err, doc) {
				if (err) {
					db.close();
					return cb(err);
				}
				if (doc) {
					collection.update({
						'name': options.name,
						'time.day': options.day,
						'title': options.title
					}, {
						$inc: {'pv': 1}
					}, function(err) {
						if (err) {
							return cb(err);
						}
					});
				}
				db.close();
				/*doc.content = markdown.toHTML(doc.content);
				doc.comments.forEach(function(comment, index) {
					comment.content = markdown.toHTML(comment.content);
				});*/
				cb(null, doc);
			});
		});
	});
};

Post.edit = function(options, cb) {
	mongodb.connect(settings.url, function(err, db) {
		if (err) {
			return cb(err);
		}
		db.collection('posts', function(err, collection) {
			if (err) {
				db.close();
				return cb(err);
			}
			collection.findOne({
				'name': options.name,
				'time.day': options.day,
				'title': options.title
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

Post.update = function(options, cb) {
	mongodb.connect(settings.url, function(err, db) {
		if (err) {
			return cb(err);
		}
		db.collection('posts', function(err, collection) {
			if (err) {
				db.close();
				return cb(err);
			}
			//根据name, time.day, title查找到对应的文章来修改，仅修改正文
			collection.update({
				'name': options.name,
				'time.day': options.day,
				'title': options.title
			},{
				$set: {'content': options.content}
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

Post.remove = function(options, cb) {
	mongodb.connect(settings.url, function(err, db) {
		if (err) {
			return cb(err);
		}
		db.collection('posts', function(err, collection) {
			if (err) {
				db.close();
				return cb(err);
			}
			collection.remove(options, function(err, doc) {
				db.close();
				if (err) {
					return cb(err);
				}
				return cb(null);
			});
		});
	});
};
Post.getArchive = function(cb) {
	mongodb.connect(settings.url, function(err, db) {
		if (err) {
			return cb(err);
		}
		db.collection('posts', function(err, collection) {
			if (err) {
				db.close();
				return cb(err);
			}
			collection.find({}, {
				'name': 1,
				'time': 1,
				'title': 1
			}).sort({
				time: -1
			}).toArray(function(err, doc) {
				db.close();
				if (err) {
					return cb(err);
				}
				cb(null, doc);
			});
		});
	});
};
Post.getTags = function(cb) {
	mongodb.connect(settings.url, function(err, db) {
		if (err) {
			return cb(err);
		}
		db.collection('posts', function(err, collection) {
			if (err) {
				db.close();
				return cb(err);
			}
			collection.distinct('tags.tag', function(err, doc){
				db.close();
				if (err) {
					return cb(err);
				}
				console.log('all tags is:', doc);
				cb(null, doc);
			});
		});
	});
};
Post.getTag = function(options, cb) {
	mongodb.connect(settings.url, function(err, db) {
		if (err) {
			return cb(err);
		}
		db.collection('posts', function(err, collection) {
			if (err) {
				db.close();
				return cb(err);
			}
			collection.find({
				'tags.tag': options.tag
			}).sort({
				time: -1
			}).toArray(function(err, posts) {
				db.close();
				if (err) {
					return cb(err);
				}
				cb(null, posts);
			});
		});
	});
};

Post.search = function(options, cb) {
	mongodb.connect(settings.url, function(err, db) {
		if (err) {
			return cb(err);
		}
		db.collection('posts', function(err, collection) {
			if (err) {
				db.close();
				return cb(err);
			}
			var patten = new RegExp("^.*" + options.keyword + ".*", "i");
			collection.find({
				'title': patten
			}, {
				'name': 1,
				'time': 1,
				'title': 1
			}).sort({
				time: -1
			}).toArray(function(err, doc) {
				db.close();
				if (err) {
					return cb(err);
				}
				cb(null, doc);
			});
		});
	});
};