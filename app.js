
var httpProxy = require('http-proxy');
var url = require('url');

httpProxy.createServer(function(req, res, proxy) {

  var isHtml = false,
      write = res.write,
      writeHead = res.writeHead,
      params = url.parse(req.url, true).query;

  delete req.headers['accept-encoding'];

  res.writeHead = function(code, headers) {
    isHtml = (headers['content-type'] == 'text/html');
    writeHead.apply(this, arguments);
  }

  res.write = function(data, encoding) {
    if (isHtml) {
      var str = data.toString();
      var i = 0;
      str = str.replace(/<(h[0-9][^>]*)>/g, function(str, match) {
        if (i == params.header) {
          str = '<' + match + ' id="header-jump">';
        }
        i += 1;
        return str;
      });
      data = new Buffer(str);
    }

    write.call(this, data, encoding);
  };

  proxy.proxyRequest(req, res, {
    host: 'localhost',
    port: 80,
  });
}).listen(9000);
