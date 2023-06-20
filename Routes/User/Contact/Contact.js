var express = require('express');
var contact = express.Router();
var database = require('../../../Database/database');
var cors = require('cors')
var jwt = require('jsonwebtoken');


user.use(cors());



/* Listes des contacts d'un utilisateur */
user.get('/contact/liste', function(req, res) {


});

/* recherche un contacts  */
user.post('/contact/recherche/:valeur', function(req, res) {


});

/* Voir la liste des demandes en contact  */
user.post('/contact/demandes', function(req, res) {


});

module.exports = contact;