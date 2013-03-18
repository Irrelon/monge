# Monge
An easy to use library for accessing and working with MongoDB.
 
## Installation
```
npm install monge
```

## Connect to MongoDB Server
```
var monge = require('monge').connect({host: 'localhost'});
```

### More Connection Options
```
var monge = require('monge').connect({host: 'localhost', port: 27017, user: 'myUser', pass: 'myPass', db: 'myDbName'});
```