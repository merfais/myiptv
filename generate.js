const path =require('path')
const fs = require('fs')
const pinyin = require('pinyin')
const _ = require('lodash')

function read(path) {
  return new Promise((res, rej) => {
    fs.readFile(path, 'utf8', (err, data) => {
      if (err) {
        rej(err)
      } else {
        res(data)
      }
    })
  })
}
const cctvNameMap = {
  'CCTV-1综合': 'CCTV1',
  'CCTV-2财经': 'CCTV2',
  'CCTV-3综艺': 'CCTV3',
  'CCTV-4中文国际': 'CCTV4',
  'CCTV-5+体育赛事': 'CCTV5+',
  'CCTV-5体育': 'CCTV5',
  'CCTV-6电影': 'CCTV6',
  'CCTV-7国防军事': 'CCTV7',
  'CCTV-8电视剧': 'CCTV8',
  'CCTV-9纪录': 'CCTV9',
  'CCTV-10科教': 'CCTV10',
  'CCTV-11戏曲': 'CCTV11',
  'CCTV-12社会与法制': 'CCTV12',
  'CCTV-13新闻': 'CCTV13',
  'CCTV-17农业农村': 'CCTV17',
}

function getMap(data) {
  const list = data.split('\n')
  let i = 1
  const map = {}
  while (i < list.length) {
    const info = list[i]
    const url = list[i + 1]
    const infoArr = info.split(',')
    const [preInfo, name] = infoArr
    if (!name || /offline|\[not/i.test(name)) {
      i += 2
      continue
    }
    let [shortName] = name.split(' (')
    shortName = cctvNameMap[shortName] || shortName
    const shortInfo = [preInfo, shortName].join()
    map[name] = map[name] || []
    map[name].push({ url, info, shortName, shortInfo })
    i += 2
  }
  return map
}

function pickFirst(list, map) {
  return _.flatten(list).reduce((acc, key) => {
    const item = map[key][0]
    // console.log(key, item, '-----\n')
    acc.push(item.shortInfo, item.url)
    return acc
  }, []).join('\n')
}

function pickName(map) {
  const keys = Object.keys(map)
  const set = keys.reduce((acc, key) => {
    const [name] = key.split(/\(|（/)
    acc.add(name.trim())
    return acc
  }, new Set())
  return [...set].join('\n')
}

function sortByList(by, data) {
  return data.sort((a, b) => {
    return by.indexOf(a.key) - by.indexOf(b.key)
  }).map(i => i.name)
}

const weishiList = [
  '湖南卫视', '浙江卫视', '江苏卫视', '上海卫视', '东方卫视', '北京卫视',
  '天津卫视', '深圳卫视', '湖北卫视', '河北卫视',
  '河南卫视', '东南卫视', '江西卫视', '云南卫视', '辽宁卫视', '吉林卫视',
  '黑龙卫视', '黑龙江卫视', '四川卫视', '重庆卫视', '广东卫视', '广西卫视',
  '宁夏卫视', '安徽卫视', '山东卫视', '山西卫视', '西藏卫视', '贵州卫视',
  '陕西卫视', '南方卫视', '厦门卫视', '海南卫视', '甘肃卫视', '内蒙卫视',
  '内蒙古卫视', '兵团卫视', '新疆兵团卫视', '新疆卫视', '青海卫视', '青海安多卫视',
]
const cityList = [
  '北京','天津','上海', '河北', '河南', '江苏', '浙江','湖南','湖北','四川',
  '深圳', '山东', '山西', '重庆', '澳', '香', '辽宁', '吉林',
  '黑龙', '安徽', '福建', '江西', '广东', '海南', '贵州', '云南', '陕西',
  '甘肃', '青海', '台湾', '内蒙', '广西', '西藏', '宁夏', '新疆',
]

const enList = [
  'cctv', 'NewTV', 'SiTV'
]

const yingList = [
  '剧场', '电影', '影院', '影视', '游戏', '动画', '动漫', '卡通'
]

function pick(map) {
  const weishiReg = new RegExp(`${weishiList.join('|')}`)
  const cityReg = new RegExp(`${cityList.join('|')}`)
  const yingReg = new RegExp(`${yingList.join('|')}`)
  const enReg = new RegExp(`${enList.join('|')}`, 'i')

  const keys = Object.keys(map)
  const set = keys.reduce((acc, name) => {
    if (/cctv-/i.test(name)) {
      acc.cctv.push(name)
    } else if (weishiReg.test(name)) {
      const [key] = name.match(weishiReg)
      acc.weishi1.push({ name, key })
    } else if (yingReg.test(name)) {
      const [key] = name.match(yingReg)
      acc.ying1.push({ name, key })
    } else if (/影|剧/.test(name)) {
      acc.ying2.push(name)
    } else if (cityReg.test(name)) {
      const [key] = name.match(cityReg)
      acc.city.push({ name, key })
    // } else if (/卫视/.test(name)) {
    //   acc.weishi2.push(name)
    // } else if (enReg.test(name)) {
    //   acc.en.push(name)
    } else {
      acc.other.push(name)
    }
    return acc
  }, {
    city: [],
    other: [],
    weishi1: [],
    // weishi2: [],
    cctv: [],
    ying1: [],
    ying2: [],
    // en: [],
  })
  const city = sortByList(cityList, set.city)
  const weishi = sortByList(weishiList, set.weishi1)
  const ying1 = sortByList(yingList, set.ying1)
  const other = set.other.sort(pinyin.compare)
  const ying2 = set.ying2.sort(pinyin.compare)
  return [
    set.cctv,
    weishi,
    ying1,
    ying2,
    // set.en,
    city,
    // set.weishi2,
    other,
  ]
}

function write(path, data) {
  // return
  return new Promise((res, rej) => {
    fs.writeFile(path, `\ufeff${data}`, (err) => {
      if (err) {
        rej(err)
      } else {
        res()
      }
    })
  })
}

function getDate() {
  const n = new Date()
  const toStr = num => num < 10 ? `0${num}` : num
  return toStr(n.getFullYear())
    + toStr((n.getMonth() + 1))
    + toStr(n.getDate())
    + '_'
    + toStr(n.getHours())
    + toStr(n.getMinutes())
    + toStr(n.getSeconds())
}

function mkdir(tmp) {
  const filePath = path.join(__dirname, tmp)
  return new Promise((res, rej) => {
    fs.mkdir(filePath, (err) => {
      if (err) {
        rej(err)
      } else {
        res(filePath)
      }
    })
  })
}

module.exports = async function main() {
  const sourceFile = path.join(__dirname, './iptv/countries/cn.m3u')
  const data = await read(sourceFile)
  const map = getMap(data)
  const date = getDate()
  const tmpPath = await mkdir(`tmp_${date}`)
  await write(path.join(tmpPath, 'all.json'), JSON.stringify(map, null, 2))
  const names = pickName(map)
  await write(path.join(tmpPath, './name.txt'), names)
  const list = pick(map)
  await write(path.join(tmpPath, './sorted.txt'), list.map(arr => [...arr, '-----------\n'].join('\n')))
  const str = pickFirst(list, map)
  // console.log(str)
  await write(path.join(tmpPath, `./out_${date}.m3u`), str)
}
