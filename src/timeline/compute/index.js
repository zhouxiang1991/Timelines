import cheerio from 'cheerio'
import html2md from 'html-to-md'
import fs from 'fs'
import {
  formatMD
} from '../../util/format.js'
import {
  deleteBlank,
  deleteBlankButSpace,
  deleteUselessHtmlTag,
  replaceHtmlTagToSpan
} from '../../util/helper.js'
import {
  makeTimelinesFromList,
  makeTimelinesFromTable,
  makeMD
} from '../../util/make.js'

/**
 * @description 创建文件路劲
 * @param {string} filename 文件名
 * @returns {string}
 */
export function createPath (filename) {
  return new URL(filename, import.meta.url)
}

const timelines1 = [
  '1950_before.html',
  '1950_1979.html',
  '1980_1989.html',
  '1990_1999.html',
  '2000_2009.html'
].reduce((sum, htmlName) => {
  let html = fs.readFileSync(createPath(htmlName), { encoding: 'utf-8' })
  html = deleteBlankButSpace(html)
  const $ = cheerio.load(html)
  deleteUselessHtmlTag($)
  replaceHtmlTagToSpan($)
  const timelines = makeTimelinesFromTable($, {
    countryFormatter (c) {
      c = deleteBlank(c)
      c = c.replace(/\?/g, '')
      c = c
        .replace('我们', '美国')
        .replace('也不', '挪威')
        .replace('美国/中国', '美国/瑞士')
        .replace('荷兰日本', '荷兰/日本')
        .replace('英国（英国）', '英国')
        .replace('美国（美国）', '美国')
        .replace('英国美国', '英国/美国')
        .replace('美国欧洲', '美国/欧洲')
        .replace('美国EUR', '美国/欧洲')
      return c
    },
    descFormatter (d) {
      d = deleteBlankButSpace(d)
      d = html2md(d)
      return d
    },
    yearFormatter (y, year) {
      y = deleteBlank(y)
      y = y
        .replace(/^C。/g, '')
        .replace(/,/g, '')
        .replace(/公元$/g, '')
        .replace('加入日期：', '年')
        .replace('1Jun1979', '1979年6月1日')
        .replace('8Jun1978', '1978年6月8日')
        .replace('5Jun1977', '1977年6月5日')
        .replace('夏天', '')
        .replace('-1940', '')
        .replace('至十一月', '')
        .replace('至八月', '')
        .replace('十二月', '12月')
        .replace('十一月', '11月')
        .replace('十月', '10月')
        .replace('九月', '9月')
        .replace('八月', '8月')
        .replace('七月', '7月')
        .replace('六月', '6月')
        .replace('五月', '5月')
        .replace('四月', '4月')
        .replace('三月', '3月')
        .replace('二月', '2月')
        .replace('一月', '1月')
        .replace('行进', '3月')
        .replace('可能', '5月')
        .trim()

      if (year) {
        if (y === '结尾') {
          y = `${year}年12月`
        } else if (y === '?') {
          y = `${year}年`
        } else if (!y.startsWith('19')) {
          y = `${year}年${y}`
        }
      }

      if (y.match(/\d$/)) {
        y += '年'
      }

      return y
    }
  })
  sum.push(...timelines)
  return sum
}, [])

let html = fs.readFileSync(createPath('2010_2019.html'), { encoding: 'utf-8' })
html = deleteBlankButSpace(html)
const $ = cheerio.load(html)
deleteUselessHtmlTag($)
replaceHtmlTagToSpan($)
const timelines2 = makeTimelinesFromList($, {
  descFormatter (d) {
    return html2md(d)
  }
})
let md = makeMD([...timelines1, ...timelines2])
md = formatMD(md)
fs.writeFileSync(createPath('all.md'), md, { encoding: 'utf-8' })
