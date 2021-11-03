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
import puppeteer from 'puppeteer'
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
export function formatYear (year) {
  year = deleteBlank(year)
  year = year.replace(/\?$/g, '')
  year = year.replace(/\d[–-]\d{2}/, (v) => {
    return v.replace(/[-–]/g, `年-${year.slice(0, 2)}`)
  })
  year = year.replace(/\d[–-]/, (v) => {
    return v.replace(/[-–]/g, '年-')
  })
  year = `${year}年`
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
  return desc
}

(async () => {
  const browser = await puppeteer.launch()
  const page = await browser.newPage()
  await page.goto('https://en.wikipedia.org/wiki/Timeline_of_programming_languages')
  await page.waitForSelector('.mw-parser-output')
  let html = await page.$eval('.mw-parser-output', el => el.outerHTML)
  await browser.close()
  html = deleteBlankButSpace(html)
  const $ = cheerio.load(html)
  deleteUselessHtmlTag($)
  replaceHtmlTagToSpan($)
  const timelines = []
  $('h2 > span.mw-headline')
    .filter((i, node) => {
      const hasTable = $(node.parent).next('table').get(0)
      return hasTable
    }).each((index, node) => {
      $(node.parent)
        .next('table')
        .find('tbody > tr')
        .each((i, trNode) => {
          let [year, desc] = $(trNode)
            .find('td')
            .slice(0, 3)
          year = $(year).text()
          year = formatYear(year)
          desc = html2md($(desc).html())
          desc = formatDesc(desc)
          timelines.push({
            year,
            desc
          })
        })
    })
  // console.log(timelines)
  let md = makeMD(timelines)
  md = formatMD(md)
  fs.writeFileSync(createPath('programmingLanguages.md'), md, { encoding: 'utf-8' })
})()
