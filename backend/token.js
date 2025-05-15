const jwt = require('jsonwebtoken');

// Données utilisateur simulées
const user = {
  id: 123,
  email: 'user@example.com',
};

// Clé secrète (à stocker dans un .env en production)
const secretKey = 'votre_cle_secrete_super_solide';

// Génération du token
const token = jwt.sign(
  { sub: user.id, email: user.email }, // Payload
  secretKey,                          // Secret
  { expiresIn: '1d' }                 // Options
);

console.log('Token JWT généré :', token);
