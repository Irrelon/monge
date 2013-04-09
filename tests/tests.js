var monge = new (require('../index.js').Monge)();

exports.connect = function (test) {
	///////////////////////////////////////////////////
	// CONNECT TO THE DATABASE
	///////////////////////////////////////////////////
	monge.connect({host: 'localhost', db: 'mongeTest'}, function (err, db) {
		test.ifError(err);
		test.done();
	});
};

exports.insert = function (test) {
	monge.connect({host: 'localhost', db: 'mongeTest'}, function (err, db) {
		///////////////////////////////////////////////////
		// INSERT AN ITEM
		///////////////////////////////////////////////////
		monge.insert('test', {'test': 0}, {}, function (err, id) {
			test.ifError(err);
			test.done();
		});
	});
};

exports.update = function (test) {
	monge.connect({host: 'localhost', db: 'mongeTest'}, function (err, db) {
		///////////////////////////////////////////////////
		// UPDATE AN ITEM
		///////////////////////////////////////////////////
		monge.update('test', {'test': 0}, {'test': 1}, null, function (err) {
			test.ifError(err);
			test.done();
		});
	});
};

exports.query = function (test) {
	monge.connect({host: 'localhost', db: 'mongeTest'}, function (err, db) {
		///////////////////////////////////////////////////
		// QUERY THE DATABASE FOR MULTIPLE ITEMS
		///////////////////////////////////////////////////
		monge.query('test', {'test': 1}, {}, function (err, items) {
			test.ifError(err);
			test.equal(items.length > 0, true, 'Returned data is empty!');
			if (items.length > 0) {
				test.equal(items[0].test, 1, 'Retrieved item does not match inserted one!');
			}
			test.done();
		});
	});
};

exports.queryOne = function (test) {
	monge.connect({host: 'localhost', db: 'mongeTest'}, function (err, db) {
		///////////////////////////////////////////////////
		// QUERY THE DATABASE FOR A SINGLE ITEM
		///////////////////////////////////////////////////
		monge.queryOne('test', {'test': 1}, {}, function (err, item) {
			test.ifError(err);
			test.equal(item !== undefined, true, 'Returned data is empty!');
			
			if (item !== undefined) {
				test.equal(item.test, 1, 'Retrieved item does not match inserted one!');
			}
			test.done();
		});
	});
};

exports.count = function (test) {
	monge.connect({host: 'localhost', db: 'mongeTest'}, function (err, db) {
		///////////////////////////////////////////////////
		// COUNT MATCHING ITEMS
		///////////////////////////////////////////////////
		monge.count('test', {'test': 1}, function (err, count) {
			test.ifError(err);
			test.equal(count === 1, true, 'Expected count === 1 and got ' + count);
			test.done();
		});
	});
};

exports.distinct = function (test) {
	monge.connect({host: 'localhost', db: 'mongeTest'}, function (err, db) {
		///////////////////////////////////////////////////
		// GET DISTINCT VALUES FOR A KEY
		///////////////////////////////////////////////////
		monge.distinct('test', 'test', {}, {}, function (err, values) {
			test.ifError(err);
			test.equal(typeof(values) == 'object' && values.length > 0, true, 'Expected array');
			test.done();
		});
	});
};

exports.unset = function (test) {
	monge.connect({host: 'localhost', db: 'mongeTest'}, function (err, db) {
		// Add a new item
		monge.insert('test', {'name': 'Hello'}, {'w': 1},  function (err, id) {
			test.ifError(err);
			
			// Get the item and check it has a "name" field
			monge.queryOne('test', {'_id': id}, {}, function (err, item) {
				test.ifError(err);
				test.equals(item['name'] !== undefined, true, 'Name field was not set!');
				
				///////////////////////////////////////////////////
				// UNSET A KEY FROM AN ITEM (DELETE JUST KEY/VALUE)
				///////////////////////////////////////////////////
				monge.unset('test', {'_id': id}, {'name': 1}, function (err) {
					test.ifError(err);
					
					// Get the item and check it has no "name" field
					monge.queryOne('test', {'_id': id}, {}, function (err, item) {
						test.equals(item['name'] === undefined, true, 'Name field was not unset!');
						test.done();
					});
				});
			});
		});
	});
};

exports.push = function (test) {
	monge.connect({host: 'localhost', db: 'mongeTest'}, function (err, db) {
		// Add a new item
		monge.insert('test', {'values': []}, {},  function (err, id) {
			test.ifError(err);
			
			///////////////////////////////////////////////////
			// PUSH ITEM INTO AN ARRAY FIELD
			///////////////////////////////////////////////////
			monge.push('test', {'_id': id}, {'values': 'hello'}, function (err) {
				test.ifError(err);
				
				// Get the item and check it has one item in the array
				monge.queryOne('test', {'_id': id}, {}, function (err, item) {
					test.ifError(err);
					test.equals(item['values'].length === 1 && item['values'][0] === 'hello', true, 'Was expecting an item in the array');
					test.done();
				});
			});
		});
	});
};

exports.pull = function (test) {
	monge.connect({host: 'localhost', db: 'mongeTest'}, function (err, db) {
		// Add a new item
		monge.insert('test', {'values': ['hello']}, {},  function (err, id) {
			test.ifError(err);
			
			///////////////////////////////////////////////////
			// PULL ITEM OUT OF AN ARRAY FIELD
			///////////////////////////////////////////////////
			monge.pull('test', {'_id': id}, {'values': 'hello'}, function (err) {
				test.ifError(err);
				
				// Get the item and check it has no item in the array
				monge.queryOne('test', {'_id': id}, {}, function (err, item) {
					test.ifError(err);
					test.equals(item['values'].length === 0, true, 'Was expecting no items in the array');
					test.done();
				});
			});
		});
	});
};

exports.remove = function (test) {
	monge.connect({host: 'localhost', db: 'mongeTest'}, function (err, db) {
		///////////////////////////////////////////////////
		// REMOVE ALL MATCHING ITEMS FROM THE COLLECTION
		///////////////////////////////////////////////////
		monge.remove('test', {}, {}, function (err) {
			test.ifError(err);
			test.done();
		});
	});
};

exports.disconnect = function (test) {
	// Test method
	monge.disconnect(function (err, db) {
		test.ifError(err);
		test.done();
	});
};