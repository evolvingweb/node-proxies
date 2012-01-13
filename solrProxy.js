// solrProxy.js
//
// Very simple reverse proxy to sit in front of solr and protect it from
// malicious queries. Originally intended for use with the AJAX-Solr library,
// but more generally applicable anyone wishing to expose Solr to the outside
// world.
//
// Created: 09/01/2012
// Last modified: 13/01/2012
//
// Author: Thomas Getgood <thomas@evolvingweb.ca>


// Filter applied by proxy:
//
// Very restrictive. Loosen with care.
//
// Only allow GETs
//
// Disable the 'qt' parameter
// Disable the 'commit' parameter
// only allow access to /solr/select
// 100 rows max per query


// TODO:
// * log IPs of offending queries.
// * log intialisation time so that we can see when it goes down.


var httpProxy = require('http-proxy'),
    url = require('url');

var querySafe = function (params) {
  var query = path.query;
  if (params.pathname === '/solr/select' &&
      query.qt === undefined &&
      query.commit === undefined &&
      (query.rows === undefined || query.rows <= 100)) {
    return true;
  }
  else {
    return false;
  }
}

httpProxy.createServer(function(req, res, proxy) {

  var params = (url.parse(req.url, true));

  if (res.method === 'GET' && querySafe(params)) {
    proxy.proxyRequest(req, res, {
      host: 'localhost',
      port: 8080,
    });
  }
  else {
    res.writeHead(403, {'Content-Type': 'text/plain'});
    res.write("Invalid query.\n");
    res.end();
    console.log("Request refused:\n" + req);
  }
}).listen(8008, function () {
         console.log("Proxy ready.")
        });

