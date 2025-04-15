-- Création de la table des utilisateurs
CREATE TABLE IF NOT EXISTS "user" (
    id SERIAL PRIMARY KEY,
    nom VARCHAR(100) NOT NULL,
    prenom VARCHAR(100) NOT NULL,
    date_naissance DATE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    mot_de_passe TEXT NOT NULL
);

-- Création de la table des catégories
CREATE TABLE IF NOT EXISTS categories (
    id SERIAL PRIMARY KEY,
    nom VARCHAR(100) NOT NULL,
    classe VARCHAR(50) CHECK (classe IN ('Besoin', 'Loisir', 'Épargne')),
    budget FLOAT DEFAULT NULL
);

-- Création de la table des dépenses
CREATE TABLE IF NOT EXISTS expenses (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL,
    categorie_id INTEGER NOT NULL,
    nom VARCHAR(100) NOT NULL,
    date DATE NOT NULL,
    montant FLOAT NOT NULL CHECK (montant > 0),
    recurrence BOOLEAN DEFAULT FALSE,
    FOREIGN KEY (user_id) REFERENCES "user"(id) ON DELETE CASCADE,
    FOREIGN KEY (categorie_id) REFERENCES categories(id) ON DELETE SET NULL
);

-- Création de la table Méthode 50/30/20
CREATE TABLE IF NOT EXISTS methode_50_30_20 (
    id SERIAL PRIMARY KEY,
    user_id INTEGER UNIQUE NOT NULL,
    revenu FLOAT NOT NULL CHECK (revenu > 0),
    budget_besoin FLOAT NOT NULL CHECK (budget_besoin >= 0),
    budget_loisir FLOAT NOT NULL CHECK (budget_loisir >= 0),
    budget_epargne FLOAT NOT NULL CHECK (budget_epargne >= 0),
    FOREIGN KEY (user_id) REFERENCES "user"(id) ON DELETE CASCADE
);

-- Index pour optimiser les requêtes
CREATE INDEX idx_expenses_user ON expenses(user_id);
CREATE INDEX idx_expenses_categorie ON expenses(categorie_id);
CREATE INDEX idx_categories_classe ON categories(classe);
