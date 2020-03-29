let fs = require('fs')

let lh = 1.2
let grem = `${lh}rem`

function makeStyle() {
  return `<style>* { box-sizing: border-box; } html { background: #efefef; color: #222; font-size: 24px; line-height: ${lh}; font-family: sans-serif; } body { margin: 0; } .wrapper { max-width: 50ch; margin-left: auto; margin-right: auto; } a { color: inherit; text-decoration-skip-ink: none; }</style>`
}

function makeHead(page_type, filename, description_text) {
  let title = page_type === 'page' ? filename.split('.')[0] : 'scrawl'
  let description =
    page_type === 'page' ? description_text : 'Notes, quickly written.'
  let url =
    page_type === 'page'
      ? 'https://scrawl.grantcuster.com/' + filename.split('.')[0] + '.html'
      : 'https://scrawl.grantcuster.com'
  return `<head>
    <meta charset="utf-8" />
    <link rel="icon" type="image/png" href="favicon.png" />

    <title>${title}</title>
    <meta name="description" content="${description}" />

    <meta property="og:title" content="${title}" />
    <meta property="og:description" content="${description}" />
    <meta property="og:image" content="http://scrawl.grantcuster.com/scrawl.png" />
    <meta property="og:url" content="${url}" />
    <meta name="twitter:card" content="summary_large_image" />

    <meta name="viewport" content="width=device-width" />
    
    ${makeStyle()}
  </head>`
}

function makeTop(page_type, filename, description) {
  return `<!DOCTYPE html><html lang="en">${makeHead(
    page_type,
    filename,
    description
  )}<body><div class="wrapper" style="padding-left: 1ch; padding-right: 1ch; margin-top: ${grem}; margin-bottom:${grem};">${
    page_type === 'page' ? `<a href="/">scrawl<a/>` : 'scrawl'
  }</div>`
}
function makeBottom(page_type) {
  return `<div class="wrapper" style="padding-left: 1ch; padding-right: 1ch; margin-bottom: ${grem};"><div style="margin-bottom: ${grem};">${
    page_type === 'page' ? `<a href="/">go to index</a>` : ''
  }</div><div>by <a href="http://feed.grantcuster.com" target="_blank">grant</a></div><div style="margin-bottom: ${grem};"><a href="https://github.com/GrantCuster/scrawl" target="_blank">view source</a></div></div></body></html>`
}

function removeLinkSyntax(content) {
  content = content.replace(/\[(.*?)\]\((.*?)\)/gi, (match, g1, g2) => `${g1}`)
  return content
}

function wrapPost(content, filename, page_type) {
  let word_count = content.split(' ').length
  content = content.replace(
    /\[(.*?)\]\((.*?)\)/gi,
    (match, g1, g2) => `<a href="${g2}" target="_blank">${g1}</a>`
  )
  let file_path = filename.split('.')[0] + '.html'

  return (
    `<div class="wrapper" style="margin-bottom: ${grem};">` +
    `<div style="position: sticky; top: 0; background: #efefef; z-index: 99; margin-left: -1px; margin-right: -1px; padding-left: 1px; padding-right: 1px;">
    <div style="position: absolute; left: 0; bottom: -1px; border-bottom: solid 2px black; width: 100%;"></div>
    <div style="padding-left: 1ch; padding-right: 1ch;">
    ${
      page_type === 'page'
        ? file_path
        : `<a href="/${file_path}">${file_path}</a>`
    }</div></div>` +
    `<div style="white-space: pre-wrap; padding-left: 1ch; padding-right: 1ch; position: relative; ">` +
    '<div style="position: absolute; left: -1px; top: -1px; right: -1px; bottom: -1px; border: solid 2px black; z-index: -1; pointer-events: none;"></div>' +
    word_count +
    ' words' +
    '\n\n' +
    content +
    `</div>` +
    '</div>'
  )
}

let filenames = fs.readdirSync('posts').reverse()
let files = filenames.map(filename => {
  let content = fs.readFileSync('posts/' + filename, 'utf-8')
  let description = content.slice().replace(/\n\n/g, ' ')
  description = description.replace(/\n/g, ' ')
  description = removeLinkSyntax(description)
  description = description.slice(0, 200).trim()
  let html =
    makeTop('page', filename, description) +
    wrapPost(content, filename, 'page') +
    makeBottom('page')
  return html
})

// write post pages
for (let f = 0; f < filenames.length; f++) {
  fs.writeFileSync('out/' + filenames[f].split('.')[0] + '.html', files[f])
}

let index = makeTop('index')
for (let f = 0; f < filenames.length; f++) {
  let content = fs.readFileSync('posts/' + filenames[f], 'utf-8')
  let html = wrapPost(content, filenames[f], 'index')
  index += html
}
index += makeBottom('index')
fs.writeFileSync('out/' + 'index.html', index)

let feed = {
  version: 'https://jsonfeed.org/version/1',
  title: 'scrawl - Grant Custer',
  home_page_url: 'https://scrawl.grantcuster.com',
  feed_url: 'https://scrawl.grantcuster.com/feed.json',
  author: {
    name: 'Grant Custer',
    url: 'https://index.grantcuster.com',
  },
  items: [],
}
for (let f = 0; f < filenames.length; f++) {
  let filename = filenames[f]
  let item = {}
  item.id = filename.split('.')[0]
  item.url =
    'https://scrawl.grantcuster.com/' + filenames[f].split('.')[0] + '.html'
  item.content_text = fs.readFileSync('posts/' + filenames[f], 'utf-8')
  let [year, days, quarter] = filename
    .split('.')[0]
    .split('-')
    .map(v => parseInt(v))
  let date = new Date(
    new Date(year, 0, 0).getTime() +
      days * 24 * 60 * 60 * 1000 -
      5 * 60 * 60 * 1000 +
      quarter * 15 * 60 * 1000
  )
  item.date = date.toJSON()
  feed.items.push(item)
}

fs.writeFileSync('out/' + 'feed.json', JSON.stringify(feed))
