# Evolving Web Node Proxies

Various node proxies. Currently of interest are 

 * solrProxy.js
 * scriptInjector.js

## Setup

Install npm if you haven't already:

```
curl http://npmjs.org/install.sh | sh
```

Then use it to install the dependencies to this project:

```
npm install
```

## solrProxy.js

A node module for building reverse proxies to protect a solr instance exposed
to the internet.

You need to define your own query filter function and use it to create a proxy.
See solrQueryFilter.js for an example query filter and solrProxyExample.js for
a working proxy.

### Setting up a proxy server

``` js
var solrProxy = require('PATH/solrProxy');

solrProxy.createProxy(proxyPort, proxyOptions, queryFilter);
```

proxyOptions is an object which defines how the proxy behaves --- including
where it proxies to. Nearly always you will want something like the following:

``` js
var proxyOptions = {
  host: 'example.com',
  port: 1234
}
```

See solrProxyExample.js for a working example.

### Writing your own query filter

A query filter is a function that returns true or false depending on whether
the given query should be proxied to Solr or rejected outright. 

As arguments the function takes an httpRequest object, an object which contains
just the parsed query, and the handler to which the query was sent.

See solrQueryFilter.js for a more complete example.

### scriptInjector.js

A proxy that allows you to inject arbitrary javascript into a webpage by
passing it through a proxy. Most useful when combined with the following
bookmarklet (or some alteration thereof):

```
javascript: document.location = "http://localhost:9000?dest=" + document.location
```

In its simpliest form (that above), the proxy injects jQuery and nothing
else. To inject other scripts, add to the GET arguments:

```
&script=example.com/script.js,mysite.localhost/scripts/stuff.js,...
```

Currently jQuery is injected always, without regard to whether or not the
site has it to begin with. 
