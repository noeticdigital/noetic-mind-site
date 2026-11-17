#!/bin/sh
# Publish the /explanation page to https://noeticdigital.info (S3 + CloudFront).
# Usage, from the site folder:  sh hosting/publish.sh
set -e
cd "$(dirname "$0")/.."
B=noetic-site-noeticdigital-info; CF=E38XVDYUIFRSWJ
rm -rf hosting/dist && mkdir -p hosting/dist
cp explanation/index.html explanation/world.js noetic-logo.svg hosting/dist/
python3 - <<'PY'
p='hosting/dist/index.html'; h=open(p).read()
h=h.replace('<meta name="robots" content="noindex" />\n','').replace('../noetic-logo.svg','/noetic-logo.svg')
if 'rel="canonical"' not in h:
    d=h.split('<meta name="description" content="',1)[1].split('"',1)[0]; t=h.split('<title>',1)[1].split('</title>',1)[0]
    h=h.replace('<link rel="icon"',f'<link rel="canonical" href="https://noeticdigital.info/" />\n<meta property="og:type" content="website" />\n<meta property="og:url" content="https://noeticdigital.info/" />\n<meta property="og:title" content="{t}" />\n<meta property="og:description" content="{d}" />\n<meta name="twitter:card" content="summary" />\n<link rel="icon"',1)
open(p,'w').write(h)
PY
aws s3 cp hosting/dist/index.html s3://$B/index.html --content-type "text/html; charset=utf-8" --cache-control "no-cache" --only-show-errors
aws s3 cp hosting/dist/world.js s3://$B/world.js --content-type "text/javascript; charset=utf-8" --cache-control "public, max-age=300" --only-show-errors
aws s3 cp hosting/dist/noetic-logo.svg s3://$B/noetic-logo.svg --content-type "image/svg+xml" --cache-control "public, max-age=86400" --only-show-errors
aws cloudfront create-invalidation --distribution-id $CF --paths "/*" --query Invalidation.Id --output text >/dev/null
echo "Published to https://noeticdigital.info (live within a minute or two)"
