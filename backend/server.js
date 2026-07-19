require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');

const authRoutes = require('./routes/auth.routes');
const vehiculeRoutes = require('./routes/vehicule.routes');
const trajetRoutes = require('./routes/trajet.routes');
const siegeRoutes = require('./routes/siege.routes');
const reservationRoutes = require('./routes/reservation.routes');
const adminRoutes = require('./routes/admin.routes');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());
app.use('/api', (req, res, next) => {
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate');
    next();
});

app.use('/api/auth', authRoutes);
app.use('/api/vehicules', vehiculeRoutes);
app.use('/api/trajets', trajetRoutes);
app.use('/api/sieges', siegeRoutes);
app.use('/api/reservations', reservationRoutes);
app.use('/api/admin', adminRoutes);

app.use(express.static(path.join(__dirname, '..', 'frontend'), {
    setHeaders: (res, filePath) => {
        if (filePath.endsWith('.html')) {
            res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate');
        }
    }
}));

app.get('/', (req, res) => {
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate');
    res.sendFile(path.join(__dirname, '..', 'frontend', 'index.html'));
});

app.listen(PORT, () => {
    console.log(`Serveur Voyage Premium demarre sur http://localhost:${PORT}`);
});
