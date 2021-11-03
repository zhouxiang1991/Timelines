import fs from 'fs'
import puppeteer from 'puppeteer'

/**
 * @description 创建文件路劲
 * @param {string} filename 文件名
 * @returns {string}
 */
function createPath (filename) {
  return new URL(filename, import.meta.url)
}

const longTimeAgoGames = fs.readFileSync(createPath('longTimeAgoGames.md'), { encoding: 'utf-8' })

let gamesMD = ''
const startYear = 1975
const stopYear = 2021

async function start (year) {
  const browser = await puppeteer.launch()
  const page = await browser.newPage()
  await page.goto('https://en.wikipedia.org/wiki/Category:' + year + '_video_games')
  await page.waitForSelector('.mw-category')
  const aList = await page.$$eval('.mw-category a', els => {
    const list = []
    for (let i = 0; i < els.length; i++) {
      const el = els[i]
      list.push({
        name: el.title,
        url: el.href
      })
    }
    return list
  })

  gamesMD += '# ' + year + '年' + '\r\n'
  aList.forEach(({ name, url }) => {
    gamesMD += '- [' + name + '](' + url + ')\r\n'
  })

  await browser.close()
}

(async () => {
  for (let i = startYear; i <= stopYear; i++) {
    console.log(i)
    await start(i)
    gamesMD = longTimeAgoGames + '\r\n' + gamesMD
    fs.writeFileSync(createPath('games1.md'), gamesMD, { encoding: 'utf-8' })
  }
})()
