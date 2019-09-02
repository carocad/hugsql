/**
 * This query finds all artists in the chinook sample db
 * @name findAllArtists
 * @property {String} foo
 */
select * from artists;
/**
 * @name findAllCustomers
 */
select * from customers;



/**
 * @name findAllAlbums
 * @property {Number} artistId
 */
select * from albums where "ArtistId" = :artistId;
