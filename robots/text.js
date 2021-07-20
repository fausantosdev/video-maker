const algorithmia = require('algorithmia')
const sentenceBoundaryDetection = require('sbd')

const NaturalLanguageUnderstandingV1 = require('ibm-watson/natural-language-understanding/v1');
const { IamAuthenticator } = require('ibm-watson/auth');

const algorithmiaApiKey = require('../credentials/algorithmia.json').apiKey
const { apikey: watsonApiKey, url: watsonServiceUrl } = require('../credentials/watson-nlu.json')

// Autenticação
const nlu = new NaturalLanguageUnderstandingV1({
    version: '2021-03-25',
    authenticator: new IamAuthenticator({
      apikey: watsonApiKey,
    }),
    serviceUrl: watsonServiceUrl,
})

async function robot(content) {
    // (1º) - Baixa conteúdo do wikipedia.
    await fetchContentFromWikipedia(content)

    // (2º) - Limpa o conteúdo.
    sanitizeContent(content)

    // (3º) - Quebra em sentenças.
    breakContentIntoSentences(content)

    limitMaximumSentences(content)

    await fetchKeywordsOfAllSentences(content)

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

    function limitMaximumSentences(content){
        content.sentences = content.sentences.slice(0, content.maximumSentences)
    }

    async function fetchKeywordsOfAllSentences(content){
        for(const sentence of content.sentences){
           sentence.keywords = await fetchWatsonAndReturnKeywords(sentence.text)
        }
    }

    async function fetchWatsonAndReturnKeywords (sentence) {
        return new Promise((resolve, reject) => {
            nlu.analyze({
                'text': sentence,
                'features': {
                  'keywords': {}
                }
            })
            .then(analysisResults => {
                const keywords = analysisResults.result.keywords.map((keyword) => {
                    return keyword.text
                })

                resolve(keywords)
            })
            .catch(err => {
                reject(err)
                return
            })
        })
    }
}

module.exports = robot