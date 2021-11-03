import dayjs from 'dayjs'

/**
 * @description 创建md内容
 * @param {object[]} timelines=[] 内容列表, [{year,desc,country}] year = '1999年' | '1999年3月' | '199年3月4日'，desc = md
 * @returns {string}
 */
export function makeMD (timelines = []) {
  let md = ''
  const data = {}
  const years = new Set()
  timelines = timelines
    .filter(({ desc }) => desc)
    .forEach((listItem) => {
      const { year } = listItem
      years.add(year)

      if (!data[year]) {
        data[year] = []
      }

      data[year].push(listItem)
    })

  const obj = Array
    .from(years)
    .reduce((sum, year) => {
      let y = ''
      let m = ''
      let d = ''
      const res = year.split(/[年月日]/).filter(Boolean)
      if (year.match(/-/)) {
        y = res[0] + '年'
        switch (res.length) {
          case 2: {
            y = res[0] + '年' + res[1] + '年'
            break
          }
          case 3: {
            m = res[1] + '月' + res[2] + '月'
            break
          }
          case 4: {
            if (res[3].startsWith('-')) {
              m = res[1] + '月'
              d = res[2] + '日' + res[3] + '日'
            } else {
              m = res[1] + '月' + res[2] + '月' + res[3] + '日'
            }
            break
          }
          case 5: {
            if (res[1] === res[3]) {
              m = res[1] + '月'
              d = res[2] + '日' + '-' + res[4] + '日'
            } else {
              m = res[1] + '月' + res[2] + '日' + res[3] + '月' + res[4] + '日'
            }
            break
          }

          default: {
            if (m) {
              m += '月'
            }
            if (d) {
              d += '日'
            }
            break
          }
        }
      } else {
        y = res[0] + '年'
        if (res[1]) {
          m = res[1] + '月'
        }
        if (res[2]) {
          d = res[2] + '日'
        }
      }

      if (!sum[y]) {
        sum[y] = {
          timelines: data[y] || []
        }
      }
      if (m) {
        if (!sum[y][m]) {
          sum[y][m] = {
            timelines: data[`${y}${m}`] || []
          }
        }
      }
      if (d) {
        if (!sum[y][m][d]) {
          sum[y][m][d] = {
            timelines: data[`${y}${m}${d}`] || []
          }
        }
      }
      // console.log(year, y, m, d)

      return sum
    }, {})
  // console.log(obj)

  function handle (timelines = [], indent = '') {
    timelines.forEach(({ desc, country }) => {
      if (!desc.endsWith('。')) {
        desc += '。'
      }
      md += `${indent}- ${country ? `在${country}，` : ''}${desc}\r\n`
    })
  }

  function toDayjs (date) {
    // console.log(date)
    const res = date.match(/(\d+年|\d+月|\d+日)/g)
    let y = 2000
    let m = 1
    let d = 1
    res.forEach(r => {
      if (r.endsWith('年')) {
        y = r.match(/\d+/g)[0]
      }
      if (r.endsWith('月')) {
        m = r.match(/\d+/g)[0]
      }
      if (r.endsWith('日')) {
        d = r.match(/\d+/g)[0]
      }
    })

    // console.log(date, y, m, d)
    return dayjs(`${y}-${m}-${d}`, 'YYYY-MM-DD')
  }

  const sortHandle = (a, b) => {
    a = toDayjs(a.split('-')[0])
    b = toDayjs(b.split('-')[0])
    return a.isAfter(b) ? 1 : -1
  }
  // console.log(obj)

  Object.keys(obj).sort(sortHandle).forEach(y => {
    // console.log(y)
    md += '# ' + y + '\r\n'
    const { timelines, ...months } = obj[y]
    handle(timelines)

    Object.keys(months)
      .sort(sortHandle)
      .forEach(m => {
        md += '- ## ' + m + '\r\n'
        const { timelines, ...days } = months[m]
        handle(timelines, '\t')

        Object.keys(days)
          .sort(sortHandle)
          .forEach(d => {
            md += '\t- ### ' + d + '\r\n'
            const { timelines } = days[d]
            handle(timelines, '\t\t')
          })
      })
  })
  return md
}

