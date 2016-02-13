var express = require('express');
var app = express();
var md5 = require('md5');
var fs = require('fs');
var request = require('request');
var MongoClient = require('mongodb');

var port = process.env.PORT || 1337;

MongoClient.connect('mongodb://admin:4dm1n_u53r@ds061385.mongolab.com:61385/parcade-arcade', function(err, db) {
    app.get('/', function(req, res) {
        res.end("ParcadeArcade");
    });

    /**
     * On a POST request to /points, add points to the user with a specific
     * userId.
     *
     * POST http://127.0.0.1/points/?id=13371c825290295966131f43f818ecca&points=5
     * ...
     * {
     *   "success": true,
     *   "points": 25
     * }
     *
     */
    app.post('/points', function(req, res) {
        var query = req.query;

        if (query.id && query.points) {
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
        } else {
            res.end(JSON.stringify({
                success: false,
                error: "Missing parameters"
            }));
        }
    });

    /**
     * On a POST request to /create_user, add a user to our MongoDB server
     * using the md5 hash of the user's remote IP address as their userId.
     *
     * POST http://127.0.0.1/create_user
     * ...
     * {
     *   "success": true,
     *   "id": "13371c825290295966131f43f818ecca"
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
     *   "success": true,
     *   "response": {
     *     "name": "ultrasonic",
     *     "sensors": {
     *       "1": "123"
     *     }
     *   }
     * }
     *
     */
    app.post('/push', function(req, res) {
        var query = req.query;

        res.setHeader('Content-Type', 'application/json');

        console.log(query);

        var cursor = db.collection('sensors').find({
            'id': query.id
        });

        cursor.each(function(err, doc) {
            if (doc !== null) {
                var sensors = doc.sensors;

                sensors[query.sensor] = query.value;

                db.collection('sensors').update({
                    'id': query.id
                }, {
                    'id': query.id,
                    'sensors': sensors
                });

                res.end(JSON.stringify({
                    'success': true,
                    'response': {
                        'name': doc.name,
                        'sensors': doc.sensors
                    }
                }));
            } else {
                res.end(JSON.stringify({
                    'success': false,
                    'error': 'no sensors document with name ' + query.name
                }));
            }
        });
    });

    /**
     * On a POST request to /add_listener, update or insert the database's
     * values for the listener (Raspberry Pi) with the specified id.
     *
     * POST http://127.0.0.1/add_listener/?id=1&capabilities={ CAPABILITIES-JSON }
     * ...
     * {
     *   "success": true,
     *   "response": {
     *     "ip": "127.0.0.1",
     *     "id": "1",
     *     "capabilities": { CAPABILITIES-JSON }
     *   }
     * }
     *
     */
    app.post('/add_listener', function(req, res) {
        var query = req.query;
        var time = Math.floor(Date.now() / 1000);

        if (query.capabilities && query.id) {
            var capabilities = false;
            var cursor = db.collection('listeners').find({
                'id': query.id
            });

            res.setHeader('Content-Type', 'application/json');

            try {
                capabilities = JSON.parse(query.capabilities);
            } catch (e) {
                console.log(e);

                res.end(JSON.stringify({
                    'success': false,
                    'error': e.toString()
                }));
            }

            if (capabilities) {
                cursor.count(function(err, count) {
                    if (count > 0) {
                        db.collection('listeners').update({
                            'id': query.id
                        }, {
                            'ip': req.connection.remoteAddress,
                            'id': query.id,
                            'capabilities': capabilities,
                            'timestamp': time
                        });
                    } else {
                        db.collection('listeners').insert({
                            'ip': req.connection.remoteAddress,
                            'id': query.id,
                            'capabilities': capabilities,
                            'timestamp': time
                        });
                    }

                    res.end(JSON.stringify({
                        'success': true,
                        'response': {
                            'ip': req.connection.remoteAddress,
                            'id': query.id,
                            'capabilities': capabilities,
                            'timestamp': time
                        }
                    }));
                });
            }
        } else {
            res.end(JSON.stringify({
                success: false,
                error: "Missing parameters"
            }));
        }
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
                    'success': true,
                    'response': {
                        'name': doc.name,
                        'id': query.id,
                        'value': doc.sensors[query.id]
                    }
                }));
            } else {
                res.end(JSON.stringify({
                    'success': false,
                    'error': 'no error document with name ' + query.name
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
     *   "success": true,
     *   "id": "13371c825290295966131f43f818ecca"
     *   "points": 25
     * }
     *
     */
    app.get('/get_points', function(req, res) {
        var query = req.query;

        if (query.id) {
            var cursor = db.collection('users').find({
                'id': query.id
            });

            res.setHeader('Content-Type', 'application/json');

            cursor.each(function(err, doc) {
                if (doc !== null) {
                    console.log(doc)
                    res.end(JSON.stringify({
                        'success': true,
                        'id': query.id,
                        'points': doc.points
                    }));
                } else {
                    res.end(JSON.stringify({
                        'success': false,
                        'error': 'No users document with id ' + query.id
                    }));
                }
            });
        } else {
            res.end(JSON.stringify({
                'success': false,
                'error': "Missing parameters"
            }));
        }
    });

    setInterval(function() {
        var cursor = db.collection('listeners').find();

        cursor.each(function(err, doc) {
            if (doc !== null) {
                request.post('http://' + doc.ip, {
                    params: {
                        'id': doc.id,
                        'capabilities': doc.capabilities
                    }
                }, function(err, response, body) {
                    if (err) {
                        console.log(err);
                    } else {
                        console.log(body);
                    }
                })
            }
        });
    }, 60000);

    /**
     * Start listening on the specified port.
     */
    app.listen(port, function() {
        console.log('Listening at port', port);
    });
});

app.use(express.static(__dirname + "/public"));


/*{
    "id": 1,
    "capabilities": [
        {
            "name": "green_button",
            "ioType": 0,
            "port": 1
        },
        {
            "name": "ultrasonic",
            "ioType": 0,
            "port": 2
        },
        {
            "name": "buzzer",
            "ioType": 1,
            "port": 3
        }
    ]
}*/
