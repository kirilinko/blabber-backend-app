

const path = require('path');
const multer = require('multer');
var express = require('express');
const bcrypt = require('bcrypt');
var jwt = require('jsonwebtoken');
var database = require('../../Database/database');
var user = express.Router();
var cors = require('cors')

const storage = multer.diskStorage({
  destination: 'uploads/',
  filename: function(req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const extension = path.extname(file.originalname);
    const fileName = uniqueSuffix + extension;
    cb(null, fileName);
  }
});

const upload = multer({ storage });

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

    const sql = `SELECT id, email, username, firstname, lastname, photoUrl, createdAt, updatedAt
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

// update user information
user.patch('/profil', function(req, res){
    token = req.body.token || req.headers['authorization'];
    var decodedToken = jwt.decode(token);
    var { email, username, firstname, lastname } = req.body;

    database.query('SELECT * FROM users WHERE id = ?', [decodedToken.utilisateurId], (error, results) => {
        if (error) {
          console.error('Erreur lors de la recherche de l\'utilisateur :', error);
          res.status(500).json({ error: 'Une erreur est survenue lors de la recherche de l\'utilisateur.' });
        } 
          else {
            if (results.length === 0) {
            res.status(404).json({ error: 'Utilisateur non trouvé.' });
          } 
            else {
            var updatedUser = {
              email: email || results[0].email,
              username: username || results[0].username,
              firstname: firstname || results[0].firstname,
              lastname: lastname || results[0].lastname,
              updatedAt: new Date(),
            };
    
            database.query('UPDATE users SET ? WHERE id = ?', [updatedUser, decodedToken.utilisateurId], (error, results) => {
              if (error) {
                console.error('Erreur lors de la mise à jour des informations de l\'utilisateur :', error);
                res.status(500).json({ error: 'Une erreur est survenue lors de la mise à jour des informations de l\'utilisateur.' });
              } else {
                res.status(200).json({ updatedUser });
              }
            });
          }
        }
      });
});



  // Mettre  à jour la photo de profile 

  user.patch('/photo', upload.single('photo'), function(req, res) {
    token = req.body.token || req.headers['authorization'];
    var decodedToken = jwt.decode(token);
    const  userId   = decodedToken.utilisateurId;
    const photoUrl = req.file.filename; 
    console.log(photoUrl)
    const sql = ` UPDATE users SET photoUrl = ? WHERE id = ? `;
  
    database.query(sql, [photoUrl, userId], (error, result) => {
      if (error) {
        console.error('Erreur lors de la mise à jour de la photo de profil :', error);
        res.status(500).json({ error: 'Une erreur est survenue lors de la mise à jour de la photo de profil.' });
      } 
       else {
        const sql = `SELECT id, email, username, firstname, lastname, photoUrl, createdAt, updatedAt FROM users  WHERE id = ?`;
        database.query(sql, [userId], (error, results) => {
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
      }
    });
  });



/* mettre  à jour le mot de passe  */
user.patch('/password', function(req, res) {
  const { password, newpassword } = req.body;
  token = req.body.token || req.headers['authorization'];
  var decodedToken = jwt.decode(token);
  const utilisateurId = decodedToken.utilisateurId; 
  
  database.query('SELECT * FROM users WHERE id = ?', [utilisateurId], (error, results) => {
    if (error) {
      console.error('Erreur lors de la recherche de l\'utilisateur :', error);
      res.status(500).json({ error: 'Une erreur est survenue lors de la recherche de l\'utilisateur.' });
    } 
      else {
        if (results.length === 0) {
          res.status(404).json({ error: 'Utilisateur introuvable.' });
        }
          else {
            const users = results[0];
            bcrypt.compare(password, users.password, function(err, isMatch) {
            if (err) {
               console.error('Erreur lors de la comparaison des mots de passe :', err);
               res.status(500).json({ error: 'Une erreur est survenue lors de la comparaison des mots de passe.' });
            }  
              else if (isMatch) {
            // Mettre à jour le nouveau mot de passe
               bcrypt.hash(newpassword, 10, function(err, hash) {
                 if (err) {
                 console.error('Erreur lors du hachage du nouveau mot de passe :', err);
                 res.status(500).json({ error: 'Une erreur est survenue lors du hachage du nouveau mot de passe.' });
                 }
                  else {
                    const updateData = {
                    password: hash,
                    updatedAt: new Date()
                  };

                database.query('UPDATE users SET ? WHERE id = ?', [updateData, utilisateurId], (error) => {
                  if (error) {
                    console.error('Erreur lors de la mise à jour du mot de passe :', error);
                    res.status(500).json({ error: 'Une erreur est survenue lors de la mise à jour du mot de passe.' });
                  }
                    else {
                      delete users.password
                      res.status(200).json({users});
                    }
                });
              }
            });
          } 
           else {
             res.status(401).json({ error: 'Ancien mot de passe incorrect.' });
           }
        });
      }
    }
  });

});



/* recherche un utilisateur par nom ou prenom  ou email ou username */
user.get('/recherche/:valeur', function(req, res) {
  const valeur = req.params.valeur; 
  
  const sql = `SELECT id, email, username, firstname, lastname, photoUrl FROM users WHERE  email LIKE '%${valeur}%' OR lastname LIKE '%${valeur}%' OR firstname LIKE '%${valeur}%'  `;
  database.query(sql,[], (error, results) => {
      if (error) {
          console.error('Erreur lors de la recherche des utilisateurs :', error);
          res.status(500).json({ error: 'Une erreur est survenue lors de la recherche des utilisateurs.' });
      } else {
          res.status(200).json(results);
      }
  });

});


/* informations du profile par id */
user.get('/:idvalue', function(req, res) {
  const idvalue = req.params.idvalue;
  const sql = `SELECT id, email, username, firstname, lastname, photoUrl, createdAt, updatedAt FROM users WHERE id = ?`;

  database.query(sql, [idvalue], (error, results) => {
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


module.exports = user;