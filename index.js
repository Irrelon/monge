require('./lib/IgePrimitives');

var IgeClass = require('./lib/IgeClass'),
	IgeEventingClass = require('./lib/IgeEventingClass');

var MongeManager = IgeEventingClass.extend({
	init: function () {
		this._connectionCount = 0;
		this._connectedCount = 0;

		this._dbNames = [];
	},

	connect: function (connections, callback) {
		var self = this;

		if (connections instanceof Array) {
			// Multiple connection objects
			var i;

			for (i in connections) {
				if (connections.hasOwnProperty(i)) {
					// Create new monge instance
					this._dbNames.push(connections[i].name);
					this[connections[i].name] = new Monge();
					this._connectionCount++;
				}
			}

			for (i in connections) {
				if (connections.hasOwnProperty(i)) {
					this[connections[i].name].connect(connections[i], function (err, db) {
						if (!err) {
							self._connectedCount++;
							self.emit('connection', [false, connections[i]]);

							if (self._connectedCount === self._connectionCount) {
								// All connections established, callback now
								callback(false);
							}
						}
					});
				}
			}
		} else {
			// Single connection object
			this._dbNames.push(connections.name);
			this[connections.name] = new Monge();
			this[connections.name].connect(connections, callback);
		}
	}
});

var Monge = IgeEventingClass.extend({
	init: function () {
		this._mongoNative = require('mongodb');

		this._mongo = {};
		this._mongo.Db = this._mongoNative.Db;
		this._mongo.Client = this._mongoNative.MongoClient;
		//this._mongo.Connection = this._mongoNative.Connection;
		//this._mongo.Server = this._mongoNative.Server;
		this._mongo.BSON = this._mongo.Db.bson_serializer;

		this._options = {};
	},

	/**
	 * Connect to the database.
	 * @param {Object} options The connection options object.
	 * @param {Function} cb The callback method.
	 */
	connect: function (options, cb) {
		var self = this;

		this._options = options;

		if (!this._options.nativeParser) {
			this._options.nativeParser = false;
		}

		if (!this._options.strict) {
			this._options.strict = false;
		}

		/*this._mongoServer = new this._mongo.Server(
		 this._options.host,
		 parseInt(this._options.port),
		 {}
		 );

		 this.client = new this._mongo.Db(
		 this._options.db,
		 this._mongoServer,
		 {native_parser: this._options.nativeParser, safe: false}
		 );

		 this.client.strict = this._options.strict;

		 // Open the database connection
		 this.client.open(function(err, db) {
		 // If we have a username then authenticate!
		 if (self._options.user) {
		 self.client.authenticate(self._options.user, self._options.pass, function () {
		 self.emit('connection', arguments);
		 cb.apply(this, arguments);
		 });
		 } else {
		 if (typeof(cb) === 'function') {
		 self.emit('connection', [err]);
		 cb(err);
		 }
		 }
		 });*/

		this._mongo.Client.connect(this._options.connect, {uri_decode_auth: true}, function(err, db) {
			if (!err) {
				self.client = db;
			}
			self.emit('connection', arguments);
			if (typeof(cb) === 'function') {
				cb.apply(this, arguments);
			}
		});
	},

	/**
	 * Disconnect from the current mongo connection.
	 * @param {Function} cb The callback method.
	 */
	disconnect: function (cb) {
		this.client.close(cb);
	},

	/**
	 * Inserts a new item into the database.
	 * @param {String} collection The collection to work with.
	 * @param {Object} obj The object to insert.
	 * @param {Object} options The options to pass to the database method when executing.
	 * @param {Function} cb The callback method.
	 */
	insert: function (collection, obj, options, cb) {
		var self = this;

		if (!obj) { obj = {}; }
		this._convertIds(obj, options);

		this.client.collection(collection, function (err, tempCollection) {
			if (!err) {
				// Got the collection
				tempCollection.insert(obj, options, function (err, docs) {
					var i;

					// Callback the result
					if (typeof(cb) === 'function') {
						docs = docs && docs[0] ? String(docs[0]._id) : null;
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
	 * Updates an item by adding / updating the fields in the object "updateObj". This
	 * DOES NOT overwrite one item with another, but rather augments the existing
	 * item with the "updateObj" properties.
	 * @param {String} collection The collection to work with.
	 * @param {Object} searchObj The key/values to search for when finding items to update.
	 * @param {Object} updateObj The key/values to add/update in the located items.
	 * @param {Object} options The options to pass to the database method when executing.
	 * @param {Function} cb The callback method.
	 */
	update: function (collection, searchObj, updateObj, options, cb) {
		var self = this;
		if (!options) { options = {}; }

		if (!searchObj) { searchObj = {}; }
		if (!updateObj) { updateObj = {}; }
		this._convertIds(searchObj, options);
		this._convertIds(updateObj, options);

		// Set some options defaults
		if (options.safe === undefined) { options.safe = true; }
		if (options.multiple === undefined) {
			options.multi = true;
		} else {
			options.multi = options.multiple;
			delete options.multiple;
		}
		if (options.upsert === undefined) { options.upsert = false; }

		this.client.collection(collection, function (err, tempCollection) {
			if (!err) {
				var finalUpdateJson;

				// Ensure we only update, not overwrite!
				finalUpdateJson = {
					'$set': updateObj
				};

				// Got the collection (or err)
				tempCollection.update(searchObj, finalUpdateJson, options, cb);
			} else {
				// Callback the result
				if (typeof(cb) === 'function') {
					cb(err, tempCollection);
				}
			}
		});
	},

	/**
	 * Updates an existing item or if none exists, inserts a new item into the database.
	 * @param {String} collection The collection to work with.
	 * @param {Object} obj The object to upsert.
	 * @param {Function} cb The callback method.
	 */
	upsert: function (collection, obj, cb) {
		var self = this;

		if (!obj) { obj = {}; }
		this._convertIds(obj);

		this.client.collection(collection, function (err, tempCollection) {
			if (!err) {
				// Got the collection

				if (obj._id) {
					// Check if an existing record exists
					this.queryOne(collection, {'_id': obj._id}, {'returnFields': [{'_id': 1}]}, function (err, item) {
						if (!err && item) {
							// An item already exists so update it
							this.update(collection, {'_id': obj._id}, obj, {}, cb);
						}
					});
				} else {
					this.insert(collection, obj, {}, function (err, docs) {
						var i;

						// Callback the result
						if (typeof(cb) === 'function') {
							docs !== undefined ? String(docs[0]._id) : null;
							cb(err, docs);
						}
					});
				}
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
	 * @param {String} collection The collection to work with.
	 * @param {Object} obj The key/value pairs to match items against.
	 * @param {Object} options The options to pass to the database method when executing.
	 * @param {Function} cb The callback method.
	 */
	query: function (collection, obj, options, cb) {
		var self = this,
			modifierOptions = {};

		if (!options) { options = {}; }

		if (options.returnFields) {
			options.fields = options.returnFields;
			delete options.returnFields;
		}

		if (options.orderBy) {
			modifierOptions.orderBy = options.orderBy;
			delete options.orderBy;
		}

		if (!obj) { obj = {}; }
		this._convertIds(obj, options);

		this.client.collection(collection, function (err, tempCollection) {
			if (!err) {
				// Got the collection (or err)
				var tempCursor = tempCollection.find(obj, options);
				
				if (tempCursor) {
					tempCursor.count(true, function(err, count) {
						// Got the result cursor (or err)
						if (!modifierOptions.orderBy) {
							tempCursor.toArray(function (err, results) {
								// Callback the results
								if (typeof(cb) === 'function') {
									cb(err, results, count);
								}
							});
						} else {
							tempCursor
								.sort(modifierOptions.orderBy)
								.toArray(function (err, results) {
									// Callback the results
									if (typeof(cb) === 'function') {
										cb(err, results, count);
									}
								});
						}
					});
				}
			} else {
				if (typeof(cb) === 'function') {
					cb(err, tempCollection);
				}
			}
		});
	},

	/**
	 * Returns a single item matching the search object.
	 * @param {String} collection The collection to work with.
	 * @param {Object} obj The key/value pairs to match items against.
	 * @param {Object} options The options to pass to the database method when executing.
	 * @param {Function} cb The callback method.
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
	},

	/**
	 * Returns the number of items that match the query.
	 * @param {String} collection The collection to work with.
	 * @param {Object} obj The key/value pairs to match items against.
	 * @param {Function} cb The callback method.
	 */
	count: function (collection, obj, cb) {
		if (!obj) { obj = {}; }
		this._convertIds(obj);

		this.client.collection(collection, function (err, tempCollection) {
			if (!err) {
				// Got the collection (or err)
				tempCollection.count(obj, cb);
			} else {
				if (typeof(cb) === 'function') {
					cb(err);
				}
			}
		});
	},

	/**
	 * Gets an array of distinct values for a key from the items that match the search.
	 * @param {String} collection The collection to work with.
	 * @param {String} key The key that the distinct values should be returned from.
	 * @param {Object} obj The key/value pairs to match items against.
	 * @param {Object} options The options to pass to the database method when executing.
	 * @param {Function} cb The callback method.
	 */
	distinct: function (collection, key, obj, options, cb) {
		if (!obj) { obj = {}; }
		if (!options) { options = {}; }
		this._convertIds(obj, options);

		this.client.command({"distinct": collection, "key": key, "query": obj || {}}, options, function (err, dataArr) {
			var data;

			if (dataArr && dataArr['values']) {
				data = dataArr['values'];
			}

			if (typeof(cb) === 'function') {
				cb(err, data);
			}
		});
	},

	/**
	 * Removes an item's property / key.
	 * @param {String} collection The collection to work with.
	 * @param {Object} searchObj The key/values to search for when finding items to unset keys in.
	 * @param {Object} unSetObj The keys to unset with a value of 1. E.g. to unset a key "name" you
	 * would pass {"name": 1}.
	 * @param {Object} options The options to pass to the database method when executing.
	 * @param {Function} cb The callback method.
	 */
	unset: function (collection, searchObj, unSetObj, options, cb) {
		if (!options) { options = {}; }

		// Set some options defaults
		if (options.safe === undefined) { options.safe = true; }
		if (options.multiple === undefined) {
			options.multi = true;
		} else {
			options.multi = options.multiple;
			delete options.multiple;
		}
		if (options.upsert === undefined) { options.upsert = false; }

		if (!searchObj) { searchObj = {}; }
		if (!unSetObj) { unSetObj = {}; }
		this._convertIds(searchObj, options);
		this._convertIds(unSetObj, options);

		this.client.collection(collection, function (err, tempCollection) {
			if (!err) {
				var finalUpdateJson;

				// Ensure we only update, not overwrite!
				finalUpdateJson = {
					'$unset': unSetObj
				};

				// Got the collection (or err)
				tempCollection.update(searchObj, finalUpdateJson, options, cb);
			} else {
				// Callback the result
				if (typeof(cb) === 'function') {
					cb(err, tempCollection);
				}
			}
		});
	},

	/**
	 * Pushes an item to an array field.
	 * @param {String} collection The collection to work with.
	 * @param {Object} searchObj The key/values to search for when finding items to push into.
	 * @param {Object} updateObj The key of the array to push into and the values that should
	 * be pushed into that array.
	 * @param {Object} options The options to pass to the database method when executing.
	 * @param {Function} cb The callback method.
	 */
	push: function (collection, searchObj, updateObj, options, cb) {
		var self = this;
		if (!options) { options = {}; }

		// Set some options defaults
		if (options.safe === undefined) { options.safe = true; }
		if (options.multiple === undefined) {
			options.multi = true;
		} else {
			options.multi = options.multiple;
			delete options.multiple;
		}
		if (options.upsert === undefined) { options.upsert = false; }

		if (!searchObj) { searchObj = {}; }
		if (!updateObj) { updateObj = {}; }
		this._convertIds(searchObj, options);
		this._convertIds(updateObj, options);

		this.client.collection(collection, function (err, tempCollection) {
			if (!err) {
				var finalUpdateJson;

				// Ensure we only update, not overwrite!
				finalUpdateJson = {
					'$push': updateObj
				};

				// Got the collection (or err)
				tempCollection.update(searchObj, finalUpdateJson, options, cb);
			} else {
				// Callback the result
				if (typeof(cb) === 'function') {
					cb(err, tempCollection);
				}
			}
		});
	},

	/**
	 * Pushes an item to an array field as long as an item with the search
	 * parameters passed does not already exist. If no search parameters are
	 * passed the pushed object is searched for.
	 * @param {String} collection The collection to work with.
	 * @param {Object} searchObj The key/values to search for when finding items to push into.
	 * @param {Object} updateObj The key of the array to push into and the values that should
	 * be pushed into that array.
	 * @param {Object} uniqueCheck The search object to check for to determine if the item
	 * should be pushed or not. If this is null, the object to be pushed in "updateObj" parameter
	 * will be used instead. In most cases it is best to specify this object to avoid ambiguity.
	 * @param {Object} options The options to pass to the database method when executing.
	 * @param {Function} cb The callback method.
	 */
	pushUnique: function (collection, searchObj, updateObj, uniqueCheck, options, cb) {
		var self = this;
		if (!options) { options = {}; }

		// Set some options defaults
		if (options.safe === undefined) { options.safe = true; }
		if (options.multiple === undefined) {
			options.multi = true;
		} else {
			options.multi = options.multiple;
			delete options.multiple;
		}
		if (options.upsert === undefined) { options.upsert = false; }

		if (!searchObj) { searchObj = {}; }
		if (!updateObj) { updateObj = {}; }
		this._convertIds(searchObj, options);
		this._convertIds(updateObj, options);

		if (!uniqueCheck) { uniqueCheck = updateObj; }

		// First check that an existing item does not exists
		self.queryOne(collection, uniqueCheck, {}, function (err, data) {
			if (!err) {
				if (!data) {
					// Data does not exist, push it
					self.push(collection, searchObj, updateObj, options, function (err, data) {
						if (!err) {
							cb(false, true); // Return true for pushed
						} else {
							cb('Could not push item to unique array: ' + err);
						}
					});
				} else {
					// Data exists, do not push it
					cb(false, false); // Return false for not pushed
				}
			} else {
				cb('Could not query database to check for unique entry in pushUnique: ' + err);
			}
		});
	},

	/**
	 * Pulls an item from an array field.
	 * @param {String} collection The collection to work with.
	 * @param {Object} searchObj The key/values to search for when finding items to pull from.
	 * @param {Object} updateObj The key of the array to pull from and the values that should
	 * be pulled from that array.
	 * @param {Object} options The options to pass to the database method when executing.
	 * @param {Function} cb The callback method.
	 */
	pull: function (collection, searchObj, updateObj, options, cb) {
		var self = this;
		if (!options) { options = {}; }

		// Set some options defaults
		if (options.safe === undefined) { options.safe = true; }
		if (options.multiple === undefined) {
			options.multi = true;
		} else {
			options.multi = options.multiple;
			delete options.multiple;
		}
		if (options.upsert === undefined) { options.upsert = false; }

		if (!searchObj) { searchObj = {}; }
		if (!updateObj) { updateObj = {}; }
		this._convertIds(searchObj, options);
		this._convertIds(updateObj, options);

		this.client.collection(collection, function (err, tempCollection) {
			if (!err) {
				var finalUpdateJson;

				// Ensure we only update, not overwrite!
				finalUpdateJson = {
					'$pull': updateObj
				};

				// Got the collection (or err)
				tempCollection.update(searchObj, finalUpdateJson, options, cb);
			} else {
				// Callback the result
				if (typeof(cb) === 'function') {
					cb(err, tempCollection);
				}
			}
		});
	},

	/**
	 * Removes all rows that match the passed criteria.
	 * @param {String} collection The collection to work with.
	 * @param {Object} obj The key/value pairs to match items against.
	 * @param {Object} options The options to pass to the database method when executing.
	 * @param {Function} cb The callback method.
	 */
	remove: function (collection, obj, options, cb) {
		var self = this;
		if (!options) { options = {}; }

		if (options.safe === undefined) { options.safe = true; }
		if (options.single === undefined) { options.single = false; }

		if (!obj) { obj = {}; }
		this._convertIds(obj, options);

		this.client.collection(collection, function (err, tempCollection) {
			if (!err) {
				// Got the collection (or err)
				tempCollection.remove(obj, options, function (err, data) {
					// Got results array (or err)
					// Callback the result array
					if (typeof(cb) === 'function') {
						cb(err, data);
					}
				});
			} else {
				// Callback the result array
				if (typeof(cb) === 'function') {
					cb(err);
				}
			}
		});
	},

	aggregate: function (collection, pipeline, options, cb) {
		this.client.collection(collection, function (err, tempCollection) {
			if (!err) {
				// Got the collection
				tempCollection.aggregate(pipeline, cb);
			} else {
				if (typeof(cb) === 'function') {
					cb(err);
				}
			}
		});
	},

	/**
	 * Increments the passed field name by 1.
	 * @param {String} collection The collection to work with.
	 * @param {Object} searchObj The key/values to search for when finding items to update.
	 * @param {Object} incrementObj The field to increment and the amount e.g. { field1: 1 }
	 * @param {Object} options The options to pass to the database method when executing.
	 * @param {Function} cb The callback method.
	 */
	increment: function (collection, searchObj, incrementObj, options, cb) {
		var self = this;
		if (!options) { options = {}; }

		if (!searchObj) { searchObj = {}; }
		if (!incrementObj) { incrementObj = {}; }
		this._convertIds(searchObj, options);
		this._convertIds(incrementObj, options);

		// Set some options defaults
		if (options.safe === undefined) { options.safe = true; }
		if (options.multiple === undefined) {
			options.multi = true;
		} else {
			options.multi = options.multiple;
			delete options.multiple;
		}

		this.client.collection(collection, function (err, tempCollection) {
			if (!err) {
				var finalUpdateJson;

				// Ensure we only update, not overwrite!
				finalUpdateJson = {
					'$inc': incrementObj
				};

				// Got the collection (or err)
				tempCollection.update(searchObj, finalUpdateJson, options, cb);
			} else {
				// Callback the result
				if (typeof(cb) === 'function') {
					cb(err, tempCollection);
				}
			}
		});
	},

	/**
	 * Increments the passed field name by 1.
	 * @param {String} collection The collection to work with.
	 * @param {Object} searchObj The key/values to search for when finding items to update.
	 * @param {Object} updateField The field to update with data from the fromField.
	 * @param {Object} fromField The field to read data from to update the updateField with.
	 * @param {Object} options The options to pass to the database update method when executing.
	 * @param {Function} cb The callback method.
	 */
	setFieldFromSelf: function (collection, searchObj, updateField, fromField, options, cb) {
		var self = this;
		if (!options) { options = {}; }

		if (!searchObj) { searchObj = {}; }
		this._convertIds(searchObj, options);

		// Set some options defaults
		if (options.safe === undefined) { options.safe = true; }
		if (options.multiple === undefined) {
			options.multi = true;
		} else {
			options.multi = options.multiple;
			delete options.multiple;
		}

		this.client.collection(collection, function (err, tempCollection) {
			if (!err) {
				// Query for items based on searchObj
				self.query(collection, searchObj, {}, function (err, items) {
					if (!err && items) {
						var arr = items,
							arrCount = arr.length,
							itemIndex,
							item,
							updateObj;

						for (itemIndex = 0; itemIndex < arrCount; itemIndex++) {
							item = arr[itemIndex];

							// Update the item with the new data
							updateObj = {};
							updateObj[updateField] = item[fromField];
							self.update(collection, {_id: item._id}, updateObj, options, function (err) {});
						}
						cb(err);
					} else {
						cb(err);
					}
				});
			}
		});
	},

	/**
	 * Converts a string into a new database ObjectID.
	 * @param id The string id to convert to an ObjectID.
	 * @returns {Object} The new mongo ObjectID.
	 */
	toId: function (id) {
		if (typeof(id) === 'string' && id && (String(id).length === 12 || String(id).length === 24)) {
			try {
				return new this.client.bson_serializer.ObjectID(id);
			} catch (e) {
				this.log('Monge toId() cannot convert id to object because it is not a valid id: ', 'warning', id);
				return '';
			}
		} else {
			return id;
		}
	},

	/**
	 * A private method for converting _id key/values to string and mongo ID objects.
	 * @param obj
	 * @param {Object} options
	 * @private
	 */
	_convertIds: function (obj, options) {
		options = options || {};

		if (options.autoConvertIds || this._options.autoConvertIds) {
			if (obj) {
				if (obj instanceof Array) {
					// Loop the objects in the array recursively
					for (var i in obj) {
						this._convertIds(obj[i], options);
					}
				} else {
					if (obj._id) {
						if (typeof(obj._id) === 'string') {
							if (options.toType !== 'string') {
								// Convert to a mongo id
								obj._id = new this.client.bson_serializer.ObjectID(obj._id);
							}
						} else {
							if (options.toType !== 'id') {
								obj._id = String(obj._id);
							}
						}
					}
				}
			}
		}
	}
});

module.exports.Monge = Monge;
module.exports.MongeManager = MongeManager;