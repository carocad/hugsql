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
 */
select * from albums where "ArtistId" = :artistId;
