
const path = require('path');
const fs = require('fs');
const { Linter, CLIEngine } = require('eslint');
const hugsql = require('../src/compiler');
const { recursiveReaddirSync } = require('../src/util');

const eslintrc = fs.readFileSync(`${__dirname}/../.eslintrc`, 'utf-8');
const config = JSON.parse(eslintrc);


for (const filepath of recursiveReaddirSync(`${__dirname}/sql/`)) {
  const linter = new Linter();
  const cli = new CLIEngine(config);

  if (path.extname(filepath) === '.sql') {
    test(`should return valid JS code from ${filepath}`, () => {
      const output = hugsql.compile(filepath, false);

      const fileConfig = cli.getConfigForFile(filepath);
      const result = linter.verifyAndFix(output, fileConfig, {
        filename: filepath,
      });

      const errors = result.messages.filter((msg) => msg.fatal);
      expect(errors.length).toBe(0);
    });
  }
}
