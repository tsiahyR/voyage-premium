const express = require('express');
const pool = require('../config/db');
const { verifierToken, verifierAdmin } = require('../middleware/auth');

const router = express.Router();

router.post('/', verifierToken, async (req, res) => {
    const connexion = await pool.getConnection();
    try {
        const { trajet_id, nom, prenom, sexe, telephone, sieges } = req.body;
        const utilisateur_id = req.utilisateur.id;

        if (!trajet_id || !nom || !prenom || !telephone || !Array.isArray(sieges) || sieges.length === 0) {
            connexion.release();
            return res.status(400).json({ message: 'Veuillez remplir tous les champs et choisir au moins un siege.' });
        }

        await connexion.beginTransaction();

        const [dejaPris] = await connexion.query(
            `SELECT siege_id FROM reservation_sieges WHERE trajet_id = ? AND siege_id IN (?)`,
            [trajet_id, sieges]
        );
        if (dejaPris.length > 0) {
            await connexion.rollback();
            connexion.release();
            return res.status(409).json({ message: 'Un ou plusieurs sieges choisis viennent d\'etre reserves. Veuillez en choisir d\'autres.' });
        }

        const [[infosTrajet]] = await connexion.query(
            `SELECT t.destination, t.lieu_depart, t.date_depart, t.heure_depart, t.prix,
                    v.nom AS vehicule_nom, v.type AS vehicule_type
             FROM trajets t JOIN vehicules v ON t.vehicule_id = v.id
             WHERE t.id = ?`,
            [trajet_id]
        );

        const [resultat] = await connexion.query(
            `INSERT INTO reservations (utilisateur_id, trajet_id, nom, prenom, sexe, telephone, nombre_siege,
                    destination_txt, lieu_depart_txt, date_depart_txt, heure_depart_txt, prix_txt, vehicule_nom_txt, vehicule_type_txt)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [utilisateur_id, trajet_id, nom, prenom, sexe || 'Homme', telephone, sieges.length,
                infosTrajet ? infosTrajet.destination : null,
                infosTrajet ? infosTrajet.lieu_depart : null,
                infosTrajet ? infosTrajet.date_depart : null,
                infosTrajet ? infosTrajet.heure_depart : null,
                infosTrajet ? infosTrajet.prix : null,
                infosTrajet ? infosTrajet.vehicule_nom : null,
                infosTrajet ? infosTrajet.vehicule_type : null]
        );
        const reservationId = resultat.insertId;

        const valeurs = sieges.map(siegeId => [reservationId, siegeId, trajet_id]);
        await connexion.query(
            'INSERT INTO reservation_sieges (reservation_id, siege_id, trajet_id) VALUES ?',
            [valeurs]
        );

        await connexion.commit();
        res.status(201).json({ message: 'Reservation confirmee avec succes.', reservation_id: reservationId });
    } catch (erreur) {
        await connexion.rollback();
        console.error(erreur);

        if (erreur.code === 'ER_DUP_ENTRY') {
            return res.status(409).json({ message: 'Un des sieges vient d\'etre pris par un autre client.' });
        }
        res.status(500).json({ message: 'Erreur lors de la reservation.' });
    } finally {
        connexion.release();
    }
});

router.get('/historique', verifierToken, async (req, res) => {
    try {
        const [lignes] = await pool.query(
            `SELECT r.*,
                    COALESCE(t.destination, r.destination_txt) AS destination,
                    COALESCE(t.lieu_depart, r.lieu_depart_txt) AS lieu_depart,
                    COALESCE(t.date_depart, r.date_depart_txt) AS date_depart,
                    COALESCE(t.heure_depart, r.heure_depart_txt) AS heure_depart,
                    COALESCE(t.prix, r.prix_txt) AS prix,
                    COALESCE(v.nom, r.vehicule_nom_txt) AS vehicule_nom,
                    COALESCE(v.type, r.vehicule_type_txt) AS vehicule_type,
                    GROUP_CONCAT(s.numero_siege ORDER BY s.numero_siege) AS numeros_sieges
             FROM reservations r
             LEFT JOIN trajets t ON r.trajet_id = t.id
             LEFT JOIN vehicules v ON t.vehicule_id = v.id
             LEFT JOIN reservation_sieges rs ON rs.reservation_id = r.id
             LEFT JOIN sieges s ON s.id = rs.siege_id
             WHERE r.utilisateur_id = ?
             GROUP BY r.id
             ORDER BY r.date_reservation DESC`,
            [req.utilisateur.id]
        );
        res.json(lignes);
    } catch (erreur) {
        console.error(erreur);
        res.status(500).json({ message: 'Erreur lors de la recuperation de l\'historique.' });
    }
});

router.put('/:id/annuler', verifierToken, async (req, res) => {
    try {
        const [lignes] = await pool.query(
            'SELECT * FROM reservations WHERE id = ? AND utilisateur_id = ?',
            [req.params.id, req.utilisateur.id]
        );
        if (lignes.length === 0) return res.status(404).json({ message: 'Reservation introuvable.' });

        await pool.query('UPDATE reservations SET statut = "Annulee" WHERE id = ?', [req.params.id]);
        await pool.query('DELETE FROM reservation_sieges WHERE reservation_id = ?', [req.params.id]);

        res.json({ message: 'Reservation annulee, les sieges sont de nouveau disponibles.' });
    } catch (erreur) {
        console.error(erreur);
        res.status(500).json({ message: 'Erreur lors de l\'annulation.' });
    }
});

// Efface tout l'historique du client connecte (doit etre defini avant /:id)
router.delete('/historique', verifierToken, async (req, res) => {
    try {
        await pool.query('DELETE FROM reservations WHERE utilisateur_id = ?', [req.utilisateur.id]);
        res.json({ message: 'Historique efface.' });
    } catch (erreur) {
        console.error(erreur);
        res.status(500).json({ message: 'Erreur lors de la suppression de l\'historique.' });
    }
});

// Efface une seule entree de l'historique du client connecte
router.delete('/:id', verifierToken, async (req, res) => {
    try {
        const [lignes] = await pool.query(
            'SELECT id FROM reservations WHERE id = ? AND utilisateur_id = ?',
            [req.params.id, req.utilisateur.id]
        );
        if (lignes.length === 0) return res.status(404).json({ message: 'Reservation introuvable.' });

        await pool.query('DELETE FROM reservations WHERE id = ?', [req.params.id]);
        res.json({ message: 'Reservation supprimee de l\'historique.' });
    } catch (erreur) {
        console.error(erreur);
        res.status(500).json({ message: 'Erreur lors de la suppression.' });
    }
});

router.get('/', verifierToken, verifierAdmin, async (req, res) => {
    try {
        const [lignes] = await pool.query(
            `SELECT r.*, u.email,
                    COALESCE(t.destination, r.destination_txt) AS destination,
                    COALESCE(t.lieu_depart, r.lieu_depart_txt) AS lieu_depart,
                    COALESCE(t.date_depart, r.date_depart_txt) AS date_depart,
                    COALESCE(t.heure_depart, r.heure_depart_txt) AS heure_depart,
                    COALESCE(v.nom, r.vehicule_nom_txt) AS vehicule_nom,
                    COALESCE(v.type, r.vehicule_type_txt) AS vehicule_type,
                    GROUP_CONCAT(s.numero_siege ORDER BY s.numero_siege) AS numeros_sieges
             FROM reservations r
             JOIN utilisateurs u ON r.utilisateur_id = u.id
             LEFT JOIN trajets t ON r.trajet_id = t.id
             LEFT JOIN vehicules v ON t.vehicule_id = v.id
             LEFT JOIN reservation_sieges rs ON rs.reservation_id = r.id
             LEFT JOIN sieges s ON s.id = rs.siege_id
             GROUP BY r.id
             ORDER BY r.date_reservation DESC`
        );
        res.json(lignes);
    } catch (erreur) {
        console.error(erreur);
        res.status(500).json({ message: 'Erreur serveur.' });
    }
});

module.exports = router;
