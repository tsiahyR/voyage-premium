-- =========================================================
--  VOYAGE PREMIUM - Script de base de données MySQL
-- =========================================================

DROP DATABASE IF EXISTS voyage_premium;
CREATE DATABASE voyage_premium CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE voyage_premium;

-- ---------------------------------------------------------
-- Table : utilisateurs (clients + admin)
-- ---------------------------------------------------------
CREATE TABLE utilisateurs (
    id              INT AUTO_INCREMENT PRIMARY KEY,
    nom             VARCHAR(100) NOT NULL,
    prenom          VARCHAR(100) NOT NULL,
    email           VARCHAR(150) NOT NULL UNIQUE,
    mot_de_passe    VARCHAR(255) NOT NULL,
    telephone       VARCHAR(20),
    sexe            ENUM('Homme','Femme') DEFAULT 'Homme',
    role            ENUM('client','admin') NOT NULL DEFAULT 'client',
    date_creation   TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- ---------------------------------------------------------
-- Table : vehicules
-- ---------------------------------------------------------
CREATE TABLE vehicules (
    id              INT AUTO_INCREMENT PRIMARY KEY,
    nom             VARCHAR(100) NOT NULL,
    type            ENUM('Standard','Premium') NOT NULL DEFAULT 'Standard',
    -- Un vehicule est desormais dedie a UNE seule destination : deux destinations
    -- differentes ne peuvent donc jamais partager le meme plan de sieges.
    destination     VARCHAR(100) NOT NULL,
    nombre_places   INT NOT NULL DEFAULT 30,
    immatriculation VARCHAR(50),
    statut          ENUM('Disponible','Indisponible') NOT NULL DEFAULT 'Disponible'
) ENGINE=InnoDB;

-- ---------------------------------------------------------
-- Table : sieges (places physiques d'un véhicule)
-- ---------------------------------------------------------
CREATE TABLE sieges (
    id              INT AUTO_INCREMENT PRIMARY KEY,
    vehicule_id     INT NOT NULL,
    numero_siege    INT NOT NULL,
    ligne           INT NOT NULL,
    colonne         INT NOT NULL,
    FOREIGN KEY (vehicule_id) REFERENCES vehicules(id) ON DELETE CASCADE,
    UNIQUE KEY uniq_vehicule_numero (vehicule_id, numero_siege)
) ENGINE=InnoDB;

-- ---------------------------------------------------------
-- Table : trajets (créés uniquement par l'admin : date + heure)
-- ---------------------------------------------------------
CREATE TABLE trajets (
    id              INT AUTO_INCREMENT PRIMARY KEY,
    destination     VARCHAR(100) NOT NULL,
    lieu_depart     VARCHAR(100) NOT NULL DEFAULT 'Antananarivo',
    vehicule_id     INT NOT NULL,
    date_depart     DATE NOT NULL,
    heure_depart    TIME NOT NULL,
    prix            DECIMAL(10,2) NOT NULL DEFAULT 0,
    statut          ENUM('Actif','Termine','Annule') NOT NULL DEFAULT 'Actif',
    FOREIGN KEY (vehicule_id) REFERENCES vehicules(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- ---------------------------------------------------------
-- Table : reservations (une réservation = un client + un trajet)
-- ---------------------------------------------------------
CREATE TABLE reservations (
    id                  INT AUTO_INCREMENT PRIMARY KEY,
    utilisateur_id      INT NOT NULL,
    trajet_id           INT NULL,
    nom                 VARCHAR(100) NOT NULL,
    prenom              VARCHAR(100) NOT NULL,
    sexe                ENUM('Homme','Femme') NOT NULL,
    telephone           VARCHAR(20) NOT NULL,
    nombre_siege        INT NOT NULL DEFAULT 1,
    statut              ENUM('Confirmee','Annulee') NOT NULL DEFAULT 'Confirmee',
    date_reservation    TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    -- Copie des informations du trajet au moment de la reservation :
    -- garantit que la reservation reste visible dans l'historique du client
    -- meme si le trajet est ensuite supprime/modifie par l'admin.
    destination_txt     VARCHAR(100),
    lieu_depart_txt     VARCHAR(100),
    date_depart_txt     DATE,
    heure_depart_txt    TIME,
    prix_txt            DECIMAL(10,2),
    vehicule_nom_txt    VARCHAR(100),
    vehicule_type_txt   VARCHAR(50),
    FOREIGN KEY (utilisateur_id) REFERENCES utilisateurs(id) ON DELETE CASCADE,
    FOREIGN KEY (trajet_id) REFERENCES trajets(id) ON DELETE SET NULL
) ENGINE=InnoDB;

-- ---------------------------------------------------------
-- Table : reservation_sieges (sièges choisis, empêche le doublon)
-- ---------------------------------------------------------
CREATE TABLE reservation_sieges (
    id              INT AUTO_INCREMENT PRIMARY KEY,
    reservation_id  INT NOT NULL,
    siege_id        INT NOT NULL,
    trajet_id       INT NOT NULL,
    FOREIGN KEY (reservation_id) REFERENCES reservations(id) ON DELETE CASCADE,
    FOREIGN KEY (siege_id) REFERENCES sieges(id) ON DELETE CASCADE,
    FOREIGN KEY (trajet_id) REFERENCES trajets(id) ON DELETE CASCADE,
    UNIQUE KEY uniq_siege_par_trajet (siege_id, trajet_id) -- empêche 2 réservations sur le même siège/trajet
) ENGINE=InnoDB;

-- =========================================================
--  DONNÉES DE DÉMONSTRATION
-- =========================================================

-- Compte admin (mot de passe : admin123 -> hash bcrypt généré par le script seed.js)
-- Voir backend/seed.js pour créer automatiquement ce compte avec un vrai hash.

-- Véhicules
-- Chaque véhicule est dédié à UNE seule destination + catégorie : les places
-- (sièges) d'un véhicule ne concernent donc jamais une autre destination.
INSERT INTO vehicules (nom, type, destination, nombre_places, immatriculation, statut) VALUES
('Mercedes Sprinter 01', 'Premium', 'Mahajanga', 30, '1234-TAA', 'Disponible'),
('Toyota Coaster 02', 'Standard', 'Toamasina', 30, '5678-TBB', 'Disponible'),
('Mercedes Sprinter 03', 'Premium', 'Antsiranana', 30, '1234-TAC', 'Disponible'),
('Toyota Coaster 04', 'Standard', 'Toliara', 30, '5678-TBD', 'Disponible'),
('Mercedes Sprinter 05', 'Premium', 'Morondava', 30, '1234-TAE', 'Disponible');

-- Sièges pour chaque véhicule (30 places : 8+8+7+7, colonne 8 réservée au couloir/chauffeur comme sur le plan)
-- Génération automatique via procédure
DELIMITER $$
CREATE PROCEDURE generer_sieges(IN v_id INT)
BEGIN
    DECLARE i INT DEFAULT 1;
    DECLARE l INT DEFAULT 1;
    DECLARE c INT DEFAULT 1;
    WHILE i <= 30 DO
        IF i <= 8 THEN SET l = 1, c = i;
        ELSEIF i <= 16 THEN SET l = 2, c = i - 8;
        ELSEIF i <= 23 THEN SET l = 3, c = i - 16;
        ELSE SET l = 4, c = i - 23;
        END IF;
        INSERT INTO sieges (vehicule_id, numero_siege, ligne, colonne) VALUES (v_id, i, l, c);
        SET i = i + 1;
    END WHILE;
END$$
DELIMITER ;

CALL generer_sieges(1);
CALL generer_sieges(2);
CALL generer_sieges(3);
CALL generer_sieges(4);
CALL generer_sieges(5);
DROP PROCEDURE generer_sieges;

-- Trajets (date/heure définis par l'admin)
-- Chaque trajet utilise le véhicule dédié à sa propre destination (voir ci-dessus).
INSERT INTO trajets (destination, lieu_depart, vehicule_id, date_depart, heure_depart, prix) VALUES
('Mahajanga', 'Antananarivo', 1, '2026-07-15', '07:00:00', 45000),
('Toamasina', 'Antananarivo', 2, '2026-07-16', '06:30:00', 35000),
('Antsiranana', 'Antananarivo', 3, '2026-07-20', '05:00:00', 60000),
('Toliara', 'Antananarivo', 4, '2026-07-18', '06:00:00', 55000),
('Morondava', 'Antananarivo', 5, '2026-07-22', '07:30:00', 50000);
