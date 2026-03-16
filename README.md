# Groupe Prolongation (V2 preview-ready)

Site complet `frontend + backend` pour petites annonces, optimise pour un deploiement rapide sur hebergement mutualise (GreenGeeks Pro).

## Structure

```text
frontend/  -> React + Vite + TypeScript + Tailwind
backend/   -> PHP 8 + MySQL (API REST JSON)
```

## Frontend (React + Vite)

### Installation et lancement local

```bash
cd frontend
npm install
npm run dev
```

Le frontend appelle l'API via `VITE_API_BASE_URL` (par defaut `/api`).
Un proxy dev est configure vers `http://localhost:8000`.

### Apercu rapide sans backend (mode mock)

1. Dans `frontend/.env.local`, mettre:
   - `VITE_ENABLE_MOCK=true`
2. Lancer:

```bash
cd frontend
npm run dev
```

Ce mode permet de previsualiser toutes les pages (annonces, detail, publication, contact, admin) sans PHP/MySQL.
Identifiants admin mock pour test: `admin` / `admin123`.

### Build production

```bash
cd frontend
npm install
npm run build
```

Le build est genere dans `frontend/dist`.

## Backend (PHP + MySQL)

### Base de donnees

Importer le schema:

`backend/sql/schema.sql`

Si ta base existe deja (version precedente), execute d abord:

`backend/sql/v2_2_migration.sql`

### Guide complet CMD (creation DB + import SQL)

1. Ouvrir `Invite de commandes` (CMD).
2. Aller dans le projet:

```cmd
cd /d C:\Users\mouha\OneDrive\Documents\Groupe_prolongation
```

3. Creer la base (si nouvelle installation):

```cmd
mysql -u root -p -e "CREATE DATABASE IF NOT EXISTS groupeprolongation CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
```

4. Importer le schema complet:

```cmd
mysql -u root -p groupeprolongation < backend\sql\schema.sql
```

5. Si ta base existe deja et tu veux juste mettre a jour:

```cmd
mysql -u root -p groupeprolongation < backend\sql\v2_2_migration.sql
```

6. Verifier rapidement:

```cmd
mysql -u root -p -e "USE groupeprolongation; SHOW TABLES; SELECT id,name,parent_id FROM categories ORDER BY id;"
```

### Config DB

Configurer `backend/config.php` avec les identifiants MySQL:
- `host`
- `port`
- `name`
- `user`
- `pass`

### Config Auth Admin

Configurer dans `backend/config.php`:
- `admin_username`
- `admin_password_hash` (recommande)

Generation du hash (en local avec PHP):

```bash
php -r "echo password_hash('TonMotDePasseFortIci', PASSWORD_DEFAULT), PHP_EOL;"
```

Copier le resultat dans `admin_password_hash`.
Tu peux aussi utiliser `ADMIN_USERNAME` et `ADMIN_PASSWORD_HASH` via variables d'environnement GreenGeeks.

### Lancement local (si PHP installe)

```bash
php -S localhost:8000 backend/router.php
```

## Endpoints API MVP

- `GET /api/categories`
- `GET /api/listings?category_id=&q=&fuel=&min_price=&max_price=&limit=`
- `GET /api/listings/{id}`
- `POST /api/listings`
- `PUT /api/listings/{id}`
- `DELETE /api/listings/{id}`
- `POST /api/contact`
- `POST /api/uploads` (upload multi-media: images + videos, jusqu a 20 fichiers)
- `GET /api/auth/me`
- `POST /api/auth/login`
- `POST /api/auth/logout`

## Categories configurees

- Automobile
- - Accessoires
- - Berline
- - Camionnette
- - Pieces
- - SUV
- - Voitures
- Autres
- Bicyclette
- Electromenagers
- - Cuisine
- - Entretien
- Moto
- Usagers
- Vetements

## Deploiement GreenGeeks (recommande)

### 1) Deployer le frontend

1. Build local: `npm run build` dans `frontend`.
2. Uploader le contenu de `frontend/dist/` dans `public_html/`.
3. Le fichier `frontend/public/.htaccess` est copie dans `dist/` automatiquement pour React Router.

