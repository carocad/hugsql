/**
 * This query finds all artists in the chinook sample db
 * @function findAllArtists
 */
select * from artists;
/**
 * @function findAllCustomers
 * @param $customers - a array of customers ids
 * @param $products yet another description
 */
select * from customers;



/**
 * @function findAllAlbums
 * @param {Number} artistId - an artist id
 */
select * from albums where "ArtistId" = :artistId;
