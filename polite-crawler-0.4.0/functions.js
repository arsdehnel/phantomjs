function getUrlStatus( json, url ){

	var retVal = false;

	var protocol = getProtocol( url );
	var domain = getDomain( url );
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
		return protocolStatus;
	}

	//then look for the domain
	var domainStatus = arrSearch( json.domains, domain, "domain" );

	casper.log( "domainStatus: "+domainStatus, 'debug' );

	if( domainStatus !== false ){
		return domainStatus;
	}

	// then look for URL status
	var urlStatus = arrSearch( json.urls, relUrl, "url" );

	casper.log( "urlStatus: "+urlStatus, 'debug' );

	if( urlStatus !== false ){
		return urlStatus;
	}

	//now look for a matching filename
	filenameStatus = arrSearch( json.filenames, filename, "filename" );

	casper.log( "filenameStatus: "+filenameStatus, 'debug' );

	if( filenameStatus ){
		return filenameStatus;
	}

	// finally check to see if the extension has a special status
	extStatus = arrSearch( json.extensions, extension, "extension" );

	casper.log( "extStatus: "+extStatus, 'debug' );

	if( extStatus ){
		return extStatus;
	}

	return false;

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


var getDomain = function( url ){
	var matches = url.match(/^https?\:\/\/([^\/?#]+)(?:[\/?#]|$)/i);
	return matches && matches[1];  // domain will be null if no match is found
}

var getProtocol = function( url ){
	return url.substring(0,url.indexOf(':'))
}

exports.indexOf = indexOf;
exports.getDomain = getDomain;
exports.getProtocol = getProtocol;
exports.arrSearch = arrSearch;
exports.getUrlStatus = getUrlStatus;
