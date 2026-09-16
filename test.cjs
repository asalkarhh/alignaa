const fs = require('fs');
const current = fs.readFileSync('src/pages.json', 'utf8');
const prev = fs.readFileSync('temp.json', 'utf8');

const pos = 130028;
console.log('Current context:');
console.log(current.substring(pos - 100, pos + 100));

const indexInPrev = prev.indexOf('mobile":{"tag"');
console.log('\nPrev context around mobile:');
console.log(prev.substring(indexInPrev - 100, indexInPrev + 100));
