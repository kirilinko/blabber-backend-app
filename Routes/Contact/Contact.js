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
    SELECT contacts.*, users.id as friend_id, users.email, users.username, users.firstname, users.lastname, users.photoUrl 
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

/* recherche un contacts par nom ou prenom  ou email ou username */
contact.get('/:idcontact', function(req, res) {
  const {idcontact} = req.params;
  token = req.body.token || req.headers['authorization'];
  var decodedToken = jwt.decode(token);
  const utilisateurId = decodedToken.utilisateurId;   
  var sql = `
    SELECT contacts.*, users.id as friend_id, users.email, users.username, users.firstname, users.lastname, users.photoUrl 
    FROM contacts
    INNER JOIN users ON (contacts.userid2 = users.id OR contacts.userid1 = users.id)
    WHERE (contacts.userid1 = ? OR contacts.userid2 = ?) AND users.id <> ? AND contacts.id=?
  `
  database.query(sql,[utilisateurId, utilisateurId, utilisateurId, idcontact], (error, results) => {
    if (error) {
      console.error('Erreur lors de la recherche des utilisateurs :', error);
      res.status(500).json({ error: 'Une erreur est survenue lors de la recherche des utilisateurs.' });
    }
      else {
        res.status(200).json(results);
      }
   });
});

/* supprimer un contact  */
contact.delete('/:contactId', function(req, res) {
  const { contactId } = req.params;
  database.query('DELETE FROM contacts WHERE id = ?', [contactId], (error, deleteResults) => {
    if (error) {
      console.error('Erreur lors de la suppression du contact :', error);
      res.status(500).json({ error: 'Une erreur est survenue lors de la suppression du contact.' });
    }
      else if (deleteResults.affectedRows === 0) {
        res.status(404).json({ error: 'Contact introuvable.' });
     }
       else {
        res.status(200).json({ success: true, message: 'Le contact a été supprimé avec succès.' });
     }
  });
});

// bloquer un contact
contact.patch('/:contactId', function(req, res) {
  token = req.body.token || req.headers['authorization'];
  var decodedToken = jwt.decode(token);
  const userId = decodedToken.utilisateurId; 
  const { contactId } = req.params;
  var {blocked} = req.query;
  const updatedAt = new Date();
  blocked=blocked.toLowerCase() === 'true'
   
  // Vérifier si le contact existe
  const checkContactQuery = 'SELECT * FROM contacts WHERE id = ?';
  database.query(checkContactQuery, [contactId], (error, contactResults) => {
    if (error) {
      console.error('Erreur lors de la vérification du contact :', error);
      res.status(500).json({ error: 'Une erreur est survenue lors de la vérification du contact.' });
    }
       else if (contactResults.length === 0) {
        res.status(404).json({ error: 'Contact introuvable.' });
      }
        else {
          const contact = contactResults[0];
          let blockedUserIdColumn = ''; 
        if (userId == contact.userid1) {
          blockedUserIdColumn = 'blockedUserid1';
        }
          else if (userId == contact.userid2) {
            blockedUserIdColumn = 'blockedUserid2';
          }
            else {
              res.status(400).json({ error: 'Vous n\'êtes pas autorisé à bloquer ce contact.' });
              return;
           }
      console.log( blocked);
      // Mettre à jour le contact avec l'utilisateur bloqué
      const updateContactQuery = `UPDATE contacts SET ${blockedUserIdColumn} = ?, updatedAt = ? WHERE id = ?`;
      database.query(updateContactQuery, [blocked, updatedAt, contactId], (error, updateResults) => {
        if (error) {
          console.error('Erreur lors de la mise à jour du contact :', error);
          res.status(500).json({ error: 'Une erreur est survenue lors de la mise à jour du contact.' });
        }
          else {
            var sql = `
             SELECT contacts.*, users.id as friend_id, users.email, users.username, users.firstname, users.lastname, users.photoUrl 
             FROM contacts
             INNER JOIN users ON (contacts.userid2 = users.id OR contacts.userid1 = users.id)
             WHERE (contacts.userid1 = ? OR contacts.userid2 = ?) AND users.id <> ? AND contacts.id=?`;
      
            database.query(sql,[userId, userId, userId, contactId], (error, results) => {
              if (error) {
                console.error('Erreur lors de la recherche des utilisateurs :', error);
                res.status(500).json({ error: 'Une erreur est survenue lors de la recherche des utilisateurs.' });
              }
                 else {
                  res.status(200).json(results);
                }
            });
         }
      });
    }
  });
});


module.exports = contact;