# Monge
An easy to use library for accessing and working with MongoDB.
 
## Installation
```
npm install monge
```

## Connect to MongoDB Server
```
var monge = require('monge')

monge.connect({
	host: 'localhost',
	db: 'myDbName'
});

monge.on('connected', function () {
	
});
```

### More connection options
```
var monge = require('monge');

monge.connect({
	host: 'localhost',
	db: 'myDbName',
	port: 27017,
	user: 'myUser',
	pass: 'myPass',
	success: function () {
		// Do something on successful connection
	},
	error: function () {
		// Do something on error
	}
});
```

## Inserting
```
monge.insert('myCollection', {name: 'myObject', and: 'someMoreData'});
```

## Querying
Monge automatically converts _id fields into mongodb ObjectId objects when querying and returns all items with their
_id field as a string. This makes it really easy to work with ObjectIds without manually converting back and forth.

### Get all items in a collection
```
var items = monge.query('myCollection', {});

// Returns
[{"_id": "49hgy0439igh034tgn4t", "name": "myObject", "and": "someMoreData"}]
```

### Get all items with the field "name" and the value "myObject"
```
var items = monge.query('myCollection', {name: 'myObject'});

// Returns
[{"_id": "49hgy0439igh034tgn4t", "name": "myObject", "and": "someMoreData"}]
```

### Get only one item
```
var item = monge.queryOne('myCollection', {name: 'myObject'});

// Returns
{"_id": "49hgy0439igh034tgn4t", "name": "myObject", "and": "someMoreData"}
```

### Get item by id
```
var item = monge.queryOne('myCollection', {_id: '49hgy0439igh034tgn4t'});

// Returns
{"_id": "49hgy0439igh034tgn4t", "name": "myObject", "and": "someMoreData"}
```

### Query options
```
var item = monge.query('myCollection', {name: 'aTest'}, {limit: 10, returnFields: {name: 1}, orderBy: {name: 1}});

// Returns
{"_id": "49hgy0439igh034tgn4t", "name": "myObject", "and": "someMoreData"}
```