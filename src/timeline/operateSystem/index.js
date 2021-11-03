import cheerio from 'cheerio'
import html2md from 'html-to-md'
import fs from 'fs'
import {
  deleteBlank,
  deleteBlankButSpace,
  deleteUselessHtmlTag,
  replaceHtmlTagToSpan
} from '../../util/helper.js'
import {
  makeTimelinesFromList,
  makeMD
} from '../../util/make.js'
import { formatMD } from '../../util/format.js'

/**
 * @description 创建文件路劲
 * @param {string} filename 文件名
 * @returns {string}
 */
export function createPath (filename) {
  return new URL(filename, import.meta.url)
}

let html = fs.readFileSync(createPath('1950_1999.html'), { encoding: 'utf-8' })
html = deleteBlankButSpace(html)
const $ = cheerio.load(html)
deleteUselessHtmlTag($)
replaceHtmlTagToSpan($)
const timelines1 = makeTimelinesFromList($, {
  descFormatter (d) {
    return html2md(d)
  },
  yearFormatter (y) {
    return `${y}年`
  }
})
const timelines2 = []
$('h2 > span.mw-headline')
  .filter((i, node) => {
    const hasTable = !!$(node.parent).next('table').get(0)
    return hasTable
  }).each((index, node) => {
    const ths = $(node.parent)
      .next('table')
      .find('thead > tr > th')
      .map((i, node) => $(node).text())
      .get()
    ths.shift()

    $(node.parent)
      .next('table')
      .find('tbody > tr')
      .each((i, trNode) => {
        const tds = $(trNode).find('td')

        const hasOne = tds.filter((i, node) => $(node).text()).length > 0
        if (hasOne) {
          const year = deleteBlank($(tds.get(0)).text()).replace(/[–-]/g, '年') + '月'
          new Array(tds.length - 1)
            .fill(1)
            .forEach((o, i) => {
              if ($(tds.get(i + 1)).text()) {
                timelines2.push({
                  year,
                  desc: html2md($(tds.get(i + 1)).html())
                })
              }
            })
        }
      })
  })
const timelines = [...timelines1, ...timelines2]
// console.log(timelines2)
let md = makeMD(timelines)
md = formatMD(md)
fs.writeFileSync(createPath('operateSystem.md'), md, { encoding: 'utf-8' })
