var settings = require('../settings'),
	Db = require('mongodb').Db,
	Connection = require('mongodb').Connection,
	Server = require('mongodb').Server;
//创建数据库，参数1:数据库名，参数2:服务器
//通过module.exports导出数据库实例，这样我们便可以对数据库进行操作了
module.exports = new Db(settings.db, new Server(settings.host, Connection.DEFAULT_PORT, {}));