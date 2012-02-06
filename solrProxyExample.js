// solrProxyExample.js
// 
// Example implementation of a solr proxy using the example filter function
// distributed herein.
//
// Proxies Solr running on port 8080 (default Tomcat port) through port 8008 on
// the same host.

var solrProxy = require('./solrProxy.js');
var qf = require('./solrQueryFilter.js');

// These specify where the proxy routes to.
var proxyOptions = {
  host: 'localhost',
  port: 8080
};

solrProxy.createProxy(8008, proxyOptions, qf.verify);

