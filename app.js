
/**
 * Module dependencies.
 */

var express = require('express')
  , routes = require('./routes')
  , user = require('./routes/user')//这个文件似乎是用不着的
  , http = require('http')
  , path = require('path')
  , MongoStore = require('connect-mongo')(express)
  , settings = require('./settings')
  , flash = require('connect-flash');

var app = express();

// all environments
app.set('port', process.env.PORT || 3000);
app.set('views', __dirname + '/views');
app.set('view engine', 'ejs');
app.use(flash());
//这里用了默认的图标，我们替换图标
//替换图标的方式：app.use(express.favicon(__dirname + '/public/images/favicon.ico'));
app.use(express.favicon());
app.use(express.logger('dev'));
app.use(express.bodyParser({keepExtensions: true, uploadDir: './public/images'}));
app.use(express.methodOverride());
//用来设置回话保存
app.use(express.cookieParser());
app.use(express.session({
	secret: settings.cookieSecret,
	cookie: {maxAge: 1000*60*60*24*30},
	/*key: settings.db,
	store: new MongoStore({
		db: settings.db
	})*/
  url: settings.url
}));

app.use(app.router);
app.use(express.static(path.join(__dirname, 'public')));

// development only
if ('development' == app.get('env')) {
  app.use(express.errorHandler());
}

//为了将路由管理从app.js(也就是这个页面)中分离出来，这里也就不需要了，添加最后一行的routes(app);
/*app.get('/', routes.index);
app.get('/users', user.list);*/

http.createServer(app).listen(app.get('port'), function(){
  console.log('Express server listening on port ' + app.get('port'));
});

//将app对象传给routes，由routes统一管理路由
routes(app);