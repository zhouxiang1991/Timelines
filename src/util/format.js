
/**
 * @description 格式化md
 * @param {string} md
 * @returns {string}
 */
export function formatMD (md) {
  md = md.replace(/]\(\//g, '](https://en.wikipedia.org/')
  return md
}
