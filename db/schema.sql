-- db/schema.sql
USE skipq;

CREATE TABLE users (
  id           INT AUTO_INCREMENT PRIMARY KEY,
  name         VARCHAR(120) NOT NULL,
  email        VARCHAR(190) NOT NULL UNIQUE,
  phone        VARCHAR(20)  UNIQUE,
  password     VARCHAR(255) NOT NULL,
  roll_number  VARCHAR(50)  UNIQUE,
  role         ENUM('USER','STAFF','ADMIN') NOT NULL DEFAULT 'USER',
  canteen_id   INT NULL,
  created_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_users_role (role)
);

CREATE TABLE canteens (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  name        VARCHAR(150) NOT NULL,
  description TEXT,
  contact     VARCHAR(30),
  is_open     TINYINT(1) NOT NULL DEFAULT 1,
  created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE users
  ADD CONSTRAINT fk_users_canteen
  FOREIGN KEY (canteen_id) REFERENCES canteens(id) ON DELETE SET NULL;

CREATE TABLE categories (
  id    INT AUTO_INCREMENT PRIMARY KEY,
  name  VARCHAR(80) NOT NULL UNIQUE
);

CREATE TABLE menu_items (
  id            INT AUTO_INCREMENT PRIMARY KEY,
  name          VARCHAR(150) NOT NULL,
  description   TEXT,
  price         DECIMAL(10,2) NOT NULL,
  prep_time_min INT NOT NULL DEFAULT 10,
  is_available  TINYINT(1) NOT NULL DEFAULT 1,
  image_url     VARCHAR(500),
  canteen_id    INT NOT NULL,
  category_id   INT NOT NULL,
  created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (canteen_id)  REFERENCES canteens(id)  ON DELETE CASCADE,
  FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE RESTRICT,
  INDEX idx_menu_canteen (canteen_id, is_available)
) ;

CREATE TABLE orders (
  id                   INT AUTO_INCREMENT PRIMARY KEY,
  user_id              INT NOT NULL,
  canteen_id           INT NOT NULL,
  status               ENUM('PLACED','CONFIRMED','PREPARING','READY','PICKED_UP','CANCELLED')
                       NOT NULL DEFAULT 'PLACED',
  total_amount         DECIMAL(10,2) NOT NULL,
  pickup_code          VARCHAR(10) NOT NULL,
  special_instructions TEXT,
  estimated_prep_time  INT NOT NULL DEFAULT 15,
  created_at           TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at           TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id)    REFERENCES users(id)    ON DELETE CASCADE,
  FOREIGN KEY (canteen_id) REFERENCES canteens(id) ON DELETE RESTRICT,
  INDEX idx_orders_user    (user_id, created_at),
  INDEX idx_orders_canteen (canteen_id, status)
);

CREATE TABLE order_items (
  id           INT AUTO_INCREMENT PRIMARY KEY,
  order_id     INT NOT NULL,
  menu_item_id INT NOT NULL,
  quantity     INT NOT NULL,
  unit_price   DECIMAL(10,2) NOT NULL,
  FOREIGN KEY (order_id)     REFERENCES orders(id)     ON DELETE CASCADE,
  FOREIGN KEY (menu_item_id) REFERENCES menu_items(id) ON DELETE RESTRICT
) ENGINE=InnoDB;

CREATE TABLE notifications (
  id         INT AUTO_INCREMENT PRIMARY KEY,
  user_id    INT NOT NULL,
  title      VARCHAR(150) NOT NULL,
  message    TEXT NOT NULL,
  type       VARCHAR(40) NOT NULL DEFAULT 'ORDER_STATUS',
  is_read    TINYINT(1) NOT NULL DEFAULT 0,
  order_id   INT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id)  REFERENCES users(id)  ON DELETE CASCADE,
  FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE SET NULL,
  INDEX idx_notif_user (user_id, is_read, created_at)
);
