// Create instances
var casper = require('casper').create({ verbose: true, logLevel: 'debug' });
var utils = require('utils')
var fs = require('fs')

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

	// first we make sure to add this to the list of visited URLs
	// otherwise we could (and probably would) get into an infinite loop
	if( indexOf.call(visited, url) === -1 ){
		visited.push(url);
	}else{
		console.log(casper.colorizer.format('REPEAT', { fg: 'red', bold: true})+' already visited '+url);
		//return;
	}

	urlStatus = getUrlStatus( json, url );

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
					//var newUrl = helpers.absoluteUri(baseUrl+'/', link);
					if( indexOf.call( visited, link ) === -1 && indexOf.call( pendingUrls, link ) === -1 ) {
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

function getUrlStatus( json, url ){

	var retVal = false;

	var protocol = url.substring(0,url.indexOf(':'));
	var relUrl = url.replace( baseUrl, '')//.substring(0,1);
	    relUrl = relUrl.substring(0,( relUrl.indexOf('?') > 0 ? relUrl.indexOf('?') : relUrl.length ))
	var filename = relUrl.substring(relUrl.lastIndexOf('/')+1);
	    filename = filename.substring(0, ( filename.indexOf('?') > 0 ? filename.indexOf('?') : filename.length ) );
	var extension = filename.split('.').pop();

	casper.log( relUrl + ' ? index ' + ( relUrl.indexOf('?') ? relUrl.indexOf('?') : relUrl.length ), 'debug' );

	casper.log( "protocol: "+protocol+", relUrl: "+relUrl+", filename: "+filename+", extension: "+extension, 'debug' );

	// first check protocol
	var protocolStatus = arrSearch( json.protocols, protocol, "protocol" );

	casper.log( "protocolStatus: "+protocolStatus, 'debug' );

	if( protocolStatus !== false ){
		retVal = protocolStatus;
	}else{

		// then look for URL status
		var urlStatus = arrSearch( json.urls, relUrl, "url" );

		casper.log( "urlStatus: "+urlStatus, 'debug' );

		if( urlStatus !== false ){
			retVal = urlStatus;
		}else{

			//now look for a matching filename
			filenameStatus = arrSearch( json.filenames, filename, "filename" );

			casper.log( "filenameStatus: "+filenameStatus, 'debug' );

			if( filenameStatus ){
				retVal = filenameStatus;
			}else{

				// finally check to see if the extension has a special status
				extStatus = arrSearch( json.extensions, extension, "extension" );

				casper.log( "extStatus: "+extStatus, 'debug' );

				if( extStatus ){
					retVal = extStatus;
				}

			}

		}

	}

	return retVal;

}

function arrSearch( arr, val, attr ){

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


var indexOf = function(needle) {
    if(typeof Array.prototype.indexOf === 'function') {
        indexOf = Array.prototype.indexOf;
    } else {
        indexOf = function(needle) {
            var i = -1, index = -1;

            for(i = 0; i < this.length; i++) {
                if(this[i] === needle) {
                    index = i;
                    break;
                }
            }

            return index;
        };
    }

    return indexOf.call(this, needle);
};