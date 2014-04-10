var page = require('webpage').create(),
    fs   = require('fs'),
    url  = 'https://www.hondappc.com/ahmperfcenter/init.action',
    path = '/Users/arsdehnel/Sites/phantomjs'

page.viewportSize = { width: 1200, height: 780 };

//capture the console from phantom and put them back to the terminal
page.onConsoleMessage = function (msg) {
  console.log(msg);
};

page.open(url, function (status) {
	page.evaluate(function () {
		document.body.bgColor = 'white';
		console.log('<title>' + document.title + '</title>');
	});

	page.render('before.jpg');
	console.log('before.jpg [' + fs.size(path + '/before.jpg') + ' bytes]');

  	page.includeJs("https://cdnjs.cloudflare.com/ajax/libs/jquery/2.0.3/jquery.min.js", function() {

    	page.evaluate(function() {
      		$("#logonId").val('dehnel');
      		$("#password").val('1');
      		$('form[name=logonForm]').submit();
      		//$("#btn-login").click();
    	});
    });

	window.setTimeout(function() {
        page.render('after.jpg');
        console.log('after.jpg [' + fs.size(path + '/after.jpg') + ' bytes]');
        phantom.exit();
    }, 2000);

});