
const sqlite3 = require('sqlite3');

const db = new sqlite3.Database(`${__dirname}/../resources/chinook.db`); // , sqlite3.OPEN_READONLY);
const queries = require('./sql/chinook.sql.js');

const calle13 = queries.findAllAlbums(1, 1);
db.all(calle13.query, calle13.parameters, (error, rows) => {
  if (error) {
    console.error(error);
  }
  for (const row of rows) {
    console.log(`rows: ${JSON.stringify(row)}`);
  }
});
