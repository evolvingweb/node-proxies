// solrQueryFilter.js
//
// Example proxy filter that allows all selects on Solr and tries to deny
// anything else. Not guaranteed to be secure, but far better than nothing.
//
// Info:
// ============================================================================
// Created: 09/01/2012
// Last modified: 19/01/2012
// Version: 0.0.?
// Author: Thomas Getgood <thomas@evolvingweb.ca>
// Available: https://github.com/evolvingweb/node-proxies.git
//
//
// Filter applied by proxy:
// ============================================================================
//
// The filter used by this proxy is defined by a function called verify which
// takes three arguments:
//
// * The request object.
// * A object which contains the key value pairs of the query.
// * The handler (path) to which the query was sent.
//
// This funtion must return true or false if the query is to be proxied or
// rejected respctively.
//
// The filter below is an example which simply denies all calls to any handler
// aside from /solr/select and all use of the 'qt' parameter. I am in no way
// certain that this is sufficient to protect the index. Testing is needed.
//
// One assumption being made below is that any data in the solr index is
// intended for public consumption. You can write a more restrictive request
// handler if you really want to keep some things in solr private (you're
// probably better off using separate cores and keeping one public and one
// entirely private though). 
//
// 
// Note on solrURL vs. proxyURL
// ============================================================================
//
// This filter requires a handler to be explicitely defined and at present, if
// ajax-solr is configured with the proxyUrl option, then no handler
// information is passed. Thus this filter will deny all requests. You could
// assume '/solr/select' if you so desire in your own filter to bypass this
// problem.

var self = {
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

        if (self.filters[q[0]] !== undefined && typeof(self.filters[q[0]]) === 'function') {
          if (!self.filters[q[0]](req, query[param], q.slice(1))) {
            return false;
          }
        }
      }
      return true;
    }
  },
  verify: function(req, query, handler) {
    if (self.handlers[handler] !== undefined && typeof(self.handlers[handler]) === 'function') {
      return self.handlers[handler](req, query);
    }
    else {
      return false;
    }
  }
};

exports.verify = self.verify;
