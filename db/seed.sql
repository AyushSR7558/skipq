-- db/seed.sql
USE skipq;

INSERT INTO categories (name) VALUES ('Snacks'), ('Meals'), ('Beverages');

INSERT INTO canteens (name, description, contact)
VALUES ('Main Canteen', 'North + South Indian', '9876543210'),
       ('Juice Junction', 'Fresh juices and shakes', '9876543211');

-- password below = bcrypt hash of "staff123"
INSERT INTO users (name, email, password, role, canteen_id) VALUES
  ('Main Canteen Staff', 'staff@skipq.com',
   '$2a$10$e0NRc3pN0KrYy2hUqG0a0OqFm3iZ4i5m0m1y6j0M3l8Z8n4eJ7cHi',
   'STAFF', 1),
  ('Juice Staff', 'juice@skipq.com',
   '$2a$10$e0NRc3pN0KrYy2hUqG0a0OqFm3iZ4i5m0m1y6j0M3l8Z8n4eJ7cHi',
   'STAFF', 2);

INSERT INTO menu_items (name, price, prep_time_min, canteen_id, category_id) VALUES
  ('Veg Sandwich', 40.00, 5,  1, 1),
  ('Masala Dosa',  60.00, 10, 1, 2),
  ('Veg Thali',    90.00, 15, 1, 2),
  ('Fresh Lime Soda', 30.00, 3, 2, 3),
  ('Mango Shake',  50.00, 5,  2, 3);
