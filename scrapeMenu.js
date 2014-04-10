var links = [];
var casper = require('casper').create();
var baseUrl = 'https://www.hondappc.com/ahmperfcenter/';
var url  = 'https://www.hondappc.com/ahmperfcenter/init.action';
var navLinks;
var allNavLinks = new Array;

function getMainMenuLinks() {
    var links = document.querySelectorAll('#navbar_front a[href^=promoHome]');
    return Array.prototype.map.call(links, function(e) {
        return e.getAttribute('href');
    });
}

function getAppNav(){
    var navLinks = document.querySelectorAll( '#subnav a[href^=rptObjCmnRpt]' );
    return Array.prototype.map.call(navLinks, function(e) {
        return e.getAttribute('href');
    });
}

function getTableLinks(){
    var navLinks = document.querySelectorAll( '.reportTable tbody a' );
    return Array.prototype.map.call(navLinks, function(e) {
        return e.getAttribute('href');
    });
}



casper.start(url, function() {
    // search for 'casperjs' from google form
    this.fill('form[name=logonForm]', { logonId: 'dehnel', password: '1' }, true);
});

casper.then(function() {
    // aggregate results for the 'casperjs' search
    links = this.evaluate(getMainMenuLinks);

});

casper.then(function() {

    //go through our menu item masters
    this.each(links,function(self,link){

        //follow the item master
        self.thenOpen(baseUrl+link,function(a){

            //get all the app navs
            navLinks = this.evaluate( getAppNav );

            //go through those app navs
            self.each(navLinks,function(navSelf,navLink){

                //display the URL
                this.echo(navLink);

                //follow the app nav
                navSelf.thenOpen(baseUrl+navLink,function(a){

                    //find the first link within the report table
                    tableLinks = this.evaluate( getTableLinks );

                    //go through each table link
                    navSelf.each(tableLinks, function(reportSelf, reportLink){

                        //show what the url is
                        this.echo( reportLink );

                    })//table link loop

                })//open app nav

            })//app nav loop

        });//open item master

    });//item master loop

});

casper.run(function() {
    // echo results in some pretty fashion
    this.echo(links.length + ' links found:');
    this.echo(' - ' + links.join('\n - '));
    //this.echo(navLinks.length + ' subnav links found:');
    //this.echo(' - ' + navLinks.join('\n - ') );
    this.echo(allNavLinks.length + ' subnav links found:');
    this.echo(' - ' + allNavLinks.join('\n - ') );
    this.exit();
});


//TODO
//go through subnav for each promo
//check subnav for submit claim action
//follow submit claim action if it's found
//submit a claim
//cancel it
//report all that back