### 2) Deployer le backend API

1. Creer le dossier `public_html/api/`.
2. Uploader dans `public_html/api/`:
   - `backend/public/index.php`
   - `backend/public/.htaccess`
   - `backend/config.php`
   - `backend/src/` (dossier complet)
3. Modifier `public_html/api/config.php` avec tes identifiants MySQL GreenGeeks.
4. Importer `backend/sql/schema.sql` via phpMyAdmin.
5. Tester dans le navigateur:
   - `https://groupeprolongation.com/api/categories`

### 3) Connexion front <-> API

En production, garder `VITE_API_BASE_URL=/api` (meme domaine).

## Deploiement Auto GitHub Actions (FTP GreenGeeks)

Un workflow est inclus:

- `.github/workflows/deploy.yml`

Il fait automatiquement:

1. build du frontend (`frontend/dist`)
2. preparation du bundle deployable:
   - `public_html/*` (frontend)
   - `public_html/api/*` (backend runtime)
3. upload FTP/FTPS sur GreenGeeks au push sur `main`

### Secrets GitHub a ajouter

Dans `GitHub > Settings > Secrets and variables > Actions > New repository secret`:

- `FTP_SERVER` (ex: `ftp.groupeprolongation.com`)
- `FTP_USERNAME` (utilisateur FTP)
- `FTP_PASSWORD` (mot de passe FTP)
- `FTP_SERVER_DIR` (ex: `/public_html/`)
- `FTP_PROTOCOL` (`ftps` recommande, ou `ftp`)
- `FTP_PORT` (optionnel, `21` par defaut)

### Activation

1. push sur `main` -> deploy automatique
2. ou execution manuelle via `Actions > Deploy To GreenGeeks > Run workflow`

### Important

- Le workflow n efface pas tout le serveur (`dangerous-clean-slate: false`).
- Configure `public_html/api/config.php` avec tes identifiants MySQL production avant le premier deploy.
- Le workflow n envoie pas `config.php` pour eviter d ecraser tes identifiants DB a chaque deploy.
- Si ton FTP ouvre directement `public_html`, mets `FTP_SERVER_DIR=/`.

## Notes V2

- Contact:
  - enregistrement en DB (`contact_messages`)
  - tentative d'envoi email via `mail()` vers `contact@groupeprolongation.com`
- Upload image:
  - URL manuelle possible (`https://...`)
  - upload fichiers locaux possible via `POST /api/uploads`
  - accepte images + videos (max 20 medias par annonce)
  - taille max par fichier: `MAX_UPLOAD_SIZE` (25 MB par defaut)
- Admin:
  - page `/admin` avec authentification
  - publication/modification/suppression/upload proteges par session admin
  - liens `Publier` et `Admin` retires du menu public
  - les pages `/publier` et `/publier/:id` sont reservees a une session admin connectee
- Attributs annonces:
  - Carburant, Transmission, Livraison, Export disponible
  - Statut, Kilometrage(km), Annee, Negociable
  - Telephone, Ville, Etat, Prix(CAD)
  - affichage/validation des attributs adapte selon la categorie choisie
- Logo:
  - placeholder: `frontend/public/logo-placeholder.svg`
  - remplace ce fichier par ton logo final si besoin.

## Commandes PowerShell (si `npm` est bloque)

Sur certains Windows PowerShell, il faut utiliser:

```powershell
npm.cmd install
npm.cmd run dev
npm.cmd run build
```

## Si l'apercu ne s'ouvre pas

Erreur `npm ERR! enoent` avec `package.json` manquant = commande lancee au mauvais dossier.

Executer exactement:

```powershell
cd "C:\Users\mouha\OneDrive\Documents\Groupe_prolongation\frontend"
npm.cmd install
npm.cmd run dev -- --host 127.0.0.1 --port 5173
```

Puis ouvrir:

`http://127.0.0.1:5173`

## Upload medias (important pour videos)

Pour permettre videos + photos, verifie aussi la config PHP (XAMPP ou hebergeur):

```ini
upload_max_filesize = 32M
post_max_size = 128M
max_file_uploads = 20
```

Puis redemarre Apache/MySQL.
