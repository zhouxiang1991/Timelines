
/**
 * @description 删除空白符除了空格
 * @param {string} str
 */
export function deleteBlankButSpace (str) {
  return str.replace(/[\r\n\t]/g, '')
}

/**
 * @description 删除空白符
 * @param {string} str
 */
export function deleteBlank (str) {
  return deleteBlankButSpace(str).replace(/[\s]/g, '')
}

/**
 * @description 删除无用的标签
 * @param {string} $ cheerio
 */
export function deleteUselessHtmlTag ($) {
  const selector = [
    'sup',
    'blockquote',
    'style',
    'link',
    'span.noprint',
    '.box-Importance-section',
    'br',
    'h2 .mw-editsection',
    '.thumb.tright',
    '.autonumber'
  ].join(',')
  $(selector).remove()
}

/**
 * @description 将一些标签替换成span
 * @param {string} $ cheerio
 */
export function replaceHtmlTagToSpan ($) {
  $('font,abbr').each((i, e) => {
    $(e).replaceWith($(`<span>${deleteBlank($(e).text())}</span>`))
  })
  $('b,i,p').each((i, e) => {
    $(e).replaceWith($(`<span>${$(e).html()}</span>`))
  })
}
