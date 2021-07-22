const fs = require('fs')

const contentPath = './content.json'

function save (content) {
    const contentString = JSON.stringify(content)
    return fs.writeFileSync(contentPath, contentString)
}

function load () {
    const fileBuffer = fs.readFileSync(contentPath,'utf-8')
    const contentJson = JSON.parse(fileBuffer)
    return contentJson
}

module.exports = {
    save,
    load
}