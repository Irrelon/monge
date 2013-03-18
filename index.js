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
		
		if (!this._options.port) {
			this._options.port = 27017;
		}
		
		if (!this._options.nativeParser) {
			this._options.nativeParser = false;
		}
		
		if (!this._options.strict) {
			this._options.strict = false;
		}
		
		var mongoServer = new this._mongo.Server(
			this._options.host,
			parseInt(this._options.port),
			{}
		), self = this;
	
		this.client = new this._mongo.Db(
			this._options.db,
			mongoServer,
			{native_parser: this._options.nativeParser}
		);
	
		this.client.strict = this._options.strict;
	
		// Open the database connection
		this.client.open(function(err, db) {
			// If we have a username then authenticate!
			if (self._options.user) {
				self.client.authenticate(self._options.user, self._options.pass, cb);
			} else {
				if (typeof(cb) === 'function') {
					cb(err);
				}
			}
		});
	},
	
	/**
	 * Disconnect from the current mongo connection.
	 * @param cb
	 */
	disconnect: function (cb) {
		this.client.close(cb);
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
						docs !== undefined ? String(docs[0]._id) : null;
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
	},
	
	/**
	 * Returns all records matching the search object and returns them as an array.
	 */
	query: function (collection, obj, options, cb) {
		var self = this;
		if (!options) { options = {}; }
		
		if (options.returnFields) {
			options.fields = options.returnFields;
			delete options.returnFields;
		}

		this.client.collection(collection, function (err, tempCollection) {
			if (!err) {
				// Got the collection (or err)
				var tempCursor = tempCollection.find(obj, options);
				
				if (tempCursor) {
					// Got the result cursor (or err)
					if (!options.orderBy) {
						tempCursor.toArray(function (err, results) {
							var i;
	
							// Callback the results
							if (typeof(cb) === 'function') {
								cb(err, results);
							}
						});
					} else {
						tempCursor
							.sort(options.orderBy)
							.toArray(function (err, results) {
								var i;
		
								// Callback the results
								if (typeof(cb) === 'function') {
									cb(err, results);
								}
							});
					}
				}
			} else {
				if (typeof(cb) === 'function') {
					cb(err, results);
				}
			}
		});
	},
	
	/**
	 * Returns a single item matching the search object.
	 */
	queryOne: function (collection, obj, options, cb) {
		if (!options) { options = {}; }
		
		// Add a limit to the options
		options.limit = 1;
		this.query(collection, obj, options, function (err, item) {
			if (!err) {
				cb(err, item[0]);
			} else {
				cb(err);
			}
		});
	}
});

module.exports = new Monge();