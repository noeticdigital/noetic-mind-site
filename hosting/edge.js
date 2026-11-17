// www.noeticdigital.info -> noeticdigital.info, and folder paths -> index.html
function handler(event) {
  var r = event.request, host = r.headers.host && r.headers.host.value;
  if (host && host.indexOf('www.') === 0) {
    var qs = Object.keys(r.querystring).map(function (k) { return k + '=' + r.querystring[k].value; }).join('&');
    return { statusCode: 301, statusDescription: 'Moved Permanently',
      headers: { location: { value: 'https://' + host.slice(4) + r.uri + (qs ? '?' + qs : '') } } };
  }
  if (r.uri.endsWith('/')) r.uri += 'index.html';
  else if (r.uri.lastIndexOf('.') < r.uri.lastIndexOf('/')) r.uri += '/index.html';
  return r;
}
