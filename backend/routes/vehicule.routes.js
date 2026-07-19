const express = require('express');
const pool = require('../config/db');
const { verifierToken, verifierAdmin } = require('../middleware/auth');

const router = express.Router();

router.get('/', async (req, res) => {
    try {
        const [vehicules] = await pool.query('SELECT * FROM vehicules ORDER BY id DESC');
        res.json(vehicules);
    } catch (erreur) {
        console.error(erreur);
        res.status(500).json({ message: 'Erreur lors de la recuperation des vehicules.' });
    }
});

router.post('/', verifierToken, verifierAdmin, async (req, res) => {
    const connexion = await pool.getConnection();
    try {
        const { nom, type, destination, nombre_places, immatriculation } = req.body;
        if (!nom || !type || !destination || !nombre_places) {
            connexion.release();
            return res.status(400).json({ message: 'Champs obligatoires manquants (nom, type, destination, nombre de places).' });
        }

        await connexion.beginTransaction();

        const [resultat] = await connexion.query(
            'INSERT INTO vehicules (nom, type, destination, nombre_places, immatriculation) VALUES (?, ?, ?, ?, ?)',
            [nom, type, destination.trim(), nombre_places, immatriculation || null]
        );

        const vehiculeId = resultat.insertId;

        const valeurs = [];
        for (let i = 1; i <= nombre_places; i++) {
            const ligne = Math.ceil(i / 8);
            const colonne = ((i - 1) % 8) + 1;
            valeurs.push([vehiculeId, i, ligne, colonne]);
        }
        if (valeurs.length > 0) {
            await connexion.query(
                'INSERT INTO sieges (vehicule_id, numero_siege, ligne, colonne) VALUES ?',
                [valeurs]
            );
        }

        await connexion.commit();
        res.status(201).json({ message: 'Vehicule cree avec succes.', id: vehiculeId });
    } catch (erreur) {
        await connexion.rollback();
        console.error(erreur);
        res.status(500).json({ message: 'Erreur lors de la creation du vehicule.' });
    } finally {
        connexion.release();
    }
});

router.put('/:id', verifierToken, verifierAdmin, async (req, res) => {
    try {
        const { nom, type, destination, statut, immatriculation } = req.body;
        if (!destination || !destination.trim()) {
            return res.status(400).json({ message: 'La destination du vehicule est obligatoire.' });
        }
        await pool.query(
            'UPDATE vehicules SET nom = ?, type = ?, destination = ?, statut = ?, immatriculation = ? WHERE id = ?',
            [nom, type, destination.trim(), statut, immatriculation, req.params.id]
        );
        res.json({ message: 'Vehicule mis a jour.' });
    } catch (erreur) {
        console.error(erreur);
        res.status(500).json({ message: 'Erreur lors de la mise a jour.' });
    }
});

router.delete('/:id', verifierToken, verifierAdmin, async (req, res) => {
    try {
        await pool.query('DELETE FROM vehicules WHERE id = ?', [req.params.id]);
        res.json({ message: 'Vehicule supprime.' });
    } catch (erreur) {
        console.error(erreur);
        res.status(500).json({ message: 'Erreur lors de la suppression.' });
    }
});

module.exports = router;
