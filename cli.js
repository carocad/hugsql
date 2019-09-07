#!/usr/bin/env node

const {docopt} = require('docopt')
const hugsql = require('./src/index')
const {version, description} = require('./package.json')
const [,, ...argv] = process.argv

const docstring = `
${description}

Usage:
    hugsql filepath --value-objects
    hugsql (-h | --help)
    hugsql --version
`

const options = docopt(docstring, {
    version,
    argv,
    help: true
})

console.log(options)
