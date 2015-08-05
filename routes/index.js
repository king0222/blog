
/*
 * GET home page.
 */

/*exports.index = function(req, res){
  res.render('index', { title: 'Express' });
};*/
var crypto = require('crypto');
var fs = require('fs');
var User = require('../models/user');
var Post = require('../models/post');
var Comment = require('../models/comment');

module.exports = function(app){
	app.get('/', function(req, res){
		var page = req.query.p ? parseInt(req.query.p) : 1;

		Post.getTen({
			name: null,
			page: page
		}, function(err, posts, total){
			if (err) {
				posts = [];
			}
			res.render('index', {
				title: '主页',
				posts: posts,
				page: page,
				isFirstPage: (page - 1) == 0,
				isLastPage: ((page - 1) * 10 + posts.length) == total,
				user: req.session.user,
				success: req.flash('success').toString(),
				error: req.flash('error').toString()
			})
		});
		
	});
	//未登录才会进行注册
	app.get('/reg', checkNotLogin);
	app.get('/reg', function(req, res){
		res.render('reg', {
			title: '注册',
			user: req.session.user,
			success: req.flash('success').toString(),
			error: req.flash('error').toString(),
			regError: req.flash('regError').toString()
		});
	});
	app.post('/reg', checkNotLogin);
	app.post('/reg', function(req, res){
		var name = req.body.name,
			password = req.body.password,
			password_re = req.body['password-repeat'];
		if (password_re != password) {
			req.flash('regError', '两次输入的密码不一致！');

			return res.redirect('/reg');
		}
		var md5 = crypto.createHash('md5'),
			password = md5.update(req.body.password).digest('hex');
		var newuser = new User({
			name: req.body.name,
			password: password,
			email: req.body.email
		});
		User.get(newuser.name, function(err, user){
			if (user) {
				req.flash('regError', '用户已经存在');
				return res.redirect('/reg');
			}
			newuser.save(function(err, user){
				if (err) {
					req.flash('regError', err);
					return res.redirect('/reg');
				}
				req.session.user = user;
				req.flash('success', '注册成功！');
				res.redirect('/');
			});
		});
	});
	app.get('/login', checkNotLogin);
	app.get('/login', function(req, res){
		res.render('login', {
			title: '登录',
			user: req.session.user,
			success: req.flash('success').toString(),
			error: req.flash('error').toString(),
			loginError: req.flash('loginError').toString()
		});
	});
	app.post('/login', checkNotLogin);
	app.post('/login', function(req, res){
		var md5 = crypto.createHash('md5'),
      password = md5.update(req.body.password).digest('hex');
	  //检查用户是否存在
	  User.get(req.body.name, function (err, user) {
	    if (!user) {
	      req.flash('loginError', '用户不存在!'); 
	      return res.redirect('/login');//用户不存在则跳转到登录页
	    }
	    //检查密码是否一致
	    if (user.password != password) {
	      req.flash('loginError', '密码错误!'); 
	      return res.redirect('/login');//密码错误则跳转到登录页
	    }
	    //用户名密码都匹配后，将用户信息存入 session
	    req.session.user = user;
	    req.flash('success', '登陆成功!');
	    res.redirect('/');
	  });
	});
	app.get('/post', checkLogin);
	app.get('/post', function(req, res){
		res.render('post', {
			title: '发表',
			user: req.session.user,
			success: req.flash('success').toString(),
			error: req.flash('error').toString()
		});
	});
	app.post('/post', checkLogin);
	app.post('/post', function(req, res){
		var name = req.session.user.name;
		var title = req.body.title;
		var content = req.body.content;
		var head = req.session.user.head;
		var tags = req.body.tags.split(' ');
		var tagsArr = [];
		if (tags.length > 1) {
			tags.forEach(function(tag, index) {
				var obj = {};
				obj.tag = tag;
				tagsArr.push(obj);
			});
		}
		
		var obj = {
			name: name,
			title: title,
			tags: tagsArr,
			content: content,
			head: head
		}
		var post = new Post(obj);
		post.save(function(err, post) {
			if (err) {
				req.flash('error', '发表文章出错');
				res.redirect('/post');
			}
			req.flash('success', '发表文章成功');
			res.redirect('/');
		});

	});
	app.get('/logout', checkLogin);
	app.get('/logout', function(req, res){
		req.session.user = null;
		req.flash('success', '登出成功!');
		res.redirect('/');
	});

	app.get('/upload', checkLogin);
	app.get('/upload', function(req, res){
		res.render('upload', {
			title: '文件上传',
			user: req.session.user,
			success: req.flash('success').toString(),
			error: req.flash('error').toString()
		});
	});
	app.post('/upload', function(req, res){
		for (var i in req.files){
			if (req.files[i].size == 0) {
				fs.unlinkSync(req.files[i].path);
				console.log('success removed an empty file!');
			} else {
				var target_path = './public/images/'+req.files[i].name;
				fs.renameSync(req.files[i].path, target_path);
			}
		}
		req.flash('success', '文件上传成功！');
		res.redirect('/upload');
	});
	app.get('/archive', function(req, res) {
		Post.getArchive(function(err, posts) {
			if (err) {
				req.flash('error', err);
				return res.redirect('/');
			}
			res.render('archive', {
				title: '存档',
				posts: posts,
				user: req.session.user,
				success: req.flash('success').toString(),
				error: req.flash('error').toString()
			});
		});
	});
	app.get('/tags', function(req, res) {
		Post.getTags(function(err, posts) {
			if (err) {
				req.flash('error', err);
				res.redirect('/');
			}
			res.render('tags', {
				title: '标签',
				posts: posts,
				user: req.session.user,
				success: req.flash('success').toString(),
				error: req.flash('error').toString()
			});
		});
	});
	app.get('/tags/:tag', function(req, res) {
		Post.getTag({
			tag: req.params.tag
		}, function(err, posts){
			if (err) {
				req.flash('error', err);
				return res.redirect('/');
			}
			res.render('tag', {
				title: 'TAG:' + req.params.tag,
				posts: posts,
				user: req.session.user,
				success: req.flash('success').toString(),
				error: req.flash('error').toString()
			});
		});
	});
	app.get('/links', function(req, res) {
		res.render('links', {
			title: '友情链接',
			user: req.session.user,
			success: req.flash('success').toString(),
			error: req.flash('error').toString()
		});
	});
	app.get('/search', function(req, res) {
		Post.search({
			keyword: req.query.keyword
		}, function(err, posts) {
			if (err) {
				req.flash('error', err);
				return res.redirect('/');
			}
			res.render('search', {
				title: 'search:' + req.query.keyword,
				posts: posts,
				user: req.session.user,
				success: req.flash('success').toString(),
				error: req.flash('error').toString()
			});
		});
	});

	app.get('/u/:name', function(req, res) {
		var page = req.query.p ? parseInt(req.query.p) : 1;
		User.get(req.params.name, function(err, user) {
			if (err) {
				req.flash('error', '用户不存在!');
				return res.redirect('/');
			}
			Post.getTen({
				name: user.name,
				page: page
			}, function(err, posts, total) {
				if (err) {
					req.flash('error', err);
					return res.redirect('/');
				}
				res.render('user', {
					title: user.name,
					posts: posts,
					page: page,
					isFirstPage: (page - 1) == 0,
					isLastPage: ((page - 1) * 10 + posts.length) == total,
					user: req.session.user,
					success: req.flash('success').toString(),
					error: req.flash('error').toString()
				});
			});
		});
	});

	app.get('/u/:name/:day/:title', function(req, res) {
		Post.getOne({
			name: req.params.name,
			day: req.params.day,
			title: req.params.title
		}, function(err, post) {
			if (err) {
				req.flash('error', err);
				return res.redirect('/');
			}
			res.render('article', {
				title: req.params.title,
				post: post,
				user: req.session.user,
				success: req.flash('success').toString(),
				error: req.flash('error').toString()
			});
		});
	});
	app.post('/u/:name/:day/:title', function(req, res) {
		var date = new Date();
		var time = date.getFullYear()+'-'+(date.getMonth()+1)+'-'+date.getDate()+' '+date.getHours()+':'+date.getMinutes();
		var md5 = crypto.createHash('md5');
		var email_MD5 = md5.update(req.body.email.toLowerCase()).digest('hex');
		var head = 'http://www.gravatar.com/avatar/' + email_MD5 + '?s=48';
		var comment = {
			name: req.body.name,
			time: time,
			email: req.body.email,
			website: req.body.website,
			content: req.body.content,
			head: head
		};
		console.log('comment is:',comment);
		var newComment = new Comment({
			name: req.params.name,
			title: req.params.title,
			day: req.params.day,
			comment: comment
		});
		newComment.save(function(err) {
			if (err) {
				req.flash('error', err);
				res.redirect('/');
			}
			req.flash('success','留言成功！');
			res.redirect('back');
		});
	});

	app.get('/edit/:name/:day/:title', checkLogin);
	app.get('/edit/:name/:day/:title', function(req, res) {
		Post.edit({
			'name': req.params.name,
			'day': req.params.day,
			'title': req.params.title
		}, function(err, post) {
			if (err) {
				req.flash('error', err);
				return res.redirect('back');
			}
			res.render('edit', {
				title: '编辑',
				post: post,
				user: req.session.user,
				success: req.flash('success').toString(),
				error: req.flash('error').toString()
			});
		});
	});
	app.post('/edit/:name/:day/:title', checkLogin);
	app.post('/edit/:name/:day/:title', function(req, res) {
		var url = '/u/'+req.params.name+'/'+req.params.day+'/'+req.params.title;
		Post.update({
			'name': req.session.user.name,
			'day': req.params.day,
			'title': req.params.title,
			'content': req.body.content
		}, function(err, post) {
			if (err) {
				req.flash('err', err);
				return res.redirect(url);
			} 
			req.flash('success', '修改成功!');
			res.redirect(url);
		});
	});
	app.get('/remove/:name/:day/:title', checkLogin);
	app.get('/remove/:name/:day/:title', function(req, res) {
		Post.remove({
			'name': req.params.name,
			'time.day': req.params.day,
			'title': req.params.title
		}, function(err, doc) {
			if (err) {
				req.flash('err', err);
				return false;
			}
			req.flash('success', '文章删除成功!');
			res.redirect('/');
		});
	});

	//当上面的访问路径都不存在时，则跳刀404页面
	app.use(function(req, res) {
		res.render('404');
	});

	function checkLogin(req, res, next) {
		if (!req.session.user) {
			req.flash('error', '为登录');
			res.redirect('/login');
		}
		next();
	}
	function checkNotLogin(req, res, next) {
		if (req.session.user) {
			req.flash('error', '已登录');
			res.redirect('back');
		}
		next();
	}
};

