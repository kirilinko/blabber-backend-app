var express = require('express');
var message = express.Router();
var cors = require('cors')
var jwt = require('jsonwebtoken');
const path = require('path');
const multer = require('multer');
var database = require('../../Database/database');

message.use(cors());

const storage = multer.diskStorage({
    destination: 'uploads/documents/',
    filename: function(req, file, cb) {
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
      const extension = path.extname(file.originalname);
      const fileName = uniqueSuffix + extension;
      cb(null, fileName);
    }
  });
  
const upload = multer({ storage });

message.use(function(req, res, next) {
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

/*Ajouter un message  à une discussion*/

message.post('/:discussionId', upload.single('file'), function(req, res) {
  token = req.body.token || req.headers['authorization'];
  var decodedToken = jwt.decode(token);
  const senderId = decodedToken.utilisateurId;

  const { discussionId } = req.params;
  const { text } = req.body;
 
  const createdAt = new Date();
  const updatedAt = createdAt;

  // Vérification de l'existence de la discussion
  const checkDiscussionSql = 'SELECT id FROM discussions WHERE id = ?';
  database.query(checkDiscussionSql, [discussionId], (error, result) => {
    if (error) {
      console.error('Erreur lors de la vérification de l\'existence de la discussion :', error);
      return res.status(500).json({ error: 'Une erreur est survenue lors de la vérification de l\'existence de la discussion.' });
    }

    if (result.length === 0) {
      return res.status(404).json({ error: 'La discussion n\'existe pas.' });
    }

    const sql = `INSERT INTO messages (senderId, receiverDiscussionId, text, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?) `;

    database.query(sql, [senderId, discussionId, text, createdAt, updatedAt], (error, result) => {
      if (error) {
        console.error('Erreur lors de l\'envoi du message :', error);
        res.status(500).json({ error: 'Une erreur est survenue lors de l\'envoi du message.' });
      } else {
        const sqlfile = `INSERT INTO files (originalName, pathUrl, size, messageId) VALUES (?, ?, ?, ?) `;
        if (req.file) {
          const { originalname, filename, size } = req.file;
          database.query(sqlfile, [originalname, filename, size, result.insertId], (error, resultfile) => {
            if (error) {
              console.error('Erreur lors de l\'ajout du fichier au message :', error);
              res.status(500).json({ error: 'Une erreur est survenue lors de l\'ajout du fichier au message.' });
            }
          });
        }

        const sqllastmessage = `UPDATE lastmessages SET messageId = ? WHERE discussionId = ?`;
        database.query(sqllastmessage, [result.insertId, discussionId], (error, updateResult) => {
          if (error) {
            console.log("Erreur lors de la mise à jour du lastmessage :", error);
          } else {
            const getMessagesSql = `
              SELECT d.*, m.id AS id_message, m.senderId, m.receiverDiscussionId, m.responseToMsgId, m.text, m.createdAt, m.updatedAt, l.messageId as id_lastMessage, f.originalName, f.pathUrl, f.size, u.username AS senderUsername, u.firstname, u.lastname, u.email, u.photoUrl
              FROM messages m
              INNER JOIN lastmessages l ON m.receiverDiscussionId=l.discussionId
              INNER JOIN users u ON m.senderId = u.id
              INNER JOIN discussions d ON m.receiverDiscussionId = d.id
              LEFT JOIN files f ON m.id = f.messageId
              WHERE d.id = ?
              ORDER BY m.createdAt DESC `;
            database.query(getMessagesSql, [discussionId], (error, messages) => {
              if (error) {
                console.error('Erreur lors de la récupération des messages :', error);
                res.status(500).json({ error: 'Une erreur est survenue lors de la récupération des messages.' });
              } else {
                res.status(200).json({ messages });
              }
            });
          }
        });
      }
    });
  });
});

  

 // ajouter un emodji à un message

  message.patch('/emodji/:messageId', function(req, res) {
    token = req.body.token || req.headers['authorization'];
    var decodedToken = jwt.decode(token);
    const userId = decodedToken.utilisateurId; 
    const {messageId} = req.params;
    const {emodji} = req.body;
  
    const sql = `INSERT INTO emodjis (userId, emodji, messageId) VALUES (?, ?, ?) `;
    database.query(sql, [userId, emodji, messageId], (error, result) => {
      if (error) {
        console.error('Erreur lors de l\'ajout de l\'emodji :', error);
        res.status(500).json({ error: 'Une erreur est survenue lors de l\'ajout de l\'emodji.' });
      } 
        else {            
          const emodjisql = `
          SELECT m.*, e.*, u.username, u.lastname, u.firstname
          FROM messages m 
          INNER JOIN emodjis e ON m.id=e.messageId
          INNER JOIN users u ON e.userId=u.id
          WHERE m.id= ? AND e.userId=? `;

          database.query(emodjisql,[messageId, userId], (error,message)=>{
            if(error){
              res.status(500).json({error:"une erreur est survenu"})
            }
              else{
                res.status(200).json({message})
              }
          })          
       }
    });
  });


// messages d'une discussion
message.get('/:discussionId', function(req, res) {
  token = req.body.token || req.headers['authorization'];
  var decodedToken = jwt.decode(token);
  const userId = decodedToken.utilisateurId;
  const { discussionId } = req.params;

  // Vérification de la participation de l'utilisateur à la discussion
  const checkParticipantSql = `SELECT * FROM participants WHERE userId = ? AND discussionId = ?`;
  database.query(checkParticipantSql, [userId, discussionId], (error, results) => {
    if (error) {
      console.error('Erreur lors de la vérification de la participation de l\'utilisateur à la discussion :', error);
      res.status(500).json({ error: 'Une erreur est survenue lors de la vérification de la participation de l\'utilisateur à la discussion.' });
    } else {
      if (results.length === 0) {
        // L'utilisateur n'est pas un participant de la discussion
        res.status(403).json({ error: 'Accès refusé. Vous n\'êtes pas autorisé à accéder à cette discussion.' });
      } else {
        // L'utilisateur est un participant de la discussion, récupérer les messages
        const getMessagesSql = `
          SELECT d.*, m.*, u.username AS senderUsername, u.firstname, u.lastname, u.email, u.photoUrl
          FROM messages m
          INNER JOIN users u ON m.senderId = u.id
          INNER JOIN discussions d ON d.id = m.receiverDiscussionId
          WHERE m.receiverDiscussionId = ?
          ORDER BY m.createdAt ASC`;

        database.query(getMessagesSql, [discussionId], (error, messages) => {
          if (error) {
            console.error('Erreur lors de la récupération des messages :', error);
            res.status(500).json({ error: 'Une erreur est survenue lors de la récupération des messages.' });
          } else {
            res.status(200).json({ messages });
          }
        });
      }
    }
  });
});


module.exports =message