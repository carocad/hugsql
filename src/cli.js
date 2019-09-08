#!/usr/bin/env node

const path = require('path')
const fs = require('fs')
const {docopt} = require('docopt')
const hugsql = require('./compiler')
const {version, description} = require('../package.json')

/**
 * Synchronously list all files in a directory recursively
 * @param {String} dir a fullpath directory
 */
function* recursiveReaddirSync(dir) {
    for(const child of fs.readdirSync(dir, {withFileTypes: true})) {

        if (child.isDirectory()) {
            yield * recursiveReaddirSync(path.resolve(dir, child.name))
        }
        // file otherwise
        else {
            yield path.resolve(dir, child.name)
        }
    }
}

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
`

// parse user arguments
const options = docopt(docstring, {
    version,
    help: true
})

// find all files in the provided dir
const files = recursiveReaddirSync(path.resolve(options['<dirpath>']))
// compile a js file for each sql file found
for (const filepath of files) {
    if(path.extname(filepath) === '.sql') {
        try {
            const output = hugsql.compile(filepath, options['--labeled'])
            const filename = path.basename(filepath, '.sql')
            const filedir = path.dirname(filepath)
            fs.writeFileSync(path.join(filedir, `${filename}.sql.js`), output)
        } catch (error) {
            console.error(error.message)
            process.exit(1)
        }
    }
}
