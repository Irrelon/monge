# Monge
An easy to use library for accessing and working with MongoDB.
 
## Installation
```
npm install monge
```

## Connect to MongoDB Server
```
var monge = require('monge');
monge.connect({
	host: 'localhost',
	db: 'mongeTest'
}, function (err, db) {
	if (!err) {
		// Connected successfully
	}
});
```

### More Connection Options
```
var monge = require('monge');
monge.connect({
	host: 'localhost',
	port: 27017,
	user: 'myUser',
	pass: 'myPass',
	db: 'mongeTest'
}, function (err, db) {
	if (!err) {
		// Connected successfully
	}
});
```

## Inserting
```
var monge = require('monge');
monge.connect({
	host: 'localhost',
	db: 'mongeTest'
}, function (err, db) {
	if (!err) {
		monge.insert('test', {'test': 0}, {}, function (err, id) {
			test.ifError(err);
			test.done();
		});
	}
});
```