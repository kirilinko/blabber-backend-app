var express = require('express');
var cors = require('cors');
var index = express.Router();
const bcrypt = require('bcrypt');
var jwt = require('jsonwebtoken');
var database = require('../../Database/database');




index.use(cors());

// inscription utilisateur

index.post('/inscription', function(req, res) {
  var { email, username, firstname, lastname, password } = req.body;
  var createdAt = new Date(); 
  var updatedAt = new Date();

  bcrypt.hash(password, 10, function(err, hash) {
    if (err) {
      console.error('Erreur lors du hachage du mot de passe :', err);
      res.status(500).json({ error: 'Une erreur est survenue lors du hachage du mot de passe.' });
    } else {
      password = hash;
      const userData = { email, username, firstname, lastname, password, createdAt, updatedAt };
      database.query('INSERT INTO users SET ?', userData, (error, results) => {
        if (error) {
          console.error('Erreur lors de l\'insertion :', error);
          res.status(500).json({ error: 'Une erreur est survenue lors de l\'insertion.' });
        } else {
          const insertedUserId = results.insertId;
          database.query('SELECT email, username, firstname, lastname, createdAt, updatedAt FROM users WHERE id = ?', insertedUserId, (error, userResults) => {
            if (error) {
              console.error('Erreur lors de la récupération des informations de l\'utilisateur :', error);
              res.status(500).json({ error: 'Une erreur est survenue lors de la récupération des informations de l\'utilisateur.' });
            } else {
              const user = userResults[0];
              delete user.password;
              res.status(200).json({user});
            }
          });
        }
      });
    }
  });
});


// connexion utilisateur

index.post('/connexion', function(req, res) {
   
    const { email, password } = req.body;

    database.query('SELECT * FROM users WHERE email = ?', [email], (error, results) => {
      if (error) {
        console.error('Erreur lors de la recherche de l\'utilisateur :', error);
        res.status(500).json({ error: 'Une erreur est survenue lors de la recherche de l\'utilisateur.' });
      } 
       else {
           if (results.length === 0) {
              res.status(401).json({ error: 'Nom d\'utilisateur incorrect.' });
          }
           else {
             const utilisateur = results[0];

                    bcrypt.compare(password, utilisateur.password, function(err, result) {
                        if (err) {
                          // Une erreur s'est produite lors de la comparaison
                          console.error('Erreur lors de la comparaison :', err);
                        } else {
                          if (result) {
                            const token = jwt.sign({ utilisateurId: utilisateur.id }, process.env.SECRET_KEY, { expiresIn: '4h' });
                            delete results[0].password
                            users=results[0]
                            res.status(200).json({statut:true, users , token });
                            console.log('Les valeurs correspondent.');
                          } else {
                            res.status(401).json({ error: 'Mot de passe incorrect.' });
                            console.log('Les valeurs ne correspondent pas.');
                          }
                        }
                  });
                
           }
        }
    });

});


module.exports = index;