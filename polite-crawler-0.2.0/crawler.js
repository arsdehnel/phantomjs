// Set the start URL
var startUrl = 'http://aslaninst.local/'
   ,baseUrl  = 'http://aslaninst.local/';

// Create instances
var casper = require('casper').create({ /*verbose: true, logLevel: 'debug' */});
var utils = require('utils')
var json = require('data.json')
//require('utils').dump(urls);
//casper.echo(urls.allowedUrls);
var helpers = require('helpers')
var fs = require('fs')

//login credentials from the parameters
var username = casper.cli.raw.get('user');
var password = casper.cli.raw.get('pwd');

// URL variables
var pendingUrls = ( json.pendingUrls ? json.pendingUrls : [])    //urls that have no decision made yet
var visited = [];

// Spider from the given URL
function spider(url) {

	// first we make sure to add this to the list of visited URLs
	// otherwise we could (and probably would) get into an infinite loop
	if( indexOf.call(visited, url) >= 0 ){
		casper.echo(url + 'already visited');
	}else{
		visited.push(url);
	}

	urlStatus = getUrlStatus( json, url );

	// Open the URL only if it's considered allowed
	if( urlStatus === "allow" ){

		casper.open(url).then(function() {

			// Set the status style based on server status code
			var status = this.status().currentHTTPStatus;
			switch(status) {
				case 200: var statusStyle = { fg: 'green', bold: true }; break;
				case 404: var statusStyle = { fg: 'red', bold: true }; break;
				 default: var statusStyle = { fg: 'magenta', bold: true }; break;
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
				var newUrl = helpers.absoluteUri(baseUrl, link);
				if( indexOf.call( visited, newUrl ) === -1 ) {
					pendingUrls.push(newUrl);
				}
			});

			// If there are URLs to be processed
			if ( pendingUrls.length > 0) {
				var nextUrl = pendingUrls.shift();
				spider(nextUrl);
			}

		});

	}else{		//not allowed

		casper.echo(casper.colorizer.format('link not allowed',{ fg: 'red', bold: true }) + ' ' + url);
		// If there are URLs to be processed
		if ( pendingUrls.length > 0) {
			var nextUrl = pendingUrls.shift();
			spider(nextUrl);
		}

	}

}

// Start spidering
casper.start(startUrl, function() {
    spider(this.getCurrentUrl());
});

// Start the run
casper.run();

function getUrlStatus( json, url ){

	//first look for URL status
	var urlStatus = arrSearch( json.urls, url, "url" );
	var retVal;

	//casper.echo( urlStatus );

	if( urlStatus !== -1 ){
		retVal = urlStatus;
	}else{

		//now look for a matching filename
		//parse out the filename or action name
		filename = url.replace( baseUrl, '');

		if( filename.indexOf('?') >= 0 ){
			filename = filename.substring(0,filename.indexOf('?'));
		}

		filenameStatus = arrSearch( json.filenames, filename, "filename" );

		if( filenameStatus ){
			retVal = filenameStatus;
		}else{

			// finally check to see if the extension has a special status
			extStatus = arrSearch( json.extensions, extension, "extension" );

			if( extStatus ){
				retVal = extStatus;
			}else{
				retVal = "pending";
			}

		}

		extension = filename.split('.').pop();

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