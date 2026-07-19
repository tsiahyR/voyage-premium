const express = require('express');
const pool = require('../config/db');
const { verifierToken, verifierAdmin } = require('../middleware/auth');

const router = express.Router();

router.use(verifierToken, verifierAdmin);

router.get('/dashboard', async (req, res) => {
    try {
        const [[{ total_utilisateurs }]] = await pool.query(
            "SELECT COUNT(*) AS total_utilisateurs FROM utilisateurs WHERE role = 'client'"
        );
        const [[{ total_vehicules }]] = await pool.query('SELECT COUNT(*) AS total_vehicules FROM vehicules');
        const [[{ total_trajets }]] = await pool.query('SELECT COUNT(*) AS total_trajets FROM trajets');
        const [[{ total_reservations }]] = await pool.query(
            "SELECT COUNT(*) AS total_reservations FROM reservations WHERE statut = 'Confirmee'"
        );
        const [dernieresReservations] = await pool.query(
            `SELECT r.id, r.nom, r.prenom, r.nombre_siege, r.date_reservation, t.destination
             FROM reservations r JOIN trajets t ON r.trajet_id = t.id
             ORDER BY r.date_reservation DESC LIMIT 5`
        );

        res.json({
            total_utilisateurs, total_vehicules, total_trajets, total_reservations,
            dernieresReservations
        });
    } catch (erreur) {
        console.error(erreur);
        res.status(500).json({ message: 'Erreur lors du chargement du dashboard.' });
    }
});

router.get('/utilisateurs', async (req, res) => {
    try {
        const [lignes] = await pool.query(
            'SELECT id, nom, prenom, email, telephone, sexe, role, date_creation FROM utilisateurs ORDER BY date_creation DESC'
        );
        res.json(lignes);
    } catch (erreur) {
        console.error(erreur);
        res.status(500).json({ message: 'Erreur serveur.' });
    }
});

router.delete('/utilisateurs/:id', async (req, res) => {
    try {
        await pool.query("DELETE FROM utilisateurs WHERE id = ? AND role = 'client'", [req.params.id]);
        res.json({ message: 'Utilisateur supprime.' });
    } catch (erreur) {
        console.error(erreur);
        res.status(500).json({ message: 'Erreur lors de la suppression.' });
    }
});

module.exports = router;
