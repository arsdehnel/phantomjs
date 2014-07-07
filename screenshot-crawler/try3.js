var page = require('webpage').create(), loadInProgress = false, fs = require('fs');
var htmlFiles = new Array();
console.log('working directory: ' + fs.workingDirectory);
var curdir = fs.list(fs.workingDirectory);

htmlFiles.push('http://aslaninst.local/');
htmlFiles.push('http://aslaninst.local/training/');

// output pages as PNG
var pageindex = 0;

var interval = setInterval(function() {
    if (!loadInProgress && pageindex < htmlFiles.length) {
        console.log("image " + (pageindex + 1));
        page.open(htmlFiles[pageindex]);
    }
    if (pageindex == htmlFiles.length) {
        console.log("image render complete!");
        phantom.exit();
    }
}, 250);

page.onLoadStarted = function() {
    loadInProgress = true;
    console.log('page ' + (pageindex + 1) + ' load started');
};

page.onLoadFinished = function() {
    loadInProgress = false;
    page.render("images/output" + (pageindex + 1) + ".png");
    console.log('page ' + (pageindex + 1) + ' load finished');
    pageindex++;
}