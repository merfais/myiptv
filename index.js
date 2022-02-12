const fs = require('fs')
const path = require('path')
const download = require('./download')
const generate = require('./generate')

async function main() {
  // const n = new Date()
  // const tmp = 'p'
  //   + n.getFullYear()
  //   + (n.getMonth() + 1)
  //   + n.getDate()
  //   + '-'
  //   + n.getHours()
  //   + n.getMinutes()
  //   + n.getSeconds()
  // const filePath = path.join(__dirname, tmp)
  // fs.mkdir(filePath, async (err) => {
  //   if (err) {
  //     console.error(err)
  //     return
  //   }
  //   const fileName = 'origin_cn.m3u'
  //   await download(filePath, fileName)
  // })
  await generate()
  console.log('done')
}

main()
