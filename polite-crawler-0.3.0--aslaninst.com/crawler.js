// Create instances
var casper = require('casper').create({ /*verbose: true, logLevel: 'debug'*/ });
var utils = require('utils')
var fs = require('fs')
var functions = require('functions')

// Set the start URL
if( casper.cli.has('startUrl') ){
	var startUrl = casper.cli.raw.get('startUrl');
}

var baseUrl = startUrl.substring(0,startUrl.length-1);

// get the datafile name
if( casper.cli.has('datafile') ){
	var datafile = casper.cli.raw.get('datafile');
}

// import it
var json = require(datafile)

// URL variables
var pendingUrls = ( json.pendingUrls ? json.pendingUrls : [])    //urls that have no decision made yet
var visited = [];

// Spider from the given URL
function spider(url) {

	// if URLs start with a / then we're going to append the base url before doing all the below
	// just so we're starting on a level playing field
	if( url.substring(0,1) === '/' ){
		url = baseUrl + url;
	}

	// first we make sure to add this to the list of visited URLs
	// otherwise we could (and probably would) get into an infinite loop
	if( functions.indexOf.call(visited, url) === -1 ){
		visited.push(url);
	}else{
		console.log(casper.colorizer.format('REPEAT', { fg: 'red', bold: true})+' already visited '+url);
		//return;
	}

	urlStatus = functions.getUrlStatus( json, url );

	casper.log( url + ' status ' + urlStatus, 'debug' );

	switch( urlStatus ){

		case "allowed":

			casper.open(url).then(function() {

				//this.echo(url.replace( baseUrl, '').replace(/\//g,'_').substring(1,2000));
				var captureFilename = url.replace( baseUrl, '').replace(/\//g,'_').replace(/\?/g,'').substring(1,2000) + '.png';
				if( captureFilename === '.png' ){
					captureFilename = 'home.png';
				}
				//this.echo( captureFilename );
				this.capture('screenshots/'+captureFilename);

				// Set the status style based on server status code
				var status = this.status().currentHTTPStatus;
				switch(status) {
					case 200: var statusStyle = { fg: 'green', bold: true }; break;
					case 404: var statusStyle = { fg: 'red', bold: true }; break;
				}

				// Display the spidered URL and status
				this.echo(this.colorizer.format(status, statusStyle) + ' ' + url);

				// Find links present on this page
				var links = this.evaluate(function() {
					var links = [];
					Array.prototype.forEach.call(__utils__.findAll('a'), function(e) {
						links.push(e.getAttribute('href'));
					});
					return links;
				});

				// Add newly found URLs to the stack
				Array.prototype.forEach.call(links, function(link) {

					if( link.substring(0,1) === '/' ){
						link = baseUrl + link;
					}

					if( functions.indexOf.call( visited, link ) === -1 && functions.indexOf.call( pendingUrls, link ) === -1 ) {
						//casper.echo( 'visited check: link '+link+', result '+indexOf.call( visited, link )+', visitedLength'+visited.length)
						pendingUrls.push(link);
					}
				});

				// If there are URLs to be processed
				if ( pendingUrls.length > 0) {
					var nextUrl = pendingUrls.shift();
					spider(nextUrl);
				}

			});

			break;

		case "blocked":
			casper.echo(casper.colorizer.format('BLOCKED',{ fg: 'red', bold: true }) + ' ' + url);
			if ( pendingUrls.length > 0) {
				var nextUrl = pendingUrls.shift();
				spider(nextUrl);
			}
			break;

		case "pending":
			casper.echo(casper.colorizer.format('PENDING',{ fg: 'blue', bold: true }) + ' ' + url);
			if ( pendingUrls.length > 0) {
				var nextUrl = pendingUrls.shift();
				spider(nextUrl);
			}
			break;

		default:
			json.urls.push({"url":url.replace( baseUrl, ''),"status":"pending"});
			casper.echo(casper.colorizer.format('ADDED',{ fg: 'yellow', bold: true }) + ' ' + url);
			if ( pendingUrls.length > 0) {
				var nextUrl = pendingUrls.shift();
				spider(nextUrl);
			}
			break;

	}

}

// Start spidering
casper.start('http://www.google.com/', function() {
    spider(startUrl);
});

casper.then(function(){
	fs.write(datafile, JSON.stringify(json,null,'\t'), 'w');
})


// Start the run
casper.run();