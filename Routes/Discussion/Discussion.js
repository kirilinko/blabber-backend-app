var express = require('express');
var cors = require('cors');
var discussion = express.Router();
var jwt = require('jsonwebtoken');
var database = require('../../Database/database');

discussion.use(cors());

discussion.use(function(req, res, next) {
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


 // Créer une discussions
discussion.post('/', (req, res) => {
   
    token = req.body.token || req.headers['authorization'];
    var decodedToken = jwt.decode(token);
    const currentId = decodedToken.utilisateurId; 

    const { tag, name, description, participants } = req.body;
    const createdAt = new Date();
    const updatedAt=  new Date();
    var current_user={"userId":currentId, "isAdmin":true}

    participants.push(current_user)

    const createDiscussionQuery = 'INSERT INTO discussions (tag, name, description, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?)';
    database.query(createDiscussionQuery, [tag, name, description, createdAt, updatedAt], (error, discussionResults) => {
      if (error) {
        console.error('Erreur lors de la création de la discussion :', error);
        res.status(500).json({ error: 'Une erreur est survenue lors de la création de la discussion.' });
      }
       else {
        const discussionId = discussionResults.insertId;
        // Créer des occurrences de participants liées à l'id de la discussion
        const createParticipantQuery = 'INSERT INTO participants (userId, isAdmin, addedAt, hasNewNotif, isArchivedChat, discussionId) VALUES (?, ?, ?, ?, ?, ?)';
        // Utiliser une boucle pour insérer chaque participant
        participants.forEach((participant) => {
          const { userId, isAdmin } = participant;
          const participantQueryValues = [userId, isAdmin, createdAt, false, false, discussionId];
          database.query(createParticipantQuery, participantQueryValues, (error, participantResults) => {
            if (error) {
              console.error('Erreur lors de la création du participant :', error);
              res.status(500).json({ error: 'Une erreur est survenue lors de la création du participant.' });
            }
          });
        });
        console.log('Discussion privée créée avec succès!');
        const getDiscussionQuery = `
        SELECT d.id, d.tag, d.createdAt, d.updatedAt, p.id AS participantId, p.userId, p.isAdmin, p.addedAt, p.hasNewNotif, p.isArchivedChat,  u.email, u.username, u.firstname, u.lastname, u.photoUrl
        FROM discussions d
        INNER JOIN participants p ON d.id = p.discussionId
        INNER JOIN users u ON p.userId=u.id
        WHERE d.id = ? `;

        database.query(getDiscussionQuery, [discussionId], (error, discussionResults) => {
          if (error) {
            console.error('Erreur lors de la récupération de la discussion :', error);
            res.status(500).json({ error: 'Une erreur est survenue lors de la récupération de la discussion.' });
          }
            else {
              console.log('Discussion privée créée avec succès!');
              const sqllastmessage = 'INSERT INTO lastmessages (discussionId) VALUES (?)';
              database.query(sqllastmessage, [discussionId], (error, lastmessageResult) => {
                if (error) {
                  console.log("Erreur lors de la création du last message :", error);
                } 
              });
              res.status(200).json(discussionResults);
           }
        });
       }
    });
  });


// Archiver une discussion
discussion.patch('/archive/:discussionId', function(req, res) {
  token = req.body.token || req.headers['authorization'];
  var decodedToken = jwt.decode(token);
  var {archived}= req.body;
  console.log(archived) 
  const userId = decodedToken.utilisateurId; 
  const {discussionId} = req.params;

  // Vérifier si l'utilisateur participe à la discussion
  const checkParticipantQuery = 'SELECT * FROM participants WHERE discussionId = ? AND userId = ?';
  database.query(checkParticipantQuery, [discussionId, userId], (error, participantResults) => {
    if (error) {
      console.error('Erreur lors de la vérification de la participation :', error);
      res.status(500).json({ error: 'Une erreur est survenue lors de la vérification de la participation.' });
    }
      else if (participantResults.length === 0) {
        res.status(404).json({ error: 'Vous ne participez pas à cette discussion.' });
     }
        else {
          // Archiver la discussion en mettant à jour le champ isArchivedChat
          const updateDiscussionQuery = 'UPDATE participants SET isArchivedChat = ? WHERE discussionId = ? AND userId= ?';
          database.query(updateDiscussionQuery, [archived, discussionId, userId], (error, updateResults) => {
          if (error) {
            console.error('Erreur lors de l\'archivage de la discussion :', error);
            res.status(500).json({ error: 'Une erreur est survenue lors de l\'archivage de la discussion.' });
          }
            else {
              // Récupérer l'occurrence de la discussion et les participants mis à jour
              const getDiscussionQuery = `
              SELECT d.*, p.id AS participantId, p.userId, p.isAdmin, p.addedAt, p.hasNewNotif, p.isArchivedChat, u.email, u.username, u.firstname, u.lastname, u.photoUrl
              FROM discussions d
              INNER JOIN participants p ON d.id = p.discussionid
              INNER JOIN users u ON p.userId=u.id
              WHERE d.id = ? `;

              database.query(getDiscussionQuery, [discussionId, userId], (error, discussions) => {
                if (error) {
                console.error('Erreur lors de la récupération de la discussion :', error);
                res.status(500).json({ error: 'Une erreur est survenue lors de la récupération de la discussion.' });
              }
                else {
                  if (discussions.length === 0) {
                  res.status(404).json({ error: 'Discussion introuvable.' });
                } 
                  else {
                    res.status(200).json({ discussions });
                  }
               }
            });
          }
       });
     }
  });
});



//mettre à jour les informations d'une discussion
discussion.patch('/:discussionId', function(req, res) {
  const {discussionId} = req.params;
  const { name, description } = req.body;
  const updateDiscussionQuery = 'UPDATE discussions SET name = ?, description = ? WHERE id = ?';
  database.query(updateDiscussionQuery, [name, description, discussionId], (error, updateResults) => {
    if (error) {
      console.error('Erreur lors de la mise à jour de la discussion :', error);
      res.status(500).json({ error: 'Une erreur est survenue lors de la mise à jour de la discussion.' });
    }
      else if (updateResults.affectedRows === 0) {
        res.status(404).json({ error: 'Discussion introuvable.' });
      }
        else {
          // Récupérer les informations mises à jour de la discussion
          const getDiscussionQuery = `
          SELECT d.*, p.id AS participantId, p.userId, p.isAdmin, p.addedAt, p.hasNewNotif, p.isArchivedChat, u.email, u.username, u.firstname, u.lastname, u.photoUrl
          FROM discussions d
          INNER JOIN participants p ON d.id = p.discussionid
          INNER JOIN users u ON p.userId=u.id
          WHERE d.id = ? `;
          database.query(getDiscussionQuery, [discussionId], (error, results) => {
            if (error) {
              console.error('Erreur lors de la récupération de la discussion :', error);
              res.status(500).json({ error: 'Une erreur est survenue lors de la récupération de la discussion.' });
            }
              else {
                if (results.length === 0) {
                  res.status(404).json({ error: 'Discussion introuvable.' });
                }
                  else {
                    // Retourner l'occurrence de la discussion avec les participants
                    const discussion = results;
                    res.status(200).json({ discussion});
                 }
              }
           });
          }
      });
  });

/*Ajouter des administrateur à une disicussion*/
discussion.patch('/admin/:discussionId', function(req,res) {
  const {discussionId}=req.params;
  const{participants}= req.body;
  const sqlquery=`UPDATE participants SET isAdmin=? WHERE userId=? AND discussionId=?`;

  participants.forEach((participant) => {
    const { userId, isAdmin } = participant;
    const participantQueryValues = [isAdmin, userId, discussionId];
    
    database.query(sqlquery, participantQueryValues, (error, participantResults) => {
      if (error) {
        console.error('Erreur lors de la création du participant :', error);
        res.status(500).json({ error: 'Une erreur est survenue lors de la création du participant.' });
      }
        else{
          const getDiscussionQuery = `
          SELECT d.*, p.id AS participantId, p.userId, p.isAdmin, p.addedAt, p.hasNewNotif, p.isArchivedChat, u.email, u.username, u.firstname, u.lastname, u.photoUrl
          FROM discussions d
          INNER JOIN participants p ON d.id = p.discussionid INNER JOIN users u ON p.userId=u.id
          WHERE d.id = ? `;
         
          database.query(getDiscussionQuery, [discussionId], (error, results) => {
            if (error) {
              console.error('Erreur lors de la récupération de la discussion :', error);
              res.status(500).json({ error: 'Une erreur est survenue lors de la récupération de la discussion.' });
            }
              else {
                if (results.length === 0) {
                  res.status(404).json({ error: 'Discussion introuvable.' });
               }
                 else {
                  // Retourner l'occurrence de la discussion avec les participants
                  const discussion = results;
                  res.status(200).json({ discussion});
                }
             }
          })
        }
     });
   });
 })



// Ajouter un participant  à une discussion
discussion.patch('/add/:discussionId', function(req,res) {
  const {discussionId}=req.params;
  const{participants}= req.body;
  const sqlquery=`INSERT INTO participants(userId, isAdmin, addedAt, hasNewNotif, isArchivedChat, discussionId) VALUES(?, ?, ?, ?, ?, ?)`

  participants.forEach((participant) => {
    const { userId } = participant;
    const participantQueryValues = [userId, false, new Date(), false, false, discussionId];
    
    database.query(sqlquery, participantQueryValues, (error, participantResults) => {
      if (error) {
        console.error('Erreur lors de la création du participant :', error);
        res.status(500).json({ error: 'Une erreur est survenue lors de la création du participant.' });
      }
        else{
          const getDiscussionQuery = `
          SELECT d.*, p.id AS participantId, p.userId, p.isAdmin, p.addedAt, p.hasNewNotif, p.isArchivedChat, u.email, u.username, u.firstname, u.lastname, u.photoUrl
          FROM discussions d
          INNER JOIN participants p ON d.id = p.discussionid INNER JOIN users u ON p.userId=u.id
          WHERE d.id = ? `;
          database.query(getDiscussionQuery, [discussionId], (error, results) => {
            if (error) {
              console.error('Erreur lors de la récupération de la discussion :', error);
              res.status(500).json({ error: 'Une erreur est survenue lors de la récupération de la discussion.' });
            }
              else {
                if (results.length === 0) {
                  res.status(404).json({ error: 'Discussion introuvable.' });
                }
                  else {
                   // Retourner l'occurrence de la discussion avec les participants
                   const discussion = results;
                   res.status(200).json({ discussion});
                 }
              }        
          })
        }
     });
   });
 })


// Liste des discussions d'un utilisateur en ligne
discussion.get('/list', function(req,res) {
  token = req.body.token || req.headers['authorization'];
  var decodedToken = jwt.decode(token);
  const userId = decodedToken.utilisateurId;

  const getDiscussionQuery = `
  SELECT d.*
  FROM discussions d
  INNER JOIN participants p ON d.id = p.discussionid INNER JOIN users u ON p.userId=u.id
  WHERE u.id = ? `;
  database.query(getDiscussionQuery, [userId], (error, results) => {
    if (error) {
      console.error('Erreur lors de la récupération de la discussion :', error);
      res.status(500).json({ error: 'Une erreur est survenue lors de la récupération de la discussion.' });
    }
      else {
        if (results.length === 0) {
          res.status(404).json({ error: 'Discussion introuvable.' });
         }
           else {
            // Retourner l'occurrence de la discussion avec les participants
            const discussion = results;
            res.status(200).json({ discussion});
          }
      }        
   })
})


// Discussion entre deux utilisateur. Celui connecter et un autre
discussion.get('/between', function(req,res) {
  token = req.body.token || req.headers['authorization'];
  var decodedToken = jwt.decode(token);
  const userId = decodedToken.utilisateurId;
  const {secondId}=req.body;
  
  const getDiscussionQuery = `
   SELECT d.*, p1.userId AS participant1 , p2.userId AS participant2
   FROM discussions d
   INNER JOIN participants p1 ON d.id = p1.discussionId
   INNER JOIN participants p2 ON d.id = p2.discussionId
   WHERE p1.userId = ? AND p2.userId = ? AND d.tag = "PRIVATE" `;
  database.query(getDiscussionQuery, [secondId,userId], (error, results) => {
    if (error) {
      console.error('Erreur lors de la récupération de la discussion :', error);
      res.status(500).json({ error: 'Une erreur est survenue lors de la récupération de la discussion.' });
    }
      else {
        if (results.length === 0) {
          res.status(404).json({ error: 'Discussion introuvable.' });
       }
         else {
           // Retourner l'occurrence de la discussion avec les participants
          const discussion = results;
          res.status(200).json({ discussion});
        }
      }        
    })
  })

// supprimer un utilisateur d'une discussion
discussion.patch('/remove/:discussionId', function(req,res) {
  const {discussionId}=req.params;
  const{participants}= req.body;
  const sqlquery=`DELETE FROM participants WHERE userId=? AND discussionId=?`

  participants.forEach((participant) => {
    const { userId } = participant;
    const participantQueryValues = [userId,discussionId];
    
    database.query(sqlquery, participantQueryValues, (error, participantResults) => {
      if (error) {
        console.error('Erreur lors de la suppression du participant :', error);
        res.status(500).json({ error: 'Une erreur est survenue lors de la suppression du participant' });
      }
        else{
          const getDiscussionQuery = `
          SELECT d.*, p.id AS participantId, p.userId, p.isAdmin, p.addedAt, p.hasNewNotif, p.isArchivedChat, u.email, u.username, u.firstname, u.lastname, u.photoUrl
          FROM discussions d
          INNER JOIN participants p ON d.id = p.discussionid INNER JOIN users u ON p.userId=u.id
          WHERE d.id = ?
        `;
        database.query(getDiscussionQuery, [discussionId], (error, results) => {
          if (error) {
            console.error('Erreur lors de la récupération de la discussion :', error);
            res.status(500).json({ error: 'Une erreur est survenue lors de la récupération de la discussion.' });
          } 
            else {
              if (results.length === 0) {
                res.status(404).json({ error: 'Discussion introuvable.' });
              }
                else {
                  // Retourner l'occurrence de la discussion avec les participants
                  const discussion = results;
                  res.status(200).json({ discussion});
               }
            }
         })
        }
     });
   });
 })


// Supprimer une discussion
discussion.delete('/:discussionId', function(req,res) {
  const {discussionId}=req.params;
  const sqlquery_participants=`DELETE FROM participants WHERE discussionId=?`;
  const sqlquery_discussions=`DELETE FROM discussions WHERE id=?`

  const sqlquery_Values = [discussionId];
  database.query(sqlquery_participants, sqlquery_Values, (error, participantResults) => {
    if (error) {
      console.error('Erreur lors de la suppression des participant :', error);
      res.status(500).json({ error: 'Une erreur est survenue lors de la suppression du participant' });
    }
      else{   
        database.query(sqlquery_discussions, sqlquery_Values, (error, discussionResults)=>{
          if(error){
            console.error('Erreur lors de la suppression des participant :', error);
            res.status(500).json({ error: 'Une erreur est survenue lors de la suppression du participant' });
          }
            else{
              res.status(200).json({ success:true, message:"Discussion correctement supprimer"});
            }
          })
       }
   });
})


// Quitter une discussion
discussion.patch('/leave/:discussionId', function(req,res) {
  token = req.body.token || req.headers['authorization'];
  var decodedToken = jwt.decode(token);

  const userId = decodedToken.utilisateurId;
  const {discussionId}=req.params;
  const sqlquery=`DELETE FROM participants WHERE userId=? AND discussionId=?`
  const participantQueryValues = [userId,discussionId];
    
  database.query(sqlquery, participantQueryValues, (error, participantResults) => {
    if (error) {
      console.error('Erreur lors de la suppression du participant :', error);
      res.status(500).json({ error: 'Une erreur est survenue lors de la suppression du participant' });
    }
      else{
        const getDiscussionQuery = `
         SELECT d.*, p.id AS participantId, p.userId, p.isAdmin, p.addedAt, p.hasNewNotif, p.isArchivedChat, u.email, u.username, u.firstname, u.lastname, u.photoUrl
         FROM discussions d
         INNER JOIN participants p ON d.id = p.discussionid INNER JOIN users u ON p.userId=u.id
         WHERE d.id = ?`;
        database.query(getDiscussionQuery, [discussionId], (error, results) => {
          if (error) {
            console.error('Erreur lors de la récupération de la discussion :', error);
            res.status(500).json({ error: 'Une erreur est survenue lors de la récupération de la discussion.' });
          }
            else {
              if (results.length === 0) {
                res.status(404).json({ error: 'Discussion introuvable.' });
              }
                else {
                  // Retourner l'occurrence de la discussion avec les participants
                  const discussion = results;
                  res.status(200).json({ discussion});
                }
            }
        })
      }
   });
})



// obtenir les informations d'un discussion

discussion.get('/:discussionId', function(req,res){
  const {discussionId} = req.params;
  const getDiscussionQuery = `
   SELECT d.*, p.id AS participantId, p.userId, p.isAdmin, p.addedAt, p.hasNewNotif, p.isArchivedChat, u.email, u.username, u.firstname, u.lastname, u.photoUrl
   FROM discussions d
   INNER JOIN participants p ON d.id = p.discussionid
   INNER JOIN users u ON p.userId=u.id
   WHERE d.id = ? `;
  database.query(getDiscussionQuery, [discussionId], (error, results) => {
    if (error) {
      console.error('Erreur lors de la récupération de la discussion :', error);
      res.status(500).json({ error: 'Une erreur est survenue lors de la récupération de la discussion.' });
    }
      else {
        if (results.length === 0) {
        res.status(404).json({ error: 'Discussion introuvable.' });
      }
        else {
          // Retourner l'occurrence de la discussion avec les participants
          const discussion = results; 
          res.status(200).json({ discussion});
        } 
      }
   });
})


module.exports = discussion;