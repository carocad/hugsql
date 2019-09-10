# HugSql

Node.js library for embracing SQL.

[![Build Status](https://travis-ci.com/carocad/hugsql.svg?branch=master)](https://travis-ci.com/carocad/hugsql)

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
  
### Example

Simply document your SQL statements with JsDoc annotations. HugSql will then create
Javascript functions with the appropriate documentation and parameters; **no magic!**

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
        values: [ albumId,artistId ]
    })
}

module.exports = statements
```

### Usage

- install it
```Shell
npm install --save-dev @carocad/hugsql
```
- run it on the command line
```Shell
# point it to the directory containing your *.sql files
npx hugsql resources/
```
- Enjoy :)
