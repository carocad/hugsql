/* eslint-env mocha */

const assert = require('assert');
const path = require('path');
const fs = require('fs');
const { Linter, CLIEngine } = require('eslint');
const hugsql = require('../src/compiler');
const { recursiveReaddirSync } = require('../src/util');

const eslintrc = fs.readFileSync(`${__dirname}/../.eslintrc`, 'utf-8');
const config = JSON.parse(eslintrc);

describe('HugSql compiler', () => {
  for (const filepath of recursiveReaddirSync(`${__dirname}/../resources/`)) {
    const linter = new Linter();
    const cli = new CLIEngine(config);

    if (path.extname(filepath) === '.sql') {
      it(`should return valid JS code from ${filepath}`, () => {
        const output = hugsql.compile(filepath, false);

        const fileConfig = cli.getConfigForFile(filepath);
        const result = linter.verifyAndFix(output, fileConfig, {
          filename: filepath,
        });

        const errors = result.messages.filter((msg) => msg.fatal);
        assert.strictEqual(errors.length, 0);
      });
    }
  }
});
