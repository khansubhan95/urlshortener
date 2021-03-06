var express = require('express');
var validUrl = require('valid-url');
var path = require('path');
var mongodb = require('mongodb').MongoClient;
var mongoose = require('mongoose');
var urlNumberSchema = require('./schemas/urlNumberSchema')
var urlSchema = require('./schemas/urlSchema')

var dbUri = process.env.MONGOLAB_URI;
// var dbUri = 'mongodb://localhost:27017/urlshortener'

var app = express()

mongoose.Promise = global.Promise

mongoose.connect(dbUri);

var UrlNumber = mongoose.model('UrlNumber',urlNumberSchema)
var Url = mongoose.model('Url',urlSchema)

// Insert a new collection urlnumbers in MongoDB
// Add a new document with key urlNumber with value 0

app.use('/',express.static(path.join(__dirname,'public')));

app.get('/:num', function(req, res){
	var num = req.params.num;
	var actualUri = req.protocol+'://'+req.get('host')+'/'+num;
	// console.log(num);
	// console.log(actualUri);
	Url.findOne({shortUrl: actualUri},function(err, doc){
		if (err) console.log(err);

		if (doc===null) 
			res.json('Invalid request')

		else 
			res.redirect(doc['bigUrl'])
	})
})

app.get('/api/:uri*',function(req,res){

    var uri = req.originalUrl;
    var userUri = uri.split('api/')[1];
    var status = validUrl.isUri(userUri)
    var actualUri = req.protocol+'://'+req.get('host');

    // console.log('userUri '+userUri);
    // console.log('actualUri '+actualUri);
    // console.log('status '+status);

    if (status !== undefined) {
    	Url.findOne({bigUrl: userUri},function(err,doc){
    		if (err) 
    			console.log('error '+err);

    		if (doc === null) {

    			UrlNumber.findOne({urlNumber: {$exists: true}}, function(err,doc){
    				if (err)
    					console.log((err));
    				var num = doc['urlNumber'];
    				console.log(num);
    				var newNum = num+1;
    				UrlNumber.update({urlNumber: num}, {urlNumber: newNum}, function(err,doc){
    					if (err) 
    						console.log(err);
    					console.log('urlNumber updated successfully');
		    			var item = new Url({bigUrl: userUri, shortUrl: actualUri+'/'+num}).save(function(err,doc){
		    				if(err) 
		    					console.log(err);
		    				res.json({bigUrl: userUri, shortUrl: actualUri+'/'+num})
		    			})


    				})
    			})
    		}
    		else
    			res.send({bigUrl: doc['bigUrl'], shortUrl: doc['shortUrl']})

    		
    	})
    }

    else 
    	res.json('Invalid API request');
})




app.listen(process.env.PORT || 3000);
console.log('Server running on port 3000');