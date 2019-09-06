
const fs = require('fs')
const Mustache = require('mustache')

const sectionRegex = /(\/\*\*.*?\*\/)\n*(.*?;)/isg
const jsDocFunctionRegex = /@function (\w+)/
const jsDocParamRegex = /@param ({\w+} )?(\$?\w+)(.*)/g
const sqlParamRegex = / (:|@|\$)(\w+)/gi

/**
 * Returns a lazy sequence of regex executions over text
 * @param {String} text
 * @param {RegExp} regex
 * @yield {IterableIterator<Array<String>>}
 */
function* allRegexMatches(text, regex) {
    while(true) {
        const section = regex.exec(text)
        if (section === null) {
            return
        }

        yield [...section]
    }
}

/**
 * return the Set s1 without the elements from Set s2
 * @param {Set<*>} s1
 * @param {Set<*>} s2
 * @return {Set<*>}
 */
function difference(s1, s2) {
    const result = new Set()
    for (const value of s1) {
        if (!s2.has(value)) {
            result.add(value)
        }
    }
    return result
}

/**
 * replaces all named parameters in sqlStatement with ? placeholders
 * @param {String} sqlStatement
 * @return {{query: string, positions: Object}}
 */
function anonymize(sqlStatement) {
    let counter = 0
    const sortedParameters = []
    const anonymized = sqlStatement.replace(sqlParamRegex, function (match, p1, name) {
        sortedParameters[counter] = name
        counter = counter + 1
        return '?'
    })
    return {
        sortedParameters,
        query: anonymized,
    }
}

/**
 * Checks that the parameters of the jsDoc section are present in Sql and viceversa
 * @param {String} sqlStatement
 * @param {String} jsDoc
 * @return {Array<String>} the names of the parameters (without :$@ symbols)
 */
function checkParameters(sqlStatement, jsDoc) {
    // $ is a valid identifier in Javascript so if we find it accept it as part of the name
    const sqlParameters = [...allRegexMatches(sqlStatement, sqlParamRegex)]
        .map(([match, symbol, name]) => symbol === '$' ? match.trim() : name)

    const jsDocParameters = [...allRegexMatches(jsDoc, jsDocParamRegex)]
        .reduce((result, [text, type, name]) => [...result, name], [])

    const sqlJsDifference = difference(new Set(sqlParameters), new Set(jsDocParameters))
    if (sqlJsDifference.size !== 0) {
        throw new Error(`"${[...sqlJsDifference]}" parameters found in Sql statement:\n\n${sqlStatement}\n\nbut not in JsDoc section:\n${jsDoc}`)
    }

    const jsSqlDifference = difference(new Set(jsDocParameters), new Set(sqlParameters))
    if (jsSqlDifference.size !== 0) {
        throw new Error(`"${[...jsSqlDifference]}" parameters found in JsDoc section:\n\n${jsDoc}\n\nbut not in Sql statement:\n${sqlStatement}`)
    }

    return jsDocParameters
}

function* parseContent(fileContent) {
    for (const section of allRegexMatches(fileContent, sectionRegex)) {
        const [, docstringBlock, rawSqlStatement] = section

        // extract basic info on the current section
        const functionBlock = jsDocFunctionRegex.exec(docstringBlock)
        if (functionBlock === null) {
            throw new Error(`missing @function in docstring section ${docstringBlock}`)
        }
        const [jsDocLine, functionName] = functionBlock

        // did the user forget to annotate anything ?
        const parameters = checkParameters(rawSqlStatement, docstringBlock)

        // normalize input data
        const {query, sortedParameters} = returnArrays === true ? anonymize(section[2]) : {query: section[2]}

        yield {
            query,
            functionName,
            parameters,
            sortedParameters,
            docstring: docstringBlock.replace(jsDocLine, ''),
        }
    }
}

const fileContent = fs.readFileSync(`${__dirname}/../resources/test.sql`, 'utf8')
const arrayTemplate = fs.readFileSync(`${__dirname}/../resources/array.mustache`, 'utf8')
const objectTemplate = fs.readFileSync(`${__dirname}/../resources/object.mustache`, 'utf8')

const returnArrays = true

const output = Mustache.render(returnArrays === true ? arrayTemplate : objectTemplate, {
    sections: [...parseContent(fileContent)]
});

fs.writeFileSync(`${__dirname}/../resources/result.js`, output)

// parse sql into comment and query/function.
// create constants for each query and attach jsdocs to it

// plan mode -- cli flag ?
// if no arguments are found then a simple constant would be enough
// if arguments are found and they are all ? then create a function with {[String, Number, ...]} as argument, returns an PreparedStatement with query and values
// if arguments are found and they are all :word or @word or $word then create a function with @param {String} word, ... as arguments which returns a PreparedStatement with query and values
