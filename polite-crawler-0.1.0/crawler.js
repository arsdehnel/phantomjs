// Set the start URL
var startUrl = 'http://aslaninst.local/'
   ,baseUrl  = 'http://aslaninst.local/';

// Create instances
var casper = require('casper').create({ /*verbose: true, logLevel: 'debug' */});
var utils = require('utils')
var json = require('urls.json')
//require('utils').dump(urls);
//casper.echo(urls.allowedUrls);
var helpers = require('helpers')
var fs = require('fs')

//login credentials from the parameters
var username = casper.cli.raw.get('user');
var password = casper.cli.raw.get('pwd');

// URL variables
var allowedUrls = ( json.allowedUrls ? json.allowedUrls : []),    //urls that the spider is okay to follow
    pendingUrls = ( json.pendingUrls ? json.pendingUrls : []),    //urls that have no decision made yet
    blockedUrls = ( json.blockedUrls ? json.blockedUrls : []),    //urls that have been logged as unfollowable
    allowedFilenames = ( json.allowedFilenames ? json.allowedFilenames : []),
    allowedExtensions = ( json.allowedExtensions ? json.allowedExtensions : []);

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

	//parse out the filename or action name
	filename = url.replace( baseUrl, '');

	if( filename.indexOf('?') >= 0 ){
		//casper.echo( filename.indexOf('?') );
		filename = filename.substring(0,filename.indexOf('?'));
	}

	extension = filename.split('.').pop();

	// Open the URL only if it's considered allowed
	if( allowedUrls.indexOf(url) >= 0 || allowedFilenames.indexOf(filename) >= 0 || allowedExtensions.indexOf(extension) >= 0 ){

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
			//var baseUrl = this.getGlobal('location').origin;
			Array.prototype.forEach.call(links, function(link) {
				var newUrl = helpers.absoluteUri(baseUrl, link);
				if ( indexOf.call( blockedUrls, newUrl ) === -1 && indexOf.call( pendingUrls, newUrl ) === -1 && indexOf.call( visited, newUrl ) === -1 ) {
					//this.echo(this.colorizer.format('-> Pushed ' + newUrl + ' onto the stack', { fg: 'magenta' }));
					pendingUrls.push(newUrl);
				}
			});

			// If there are URLs to be processed
			if ( pendingUrls.length > 0) {
				var nextUrl = pendingUrls.shift();
				//this.echo(this.colorizer.format('<- Popped ' + nextUrl + ' from the stack', { fg: 'blue' }));
				spider(nextUrl);
			}

		});

	}else{		//not allowed

		casper.echo(casper.colorizer.format('link not allowed',{ fg: 'red', bold: true }) + ' ' + url);
		// If there are URLs to be processed
		if ( pendingUrls.length > 0) {
			var nextUrl = pendingUrls.shift();
			//this.echo(this.colorizer.format('<- Popped ' + nextUrl + ' from the stack', { fg: 'blue' }));
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