/**
 * @description 从表格创建的timeline列表
 * @param {string} $ cheerio
 * @param {object[]} =[]
 */
export function makeTimelinesFromTable ($, {
  yearFormatter = (y) => y,
  descFormatter = (d) => d,
  countryFormatter = (c) => c
}) {
  const timelines = []

  $('h2 > span.mw-headline')
    .filter((i, node) => {
      const hasTable = $(node.parent).next('table').get(0)
      return hasTable
    }).each((index, node) => {
    // console.log('表格', index + 1)
      const year = node.attribs.id.match(/\d{4}s?$/g)
        ? $(node).text().trim()
        : ''
      // console.log('year', year)

      const thCount = $(node.parent)
        .next('table')
        .find('thead > tr > th')
        .length
      // console.log('thCount', thCount)

      $(node.parent)
        .next('table')
        .find('tbody > tr')
        .each((i, trNode) => {
        // console.log('tr', i + 1)
          const children = $(trNode).children()
            .filter((a, n) => {
              return n.name === 'td'
            })

          if (children.length) {
            const tdCount = children.length
            // console.log('tdCount', tdCount)
            const data = {
              country: '',
              desc: '',
              year: ''
            }

            /**
           * 设置年月日、国家、说明
           */
            if (thCount) {
              if (thCount === tdCount) {
                data.year = $(children[0]).text()
                if (thCount === 3) {
                  data.country = $(children[1]).text()
                  data.desc = $(children[2]).html()
                } else {
                  data.country = ''
                  data.desc = $(children[1]).html()
                }
              } else {
                let node = $(trNode).prev('tr')
                while (true) {
                  const count = $(node).find('td').length
                  if (count) {
                    if (count === 3) {
                      data.year = $($(node).find('td').get(0)).text()
                      break
                    } else {
                      node = node.prev('tr')
                    }
                  } else {
                    break
                  }
                }

                if (thCount === 3) {
                  data.country = $(children[0]).text()
                  data.desc = $(children[1]).html()
                }
              }
            } else {
              data.year = $(children[0]).text()
              if (tdCount === 3) {
                data.country = $(children[1]).text()
                data.desc = $(children[2]).html()
              } else {
                data.country = ''
                data.desc = $(children[1]).html()
              }
            }

            /**
             * 格式化年月日
             */
            data.year = yearFormatter(data.year, year)

            /**
             * 格式化国家
             */
            data.country = countryFormatter(data.country)

            /**
             * 格式化说明
             */
            console.log(data.desc)
            data.desc = descFormatter(data.desc)

            timelines.push(data)
          }
        })
    })
  return timelines
}

/**
 * @description 从列表创建的timeline列表
 * @param {string} $ cheerio
 * @param {object[]} =[]
 */
export function makeTimelinesFromList ($, {
  yearFormatter = (y) => y,
  descFormatter = (d) => d
}) {
  const timelines = []
  $('h2 > span.mw-headline')
    .filter((i, node) => {
      const hasUl = $(node.parent).next('ul').get(0)
      return hasUl
    }).each((index, node) => {
      const year = node.attribs.id.match(/^\d{4}s?$/g)
        ? $(node).text().trim()
        : ''
      $(node.parent)
        .next('ul')
        .find(':scope > li')
        .each((index, node) => {
          let y = ''
          const span = $(node)
            .find(':scope > span')
            .text()
            .replace(/\s/g, '')
          if (span.match(/\d{4}/)) {
            y = span
          } else {
            y = `${year}年${span}`
          }
          $(node)
            .find('ul')
            .find('li')
            .each((index, node) => {
              timelines.push({
                desc: descFormatter($(node).html()),
                year: yearFormatter(y)
              })
            })
        })
    })
  return timelines
}
