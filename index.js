const download = require('./download')
const generate = require('./generate')

async function main() {
  const filePath = 'origin_cn.m3u'
  await download(filePath)
  await generate(filePath)
  console.log('done')
}

main()
