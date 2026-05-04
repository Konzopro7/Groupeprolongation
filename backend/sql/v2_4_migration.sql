-- Migration V2.4: devise FCFA (XAF)
-- Passe la devise par defaut en XAF et met a jour les anciennes annonces CAD.

ALTER TABLE listings
    MODIFY COLUMN price_currency CHAR(3) NOT NULL DEFAULT 'XAF';

UPDATE listings
SET price_currency = 'XAF'
WHERE price_currency IS NULL
   OR TRIM(price_currency) = ''
   OR UPPER(price_currency) = 'CAD';
