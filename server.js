var express = require('express');
var app = express();
var handlebars = require('handlebars');
var fs = require('fs');
var port = process.env.PORT || 1337;

var layout = handlebars.compile(fs.readFileSync('./layout.html', 'utf8'));

app.get('/', function (req, res) {
    res.end(layout({
        "data": "Hello world!"
    }));
});

app.listen(port, function () {
    console.log('Listening at port', port);
});
