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

function getMap(data) {
  const list = data.split('\n')
  let i = 1
  const map = {}
  while (i < list.length) {
    const info = list[i]
    const url = list[i + 1]
    const [, name] = info.split(',')
    if (!name || /offline/i.test(name)) {
      i += 2
      continue
    }
    map[name] = map[name] || []
    map[name].push({ url, info })
    i += 2
  }
  return map
}

function pickFirst(list, map) {
  return _.flatten(list).reduce((acc, key) => {
    console.log(key, map[key])
    const item = map[key][0]
    acc.push(item.info, item.url)
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

function pickWeishi(map) {
  const keys = Object.keys(map)
  const set = keys.reduce((acc, key) => {
    const [name] = key.split(/ *[(（] */)
    if (/卫视/.test(name)) {
      acc.add(name)
    }
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
  '北京卫视 [Not 24/7]', '天津卫视', '深圳卫视', '凤凰', 'TVB', '湖北卫视', '河北卫视',
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
    } else if (/卫视/.test(name)) {
      acc.weishi2.push(name)
    } else if (enReg.test(name)) {
      acc.en.push(name)
    } else {
      acc.other.push(name)
    }
    return acc
  }, {
    city: [],
    other: [],
    weishi1: [],
    weishi2: [],
    cctv: [],
    ying1: [],
    ying2: [],
    en: [],
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
    set.en,
    city,
    set.weishi2,
    other,
  ]
}

function write(path, data) {
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


async function main() {
  const data = await read('./cn.m3u')
  const map = getMap(data)
  const names = pickName(map)
  await write('./name.txt', names)
  const weishi = pickWeishi(map)
  await write('./weishi.csv', weishi)
  const list = pick(map)
  await write('./city.txt', list.map(arr => [...arr, '-----------'].join('\n')))
  const str = pickFirst(list, map)
  await write('./keyong.m3u', str)
  console.log('done')
}

main()
