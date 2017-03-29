var express = require('express');
var bodyParser = require('body-parser');
var pg = require('pg');

var app = express();

app.set('port', process.env.PORT || 5000);

app.use(express.static('public'));
app.use(bodyParser.json());

app.post('/update', function(req, res) {
    pg.connect(process.env.DATABASE_URL, function (err, conn, done) {
        // watch for any connect issues
        if (err) console.log(err);
        conn.query(
            'UPDATE salesforce.Contact SET Phone = $1, MobilePhone = $1 WHERE LOWER(FirstName) = LOWER($2) AND LOWER(LastName) = LOWER($3) AND LOWER(Email) = LOWER($4)',
            [req.body.phone.trim(), req.body.firstName.trim(), req.body.lastName.trim(), req.body.email.trim()],
            function(err, result) {
                if (err != null || result.rowCount == 0) {
                  conn.query('INSERT INTO salesforce.Contact (Phone, MobilePhone, FirstName, LastName, Email) VALUES ($1, $2, $3, $4, $5)',
                  [req.body.phone.trim(), req.body.phone.trim(), req.body.firstName.trim(), req.body.lastName.trim(), req.body.email.trim()],
                  function(err, result) {
                    done();
                    if (err) {
                        res.status(400).json({error: err.message});
                    }
                    else {
                        // this will still cause jquery to display 'Record updated!'
                        // eventhough it was inserted
                        res.json(result);
                    }
                  });
                }
                else {
                    done();
                    res.json(result);
                }
            }
        );
    });
});

app.post("/new_contact", function(req, res) {
  var notification =req.body["soapenv:envelope"]["soapenv:body"][0]["notifications"][0];
  var sessionId = notification["sessionid"][0];
  var data = {};
 
  if (notification["notification"] !== undefined) {
    var sobject = notification["notification"][0]["sobject"][0];
    Object.keys(sobject).forEach(function(key) {
      if (key.indexOf("sf:") == 0) {
        var newKey = key.substr(3);
        data[newKey] = sobject[key][0];
      }
    });
    // do something #awesome with the data and sessionId
  }
  res.status(201).end();
});

app.listen(app.get('port'), function () {
    console.log('Express server listening on port ' + app.get('port'));
});
