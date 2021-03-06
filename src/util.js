
const path = require('path');
const fs = require('fs');


/**
 * Returns a lazy sequence of regex executions over text
 * @param {String} text
 * @param {RegExp} regex
 * @yield {IterableIterator<Array<String>>}
 */
function* allRegexMatches(text, regex) {
  while (true) {
    const section = regex.exec(text);
    if (section === null) {
      return;
    }

    yield [...section];
  }
}

/**
 * return the Set s1 without the elements from Set s2
 * @param {Set<*>} s1
 * @param {Set<*>} s2
 * @return {Set<*>}
 */
function difference(s1, s2) {
  const result = new Set();
  for (const value of s1) {
    if (!s2.has(value)) {
      result.add(value);
    }
  }
  return result;
}


/**
 * Synchronously list all files in a directory recursively
 * @param {String} pathlike to the sql target
 */
function* recursiveReaddirSync(pathlike) {
  const stat = fs.lstatSync(pathlike);
  if (stat.isFile()) {
    yield pathlike;
  } else {
    for (const child of fs.readdirSync(pathlike, { withFileTypes: true })) {
      if (child.isDirectory()) {
        yield* recursiveReaddirSync(path.resolve(pathlike, child.name));
      } else { // file otherwise
        yield path.resolve(pathlike, child.name);
      }
    }
  }
}

module.exports = {
  allRegexMatches,
  difference,
  recursiveReaddirSync,
};
