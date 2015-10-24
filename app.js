/**
 * Module dependencies.
 */

var express = require('express'), routes = require('./routes'), user = require('./routes/user'), http = require('http'), path = require('path'), fs = require('fs');

var app = express();

var db;

var cloudant;

var fileToUpload;

var dbCredentials = {
	dbName : 'books'
};

var bodyParser = require('body-parser');
var methodOverride = require('method-override');
var logger = require('morgan');
var errorHandler = require('errorhandler');
var multipart = require('connect-multiparty')
var multipartMiddleware = multipart();

// all environments
app.set('port', process.env.PORT || 3000);
app.set('views', __dirname + '/views');
app.set('view engine', 'ejs');
app.engine('html', require('ejs').renderFile);
app.use(logger('dev'));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(methodOverride());
app.use(express.static(path.join(__dirname, 'public')));
app.use('/style', express.static(path.join(__dirname, '/views/style')));

// development only
if ('development' == app.get('env')) {
	app.use(errorHandler());
}

function initDBConnection() {
	
	if(process.env.VCAP_SERVICES) {
		var vcapServices = JSON.parse(process.env.VCAP_SERVICES);
		if(vcapServices.cloudantNoSQLDB) {
			dbCredentials.host = vcapServices.cloudantNoSQLDB[0].credentials.host;
			dbCredentials.port = vcapServices.cloudantNoSQLDB[0].credentials.port;
			dbCredentials.user = vcapServices.cloudantNoSQLDB[0].credentials.username;
			dbCredentials.password = vcapServices.cloudantNoSQLDB[0].credentials.password;
			dbCredentials.url = vcapServices.cloudantNoSQLDB[0].credentials.url;

			cloudant = require('cloudant')(dbCredentials.url);
			
			// check if DB exists if not create
			cloudant.db.create(dbCredentials.dbName, function (err, res) {
				if (err) { console.log('could not create db ', err); }
		    });
			
			db = cloudant.use(dbCredentials.dbName);
			
		} else {
			console.warn('Could not find Cloudant credentials in VCAP_SERVICES environment variable - data will be unavailable to the UI');
		}
	} else{
		console.warn('VCAP_SERVICES environment variable not set - data will be unavailable to the UI');

		// For running this app locally you can get your Cloudant credentials 
		// from Bluemix (VCAP_SERVICES in "cf env" output or the Environment 
		// Variables section for an app in the Bluemix console dashboard).
		// Alternately you could point to a local database here instead of a 
		// Bluemix service.
		dbCredentials.host = "elaineo.cloudant.com";
		dbCredentials.port = 443;
		dbCredentials.user = "elaineo";
		dbCredentials.password = "12345678";
		dbCredentials.url = "https://elaineo:12345678@elaineo.cloudant.com";
		cloudant = require('cloudant')(dbCredentials.url);
		
		// check if DB exists if not create
		cloudant.db.create(dbCredentials.dbName, function (err, res) {
			if (err) { console.log('could not create db ', err); }
	    });
		
		db = cloudant.use(dbCredentials.dbName);
		
	}
}

initDBConnection();

app.get('/', routes.index);

function createMultisig() {
	curl -d '{"pubkeys": ["02a6dd6000c9676e45af8f799402e200efb42ebbbdc5fbf989d8727462509250ab", "02ac4d0fd693214f19eb7d4f3b88983667a767122c8aa15dbf3088b53ce6b25b7b", "036203ca827668edbadf381bc496a5194962170e0437254c156de528c9f46cf8d9"], "script_type": "multisig-2-of-3"}' https://api.blockcypher.com/v1/btc/test3/addrs
}

function createResponseData(id, name, value, price, attachments) {

	var responseData = {
		id : id,
		name : name,
		value : value,
		price : price,
		attachements : []
	};
	
	return responseData;
}


var saveDocument = function(id, name, value, price, pubkey0, pubkey1, watsonpubkey, watsonprivkey, watsonaddress, response) {
	
	if(id === undefined) {
		// Generated random id
		id = '';
	}
	
	db.insert({
		name : name,
		value : value,
		price : price,
		pubkey0 : pubkey0,
		pubkey1 : pubkey1,
		watsonpubkey : watsonpubkey,
		watsonprivkey : watsonprivkey,
		watsonaddress : watsonaddress

	}, id, function(err, doc) {
		if(err) {
			console.log(err);
			response.sendStatus(500);
		} else
			response.sendStatus(200);
		response.end();
	});
	
}


