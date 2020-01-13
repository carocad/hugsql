# HugSql

Node.js library for embracing SQL.

[![Build Status](https://travis-ci.com/carocad/hugsql.svg?branch=master)](https://travis-ci.com/carocad/hugsql)
[![npm version](https://badge.fury.io/js/%40carocad%2Fhugsql.svg)](https://badge.fury.io/js/%40carocad%2Fhugsql)

HugSql is my own adaptation of the wonderful [HugSql](https://github.com/layerware/hugsql)
library for Clojure.

- SQL is the right tool for the job when working with a relational database!
- HugSQL uses JsDoc style documentation in your SQL files to
  define (at compile time) database functions in your Javascript Modules,
  creating a clean separation of Javascript and SQL code
- HugSQL relies on battle tested SQL client implementations for Node.js
  to provide proper value replacement and escaping with security
  
Stop using complicated frameworks that transform your queries in unexpected ways. Instead
just use plain Sql statements and enjoy the benefits of *What You See Is What You Get*.

As an added benefit you can directly use all the tooling available for your Sql dialect
and the one available for Node.js without compromising on quality :) 

### Usage

- install it
```Shell
npm install --save-dev @carocad/hugsql
```

- Document your SQL statements with JsDoc annotations. HugSql will then create
Javascript functions with the appropriate documentation and parameters. For example on `src/example.sql` file
```SQL
/**
 * Fetch all the albums from a specific artist ...
 * you better pick a good one ;)
 * @function findAllAlbums
 * @param {Number} artistId - an artist id
 * @param {Number} albumId - an album id
 */
select * from albums where "AlbumId" = :albumId and "ArtistId" = :artistId;
```

- run *hugsql* on the command line
```Shell
# point it to the directory containing your *.sql files
npx hugsql src/
```

- you get an autogenerated `src/example.sql.js` file
```js
const statements = {
    /**
     * Fetch all the albums from a specific artist ...
     * you better pick a good one ;)
     * 
     * @param {Number} artistId - an artist id
     * @param {Number} albumId - an album id
     */
    findAllAlbums: (artistId,albumId) => ({
        query: 'select * from albums where "AlbumId" = ? and "ArtistId" = ?;',
        parameters: [ albumId,artistId ]
    })
}

module.exports = statements
```

- then you can use it like (example using [MySql](https://github.com/mysqljs/mysql))
```js
const mysql      = require('mysql');
// import your autogenerated code
const statements = require('./src/example.sql.js');

const connection = mysql.createConnection({ ... });

const myFavouriteSongs = statements.findAllAlbums('Calle 13', 'Multi Viral');
connection.query(MyFavouriteSongs.query, myFavouriteSongs.parameters, function (error, results, fields) {
  console.log('Here we kum: ', results);
})
```

- Enjoy :)

For more examples, check the [resources/sql](./resources/sql) directory
