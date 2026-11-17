// noeticdigital.uk and www.noeticdigital.uk -> https://noeticdigital.info (same path)
function handler(event) {
  var r = event.request;
  var qs = Object.keys(r.querystring).map(function (k) { return k + '=' + r.querystring[k].value; }).join('&');
  return { statusCode: 301, statusDescription: 'Moved Permanently',
    headers: { location: { value: 'https://noeticdigital.info' + r.uri + (qs ? '?' + qs : '') } } };
}
