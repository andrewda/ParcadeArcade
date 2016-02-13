var express = require('express');
var app = express();
var port = process.env.PORT || 1337;

app.get('/', function (req, res) {
    res.send('Hello World!');
});

app.listen(port, function () {
    console.log('Listening at port', port);
});
