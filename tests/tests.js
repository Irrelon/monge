var monge = require('../index.js');

exports.connect = function (test) {
	// Test method
	monge.connect({host: 'localhost', db: 'mongeTest'}, function (err, db) {
		test.ifError(err);
		test.done();
	});
};

exports.insert = function (test) {
	monge.connect({host: 'localhost', db: 'mongeTest'}, function (err, db) {
		// Test method
		monge.insert('test', {'test': 1}, function (err, id) {
			test.ifError(err);
			test.done();
		});
	});
};

exports.query = function (test) {
	monge.connect({host: 'localhost', db: 'mongeTest'}, function (err, db) {
		// Test method
		monge.query('test', {'test': 1}, {}, function (err, items) {
			test.ifError(err);
			test.equal(items[0].test, 1, 'Retrieved item does not match inserted one!');
			test.done();
		});
	});
};

exports.queryOne = function (test) {
	monge.connect({host: 'localhost', db: 'mongeTest'}, function (err, db) {
		// Test method
		monge.queryOne('test', {'test': 1}, {}, function (err, item) {
			test.ifError(err);
			test.equal(item.test, 1, 'Retrieved item does not match inserted one!');
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