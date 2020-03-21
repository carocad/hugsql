
const sqlite3 = require('sqlite3');

const db = new sqlite3.Database(`${__dirname}/../resources/chinook.db`); // , sqlite3.OPEN_READONLY);
const statements = require('./sql/chinook.sql.js')(db);

statements.findAllArtists()
  .then(console.log)
  .catch(console.error);
