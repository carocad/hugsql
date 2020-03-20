/**
 * @function postgressExample
 * @param {String} $1 the first name of the user
 * @param {String} $2 the last name of the user
 */
SELECT $1::text as first_name from users where last_name = $2::text;
