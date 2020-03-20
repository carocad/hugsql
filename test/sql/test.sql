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
 * Fetch all the albums from a specific artist ...
 * you better pick a good one ;)
 * @function findAllAlbums
 * @param {Number} artistId - an artist id
 * @param {Number} albumId - an album id
 */
select * from albums where "AlbumId" = :albumId and "ArtistId" = :artistId;

/**
 * Account transaction
 * @function complexTransaction
 */
BEGIN TRANSACTION;

UPDATE accounts
   SET balance = balance - 1000
 WHERE account_no = 100;

UPDATE accounts
   SET balance = balance + 1000
 WHERE account_no = 200;

INSERT INTO account_changes(account_no,flag,amount,changed_at)
VALUES(100,'-',1000,datetime('now'));

INSERT INTO account_changes(account_no,flag,amount,changed_at)
VALUES(200,'+',1000,datetime('now'));

COMMIT;

/**
 * @function postgressExample
 * @param {String} $1 the first name of the user
 * @param {String} $2 the last name of the user
 */
SELECT $1::text as first_name from users where last_name = $2::text;

/**
 * Check that this one is also properly parsed
 * @function complexTransactionDuplicate
 */
BEGIN TRANSACTION;

UPDATE accounts
   SET balance = balance - 1000
 WHERE account_no = 100;

UPDATE accounts
   SET balance = balance + 1000
 WHERE account_no = 200;

INSERT INTO account_changes(account_no,flag,amount,changed_at)
VALUES(100,'-',1000,datetime('now'));

INSERT INTO account_changes(account_no,flag,amount,changed_at)
VALUES(200,'+',1000,datetime('now'));

COMMIT;
