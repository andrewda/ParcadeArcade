var express = require('express');
var app = express();
var fs = require('fs');
var MongoClient = require('mongodb');
var md5 = require('md5');
var port = process.env.PORT || 1337;

MongoClient.connect('mongodb://admin:4dm1n_u53r@ds061385.mongolab.com:61385/parcade-arcade', function(err, db) {

    /**
     * On a get request to /, check the number of points the provided user
     * currently has. This should later be moved to /get_points or similar.
     */
    app.get('/', function(req, res) {
        var query = req.query;
        var cursor = db.collection('users').find({
            'id': query.id
        });

        res.setHeader('Content-Type', 'application/json');

        cursor.each(function(err, doc) {
            if (doc !== null) {
                res.end( JSON.stringify( { success: true, id: query.id, points: doc.points } ) );
            } else {
                res.end( JSON.stringify( { success: false, error: 'no document with id ' + query.id } ) );
            }
        });
    });

    /**
     * On a POST request to /points, add points to the user with a specific
     * userId.
     */
    app.post('/points', function(req, res) {
        var query = req.query;
        console.log(query)
        var cursor = db.collection('users').find({
            'id': query.id
        });

        res.setHeader('Content-Type', 'application/json');

        cursor.each(function(err, doc) {
            if (doc !== null) {
                console.log(doc);

                db.collection('users').update({
                    'id': query.id
                }, {
                    'id': query.id,
                    'points': parseInt(doc.points) + parseInt(query.points)
                });

                res.end( JSON.stringify( { success: true, points: parseInt(doc.points) + parseInt(query.points) } ) );
            } else {
                res.end( JSON.stringify( { success: false, error: 'no document with id ' + query.id } ) );
            }
        });
    });

    /**
     * On a POST request to /create_user, add a user to our MongoDB server
     * using the md5 hash of the user's remote IP address as their userId.
     */
    app.post('/create_user', function(req, res) {
        var userId = md5(req.connection.remoteAddress);

        db.collection('users').insert({
            'id': userId,
            'points': 0
        }, function(err) {
            if (err) {
                res.end( JSON.stringify( { success: false, error: err } ) );
            } else {
                res.end( JSON.stringify( { success: true, id: userId } ) );
            }
        });
    });

    app.listen(port, function() {
        console.log('Listening at port', port);
    });
});
