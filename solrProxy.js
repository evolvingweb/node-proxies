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
// Last modified: 07/02/2012
// Version: 0.0.2
// Author: Thomas Getgood <thomas@evolvingweb.ca>
// Available: https://github.com/evolvingweb/node-proxies.git
//
// 
// N.B. If you are already using a Solr instance which takes requests
// optimistically from the internet, you need to reconfigure it to only accept
// requests from the server the proxy is running on. The proxy won't help you
// if someone can bypass it.
//
// For instance, if you're running Solr on Tomcat with the proxy on the same
// machine, then add the line: 
//
// <Valve className="org.apache.catalina.valves.RemoteAddrValve" allow="127\.0\.0\.1"/>
//
// to /etc/solr/solr-tomcat.xml. 


// TODO:
// * log IPs of offending queries (to an actual log file).
// * log intialisation time so that we can see when it goes down.


var httpProxy = require('http-proxy'),
    url = require('url'),
    qs = require('querystring');

exports.createProxy = function(proxyOptions, verifyCallback) {

  return httpProxy.createServer(function(req, res, proxy) {

    /* 
     * Generic access denied.
     */
    var forbid = function(mesg) {
      res.writeHead(403, 'Illegal request');
      if (mesg === undefined) {
        mesg = 'Your request has been denied for secuity reasons. If you think it was a legitamate request, please contact the site administrator.\n';
      }
      res.write(mesg);
      console.log("Request refused from: " + req.headers.origin);
      res.end();
    }

    /* 
     * Check the query against the filter and either proxy the request, or return a
     * 403.
     */
    var vetQuery = function (query, handler) {
      if (verifyCallback(req, query, handler)) {
        proxy.proxyRequest(req, res, proxyOptions);
      }
      else {
        forbid();
        }
    }

    // Incoming request prameters.
    var query = {};
    var handler = '';
    var data = '';

    // Server logic
    // The POST handling is a bit of a mess and not really necessary. It may be
    // removed in the future.
    // ==========================================================================

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
      req.setEncoding('utf8');
      req.on('data', function(chunk) {
        data += chunk;
      });
      req.on('end', function() {
        // N.B. This will need to be changed depending on how data is going to
        // be formatted in POST requests. As it is, it assumes a URL encoding.
        // JSON would be more sensible. 
        
        //TODO: Why does queryString.parse fail to parse this?
        var args = url.parse('?' + data, true).query;
        query = url.parse('?' + args.query, true).query;
        console.log(query);
        handler = args.handler;
        vetQuery(query, handler);
      });
    }
    else if (req.method === 'GET') {
      data = url.parse(req.url, true);
      query = data.query; 
      handler = data.pathname;
      vetQuery(query, handler);
    }
    // HEAD requests are missing, TODO: check that Solr handles them as it should.
    else {
      forbid();
    }
  });
};
