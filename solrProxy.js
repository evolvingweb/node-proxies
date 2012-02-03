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
// Available: https://github.com/evolvingweb/node-proxies.git
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
// The filter is defined by the proxyFilter object below. The intention is to
// move this to a module and allow it to be customised per use, The only
// requirement is that it have a function named "verify" which takes the
// request, query, and handler and returns true or false depending on whether
// the query should be proxied or rejected. 
//
// The filter currently implemented simply denies all calls to /update and all
// use of the 'qt' parameter. I am in no way certain that this is sufficient to
// protect the index. Testing is needed.
//
// One assumption being made below is that any data in the solr index is
// intended for public consumption. You can write a more restrictive request
// handler if you really want to keep some things in solr private (you're
// probably better off using separate cores and keeping one public and one
// entirely private though). 
//
// ============================================================================


// Note on solrURL vs. proxyURL
// ============================================================================
//
// I'm currently confused about the state of the proxyUrl argument to the
// jQuery Manager of AJAX-Solr. Until I get this sorted out, I'm going to
// disallow POST requests.


// TODO:
// * log IPs of offending queries (to an actual log file).
// * log intialisation time so that we can see when it goes down.
// * Refactor the filter object out into something extendable.

var httpProxy = require('http-proxy'),
    url = require('url'),
    qs = require('querystring');

/*
 * The verify method of this object defines the filter being applied.
 */
var proxyFilter = {

  filters: {
    qt: function() {return false;}
  },
  handlers: {
    '/solr/select': function(req, query) {
      for (var param in query) {
        if (!query.hasOwnProperty(param)) {
          continue;
        }

        var q = param.split('.');

        if (this.filters[q[0]] !== undefined && typeof(this.filters[q[0]]) === 'function') {
          if (!this.filters[q[0]](req, query[param], q.slice(1))) {
            return false;
          }
        }
      }
      return true;
    }
  },
  verify: function(req, query, handler) {
    if (this.handlers[handler] !== undefined && typeof(this.handlers[handler]) === 'function') {
      return this.handlers[handler](req, query);
    }
    else {
      return false;
    }
  }
};
    
/* 
 * Generic access denied.
 */
var serve403 = function(req, res, mesg) {
  res.writeHead(403, 'Illegal request');
  if (mesg === undefined) {
    mesg = 'Your request has been denied for secuity reasons. If you think it was a legitamate request, please contact the site administrator.';
  }
  res.write(mesg);
  console.log("Request refused from:\n" + req.headers.origin);
  res.end();
}

/* 
 * Check the query against the filter and either proxy the request, or return a
 * 403.
 */
var vetQuery = function (req, res, query, handler) {
  if (proxyFilter.verify(req, query, handler)) {
    httpProxy.createServer(function(req, res, proxy) {
      proxy.proxyRequest(req, res, {
        host: 'localhost',
        port: 8080,
      });
    });
  }
  else {
    serve403(req, res);
    }
}

httpProxy.createServer(function(req, res, proxy) {

  // Incoming request prameters.
  var query = {};
  var handler = '';
  var data = '';

  if (req.method === 'OPTIONS') {
    // FIXME: XSS anyone?
    res.writeHead(200, {
      'Access-Control-Allow-Origin': req.headers.origin,
      'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
      'Access-Control-Max-Age': '1000',
      'Access-Control-Allow-Headers': '*,x-requested-with'
    });
    res.end();
  }
  else if (req.method === 'POST') {
    // TODO: forbid if req.headers['content-length'] is too big;
    // What's too big?
    req.on('data', function(chunk) {
      data += chunk;
    });
    req.on('end', function() {
      var args = url.parse('?' + data, true).query;
      query = url.parse('?' + args.query, true).query;

      // TODO: Once we get the handler business figured out, fix this.
      vetQuery(req, res, query, undefined);
    });
  }
  else if (req.method === 'GET') {
    data = url.parse(req.url, true);
    query = data.query; 
    handler = data.pathname;
    vetQuery(req, res, query, handler);
  }
  else {
    serve403(req, res);
  }
}).listen(8008, function () {
         console.log("Proxy ready.")
        });

