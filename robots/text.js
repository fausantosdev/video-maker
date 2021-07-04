const algorithmia = require('algorithmia')
const sentenceBoundaryDetection = require('sbd')

const algorithmiaApiKey = require('../credentials/algorithmia.json').apiKey

async function robot(content) {
    // (1º) - Baixa conteúdo do wikipedia.
    await fetchContentFromWikipedia(content)

    // (2º) - Limpa o conteúdo.
    sanitizeContent(content)

    // (3º) - Quebra em sentenças.
    breakContentIntoSentences(content)

    // (1º)
    async function fetchContentFromWikipedia (content) {
        // Autenticada.
        const augorithmiaAuthenticated = algorithmia(algorithmiaApiKey)
        
        // Define o algoritimo.
        const wikipediaAlgorithm = augorithmiaAuthenticated.algo('web/WikipediaParser/0.1.2')

        // Executa.
        const wikipediaResponse = await wikipediaAlgorithm.pipe(content.searchTerm)
 
        // Captura o valor.
        const wikipediaContent = wikipediaResponse.get()

        content.sourceContentOriginal = wikipediaContent.content
    }

    // (2º)
    function sanitizeContent(content) {
        const withoutBlankLinesAndMarkdown = removeBlankLinesAndMarkdown(content.sourceContentOriginal)
        const withoutDatesInParentheses = removeDatesInParentheses(withoutBlankLinesAndMarkdown)

        content.sourceContentSanitized = withoutDatesInParentheses

        function removeBlankLinesAndMarkdown(text) {
            const allLines = text.split('\n')

            const withoutBlankLinesAndMarkdown = allLines.filter((line) => {
                if (line.trim().length === 0 || line.trim().startsWith('=') ){
                    return false
                }

                return true
            })

            return withoutBlankLinesAndMarkdown.join(' ')
        }
    }

    function removeDatesInParentheses(text) {
        return text.replace(/\((?:\([^()]*\)|[^()])*\)/gm, '').replace(/  /g,' ')
    }

    function breakContentIntoSentences(content) {
        content.sentences = []

        const sentences = sentenceBoundaryDetection.sentences(content.sourceContentSanitized)
        
        sentences.forEach((sentence) => {
            content.sentences.push({
                text: sentence,
                keywords: [],
                images: []
            })
        });
    }
}

module.exports = robot