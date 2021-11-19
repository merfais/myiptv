const https = require('https'); // or 'https' for https:// URLs
const fs = require('fs');

const url = 'https://raw.githubusercontent.com/iptv-org/iptv/gh-pages/countries/cn.m3u'
const murl = 'https://raw.githubusercontent.com/iptv-org/iptv/master/channels/cn.m3u'

module.exports = function download(filePath) {
  const stream = fs.createWriteStream(filePath);
  https.get(murl, response => {
    response.pipe(stream);
  });
  return new Promise((res, rej) => {
    stream.on('finish', res)
    stream.on('error', rej)
  })
}
