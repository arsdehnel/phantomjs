// Set the start URL
var startUrl = 'http://aslaninst.local/'
   ,baseUrl  = 'http://aslaninst.local/';

// Create instances
var casper = require('casper').create({ /*verbose: true, logLevel: 'debug' */});
var page = require('webpage').create();
var colorizer = require('colorizer').create('Colorizer');
var utils = require('utils')
var fs = require('fs') // filesystem
var helpers = require('../helpers')

// load up our JSON file that has all our variables and whatnot
var data = require('data.json')

// spider variables
var urlStatus;
var filename;
var extension;
var visited = [];
var spiderLinks = new Array();

// Spider from the given URL
function spider(url) {

	// first we make sure to add this to the list of visited URLs
	// otherwise we could (and probably would) get into an infinite loop
	if( visited.indexOf(url) >= 0 ){
		return;
	}else{
		visited.push(url);
	}

    /***********************************************************
		URLs

	 	first we look for an exact URL match
	  **********************************************************/
	urlStatus = findMatch( url, data.urls, "url" );

	//if that came back false
	if( !urlStatus ){

	    /***********************************************************
			Filenames

		 	if we didn't find a match there we get just the filename
		 	as sometimes the URL doesn't match perfectly due to
		 	querystring parameters
		  **********************************************************/
		// parse out the filename
		filename = url.replace( baseUrl, '');
		if( filename.indexOf('?') >= 0 ){
			filename = filename.substring(0,filename.indexOf('?'));
		}
		urlStatus = findMatch( filename, data.filenames, "filename" );

	}

	// however we got here we now figure out what to do with this url
	switch( urlStatus ){
		case "allow":
			casper.echo( urlResult( 'allowed', 'green', url ) );
			page.open(url,function(){
				casper.echo(url+' opened');
			});
			/*
			casper.open(url).then(function() {
				// Find links present on this page
				var links = this.evaluate(function() {
					var links = [];
					Array.prototype.forEach.call(__utils__.findAll('a'), function(e) {
						links.push(e.getAttribute('href'));
					});
					return links;
				});

				Array.prototype.forEach.call(links, function(link) {
					var newUrl = helpers.absoluteUri(baseUrl, link);
					if ( spiderLinks.indexOf(newUrl) == -1 ) {
						spiderLinks.push(newUrl);
					}
				});

				casper.echo( spiderLinks );

			});
			*/

			break;
		case "block":
			casper.echo(colorizer.format("BLOCKED: ", { fg: 'red', bg: 'black', bold: true }) + ' ' + url);
			break;
		default:
			casper.echo(colorizer.format("PENDING: ", { fg: 'magenta', bg: 'black', bold: true }) + ' ' + url);
			data.urls.push({"url":url,"status":"pending"});
			break;
	}

	casper.echo( spiderLinks.length );

}

// Start spidering
casper.start(startUrl, function() {
    spider(startUrl);
});

//re-write the JSON file with any new findings
casper.then(function(){
	fs.write('newJSON.json', JSON.stringify(data,null,'\t'), 'w');
})

// Start the run
casper.run();

page.onLoadFinished = function() {
    //loadInProgress = false;
    page.render("images/output" + (pageindex + 1) + ".png");
    console.log('page ' + (pageindex + 1) + ' load finished');
    pageindex++;
}

function urlResult( status, color, url ){
	var returnStr = colorizer.format(status.toUpperCase()+": ", { fg: color, bg: 'black', bold: true });
	returnStr += colorizer.format( ' ' + url, { fg: 'white', bg: 'black' } );
	return returnStr;
}

function findMatch( val, arr, attr ){

	// if left as null this will tell the calling function that we didn't find something
	var returnVal = false;

	// go through all the urls
	for( var crnt in arr ){

		// do we match exactly
		if( arr[crnt][attr] === val ){

			// return the status
			returnVal = arr[crnt].status;

		}

	}

	return returnVal;

}

function getLinks( url ){

	//var linkArr = [];

	var linkArr = casper.open(url).then(function() {

		// Set the status style based on server status code
		var status = this.status().currentHTTPStatus;
		switch(status) {
			case 200: var statusStyle = { fg: 'green', bold: true }; break;
			case 404: var statusStyle = { fg: 'red', bold: true }; break;
			 default: var statusStyle = { fg: 'magenta', bold: true }; break;
		}

		// Display the spidered URL and status
		this.echo(this.colorizer.format(status, statusStyle) + ' ' + url);

		if( status === 200 ){
			// Find links present on this page
			var links = this.evaluate(function() {
				var links = [];
				Array.prototype.forEach.call(__utils__.findAll('a'), function(e) {
					links.push(e.getAttribute('href'));
				});
				return links;
			});

			//linkArr = links;

		}

		//console.log(linkArr);

		return links;

	})

	return linkArr;

}