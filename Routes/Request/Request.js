var express = require('express');
var cors = require('cors');
var request = express.Router();
const bcrypt = require('bcrypt');
var jwt = require('jsonwebtoken');
var database = require('../../Database/database');


request.use(cors());

request.use(function(req, res, next) {
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



// Envoyer un demande
request.post('/new/:receiverId', function(req, res) {
    token = req.body.token || req.headers['authorization'];
    var decodedToken = jwt.decode(token);
    
    const receiverId  = req.params.receiverId;
    const createdAt = new Date();
    const updatedAt = createdAt;
    const accepted = false;
    const senderId=decodedToken.utilisateurId;

    const requestData = { senderId, receiverId, accepted, createdAt, updatedAt };
    database.query('INSERT INTO requests SET ?', requestData, (error, results) => {
      if (error) {
        console.error('Erreur lors de l\'insertion de la demande :', error);
        res.status(500).json({ error: 'Une erreur est survenue lors de l\'insertion de la demande.' });
      } 
        else {
          const insertedRequestId = results.insertId;
          database.query('SELECT * FROM requests WHERE id=?',[results.insertId], (error, resultsquery)=>{
            if(error){
                console.error('Erreur lors de l\'insertion de la demande :', error);
             }
               else{
                 data=resultsquery[0]
                 res.status(200).json({data});
               }
           })
         } 
      });
  });

 /*accepter refuser demande*/ 
  request.patch('/:requestId', function(req, res) {
    const { requestId } = req.params;
    const accepted = req.query.accepted;
    const updatedAt = new Date();
  
    if (accepted == 'true' || accepted == 'false') {
      const acceptedValue = accepted == 'true';
  
      database.query('UPDATE requests SET accepted = ?, updatedAt = ? WHERE id = ?', [acceptedValue, updatedAt, requestId], (error, updateResults) => {
        if (error) {
          console.error('Erreur lors de la mise à jour de la demande :', error);
          res.status(500).json({ error: 'Une erreur est survenue lors de la mise à jour de la demande.' });
        } 
          else if (updateResults.affectedRows === 0) {
            res.status(404).json({ error: 'Demande introuvable.' });
          }
            else {
              const query = `SELECT r.*, s.lastname AS senderLastname, s.firstname AS senderFirstname, s.email AS senderEmail, s.username AS senderUsername, c.lastname AS receiverLastname, c.firstname AS receiverFirstname, c.email AS receiverEmail, c.username AS receiverUsername
              FROM requests r
              INNER JOIN users s ON r.senderId = s.id
              INNER JOIN users c ON r.receiverId = c.id
              WHERE r.id = ?`;
  
              database.query(query, [requestId], (error, results) => {
                if (error) {
                console.error('Erreur lors de la récupération de la demande :', error);
                res.status(500).json({ error: 'Une erreur est survenue lors de la récupération de la demande.' });
             }
                else {
                  if (results.length === 0) {
                  res.status(404).json({ error: 'Demande introuvable.' });
               } 
                 else {
                   const request = results[0];
                   const sender = {
                    id: request.senderId,
                    lastname: request.senderLastname,
                    firstname: request.senderFirstname,
                    email: request.senderEmail,
                    username: request.senderUsername
                  };
                  const receiver = {
                    id: request.receiverId,
                    lastname: request.receiverLastname,
                    firstname: request.receiverFirstname,
                    email: request.receiverEmail,
                    username: request.receiverUsername
                  };

                  const response = {
                    id: request.id,
                    createdAt: request.createdAt,
                    updatedAt: request.updatedAt,
                    accepted: request.accepted,
                    senderId: request.senderId,
                    receiverId: request.receiverId
                };
  
                  if (acceptedValue) {
                    database.query('INSERT INTO contacts (userid1, userid2, blockedUserid1, blockedUserid2, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?)', [request.senderId, request.receiverId, false, false, new Date(), new Date() ], (error, contactResults) => {
                      if (error) {
                        console.error('Erreur lors de la création du contact :', error);
                        res.status(500).json({ error: 'Une erreur est survenue lors de la création du contact.' });
                     }
                       else {
                        res.status(200).json({ response, sender, receiver });
                     }
                  });
                } 
                 else {
                   res.status(200).json({ response, sender, receiver });
                  }
               }
             }
          });
        }
      });
    } 
      else {
        res.status(400).json({ error: 'Action invalide. Veuillez spécifier "accept" ou "reject".' });
     }
  });
  
  
// Mes demandes de mise en contact 

request.get('/list', function(req, res) {
    token = req.body.token || req.headers['authorization'];
    var decodedToken = jwt.decode(token);
    const utilisateurId = decodedToken.utilisateurId;
    console.log(utilisateurId)
    const query = `
      SELECT r.*, s.lastname AS senderLastname, s.firstname AS senderFirstname, s.email AS senderEmail, s.username AS senderUsername,
             c.lastname AS receiverLastname, c.firstname AS receiverFirstname, c.email AS receiverEmail, c.username AS receiverUsername
      FROM requests r
      INNER JOIN users s ON r.senderId = s.id
      INNER JOIN users c ON r.receiverId = c.id
      WHERE c.id=? AND r.accepted IS ? `;
  
    database.query(query, [utilisateurId ,false], (error, results) => {
      if (error) {
        console.error('Erreur lors de la récupération des demandes en attente :', error);
        res.status(500).json({ error: 'Une erreur est survenue lors de la récupération des demandes en attente.' });
      } 
        else {
          const pendingRequests = results.map(request => {
            const sender = {
              lastname: request.senderLastname,
              firstname: request.senderFirstname,
              email: request.senderEmail,
              username: request.senderUsername
           };
           const receiver = {
              lastname: request.receiverLastname,
              firstname: request.receiverFirstname,
              email: request.receiverEmail,
              username: request.receiverUsername
           };
  
          return {
            id: request.id,
            createdAt: request.createdAt,
            updatedAt: request.updatedAt,
            accepted: request.accepted,
            senderId: request.senderId,
            receiverId: request.receiverId,
            sender,
            receiver
            
          };
        });
        res.status(200).json(pendingRequests);
      }
    });
  });
   
  module.exports = request;