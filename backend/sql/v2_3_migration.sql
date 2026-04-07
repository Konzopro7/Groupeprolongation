-- Migration V2.3: couleurs vehicule
-- Ajoute les attributs couleur interieur / exterieur aux annonces.

ALTER TABLE listings
    ADD COLUMN IF NOT EXISTS interior_color VARCHAR(60) NULL AFTER transmission,
    ADD COLUMN IF NOT EXISTS exterior_color VARCHAR(60) NULL AFTER interior_color;
