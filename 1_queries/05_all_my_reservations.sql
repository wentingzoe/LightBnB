SELECT reservations.*, properties.*, AVG(property_reviews.rating) FROM reservations
JOIN properties ON properties.id = property_id
JOIN property_reviews ON reservation_id = reservations.id
WHERE reservations.guest_id = '1'
GROUP BY reservations.id
ORDER BY start_date 
LIMIT 10;