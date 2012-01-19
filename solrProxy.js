// solrProxy.js
//
// Very simple reverse proxy to sit in front of solr and protect it from
// malicious queries. Originally intended for use with the AJAX-Solr library,
// but more generally applicable anyone wishing to expose Solr to the outside
// world.
//
// Info:
// ============================================================================
// Created: 09/01/2012
// Last modified: 19/01/2012
// Version: 0.0.?
// Author: Thomas Getgood <thomas@evolvingweb.ca>
//
// Usage:
// ============================================================================
//
// Say this proxy is running a machine whose IP is a.b.c.d: configure Solr to
// accept requests on port 8080 from a.b.c.d and nowhere else, then redirect
// all web traffic through a.b.c.d:8008. 
// 
// N.B. If you are already using a Solr instance which takes requests
// optimistically from the internet, you need to reconfigure it to only accept
// requests from the server this proxy is running on. The proxy won't help you
// if someone can bypass it.
//
// For instance, if you're running Solr on Tomcat, with this proxy on the same
// machine, then add the line: 
//
// <Valve className="org.apache.catalina.valves.RemoteAddrValve" allow="127\.0\.0\.1"/>
//
// to /etc/solr/solr-tomcat.xml. 


// Filter applied by proxy:
// ============================================================================
//
// Very restrictive. Loosen with care.
//
// Only allow GETs
//
// Disable the 'qt' parameter
// Disable the 'commit' parameter
// only allow access to /solr/select
// 100 rows max per query
// ============================================================================


// TODO:
// * log IPs of offending queries (to an actual log file).
// * log intialisation time so that we can see when it goes down.
// * Make sure document access permissions can be enforced.
// * What to do if we need to allow custom handlers?
// * Allow solr path --- i.e. xxx in /xxx/select --- to be configured.


var httpProxy = require('http-proxy'),
    url = require('url');

/* 
 * Filter function. Returns true if the query object fulfils the
 * requirements set out above, false otherwise. Could be a bit clearer...
 */
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

