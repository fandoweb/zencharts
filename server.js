var connect = require('connect');
var serveStatic = require('serve-static');
connect().use(serveStatic(__dirname)).listen(3000);
console.log('Server running at http://127.0.0.1:3000/');
