require('dotenv').config();
const jwt = require('jsonwebtoken');

function verifierToken(req, res, next) {
    const header = req.headers['authorization'];
    const token = header && header.split(' ')[1];

    if (!token) {
        return res.status(401).json({ message: 'Acces refuse. Aucun token fourni.' });
    }

    jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
        if (err) {
            return res.status(403).json({ message: 'Token invalide ou expire.' });
        }
        req.utilisateur = decoded;
        next();
    });
}

function verifierAdmin(req, res, next) {
    if (req.utilisateur && req.utilisateur.role === 'admin') {
        return next();
    }
    return res.status(403).json({ message: 'Acces reserve aux administrateurs.' });
}

module.exports = { verifierToken, verifierAdmin };
