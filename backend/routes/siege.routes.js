const express = require('express');
const pool = require('../config/db');

const router = express.Router();

router.get('/trajet/:trajetId', async (req, res) => {
    try {
        const { trajetId } = req.params;

        const [trajetLignes] = await pool.query('SELECT vehicule_id FROM trajets WHERE id = ?', [trajetId]);
        if (trajetLignes.length === 0) {
            return res.status(404).json({ message: 'Trajet introuvable.' });
        }
        const vehiculeId = trajetLignes[0].vehicule_id;

        const [sieges] = await pool.query(
            `SELECT s.id, s.numero_siege, s.ligne, s.colonne,
                    CASE WHEN rs.id IS NULL THEN 'libre' ELSE 'reserve' END AS statut
             FROM sieges s
             LEFT JOIN reservation_sieges rs
                    ON rs.siege_id = s.id AND rs.trajet_id = ?
             WHERE s.vehicule_id = ?
             ORDER BY s.numero_siege ASC`,
            [trajetId, vehiculeId]
        );

        res.json(sieges);
    } catch (erreur) {
        console.error(erreur);
        res.status(500).json({ message: 'Erreur lors de la recuperation des sieges.' });
    }
});

module.exports = router;
