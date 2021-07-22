const readLine = require('readline-sync')

const state = require('./state')

function robot () {
    // Objeto que guarda o conteúdo da pesquisa.
    const content = {
        maximumSentences: 7
    }

    content.searchTerm = askAndReturnSearchTerm()
    content.prefix = askAndReturnPrefix()

    state.save(content)

    // Pergunta o termo da pesquisa.
    function askAndReturnSearchTerm() {
        return readLine.question('Type a Wikipedia search term: ')
    } 

    // Pergunta o prefixo da pesquisa.
    function askAndReturnPrefix() {
        const prefixes = ['Who is', 'What is', 'The history of']
        const selectedPrefixIndex = readLine.keyInSelect(prefixes, 'Choose one option: ')
        const selectedPrefixText = prefixes[selectedPrefixIndex]

        return selectedPrefixText
    } 
}

module.exports = robot