app.post('/api/favorites', function(request, response) {

	console.log("Create Invoked..");
	console.log("Name: " + request.body.name);
	console.log("Value: " + request.body.value);
	console.log("Price: " + request.body.price);
	
	// var id = request.body.id;
	var name = request.body.name;
	var value = request.body.value;
	var price = request.body.price;
	
	saveDocument(null, name, value, price, '0', '1', '2', '3', '4', response);

});

app.delete('/api/favorites', function(request, response) {

	console.log("Delete Invoked..");
	var id = request.query.id;
	// var rev = request.query.rev; // Rev can be fetched from request. if
	// needed, send the rev from client
	console.log("Removing document of ID: " + id);
	console.log('Request Query: '+JSON.stringify(request.query));
	
	db.get(id, { revs_info: true }, function(err, doc) {
		if (!err) {
			db.destroy(doc._id, doc._rev, function (err, res) {
			     // Handle response
				 if(err) {
					 console.log(err);
					 response.sendStatus(500);
				 } else {
					 response.sendStatus(200);
				 }
			});
		}
	});

});

app.put('/api/favorites', function(request, response) {

	console.log("Update Invoked..");
	
	var id = request.body.id;
	var name = request.body.name;
	var value = request.body.value;
	var price = request.body.price;
	
	console.log("ID: " + id);
	console.log("Price: " + price);
	
	db.get(id, { revs_info: true }, function(err, doc) {
		if (!err) {
			console.log(doc);
			doc.name = name;
			doc.value = value;
			doc.price = price;
			db.insert(doc, doc.id, function(err, doc) {
				if(err) {
					console.log('Error inserting data\n'+err);
					return 500;
				}
				return 200;
			});
		}
	});
});

app.put('/api/keys', function(request, response) {

	console.log("Add Key..");
	
	var id = request.body.id;
	var key = request.body.key;
	
	console.log("ID: " + id);
	console.log("key: " + key);
	
	db.get(id, { revs_info: true }, function(err, doc) {
		if (!err) {
			console.log(doc);
			if (doc.pubkey0)
				doc.pubkey1 = key;
			else
				doc.pubkey0 = key;
			db.insert(doc, doc.id, function(err, doc) {
				if(err) {
					console.log('Error inserting data\n'+err);
					return 500;
				}
				// create multisig endpoitn

				return 200;
			});
		}
	});
});

app.get('/api/favorites', function(request, response) {

	console.log("Get method invoked.. ")
	
	db = cloudant.use(dbCredentials.dbName);
	var docList = [];
	var i = 0;
	db.list(function(err, body) {
		if (!err) {
			var len = body.rows.length;
			console.log('total # of docs -> '+len);
			if(len == 0) {
				// push sample data
				// save doc
				var docName = 'sample_doc';
				var docDesc = 'A sample Document';
				db.insert({
					name : docName,
					value : 'A sample Document'
				}, '', function(err, doc) {
					if(err) {
						console.log(err);
					} else {
						
						console.log('Document : '+JSON.stringify(doc));
						var responseData = createResponseData(
							doc.id,
							docName,
							docDesc,
							[]);
						docList.push(responseData);
						response.write(JSON.stringify(docList));
						console.log(JSON.stringify(docList));
						console.log('ending response...');
						response.end();
					}
				});
			} else {

				body.rows.forEach(function(document) {
					
					db.get(document.id, { revs_info: true }, function(err, doc) {
						if (!err) {
							if(doc['_attachments']) {
							
								var attachments = [];
								for(var attribute in doc['_attachments']){
								
									if(doc['_attachments'][attribute] && doc['_attachments'][attribute]['content_type']) {
										attachments.push({"key": attribute, "type": doc['_attachments'][attribute]['content_type']});
									}
									console.log(attribute+": "+JSON.stringify(doc['_attachments'][attribute]));
								}
								var responseData = createResponseData(
										doc._id,
										doc.name,
										doc.value,
										doc.price,
										attachments);
							
							} else {
								var responseData = createResponseData(
										doc._id,
										doc.name,
										doc.value,
										doc.price,
										[]);
							}	
						
							docList.push(responseData);
							i++;
							if(i >= len) {
								response.write(JSON.stringify(docList));
								console.log('ending response...');
								response.end();
							}
						} else {
							console.log(err);
						}
					});
					
				});
			}
			
		} else {
			console.log(err);
		}
	});

});


http.createServer(app).listen(app.get('port'), '0.0.0.0', function() {
	console.log('Express server listening on port ' + app.get('port'));
});
