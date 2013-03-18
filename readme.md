# Monge
An easy to use library for accessing and working with MongoDB.
 
## Installation
```
npm install monge
```

## Unit Tests
There is a full suite of unit tests included in the ./tests folder. They are designed to run via nodeunit and you can
execute them via:
```
node ./tests/index.js
```

Please note that the tests require a MongoDB server running at "localhost" that has no access restrictions. A collection
called "test" will be created and used during the unit test execution. A database called "mongeTest" is expected to
exist on the server before any tests are run. Please create it if it does not already exist.

## Connect to MongoDB Server
```
var monge = require('monge');

/**
 * Connect to the database.
 * @param {Object} options The connection options object.
 * @param {Function} cb The callback method.
 */
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

/**
 * Connect to the database.
 * @param {Object} options The connection options object.
 * @param {Function} cb The callback method.
 */
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
		/**
		 * Inserts a new item into the database.
		 * @param {String} collection The collection to work with.
		 * @param {Object} obj The object to insert.
		 * @param {Object} options The options to pass to the database method when executing.
		 * @param {Function} cb The callback method.
		 */
		monge.insert('test', {'test': 0}, {}, function (err, id) {
			if (!err) {
				// Insert successful, the inserted item ID is in "id" (string)
			}
		});
	}
});
```

## Updating
It is *important* to note that the Monge update() method does NOT overwrite one item with another like the default
behaviour of MongoDB does. Instead it adds / updates existing items so if you search for:
 
```
{'field1': 'hello'}
```

And then you update it with:

```
{'field2': 'goodbye'}
```

The resulting item is:

```
{'field1': 'hello', 'field2': 'goodbye'}
```

Example:
```
var monge = require('monge');
monge.connect({
	host: 'localhost',
	db: 'mongeTest'
}, function (err, db) {
	if (!err) {
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
		monge.update('test', {'test': 0}, {'test': 1}, function (err) {
			if (!err) {
				// Update successful
			}
		});
	}
});
```

## Query for Multiple Items
```
var monge = require('monge');
monge.connect({
	host: 'localhost',
	db: 'mongeTest'
}, function (err, db) {
	if (!err) {
		/**
		 * Returns all records matching the search object and returns them as an array.
		 * @param {String} collection The collection to work with.
		 * @param {Object} obj The key/value pairs to match items against.
		 * @param {Object} options The options to pass to the database method when executing.
		 * @param {Function} cb The callback method.
		 */
		monge.query('test', {'test': 1}, {}, function (err, items) {
			if (!err) {
				// Do something with "items" (array)
			}
		});
	}
});
```

## Query for a Single Item
```
var monge = require('monge');
monge.connect({
	host: 'localhost',
	db: 'mongeTest'
}, function (err, db) {
	if (!err) {
		/**
		 * Returns a single item matching the search object.
		 * @param {String} collection The collection to work with.
		 * @param {Object} obj The key/value pairs to match items against.
		 * @param {Object} options The options to pass to the database method when executing.
		 * @param {Function} cb The callback method.
		 */
		monge.queryOne('test', {'test': 1}, {}, function (err, item) {
			if (!err) {
				// Do something with "item" (object)
			}
		});
	}
});
```

## Counting Items
```
var monge = require('monge');
monge.connect({
	host: 'localhost',
	db: 'mongeTest'
}, function (err, db) {
	if (!err) {
		/**
		 * Returns the number of items that match the query.
		 * @param {String} collection The collection to work with.
		 * @param {Object} obj The key/value pairs to match items against.
		 * @param {Function} cb The callback method.
		 */
		monge.count('test', {'test': 1}, function (err, count) {
			if (!err) {
				// Do something with "count" (integer)
			}
		});
	}
});
```

## Get Distinct Values
```
var monge = require('monge');
monge.connect({
	host: 'localhost',
	db: 'mongeTest'
}, function (err, db) {
	if (!err) {
		/**
		 * Gets an array of distinct values for a key from the items that match the search.
		 * @param {String} collection The collection to work with.
		 * @param {String} key The key that the distinct values should be returned from.
		 * @param {Object} obj The key/value pairs to match items against.
		 * @param {Object} options The options to pass to the database method when executing.
		 * @param {Function} cb The callback method.
		 */
		monge.distinct('test', 'test', {}, {}, function (err, values) {
			if (!err) {
				// Do something with "values" (array)
			}
		});
	}
});
```

## Unset (Remove) A Key From An Item
```
var monge = require('monge');
monge.connect({
	host: 'localhost',
	db: 'mongeTest'
}, function (err, db) {
	if (!err) {
		/**
		 * Removes an item's property / key. 
		 * @param {String} collection The collection to work with.
		 * @param {Object} searchObj The key/values to search for when finding items to unset keys in.
		 * @param {Object} unSetObj The keys to unset with a value of 1. E.g. to unset a key "name" you
		 * would pass {"name": 1}.
		 * @param {Object} options The options to pass to the database method when executing.
		 * @param {Function} cb The callback method.
		 */
		monge.unset('test', {'_id': id}, {'name': 1}, function (err) {
			if (!err) {
				// Unset successful
			}
		});
	}
});
```

## Push A Value To An Item's Array Key
```
var monge = require('monge');
monge.connect({
	host: 'localhost',
	db: 'mongeTest'
}, function (err, db) {
	if (!err) {
		/**
		 * Pushes an item to an array field.
		 * @param {String} collection The collection to work with.
		 * @param {Object} searchObj The key/values to search for when finding items to push into.
		 * @param {Object} updateObj The key of the array to push into and the values that should
		 * be pushed into that array.
		 * @param {Object} options The options to pass to the database method when executing.
		 * @param {Function} cb The callback method.
		 */
		monge.push('test', {'_id': id}, {'values': 'hello'}, function (err) {
			if (!err) {
				// Push successful
			}
		});
	}
});
```

## Pull A Value From An Item's Array Key
```
var monge = require('monge');
monge.connect({
	host: 'localhost',
	db: 'mongeTest'
}, function (err, db) {
	if (!err) {
		/**
		 * Pulls an item from an array field.
		 * @param {String} collection The collection to work with.
		 * @param {Object} searchObj The key/values to search for when finding items to pull from.
		 * @param {Object} updateObj The key of the array to pull from and the values that should
		 * be pulled from that array.
		 * @param {Object} options The options to pass to the database method when executing.
		 * @param {Function} cb The callback method.
		 */
		monge.pull('test', {'_id': id}, {'values': 'hello'}, function (err) {
			if (!err) {
				// Pull successful
			}
		});
	}
});
```

## Remove Item(s)
```
var monge = require('monge');
monge.connect({
	host: 'localhost',
	db: 'mongeTest'
}, function (err, db) {
	if (!err) {
		/**
		 * Removes all rows that match the passed criteria.
		 * @param {String} collection The collection to work with.
		 * @param {Object} obj The key/value pairs to match items against.
		 * @param {Object} options The options to pass to the database method when executing.
		 * @param {Function} cb The callback method.
		 */
		monge.remove('test', {}, {}, function (err) {
			if (!err) {
				// Remove successful
			}
		});
	}
});
```

# Phone Home
This software is developed by Rob Evans and is licensed from Irrelon Software Limited, the creators of the Isogenic
Game Engine (http://www.isogenicengine.com). This open-source software is provided as is without any warranty or
guarantee as is provided free of charge and free of restriction.

# License
This software is licensed under the MIT license.