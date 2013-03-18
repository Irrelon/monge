require('./lib/IgePrimitives');

var IgeClass = require('./lib/IgeClass'),
	IgeEventingClass = require('./lib/IgeEventingClass');

var Monge = IgeEventingClass.extend({
	init: function () {
		this._mongoNative = require('mongodb');
		
		this._mongo = {};
		this._mongo.Db = this._mongoNative.Db;
		this._mongo.Connection = this._mongoNative.Connection;
		this._mongo.Server = this._mongoNative.Server;
		this._mongo.BSON = this._mongo.Db.bson_serializer;
		
		this._options = {};
	},
	
	connect: function (options, cb) {
		this._options = options;
		
		if (!options.port) {
			options.port = 27017;
		}
		
		this.log('Connecting to mongo database "'  + options.db + '" @' + options.host + ':' + options.port);
		
		var mongoServer = new this._mongo.Server(
			this._options.host,
			parseInt(this._options.port),
			{}
		), self = this;
	
		this.client = new this._mongo.Db(
			this._options.db,
			mongoServer,
			{native_parser: this._nativeParser}
		);
	
		this.client.strict = this._strict;
	
		// Open the database connection
		this.client.open(function(err, db) {
			// If we have a username then authenticate!
			if (self._username) {
				self.client.authenticate(self._username, self._password, cb);
			} else {
				if (typeof(cb) === 'function') {
					cb.apply(self, [err]);
				}
			}
		});
	},
	
	/**
	 * Disconnect from the current mongo connection.
	 * @param cb
	 */
	disconnect: function (cb) {
		this.log("Closing DB connection...");
		this.client.close(function (err, data) {
			cb(err, data);
		});
	},
	
	/**
	 * Inserts a new item into the database.
	 * @param {String} collection The collection name to operate on.
	 * @param {Object} obj The JSON data to insert e.g. {myData: true}
	 * @param {Function} cb The method to call once the DB operation
	 * has been completed.
	 */
	insert: function (collection, obj, cb) {
		var self = this;

		this.client.collection(collection, function (err, tempCollection) {
			if (!err) {
				// Got the collection
				tempCollection.insert(obj, function (err, docs) {
					var i;

					// Callback the result
					if (typeof(cb) === 'function') {
						cb(err, docs);
					}
				});
			} else {
				// Callback the result
				if (typeof(cb) === 'function') {
					cb(err, tempCollection);
				}
			}
		});
	}
});

module.exports = new Monge();