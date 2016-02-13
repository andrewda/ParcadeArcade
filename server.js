var express = require('express');
var app = express();
var md5 = require('md5');
var fs = require('fs');
var MongoClient = require('mongodb');

var port = process.env.PORT || 1337;

MongoClient.connect('mongodb://admin:4dm1n_u53r@ds061385.mongolab.com:61385/parcade-arcade', function(err, db) {
    /**
     * On a POST request to /points, add points to the user with a specific
     * userId.
     *
     * POST http://127.0.0.1/points/?id=13371c825290295966131f43f818ecca&points=5
     * ...
     * {
     *    "success": true,
     *    "points": 25
     * }
     *
     */
    app.post('/points', function(req, res) {
        var query = req.query;
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

                res.end(JSON.stringify({
                    success: true,
                    points: parseInt(doc.points) + parseInt(query.points)
                }));
            } else {
                res.end(JSON.stringify({
                    success: false,
                    error: 'no users document with id ' + query.id
                }));
            }
        });
    });

    /**
     * On a POST request to /create_user, add a user to our MongoDB server
     * using the md5 hash of the user's remote IP address as their userId.
     *
     * POST http://127.0.0.1/create_user
     * ...
     * {
     *    "success": true,
     *    "id": "13371c825290295966131f43f818ecca"
     * }
     *
     */
    app.post('/create_user', function(req, res) {
        var userId = md5(req.connection.remoteAddress);

        res.setHeader('Content-Type', 'application/json');

        db.collection('users').insert({
            'id': userId,
            'points': 0
        }, function() {
            res.end(JSON.stringify({
                success: true,
                id: userId
            }));
        });
    });

    /**
     * On a POST request to /push, replace the database's sensor value with the
     * specified id to the specified value.
     *
     * POST http://127.0.0.1/push/?name=ultrasonic&id=1&value=123
     * ...
     * {
     *    "success": true,
     *    "response": {
     *      "name": "ultrasonic",
     *      "sensors": {
     *        "1": "123"
     *      }
     *    }
     * }
     *
     */
    app.post('/push', function(req, res) {
        var query = req.query;

        res.setHeader('Content-Type', 'application/json');

        console.log(query);

        var cursor = db.collection('sensors').find({
            'name': query.name
        });

        cursor.each(function(err, doc) {
            if (doc !== null) {
                var sensors = doc.sensors;

                sensors[query.id] = query.value;

                db.collection('sensors').update({
                    'name': query.name
                }, {
                    'name': query.name,
                    'sensors': sensors
                });

                res.end(JSON.stringify({
                    success: true,
                    response: {
                        'name': doc.name,
                        'sensors': doc.sensors
                    }
                }));
            } else {
                res.end(JSON.stringify({
                    success: false,
                    error: 'no sensors document with name ' + query.name
                }));
            }
        });
    });

    /**
     * On a GET request to /pull, retrieve information from the database with
     * the specified name and id.
     *
     * GET http://127.0.0.1/pull/?name=ultrasonic&id=1
     * ...
     * {
     *   "success": true,
     *   "response": {
     *     "name": "ultrasonic",
     *     "id": "1",
     *     "value": "123"
     *   }
     * }
     *
     */
    app.get('/pull', function(req, res) {
        var query = req.query;

        res.setHeader('Content-Type', 'application/json');

        var cursor = db.collection('sensors').find({
            'name': query.name
        });

        cursor.each(function(err, doc) {
            if (doc !== null) {
                res.end(JSON.stringify({
                    success: true,
                    response: {
                        name: doc.name,
                        id: query.id,
                        value: doc.sensors[query.id]
                    }
                }));
            } else {
                res.end(JSON.stringify({
                    success: false,
                    error: 'could not find document ' + query.name
                }));
            }
        });
    });

    /**
     * On a get request to /get_points, check the number of points the provided
     * user currently has.
     *
     * GET http://127.0.0.1/get_points/?id=13371c825290295966131f43f818ecca
     * ...
     * {
     *    "success": true,
     *    "id": "13371c825290295966131f43f818ecca"
     *    "points": 25
     * }
     *
     */
    app.get('/get_points', function(req, res) {
        var query = req.query;
        var cursor = db.collection('users').find({
            'id': query.id
        });

        res.setHeader('Content-Type', 'application/json');

        cursor.each(function(err, doc) {
            if (doc !== null) {
                console.log(doc)
                res.end(JSON.stringify({
                    success: true,
                    id: query.id,
                    points: doc.points
                }));
            } else {
                res.end(JSON.stringify({
                    success: false,
                    error: 'no users document with id ' + query.id
                }));
            }
        });
    });

    /**
     * Start listening on the specified port.
     */
    app.listen(port, function() {
        console.log('Listening at port', port);
    });
});
