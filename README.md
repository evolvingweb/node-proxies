l Evolving Web Node Proxies
// * Fix paths.

Various node proxies. Mostly toys with some purpose. See individual sections of source files for details (source file headers are more likely to be up to date).

## Setup

Install npm if you haven't already:

```
curl http://npmjs.org/install.sh | sh
```

Then use it to install the dependencies to this project:

```
npm install
```

## Contains

### solrProxy.js

Very simple reverse proxy to sit in front of solr and protect it from
malicious queries. Originally intended for use with the AJAX-Solr library,
but more generally applicable anyone wishing to expose Solr to the outside
world.

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
