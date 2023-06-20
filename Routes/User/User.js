var express = require('express');
var user = express.Router();
var database = require('../../Database/database');
var cors = require('cors')
var jwt = require('jsonwebtoken');


user.use(cors());


user.use(function(req, res, next) {
    var token = req.body.token || req.headers['authorization'];
    var appData = {};
    if (token) {
        jwt.verify(token, process.env.SECRET_KEY, function(err) {
            if (err) {
                appData["statut"] = false;
                appData["data"] = "Le Token est invalide";
                res.status(500).json(appData);
            } else {
                next();
            }
        });
    } else {
        appData["statut"] = false;
        appData["message"] = "Absence de token dans la requête. Impossible d'accéder à cette ressource.";
        res.status(403).json(appData);
    }
});



/* profil utilisateur */
user.get('/profil', function(req, res) {
    token = req.body.token || req.headers['authorization'];
    var decodedToken = jwt.decode(token);

    const sql = `SELECT email, username, firstname, lastname, photoUrl, createdAt, updatedAt
    FROM users
    WHERE id = ?`;

    database.query(sql, [decodedToken.utilisateurId], (error, results) => {
    if (error) {
        console.error('Erreur lors de la récupération du profil :', error);
        return res.status(500).json({ error: 'Une erreur est survenue lors de la récupération du profil.' });
    }

    if (results.length === 0) {
       return res.status(404).json({ error: 'Utilisateur introuvable' });
    }

    const profil = results[0];
    return res.status(200).json(profil);
  });
     
});

user.patch('/profil', function(req, res){
    token = req.body.token || req.headers['authorization'];
    var decodedToken = jwt.decode(token);
    var { email, username, firstname, lastname, photoUrl } = req.body;

    database.query('SELECT * FROM users WHERE id = ?', [decodedToken.utilisateurId], (error, results) => {
        if (error) {
          console.error('Erreur lors de la recherche de l\'utilisateur :', error);
          res.status(500).json({ error: 'Une erreur est survenue lors de la recherche de l\'utilisateur.' });
        } else {
          if (results.length === 0) {
            res.status(404).json({ error: 'Utilisateur non trouvé.' });
          } else {
            
            var updatedUser = {
              email: email || results[0].email,
              username: username || results[0].username,
              firstname: firstname || results[0].firstname,
              lastname: lastname || results[0].lastname,
              photoUrl: photoUrl || results[0].photoUrl,
              updatedAt: new Date(),
            };
    
            database.query('UPDATE users SET ? WHERE id = ?', [updatedUser, decodedToken.utilisateurId], (error, results) => {
              if (error) {
                console.error('Erreur lors de la mise à jour des informations de l\'utilisateur :', error);
                res.status(500).json({ error: 'Une erreur est survenue lors de la mise à jour des informations de l\'utilisateur.' });
              } else {
                res.status(200).json({ message: 'Informations de l\'utilisateur mises à jour avec succès.' });
              }
            });
          }
        }
      });
});



/* Voir la liste des discutions  */
user.post('/discussion/liste', function(req, res) {


});






module.exports = user;