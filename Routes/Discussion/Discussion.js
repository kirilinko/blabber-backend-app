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



discussion.post('/', (req, res) => {
   
    token = req.body.token || req.headers['authorization'];
    var decodedToken = jwt.decode(token);
    const currentId = decodedToken.utilisateurId; 

    const { tag, name, description, participants } = req.body;
    const createdAt = new Date();
    const updatedAt=  new Date();
    var current_user={"userId":currentId, "isAdmin":true}

    participants.push(current_user)

    // 1. Créer une occurrence de discussions avec le tag spécifié
    const createDiscussionQuery = 'INSERT INTO discussions (tag, name, description, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?)';
    database.query(createDiscussionQuery, [tag, name, description, createdAt, updatedAt], (error, discussionResults) => {
      if (error) {
        console.error('Erreur lors de la création de la discussion :', error);
        res.status(500).json({ error: 'Une erreur est survenue lors de la création de la discussion.' });
      } else {
        const discussionId = discussionResults.insertId;
  
        // 2. Créer des occurrences de participants liées à l'id de la discussion
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
        SELECT d.id, d.tag, d.createdAt, d.updatedAt, p.id AS participantId, p.userId, p.isAdmin, p.addedAt, p.hasNewNotif, p.isArchivedChat
        FROM discussions d
        INNER JOIN participants p ON d.id = p.discussionId
        WHERE d.id = ?
      `;

      database.query(getDiscussionQuery, [discussionId], (error, discussionResults) => {
        if (error) {
          console.error('Erreur lors de la récupération de la discussion :', error);
          res.status(500).json({ error: 'Une erreur est survenue lors de la récupération de la discussion.' });
        } else {
          console.log('Discussion privée créée avec succès!');
          res.status(200).json(discussionResults);
        }
      });
      }
    });
  });





// Route pour archiver une discussion
discussion.patch('/archive/:discussionId', function(req, res) {
  token = req.body.token || req.headers['authorization'];
  var decodedToken = jwt.decode(token);
  var {archived}= req.body;
  console.log(archived)
  const userId = decodedToken.utilisateurId; 
  const {discussionId} = req.params;

  
    // Supposons que vous utilisez une authentification et avez l'id de l'utilisateur connecté

  // Vérifier si l'utilisateur participe à la discussion
  const checkParticipantQuery = 'SELECT * FROM participants WHERE discussionId = ? AND userId = ?';
  database.query(checkParticipantQuery, [discussionId, userId], (error, participantResults) => {
    if (error) {
      console.error('Erreur lors de la vérification de la participation :', error);
      res.status(500).json({ error: 'Une erreur est survenue lors de la vérification de la participation.' });
    } else if (participantResults.length === 0) {
      res.status(404).json({ error: 'Vous ne participez pas à cette discussion.' });
    } else {
      // Archiver la discussion en mettant à jour le champ isArchivedChat
      const updateDiscussionQuery = 'UPDATE participants SET isArchivedChat = ? WHERE discussionId = ? AND userId= ?';
      database.query(updateDiscussionQuery, [archived, discussionId, userId], (error, updateResults) => {
        if (error) {
          console.error('Erreur lors de l\'archivage de la discussion :', error);
          res.status(500).json({ error: 'Une erreur est survenue lors de l\'archivage de la discussion.' });
        } else {
          // Récupérer l'occurrence de la discussion et les participants mis à jour
          const getDiscussionQuery = `
            SELECT d.*, p.id AS participantId, p.userId, p.isAdmin, p.addedAt, p.hasNewNotif, p.isArchivedChat
            FROM discussions d
            INNER JOIN participants p ON d.id = p.discussionid
            WHERE d.id = ?
          `;
          database.query(getDiscussionQuery, [discussionId, userId], (error, results) => {
            if (error) {
              console.error('Erreur lors de la récupération de la discussion :', error);
              res.status(500).json({ error: 'Une erreur est survenue lors de la récupération de la discussion.' });
            } else {
              if (results.length === 0) {
                res.status(404).json({ error: 'Discussion introuvable.' });
              } else {
                // Retourner l'occurrence de la discussion avec les participants
                const discussion = results[0];
                const participants = results.map(participant => ({
                  id: participant.participantId,
                  userId: participant.userId,
                  isAdmin: participant.isAdmin,
                  addedAt: participant.addedAt,
                  hasNewNotif: participant.hasNewNotif,
                  isArchivedChat: participant.isArchivedChat
                }));

                res.status(200).json({ discussion, participants });
              }
            }
          });
        }
      });
    }
  });
});








// Route pour mettre à jour les informations d'une discussion
discussion.patch('/:discussionId', function(req, res) {
  const discussionId = req.params.discussionId;
  const { name, description } = req.body;

  // Mettre à jour les informations de la discussion
  const updateDiscussionQuery = 'UPDATE discussions SET name = ?, description = ? WHERE id = ?';
  database.query(updateDiscussionQuery, [name, description, discussionId], (error, updateResults) => {
    if (error) {
      console.error('Erreur lors de la mise à jour de la discussion :', error);
      res.status(500).json({ error: 'Une erreur est survenue lors de la mise à jour de la discussion.' });
    } else if (updateResults.affectedRows === 0) {
      res.status(404).json({ error: 'Discussion introuvable.' });
    } else {
      // Récupérer les informations mises à jour de la discussion
      const getDiscussionQuery = 'SELECT * FROM discussions WHERE id = ?';
      database.query(getDiscussionQuery, [discussionId], (error, results) => {
        if (error) {
          console.error('Erreur lors de la récupération de la discussion :', error);
          res.status(500).json({ error: 'Une erreur est survenue lors de la récupération de la discussion.' });
        } else {
          if (results.length === 0) {
            res.status(404).json({ error: 'Discussion introuvable.' });
          } else {
            const discussion = results[0];
            res.status(200).json({ discussion });
          }
        }
      });
    }
  });
});








  
  module.exports = discussion;