var express = require('express');
var contact = express.Router();
var database = require('../../Database/database');
var cors = require('cors')
var jwt = require('jsonwebtoken');


contact.use(cors());

contact.use(function(req, res, next) {
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


/* Listes des contacts d'un utilisateur */
contact.get('/liste', function(req, res) {
    token = req.body.token || req.headers['authorization'];
    var decodedToken = jwt.decode(token);
    const utilisateurId = decodedToken.utilisateurId; 
    var sql = `
    SELECT contacts.*, users.id, users.email, users.username, users.firstname, users.lastname, users.photoUrl 
    FROM contacts
    INNER JOIN users ON (contacts.userid2 = users.id OR contacts.userid1 = users.id)
    WHERE (contacts.userid1 = ? OR contacts.userid2 = ?) AND users.id <> ?
  `;

  database.query(sql, [utilisateurId, utilisateurId, utilisateurId], function(error, results) {
    if (error) {
      console.error('Erreur lors de la récupération des contacts :', error);
      res.status(500).json({ error: 'Une erreur est survenue lors de la récupération des contacts.' });
    } else {
      res.status(200).json(results);
    }
  });

});

/* recherche un contacts par nom ou prenom  */
contact.get('/recherche/:valeur', function(req, res) {
  const valeur = req.params.valeur;
  token = req.body.token || req.headers['authorization'];
  var decodedToken = jwt.decode(token);
  const utilisateurId = decodedToken.utilisateurId;   
  
  const sql = `SELECT users.id, users.email, users.username, users.firstname, users.lastname, users.photoUrl FROM users INNER JOIN contacts ON (contacts.userid2 = users.id OR contacts.userid1 = users.id)
  WHERE (contacts.userid1 = ? OR contacts.userid2 = ?) AND users.id <> ? AND (users.firstname LIKE '%${valeur}%' OR users.lastname LIKE '%${valeur}%') `;
  
  database.query(sql,[utilisateurId, utilisateurId, utilisateurId], (error, results) => {
      if (error) {
          console.error('Erreur lors de la recherche des utilisateurs :', error);
          res.status(500).json({ error: 'Une erreur est survenue lors de la recherche des utilisateurs.' });
      } else {
          res.status(200).json(results);
      }
  });

});


/* obtenir les informations d'un contact*/
contact.get('/:id', function(req, res) {
  const utilisateurId = req.params.id;
  
  const query = 'SELECT id, email, username, firstname, lastname, photoUrl FROM users WHERE id = ?';
  
  database.query(query, [utilisateurId], (error, results) => {
      if (error) {
          console.error('Erreur lors de la récupération des informations de l\'utilisateur :', error);
          res.status(500).json({ error: 'Une erreur est survenue lors de la récupération des informations de l\'utilisateur.' });
      } else {
          if (results.length === 0) {
              res.status(404).json({ error: 'Utilisateur non trouvé.' });
          } else {
              const utilisateur = results[0];
              res.status(200).json(utilisateur);
          }
      }
  });
});


/* Voir la liste des demandes en contact  */
contact.post('/demandes', function(req, res) {


});

module.exports = contact;