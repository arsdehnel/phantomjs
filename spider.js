// Set the start URL
var startUrl = 'https://www.hondappc.com/ahmperfcenter/init.action'
   ,baseUrl  = 'https://www.hondappc.com/ahmperfcenter/';

// URL variables
var visitedUrls = [], pendingUrls = [];

// Create instances
var casper = require('casper').create({ verbose: true, logLevel: 'debug' });
var utils = require('utils')
var helpers = require('./helpers')
var fs = require('fs')

visitedUrls.push('https://www.hondappc.com/ahmperfcenter/logoutNoReEntry.action');
visitedUrls.push('https://www.hondappc.com/ahmperfcenter/logout.action');

// Spider from the given URL
function spider(url) {

	// Add the URL to the visited stack
	visitedUrls.push(url);

	// Open the URL
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
			if (pendingUrls.indexOf(newUrl) == -1 && visitedUrls.indexOf(newUrl) == -1) {
				//this.echo(this.colorizer.format('-> Pushed ' + newUrl + ' onto the stack', { fg: 'magenta' }));
				pendingUrls.push(newUrl);
			}
		});

		// If there are URLs to be processed
		if (pendingUrls.length > 0) {
			var nextUrl = pendingUrls.shift();
			this.echo(this.colorizer.format('<- Popped ' + nextUrl + ' from the stack', { fg: 'blue' }));
			spider(nextUrl);
		}

	});

}

// Start spidering
casper.start(startUrl, function() {
    // search for 'casperjs' from google form
    this.fill('form[name=logonForm]', { logonId: 'dehnel', password: '1' }, true);
});

casper.then(function() {
    spider(this.getCurrentUrl());
});

// Start the run
casper.run();