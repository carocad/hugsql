#!/usr/bin/env node

const path = require('path')
const fs = require('fs')
const {docopt} = require('docopt')
const hugsql = require('./src/index')
const {version, description} = require('./package.json')
const [,, ...argv] = process.argv

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

const options = docopt(docstring, {
    version,
    help: true
})

const files = recursiveReaddirSync(path.resolve(options['<dirpath>']))
for (const filepath of files) {
    if(path.extname(filepath) === '.sql') {
        try {
            hugsql.compile(filepath, options['--labeled'])
        } catch (error) {
            console.error(error.message)
            process.exit(1)
        }
    }
}
