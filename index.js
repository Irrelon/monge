var mongodb = require('mongodb');

var mongoease = function (options) {
	// Setup the mongo module
	this._mongo = {};
	this._mongo.Db = require('../../../' + modulePath + 'mongodb').Db;
	this._mongo.Connection = require('../../../' + modulePath + 'mongodb').Connection;
	this._mongo.Server = require('../../../' + modulePath + 'mongodb').Server;
	this._mongo.BSON = this._mongo.Db.bson_serializer;
	
	this._host = options.host;
	this._database = options.database;
	this._port = options.port;
	this._username = options.user;
	this._password = options.pass;
};

/**
 * Connect to the database with the current settings.
 * @param callback
 */
mongoease.prototype.connect = function (callback) {
	console.log('Connecting to mongo database "'  + this._database + '" @' + this._host + ':' + this._port);
	
	var mongoServer = new this._mongo.Server(
		this._host,
		parseInt(this._port),
		{}
	), self = this;

	this.client = new this._mongo.Db(
		this._database,
		mongoServer,
		{native_parser: this._nativeParser}
	);

	this.client.strict = this._strict;

	// Open the database connection
	this.client.open(function(err, db) {
		// If we have a username then authenticate!
		if (self._username) {
			self.client.authenticate(self._username, self._password, function (err) {
				if (err) {
					self.log('Error when authenticating with the database!');
					//console.log(err);

					if (typeof(callback) === 'function') {
						callback.apply(self, [err]);
					}
				} else {
					self.log('Connected to mongo DB ok, processing callbacks...');
					self._connected.apply(self, [err, db, callback]);
				}
			});
		} else {
			if (err) {
				self.log('Error when connecting to the database!');
				//console.log(err);

				if (typeof(callback) === 'function') {
					callback.apply(self, [err]);
				}
			} else {
				self.log('Connected to mongo DB ok, processing callbacks...');
				self._connected.apply(self, [err, db, callback]);
			}
		}
	});
};

	/**
	 * Disconnect from the current mongo connection.
	 * @param callback
	 */
	disconnect: function (callback) {
		this.log("Closing DB connection...");
		this.client.close();

		callback();
	},

	/**
	 * Called by the connect() method once a connection has been established
	 * or a connection error occurs.
	 * @param err
	 * @param db
	 * @param callback
	 * @private
	 */
	_connected: function (err, db, callback) {
		if (!err) {
			this.log('MongoDB connected successfully.');
			this.emit('connected');
		} else {
			this.log('MongoDB connection error', 'error', err);
			this.emit('connectionError');
		}

		if (typeof(callback) === 'function') {
			callback.apply(this, [err, db]);
		}
	},