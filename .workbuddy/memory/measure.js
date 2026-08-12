var nav = performance.getEntriesByType('navigation')[0];
var res = performance.getEntriesByType('resource');
var firstPaint = (performance.getEntriesByType('paint').find(function(p){return p.name==='first-paint'}) || {}).startTime;
var firstContent = (performance.getEntriesByType('paint').find(function(p){return p.name==='first-contentful-paint'}) || {}).startTime;
var total = res.reduce(function(s, r){ return s + (r.encodedBodySize || 0) }, 0);
var wallpaper = res.filter(function(r){ return /wallpaper/.test(r.name) }).map(function(r){ return r.name.split('/').pop() + ' ' + r.encodedBodySize + 'B ' + Math.round(r.duration) + 'ms' });
var scripts = res.filter(function(r){ return /\.js$/.test(r.name) }).map(function(r){ return r.name.split('/').pop() + ' ' + r.encodedBodySize + 'B ' + Math.round(r.duration) + 'ms' });
JSON.stringify({loadMs: Math.round(nav.loadEventEnd - nav.startTime), totalB: total, paintFP: firstPaint, paintFCP: firstContent, wallpaper: wallpaper, scripts: scripts})