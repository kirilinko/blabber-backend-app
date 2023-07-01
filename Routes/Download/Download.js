var express = require('express');
var database = require('../../Database/database');
var download = express.Router();
var jwt = require('jsonwebtoken');
var cors = require('cors');
const message = require('../Message/Message');

download.use(cors());


download.use(function(req, res, next) {
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




download.get('/:messageId', function(req,res) {
    const{messageId}=req.params;
    const sql=`SELECT pathUrl FROM files WHERE messageId=?`;
    database.query(sql,[messageId],function(error,results){
        if(error){
            console.log("Une erreur est survenu lors de la rêquete:", error);
            res.status(500).json({message:"Une erreur s'est produite lors de la recherche du message"});
        }
          else{
            const pathfile =`uploads/${results[0].pathUrl}`;
            console.log(pathfile);
            res.download(pathfile, (error)=>{
                if(error){
                    console.error('Erreur lors du téléchargement du fichier :', error);
                } 
            })
          }
    })
})



module.exports =download