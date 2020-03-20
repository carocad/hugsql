#!/usr/bin/env node

const path = require('path');
const fs = require('fs');
const { docopt, DocoptLanguageError, DocoptExit } = require('docopt');
const { recursiveReaddirSync } = require('./util');
const hugsql = require('./compiler');
const { version, description } = require('../package.json');

const docstring = `
${description}

Usage:
    hugsql <dirpath> [--labeled]
    hugsql (-h | --help)
    hugsql --version
    
Options:
    --labeled  Allows '$name' parameters in Sql. By default hugsql replaces
               all Sql parameters with '?'.
    
Examples:
    hugsql ./resources
    hugsql ./resources --labeled
`;

try {
  // parse user arguments
  const options = docopt(docstring, {
    version,
    help: true,
    exit: false,
  });
  // find all files in the provided dir
  const files = recursiveReaddirSync(path.resolve(options['<dirpath>']));
  // compile a js file for each sql file found
  for (const filepath of files) {
    if (path.extname(filepath) === '.sql') {
      const output = hugsql.compile(filepath, options['--labeled']);
      const filename = path.basename(filepath, '.sql');
      const filedir = path.dirname(filepath);
      fs.writeFileSync(path.join(filedir, `${filename}.sql.js`), output);
    }
  }
} catch (error) {
  // error thrown by docopt
  if (error instanceof DocoptLanguageError || error instanceof DocoptExit) {
    console.error('Error parsing user arguments. Please check the usage section below and try again');
    console.log(docstring);
  } else {
    console.error(error.toString());
  }
  process.exit(1);
}
