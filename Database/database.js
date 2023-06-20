var mysql = require("mysql")

var connection = mysql.createConnection({
    host: "localhost",
    user: "root",
    password: "",
    database: "blabber"
})

connection.connect((err) => {
    if (err) throw err;
    console.log("Connexion database ok...")
})

module.exports = connection;