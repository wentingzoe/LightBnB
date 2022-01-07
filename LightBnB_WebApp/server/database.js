const properties = require('./json/properties.json');
const users = require('./json/users.json');
const { Pool } = require('pg');

const pool = new Pool({
  user: 'vagrant',
  password: '123',
  host: 'localhost',
  database: 'LightBnB'
});

/**
 * Get a single user from the database given their email.
 * @param {String} email The email of the user.
 * @return {Promise<{}>} A promise to the user.
 */
const getUserWithEmail = function(email) {
  const queryString = `SELECT * FROM users WHERE email = $1`;
  const value = [email];
  return pool
    .query(queryString, value)
    .then((result) => result.rows[0]? result.rows[0]:null)
    .catch((err) => { console.error(err.message);});
}
exports.getUserWithEmail = getUserWithEmail;

/**
 * Get a single user from the database given their id.
 * @param {string} id The id of the user.
 * @return {Promise<{}>} A promise to the user.
 */
const getUserWithId = function(id) {
  const queryString = `SELECT * FROM users WHERE id = $1`;
  const value = [id];
  return pool
  .query(queryString, value)
  .then((result) => result.rows[0]? result.rows[0]:null)
  .catch(err => console.error(err.message));
}
exports.getUserWithId = getUserWithId;


/**
 * Add a new user to the database.
 * @param {{name: string, password: string, email: string}} user
 * @return {Promise<{}>} A promise to the user.
 */
const addUser =  function(user) {

  const queryString = `INSERT INTO users (name,email,password) VALUES ($1,$2,$3) RETURNING *`;
  const values = [user.name, user.email, user.password];
  return pool
  .query(queryString,values)
  .then(res => res.rows)
  .catch(err => console.error(err.message));
}
exports.addUser = addUser;

/// Reservations

/**
 * Get all reservations for a single user.
 * @param {string} guest_id The id of the user.
 * @return {Promise<[{}]>} A promise to the reservations.
 */
const getAllReservations = function(guest_id, limit = 10) {
  const queryString = `SELECT reservations.*, properties.*, AVG(property_reviews.rating) as average_rating FROM reservations
  JOIN properties ON properties.id = property_id
  JOIN property_reviews ON reservation_id = reservations.id
  WHERE reservations.guest_id = $1
  AND reservations.end_date < now()::DATE
  GROUP BY properties.id, reservations.id
  ORDER BY start_date 
  LIMIT $2;`
  const values = [guest_id, limit]
  return pool  
  .query(queryString,values)
  .then(res => res.rows)
  .catch(err => console.error(err.message));
}
exports.getAllReservations = getAllReservations;

/// Properties

/**
 * Get all properties.
 * @param {{}} options An object containing query options.
 * @param {*} limit The number of results to return.
 * @return {Promise<[{}]>}  A promise to the properties.
 */
const getAllProperties = function(options, limit = 10) {
   //1
   let values = [];

   //2
   let queryString = `
   SELECT properties.*, avg(property_reviews.rating) as average_rating
   FROM properties
   JOIN property_reviews ON properties.id = property_reviews.property_id
   `;
   
   // 3 -- WE NEED A WHERE WHEN AT LEAST ONE OF THESE 4 OPTIONS IS MET. MIN_RATING REQUIRES 'HAVING'.
   if (options.city) {
    values.push(`%${options.city}%`);
    queryString += `WHERE city LIKE $${values.length} `;
   }
   if (options.owner_id) {
     values.push(options.owner_id);
     queryString += `AND owner_id = $${values.length}`;
   }
   if(options.minimum_price_per_night){
     values.push(options.minimum_price_per_night*100);
     queryString += `AND cost_per_night >= $${values.length}`;
   }
   if(options.maximum_price_per_night){
     values.push(options.maximum_price_per_night*100);
     queryString += `AND cost_per_night <= $${values.length}`;
   }
     
   queryString += `
   GROUP BY properties.id `; // This is always needed
 
   // This is conditional on if min rating is entered -- needs to be after GROUP BY.
   if(options.minimum_rating){
     values.push(options.minimum_rating);
     queryString += `HAVING avg(property_reviews.rating) >= $${values.length} `;
   }
   
   // 4 -- This is always needed
   values.push(limit);
   queryString += `
   ORDER BY cost_per_night
   LIMIT $${values.length};
   `;
 
   // 5
   
   return pool
     .query(queryString,values)
     .then(result => result.rows)
     .catch(err => console.error(err.message));
}
exports.getAllProperties = getAllProperties;


/**
 * Add a property to the database
 * @param {{}} property An object containing all of the property details.
 * @return {Promise<{}>} A promise to the property.
 */
const addProperty = function(property) {
  const queryString = `INSERT INTO properties (owner_id, title, description, thumbnail_photo_url, cover_photo_url, cost_per_night, parking_spaces, number_of_bathrooms, number_of_bedrooms, country, street, city, province, post_code) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14) RETURNING *`;
  
  const values = [];

  values.push(property.owner_id, property.title, property.description, property.thumbnail_photo_url, property.cover_photo_url, property.cost_per_night, Number(property.parking_spaces), Number(property.number_of_bathrooms), Number(property.number_of_bedrooms), property.country, property.street, property.city, property.province, property.post_code);
  
  return pool
  .query(queryString,values)
  .then(res => res.rows)
  .catch(err => console.error(err.message));
}
exports.addProperty = addProperty;
