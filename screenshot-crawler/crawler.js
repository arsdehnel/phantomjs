var page = require('webpage').create(),
    fs   = require('fs'),
    url  = 'http://aslaninst.local',
    path = '/Users/arsdehnel/Sites/phantomjs/screenshot-crawler/'

page.viewportSize = { width: 1200, height: 780 };

//capture the console from phantom and put them back to the terminal
page.onConsoleMessage = function (msg) {
  console.log(msg);
};

page.open(url, function (status) {

    //get all the app navs
    navLinks = this.evaluate( getAppNav );

	page.render('page.png');
	console.log('page.png [' + fs.size(path + '/page.png') + ' bytes]');
	//phantom.exit();

});


function getMainMenuLinks() {
    var links = document.querySelectorAll('a[href^=promoHome]');
    return Array.prototype.map.call(links, function(e) {
        return e.getAttribute('href');
    });
}