var monge = require('../index.js');

exports.connect = function (test) {
	monge.connect({host: 'localhos', db: 'mongeTest'}, function (err, db) {
		test.ifError(err);
		test.done();
	});
};

exports.insert = function (test) {
	monge.connect({host: 'localhost', db: 'mongeTest'}, function (err, db) {
		monge.insert('test', {'test': 1}, function (err, id) {
			test.ifError(err);
			test.done();
		});
	});
};

/*exports.query = function (test) {
	monge.connect({host: 'localhost', db: 'mongeTest'}, function (err, db) {
		monge.query('test', {'test': 1}, function (err, items) {
			test.equal(err, null, 'insert');
			test.done();
		});
	});
};*/

exports.disconnect = function (test) {
	monge.disconnect(function (err, db) {
		test.equal(err, null, 'disconnect');
		test.done();
	});
};