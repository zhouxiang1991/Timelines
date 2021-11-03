import fs from 'fs'
import cheerio from 'cheerio'
import {
  deleteBlankButSpace,
  replaceHtmlTagToSpan,
  deleteBlank,
  deleteUselessHtmlTag
} from '../../util/helper.js'
import {
  formatMD
} from '../../util/format.js'
import {
  makeMD,
  makeTimelinesFromTable
} from '../../util/make.js'
import html2md from 'html-to-md'

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
  year = year.replace('六月至九月', '6月-9月')
  year = year.replace('十月至十一月', '10月-11月')
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
  year = year.replace('至', '-')
  year = year.replace(/\d-/, (v) => {
    return v.replace('-', '日-')
  })
  y = y.replace('年后', '')
  if (!year.match(/^\d{4}/)) {
    year = `${y}年${year}`
  }

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
  return desc
}

(async () => {
  let html = fs.readFileSync(createPath('worldWar1.html'), { encoding: 'utf-8' })
  html = deleteBlankButSpace(html)
  const $ = cheerio.load(html)
  deleteUselessHtmlTag($)
  replaceHtmlTagToSpan($)
  $('tr:nth-child(1)').remove()
  $('.wikitable tr td:nth-child(4)').remove()
  $('.wikitable tr').each((i, tr) => {
    const tds = $(tr).find('td')
    if (tds.length === 2) {
      let node = $(tr).prev('tr')
      while (true) {
        const count = $(node).find('td').length
        if (count) {
          if (count === 3) {
            $(tr).prepend(`<td>${$($(node).find('td')[0]).text()}</td>`)
            break
          } else {
            node = node.prev('tr')
          }
        } else {
          break
        }
      }
    }
  })
  $('td:nth-child(2)').remove()
  $('.wikitable tr').each((i, node) => {
    const tds = $(node).find('td')
    if (tds.length === 1) {
      $(node).append($(node).next().find('td')[1])
      $(node).next().remove()
    }
  })
  $('.wikitable tr th[colspan="3"]').each((i, n) => {
    let tr = $(n).parent().next()
    while (true) {
      // console.log(tr.children().length)
      if (tr.children().length === 2) {
        tr.children().prepend($(`<td>${$(n).text() + '年'}</td>`))
        // console.log(tr.text())
        tr = tr.next()
      } else {
        break
      }
    }
  })

  const timelines = makeTimelinesFromTable($, {
    yearFormatter: formatYear,
    descFormatter: formatDesc
  })
  // console.log(timelines)
  // console.log(timelines.map(({ year }) => year))
  let md = makeMD(timelines)
  md = formatMD(md)
  fs.writeFileSync(createPath('worldWar1.md'), md, { encoding: 'utf-8' })
})()
