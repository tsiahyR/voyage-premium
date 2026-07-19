require('dotenv').config();
const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const pool = require('../config/db');

const router = express.Router();

router.post('/inscription', async (req, res) => {
    try {
        const { nom, prenom, email, mot_de_passe, telephone, sexe } = req.body;

        if (!nom || !prenom || !email || !mot_de_passe) {
            return res.status(400).json({ message: 'Veuillez remplir tous les champs obligatoires.' });
        }

        const [existants] = await pool.query('SELECT id FROM utilisateurs WHERE email = ?', [email]);
        if (existants.length > 0) {
            return res.status(409).json({ message: 'Cet email est deja utilise.' });
        }

        const hash = await bcrypt.hash(mot_de_passe, 10);

        const [resultat] = await pool.query(
            `INSERT INTO utilisateurs (nom, prenom, email, mot_de_passe, telephone, sexe, role)
             VALUES (?, ?, ?, ?, ?, ?, 'client')`,
            [nom, prenom, email, hash, telephone || null, sexe || 'Homme']
        );

        const token = jwt.sign(
            { id: resultat.insertId, email, role: 'client', nom, prenom },
            process.env.JWT_SECRET,
            { expiresIn: '7d' }
        );

        res.status(201).json({
            message: 'Compte cree avec succes.',
            token,
            utilisateur: { id: resultat.insertId, nom, prenom, email, role: 'client' }
        });
    } catch (erreur) {
        console.error(erreur);
        res.status(500).json({ message: 'Erreur serveur lors de l\'inscription.' });
    }
});

router.post('/connexion', async (req, res) => {
    try {
        const { email, mot_de_passe } = req.body;

        if (!email || !mot_de_passe) {
            return res.status(400).json({ message: 'Email et mot de passe requis.' });
        }

        const [lignes] = await pool.query('SELECT * FROM utilisateurs WHERE email = ?', [email]);
        if (lignes.length === 0) {
            return res.status(401).json({ message: 'Email ou mot de passe incorrect.' });
        }

        const utilisateur = lignes[0];
        const motDePasseValide = await bcrypt.compare(mot_de_passe, utilisateur.mot_de_passe);

        if (!motDePasseValide) {
            return res.status(401).json({ message: 'Email ou mot de passe incorrect.' });
        }

        const token = jwt.sign(
            { id: utilisateur.id, email: utilisateur.email, role: utilisateur.role, nom: utilisateur.nom, prenom: utilisateur.prenom },
            process.env.JWT_SECRET,
            { expiresIn: '7d' }
        );

        res.json({
            message: 'Connexion reussie.',
            token,
            utilisateur: {
                id: utilisateur.id,
                nom: utilisateur.nom,
                prenom: utilisateur.prenom,
                email: utilisateur.email,
                role: utilisateur.role
            }
        });
    } catch (erreur) {
        console.error(erreur);
        res.status(500).json({ message: 'Erreur serveur lors de la connexion.' });
    }
});

module.exports = router;
