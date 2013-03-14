// scriptInjectorProxy.js
//
// A proxy that allows you to inject arbitrary javascript into a webpage by
// passing it through a proxy. Most useful when combined with the following
// bookmarklet (or some alteration thereof):
//
// javascript: document.location = "http://localhost:9000?dest=" + document.location
//
// In its simpliest form (that above), the proxy injects jQuery and nothing
// else. To inject other scripts, add to the GET arguments:
//
// &script=example.com/script.js,mysite.localhost/scripts/stuff.js,...
//
// Currently jQuery is injected always, without regard to whether or not the
// site has it to begin with. 
//
// Created: 06/01/2012
// Last updated: 13/01/2012
//
// Author: Thomas Getgood <thomas@evolvingweb.ca>
// Available: http://github.com/evolvingweb/node-proxies.git


// TODO:
// * get 'script=' GET argument working.
// * Catch 302s and reproxy to the redirected url.
// * Try to deal with https (it feels like this should be hard, but maybe not).


var httpProxy = require('http-proxy');
var url = require('url');

httpProxy.createServer(function(req, res, proxy) {

  var isHtml = false,
      write = res.write,
      writeHead = res.writeHead,
      params = url.parse(req.url, true).query,
      dest = params.dest || 'localhost',
      destination;

  dest = dest.match(/^http/) ? dest : 'http://' + dest;
  destination = url.parse(dest, true);

  req.headers['host'] = destination.host;
  req.url = destination.path;
//  req.headers['url'] = destination.href;

  // console.log(dest);
  // console.log("-------------------------------------------");
  // console.log(destination);

  // console.log(req.headers);

  // We don't want to deal with gzip...
  delete req.headers['accept-encoding'];

  res.writeHead = function(code, headers) {
    isHtml = headers['content-type'] && headers['content-type'].match('text/html');
    writeHead.apply(this, arguments);
  }

  res.write = function(data, encoding) {
    if (isHtml && params.dest) {
      var str = data.toString();
      var scriptTag = '<script type="text/javascript" src="http://code.jquery.com/jquery-1.7.min.js"></script>';
      var baseTag = '<base href="' + (dest.replace(/\/$/, '') || '') + '"/>';
      // console.log(str);
      // console.log("\n----------------------------------------------------------\n");

      str = str.replace(/(<head[^>]*>)/, "$1" + "\n" + scriptTag + "\n" + baseTag);

      data = new Buffer(str);
    }

    write.call(this, data, encoding);
  };

  proxy.proxyRequest(req, res, {
    host: destination.host,
    port: 80,
  });
}).listen(9000, function () {
  console.log("Waiting for requests...");
});
