-- Migration V2.2: categories cible + attributs annonces
-- Execute ce script UNE seule fois sur la base existante.

ALTER TABLE categories
    ADD COLUMN parent_id INT UNSIGNED NULL AFTER slug;

ALTER TABLE categories
    ADD INDEX idx_categories_parent_id (parent_id);

ALTER TABLE categories
    ADD CONSTRAINT fk_categories_parent
    FOREIGN KEY (parent_id)
    REFERENCES categories (id)
    ON UPDATE CASCADE
    ON DELETE SET NULL;

ALTER TABLE listings
    ADD COLUMN price_currency CHAR(3) NOT NULL DEFAULT 'XAF' AFTER price,
    ADD COLUMN transmission VARCHAR(60) NULL AFTER fuel,
    ADD COLUMN delivery TINYINT(1) NULL AFTER transmission,
    ADD COLUMN export_available TINYINT(1) NULL AFTER delivery,
    ADD COLUMN status VARCHAR(40) NULL DEFAULT 'Disponible' AFTER export_available,
    ADD COLUMN negotiable TINYINT(1) NULL AFTER year,
    ADD COLUMN phone VARCHAR(50) NULL AFTER negotiable,
    ADD COLUMN city VARCHAR(120) NULL AFTER phone,
    ADD COLUMN item_state VARCHAR(60) NULL AFTER city;

UPDATE listings
SET city = COALESCE(city, location),
    price_currency = COALESCE(NULLIF(price_currency, ''), 'XAF')
WHERE 1 = 1;

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
