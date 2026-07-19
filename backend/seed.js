require('dotenv').config();
const bcrypt = require('bcryptjs');
const pool = require('./config/db');

(async () => {
    try {
        const email = 'admin@voyagepremium.mg';
        const motDePasse = 'admin123';
        const hash = await bcrypt.hash(motDePasse, 10);

        const [existants] = await pool.query('SELECT id FROM utilisateurs WHERE email = ?', [email]);
        if (existants.length > 0) {
            console.log('Le compte admin existe deja.');
            process.exit(0);
        }

        await pool.query(
            `INSERT INTO utilisateurs (nom, prenom, email, mot_de_passe, telephone, sexe, role)
             VALUES (?, ?, ?, ?, ?, ?, 'admin')`,
            ['Admin', 'Voyage Premium', email, hash, '0340000000', 'Homme']
        );

        console.log('Compte administrateur cree avec succes !');
        console.log('Email    :', email);
        console.log('Mot de passe :', motDePasse);
        process.exit(0);
    } catch (erreur) {
        console.error('Erreur lors de la creation du compte admin :', erreur);
        process.exit(1);
    }
})();
