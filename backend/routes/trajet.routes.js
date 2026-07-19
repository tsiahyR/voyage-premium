const express = require('express');
const pool = require('../config/db');
const { verifierToken, verifierAdmin } = require('../middleware/auth');

const router = express.Router();

router.get('/', async (req, res) => {
    try {
        const { destination, type } = req.query;
        let sql = `SELECT t.*, v.nom AS vehicule_nom, v.type AS vehicule_type, v.nombre_places
                    FROM trajets t
                    JOIN vehicules v ON t.vehicule_id = v.id
                    WHERE t.statut = 'Actif'`;
        const params = [];

        if (destination) {
            sql += ' AND t.destination = ?';
            params.push(destination);
        }
        if (type) {
            sql += ' AND v.type = ?';
            params.push(type);
        }
        sql += ' ORDER BY t.date_depart ASC';

        const [trajets] = await pool.query(sql, params);
        res.json(trajets);
    } catch (erreur) {
        console.error(erreur);
        res.status(500).json({ message: 'Erreur lors de la recuperation des trajets.' });
    }
});

router.get('/destinations', async (req, res) => {
    try {
        const [lignes] = await pool.query(
            "SELECT DISTINCT destination FROM trajets WHERE statut = 'Actif' ORDER BY destination"
        );
        res.json(lignes.map(l => l.destination));
    } catch (erreur) {
        console.error(erreur);
        res.status(500).json({ message: 'Erreur serveur.' });
    }
});

router.get('/:id', async (req, res) => {
    try {
        const [lignes] = await pool.query(
            `SELECT t.*, v.nom AS vehicule_nom, v.type AS vehicule_type, v.nombre_places
             FROM trajets t JOIN vehicules v ON t.vehicule_id = v.id
             WHERE t.id = ?`,
            [req.params.id]
        );
        if (lignes.length === 0) return res.status(404).json({ message: 'Trajet introuvable.' });
        res.json(lignes[0]);
    } catch (erreur) {
        console.error(erreur);
        res.status(500).json({ message: 'Erreur serveur.' });
    }
});

router.post('/', verifierToken, verifierAdmin, async (req, res) => {
    try {
        const { destination, lieu_depart, vehicule_id, date_depart, heure_depart, prix } = req.body;
        if (!destination || !vehicule_id || !date_depart || !heure_depart) {
            return res.status(400).json({ message: 'Champs obligatoires manquants.' });
        }

        // Un vehicule est dedie a une seule destination : on verifie la coherence
        // pour que deux destinations differentes n'utilisent jamais le meme plan de sieges.
        const [[vehicule]] = await pool.query('SELECT destination FROM vehicules WHERE id = ?', [vehicule_id]);
        if (!vehicule) {
            return res.status(400).json({ message: 'Vehicule introuvable.' });
        }
        if (vehicule.destination.trim().toLowerCase() !== destination.trim().toLowerCase()) {
            return res.status(400).json({
                message: `Ce vehicule est dedie a la destination "${vehicule.destination}" et ne peut pas etre utilise pour "${destination}". Creez ou choisissez un vehicule dedie a cette destination.`
            });
        }

        const [resultat] = await pool.query(
            `INSERT INTO trajets (destination, lieu_depart, vehicule_id, date_depart, heure_depart, prix)
             VALUES (?, ?, ?, ?, ?, ?)`,
            [destination, lieu_depart || 'Antananarivo', vehicule_id, date_depart, heure_depart, prix || 0]
        );
        res.status(201).json({ message: 'Trajet cree avec succes.', id: resultat.insertId });
    } catch (erreur) {
        console.error(erreur);
        res.status(500).json({ message: 'Erreur lors de la creation du trajet.' });
    }
});

router.put('/:id', verifierToken, verifierAdmin, async (req, res) => {
    try {
        const { destination, lieu_depart, vehicule_id, date_depart, heure_depart, prix, statut } = req.body;

        const [[vehicule]] = await pool.query('SELECT destination FROM vehicules WHERE id = ?', [vehicule_id]);
        if (!vehicule) {
            return res.status(400).json({ message: 'Vehicule introuvable.' });
        }
        if (vehicule.destination.trim().toLowerCase() !== destination.trim().toLowerCase()) {
            return res.status(400).json({
                message: `Ce vehicule est dedie a la destination "${vehicule.destination}" et ne peut pas etre utilise pour "${destination}". Creez ou choisissez un vehicule dedie a cette destination.`
            });
        }

        await pool.query(
            `UPDATE trajets SET destination=?, lieu_depart=?, vehicule_id=?, date_depart=?, heure_depart=?, prix=?, statut=?
             WHERE id = ?`,
            [destination, lieu_depart, vehicule_id, date_depart, heure_depart, prix, statut, req.params.id]
        );
        res.json({ message: 'Trajet mis a jour.' });
    } catch (erreur) {
        console.error(erreur);
        res.status(500).json({ message: 'Erreur lors de la mise a jour.' });
    }
});

router.delete('/:id', verifierToken, verifierAdmin, async (req, res) => {
    try {
        await pool.query('DELETE FROM trajets WHERE id = ?', [req.params.id]);
        res.json({ message: 'Trajet supprime.' });
    } catch (erreur) {
        console.error(erreur);
        res.status(500).json({ message: 'Erreur lors de la suppression.' });
    }
});

module.exports = router;
