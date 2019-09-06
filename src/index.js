
const fs = require('fs')
const Mustache = require('mustache')

const sectionRegex = /(\/\*\*.*?\*\/)\n*(.*?;)/isg
const paramsRegex = /@param ({\w+} )?(\S+)(.*)/g
const functionRegex = /@function (\w+)/

const SqlExample = fs.readFileSync(`${__dirname}/../resources/test.sql`, 'utf8')
const template = fs.readFileSync(`${__dirname}/../resources/template.mustache`, 'utf8')

function* allRegexMatches(text, regex) {
    while(true) {
        const section = regex.exec(text)
        if (section === null) {
            return
        }

        yield [...section]
    }
}

function* parseContent(fileContent) {
    for (const section of allRegexMatches(fileContent, sectionRegex)) {
        const [, docstringBlock, query] = section

        const functionBlock = functionRegex.exec(docstringBlock)
        if (functionBlock === null) {
            throw new Error(`missing @function in docstring section ${docstringBlock}`)
        }
        const [match, functionName] = functionBlock

        const parameters = [...allRegexMatches(docstringBlock, paramsRegex)]
            .reduce((result, [text, type, name]) => [...result, name], [])

        yield {
            query,
            functionName,
            parameters,
            docstring: docstringBlock.replace(match, ''),
            functionParameters: function() { return this.parameters.join(', ') }
        }
    }
}

const output = Mustache.render(template, {
    sections: Array.from(parseContent(SqlExample))
});

fs.writeFileSync(`${__dirname}/../resources/result.js`, output)

// parse sql into comment and query/function.
// create constants for each query and attach jsdocs to it

// plan mode -- cli flag ?
// if no arguments are found then a simple constant would be enough
// if arguments are found and they are all ? then create a function with {[String, Number, ...]} as argument, returns an PreparedStatement with query and values
// if arguments are found and they are all :word or @word or $word then create a function with @param {String} word, ... as arguments which returns a PreparedStatement with query and values
