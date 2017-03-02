var express = require('express');
var bodyParser = require('body-parser')
var proxy = require('express-http-proxy');
var app = express();
var refImageDir = "../References/"

app.use('/ref',express.static(refImageDir));
app.use('/mizar',express.static('../../Mizar'));
app.use(express.static('../Jasmine'));

app.post('/upload', bodyParser.text({
		limit : "5Mb"
	}), function (req, res) {
	var base64Data = req.body.replace(/^data:image\/png;base64,/, "");
	require("fs").writeFile(refImageDir + req.query.name, base64Data, 'base64', function (err) {
		if (err) {
			res.status(500).send("ERROR");
		} else {
			res.status(200).send("OK");
		}
	});

});

var server = app.listen(3000, function () {
		var host = server.address().address;
		var port = server.address().port;

		console.log('Example app listening at http://%s:%s', host, port);
	});
