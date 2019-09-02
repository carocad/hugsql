
const fs = require('fs')
const Mustache = require('mustache')

const sectionRegex = /(\/\*\*.*?\*\/)\n*(.*?;)/isg
const nameRegex = /@name (\w+)/

const SqlExample = fs.readFileSync(`${__dirname}/../resources/test.sql`, 'utf8')
const template = fs.readFileSync(`${__dirname}/../resources/template.mustache`, 'utf8')

function* parseContent(fileContent) {
    while(true) {
        const section = sectionRegex.exec(fileContent)
        if (section === null) {
            return
        }

        const [, docstringBlock, query] = section
        const nameBlock = nameRegex.exec(docstringBlock)
        if (nameBlock === null) {
            throw new Error(`missing @name in docstring section ${docstringBlock}`)
        }

        const [match, name] = nameBlock
        yield { query, name, docstring: docstringBlock.replace(match, '') }
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
