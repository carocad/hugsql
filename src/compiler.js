
const fs = require('fs');
const handlebars = require('handlebars');
const { difference, allRegexMatches } = require('./util');

const namelessTemplate = fs.readFileSync(`${__dirname}/../resources/templates/nameless.mustache`, 'utf8');
const labeledTemplate = fs.readFileSync(`${__dirname}/../resources/templates/labeled.mustache`, 'utf8');

const sectionRegex = /(\/\*\*.*?\*\/)\n*(.*?)(?=(\/\*)|$)/sg;
const jsDocFunctionRegex = /@function (\w+)/;
// $ is a valid Javascript identifier
const jsDocParamRegex = /@param ({\w+} )?(\$?\w+)(.*)/g;
const sqlParamRegex = / (:|@|\$)(\w+)/gi;


/**
 * replaces all named parameters in sqlStatement with ? placeholders
 * @param {String} sqlStatement
 * @return {{query: string, sortedParameters: Array<String>}}
 */
function anonymize(sqlStatement) {
  let counter = 0;
  const sortedParameters = [];
  const anonymized = sqlStatement.replace(sqlParamRegex, (match, symbol, name) => {
    sortedParameters[counter] = symbol === '$' ? match.trim() : name;
    counter += 1;
    return ' ?';
  });
  return {
    sortedParameters,
    query: anonymized,
  };
}

/**
 * Checks that the parameters of the jsDoc section are present in Sql and vice versa
 * @param {String} sqlStatement
 * @param {String} jsDoc
 * @return {Array<String>} the names of the parameters (without :$@ symbols)
 */
function checkParameters(sqlStatement, jsDoc) {
  // $ is a valid identifier in Javascript so if we find it accept it as part of the name
  const sqlParameters = [...allRegexMatches(sqlStatement, sqlParamRegex)]
    .map(([match, symbol, name]) => (symbol === '$' ? match.trim() : name));

  const jsDocParameters = [...allRegexMatches(jsDoc, jsDocParamRegex)]
    .reduce((result, [, , name]) => [...result, name], []);

  const sqlJsDifference = difference(new Set(sqlParameters), new Set(jsDocParameters));
  if (sqlJsDifference.size !== 0) {
    throw new SyntaxError(`"${[...sqlJsDifference]}" parameters`
            + ` found in Sql statement:\n\n${sqlStatement}\n\nbut not in JsDoc`
            + ` section:\n${jsDoc}`);
  }

  const jsSqlDifference = difference(new Set(jsDocParameters), new Set(sqlParameters));
  if (jsSqlDifference.size !== 0) {
    throw new SyntaxError(`"${[...jsSqlDifference]}" parameters`
            + ` found in JsDoc section:\n\n${jsDoc}\n\nbut not in Sql`
            + ` statement:\n${sqlStatement}`);
  }

  return jsDocParameters;
}

/**
 * Parse and check the content of an Sql file with JsDoc annotations. Yields
 * a sequence of objects that can be used for rendering with mustache
 * @param {String} fileContent
 * @param {Boolean} labeled
 * @yield {functionName: string,
 *         sortedParameters: string,
 *         docstring: string,
 *         query: string,
 *         parameters: Array<String>}
 */
function* parseContent(fileContent, labeled) {
  for (const section of allRegexMatches(fileContent, sectionRegex)) {
    const [, docstringBlock, rawSqlStatement] = section;

    // ignore private statements
    if (!docstringBlock.includes('@private')) {
      // extract basic info on the current section
      const functionBlock = jsDocFunctionRegex.exec(docstringBlock);
      if (functionBlock === null) {
        throw new SyntaxError('Missing @function in docstring'
            + ` section ${docstringBlock}`);
      }
      const [jsDocLine, functionName] = functionBlock;

      // did the user forget to annotate anything ?
      const parameters = checkParameters(rawSqlStatement, docstringBlock);

      // normalize input data
      const { query, sortedParameters } = labeled === false ? anonymize(rawSqlStatement) : {
        query: rawSqlStatement,
      };

      if (labeled === true && parameters.some((param) => !param.startsWith('$'))) {
        throw new SyntaxError('Only \'$name\' parameters are allowed on --labeled mode.'
            + `\nPlease rename these parameters: ${parameters} on the statement:\n\n${rawSqlStatement}`);
      }

      yield {
        functionName,
        parameters,
        sortedParameters,
        query: query.trim(),
        docstring: docstringBlock.replace(jsDocLine, ''),
      };
    }
  }
}

/**
 * Parses the concept of filepath and writes a file with the same name
 * but .sql.js extension out
 *
 * @param {String} filepath
 * @param {Boolean} labeled Whether to return arrays or objects in
 *                          generated Js functions
 * @return {String} a Js file with functions containing the Sql statements
 */
module.exports.compile = function compile(filepath, labeled) {
  const templateType = labeled === true ? labeledTemplate : namelessTemplate;
  const template = handlebars.compile(templateType);
  const fileContent = fs.readFileSync(filepath, 'utf8');

  return template({
    sections: [...parseContent(fileContent, labeled)],
  });
};
