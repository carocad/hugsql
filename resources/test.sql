/**
 * This query finds all artists in the chinook sample db
 * @function findAllArtists
 */
select * from artists;
/**
 * @function findAllCustomers
 */
select * from customers;



/**
 * @function findAllAlbums
 * @param {Number} artistId - an artist id
 * @param {Number} albumId - an album id
 */
select * from albums where "AlbumId" = :albumId and "ArtistId" = :artistId;

/**
 @function postgressExample
 @param {String} $1 the first name of the user
 @param {String} $2 the last name of the user
 */
SELECT $1::text as first_name from users where last_name = $2::text;
