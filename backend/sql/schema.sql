CREATE TABLE IF NOT EXISTS categories (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    slug VARCHAR(120) NOT NULL UNIQUE,
    parent_id INT UNSIGNED NULL,
    CONSTRAINT fk_categories_parent
        FOREIGN KEY (parent_id)
        REFERENCES categories (id)
        ON UPDATE CASCADE
        ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS listings (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(180) NOT NULL,
    description TEXT NOT NULL,
    price DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    price_currency CHAR(3) NOT NULL DEFAULT 'CAD',
    category_id INT UNSIGNED NOT NULL,
    fuel VARCHAR(60) NULL,
    transmission VARCHAR(60) NULL,
    delivery TINYINT(1) NULL,
    export_available TINYINT(1) NULL,
    status VARCHAR(40) NULL DEFAULT 'Disponible',
    mileage INT UNSIGNED NULL,
    year SMALLINT UNSIGNED NULL,
    negotiable TINYINT(1) NULL,
    phone VARCHAR(50) NULL,
    city VARCHAR(120) NULL,
    item_state VARCHAR(60) NULL,
    location VARCHAR(160) NULL,
    images TEXT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_listings_category
        FOREIGN KEY (category_id)
        REFERENCES categories (id)
        ON UPDATE CASCADE
        ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS contact_messages (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(120) NOT NULL,
    email VARCHAR(180) NOT NULL,
    message TEXT NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

INSERT INTO categories (id, name, slug, parent_id) VALUES
    (1, 'Automobile', 'automobile', NULL),
    (2, 'Accessoires', 'accessoires', 1),
    (3, 'Berline', 'berline', 1),
    (4, 'Camionnette', 'camionnette', 1),
    (5, 'Pieces', 'pieces-auto', 1),
    (6, 'SUV', 'suv', 1),
    (7, 'Voitures', 'voiture', 1),
    (8, 'Autres', 'autre', NULL),
    (9, 'Bicyclette', 'bicyclette', NULL),
    (10, 'Electromenagers', 'electromenagers', NULL),
    (11, 'Cuisine', 'cuisine', 10),
    (12, 'Entretien', 'entretien', 10),
    (13, 'Moto', 'moto', NULL),
    (14, 'Usagers', 'usagers', NULL),
    (15, 'Vetements', 'vetements', NULL)
ON DUPLICATE KEY UPDATE
    name = VALUES(name),
    slug = VALUES(slug),
    parent_id = VALUES(parent_id);

INSERT INTO listings (
    title,
    description,
    price,
    price_currency,
    category_id,
    fuel,
    transmission,
    delivery,
    export_available,
    status,
    mileage,
    year,
    negotiable,
    phone,
    city,
    item_state,
    location,
    images
)
VALUES
(
    'Toyota Corolla SE 2022',
    'Vehicule en excellent etat, entretien regulier, pneus hiver inclus, aucune reparation a prevoir.',
    24800.00,
    'CAD',
    7,
    'Essence',
    'Automatique',
    1,
    0,
    'Disponible',
    36000,
    2022,
    1,
    '+1 514 555 1240',
    'Montreal',
    'Occasion',
    'Montreal',
    '["https://images.unsplash.com/photo-1549921296-3a6b0e8dd1e0?auto=format&fit=crop&w=1200&q=80"]'
),
(
    'Yamaha MT-07 2020',
    'Moto performante et fiable, entretien fait en concession, tenue de route excellente, aucun accident.',
    9200.00,
    'CAD',
    13,
    'Essence',
    'Manuelle',
    0,
    0,
    'Disponible',
    18000,
    2020,
    1,
    '+1 450 555 3344',
    'Quebec',
    'Bon etat',
    'Quebec',
    '["https://images.unsplash.com/photo-1558981806-ec527fa84c39?auto=format&fit=crop&w=1200&q=80"]'
)
ON DUPLICATE KEY UPDATE
    title = VALUES(title);
