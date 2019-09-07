#!/usr/bin/env node

const path = require('path')
const {docopt} = require('docopt')
const hugsql = require('./src/index')
const {version, description} = require('./package.json')
const [,, ...argv] = process.argv

const docstring = `
${description}

Usage:
    hugsql <dirpath> [--value-objects]
    hugsql (-h | --help)
    hugsql --version

`

const options = docopt(docstring, {
    version,
    help: true,
    exit: false
})

// TODO: fetch the list of files in the dir
// filter the sql ones
// pass each file to the compile function
// DONE
//path.basename(options['<dirpath>'])

console.log(options)
