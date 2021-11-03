import fs from 'fs'
import cheerio from 'cheerio'
import {
  deleteBlankButSpace,
  replaceHtmlTagToSpan,
  deleteBlank,
  deleteUselessHtmlTag
} from '../../util/helper.js'
import {
  makeMD
} from '../../util/make.js'
import html2md from 'html-to-md'
import { formatMD } from '../../util/format.js'

/**
 * @description 创建文件路劲
 * @param {string} filename 文件名
 * @returns {string}
 */
function createPath (filename) {
  return new URL(filename, import.meta.url)
}

/**
 * @description 格式化年
 * @param {string} year
 * @returns {string}
 */
export function formatYear (year, y) {
  year = deleteBlank(year)
  year = year.replace('十二月', '12月')
  year = year.replace('十一月', '11月')
  year = year.replace('十月', '10月')
  year = year.replace('九月', '9月')
  year = year.replace('八月', '8月')
  year = year.replace('七月', '7月')
  year = year.replace('六月', '6月')
  year = year.replace('五月', '5月')
  year = year.replace('四月', '4月')
  year = year.replace('三月', '3月')
  year = year.replace('二月', '2月')
  year = year.replace('一月', '1月')
  year = year.replace('行进', '3月')
  year = year.replace(/月\d{1,2}-/, (v) => {
    return v.replace('-', '日-')
  })
  if (!year.match(/^\d{4}/)) {
    year = `${y}年${year}`
  }
  // console.log(year)

  return year
}

/**
 * @description 格式化说明
 * @param {string} desc
 * @returns {string}
 */
export function formatDesc (desc) {
  desc = deleteBlankButSpace(desc)
  desc = html2md(desc)
  // console.log(desc)
  return desc
}

function firstTypeHandler ($, timelines) {
  $('.mw-parser-output > h2').each((index, node) => {
    const year = $(node).find('span.mw-headline').text().trim()
    $(node).nextUntil('h2').each((i, node) => {
      if (node.name === 'span') {
        // console.log($(node).text(), 222)
        // console.log($(node).nextUntil('span').html(), 33333)
        timelines.push({
          year: formatYear($(node).text(), year),
          desc: formatDesc($(node).nextUntil('span').html())
        })
      }
    })
  })
}

function secondTypeHandler ($, timelines, year = '') {
  $('.mw-parser-output > h2').each((index, node) => {
    const month = $(node).find('span.mw-headline').text()
    $(node).nextUntil('h2')
      .each((i, node) => {
        let desc = formatDesc($(node).html())
        let day = (desc.match(/^\d{1,2}-?\d{0,2}/g) || [])[0]
        if (day) {
          if (day.includes('-')) {
            day = day.split('-').map(v => (v += '日')).join('-')
          }
          let y = formatYear(`${year ? `${year}年` : ''}${month}${day}`)
          if (!y.endsWith('日')) {
            y += '日'
          }

          desc = desc.replace(/^\d{1,2}-?\d{0,2}日?：/, '')
          desc = desc.replace(/(：|:\s?)/, '')
          // console.log(y, 'year')
          // console.log(desc, 'desc')
          timelines.push({
            year: y,
            desc: desc
          })
        }
      })
  })
}

function thirdTypeHandler ($, timelines, year = '') {
  $('.mw-parser-output > h2').each((index, node) => {
    const month = $(node).find('span.mw-headline').text()
    $(node).nextUntil('h2')
      .each((i, node) => {
        function handler (node) {
          let desc = formatDesc($(node).html())
          let day = (desc.match(/^\d{1,2}-?\d{0,2}/g) || [])[0]
          if (day) {
            if (day.includes('-')) {
              day = day.split('-').map(v => (v += '日')).join('-')
            }
            let y = formatYear(`${year}年${month}${day}`)
            if (!y.endsWith('日')) {
              y += '日'
            }
            desc = desc.replace(/^\d{1,2}-?\d{0,2}日?：/, '')
            desc = desc.replace(/(：|:\s?)/g, '')
            // console.log(y, 'year')
            // console.log(desc, 'desc')
            timelines.push({
              year: y,
              desc: desc
            })
          }
        }
        if (node.name === 'ul') {
          $(node).find('li').each((i, n) => {
            handler(n)
          })
        } else {
          handler(node)
        }
      })
  })
}

const HTML_NAME = {
  BEFORE_1939: 'worldWar2_before_1939',
  YEAR_1939: 'worldWar2_1939',
  YEAR_1940: 'worldWar2_1940',
  YEAR_1941: 'worldWar2_1941',
  YEAR_1942: 'worldWar2_1942',
  YEAR_1943: 'worldWar2_1943',
  YEAR_1944: 'worldWar2_1944',
  AFTER_1954: 'worldWar2_after_1945'
}
const HTML_NAMES = [
  HTML_NAME.BEFORE_1939,
  HTML_NAME.YEAR_1939,
  HTML_NAME.YEAR_1940,
  HTML_NAME.YEAR_1941,
  HTML_NAME.YEAR_1942,
  HTML_NAME.YEAR_1943,
  HTML_NAME.YEAR_1944,
  HTML_NAME.AFTER_1954
]
const HTML_NAME_HANDLER = {
  [HTML_NAME.BEFORE_1939]: firstTypeHandler,
  [HTML_NAME.YEAR_1939]: secondTypeHandler,
  [HTML_NAME.YEAR_1940]: secondTypeHandler,
  [HTML_NAME.YEAR_1941]: thirdTypeHandler,
  [HTML_NAME.YEAR_1942]: secondTypeHandler,
  [HTML_NAME.YEAR_1943]: secondTypeHandler,
  [HTML_NAME.YEAR_1944]: secondTypeHandler,
  [HTML_NAME.AFTER_1954]: secondTypeHandler
}
const HTML_NAME_YEAR = {
  [HTML_NAME.BEFORE_1939]: '',
  [HTML_NAME.YEAR_1939]: 1939,
  [HTML_NAME.YEAR_1940]: 1940,
  [HTML_NAME.YEAR_1941]: 1941,
  [HTML_NAME.YEAR_1942]: 1942,
  [HTML_NAME.YEAR_1943]: 1943,
  [HTML_NAME.YEAR_1944]: 1944,
  [HTML_NAME.AFTER_1954]: ''
}

;(async () => {
  const timelines = []
  for (let i = 0; i < HTML_NAMES.length; i++) {
    const htmlName = HTML_NAMES[i]
    let html = fs.readFileSync(createPath(`${htmlName}.html`), { encoding: 'utf-8' })
    html = deleteBlankButSpace(html)
    const $ = cheerio.load(html)
    deleteUselessHtmlTag($)
    replaceHtmlTagToSpan($)
    HTML_NAME_HANDLER[htmlName]($, timelines, HTML_NAME_YEAR[htmlName])
  }
  // timelines.map(({ year }) => console.log(year))
  // console.log(timelines)
  let md = makeMD(timelines)
  md = formatMD(md)

  fs.writeFileSync(createPath('worldWar2.md'), md, { encoding: 'utf-8' })
})()
