const auth = require('../models/auth.js');
const jwt = require("jsonwebtoken");
const ldap = require('ldapjs');

async function login(req, res, next) {
  
  try {
    if (!req.body.username || !req.body.password) {
      res.status(400).json({
        status:400,
        message:req.body,
      });
    }else{
      const context = {};
      context.nik = req.body.username;
      context.password = req.body.password;

      var client = ldap.createClient({
        url: 'ldap://'
      });
    
      client.on('connect', function () {
        client.bind(context.username, context.password, function(err) {
          if (err) {
            res.status(401).json({
              status:401,
              message:'The user credentials were incorrect.',
            });
          } 

          const jwtToken= generateToken(context.nik)
          res.status(200).json({
            status:200,
            message:'Token will expired in 15 day.',
            access_token:jwtToken,
          });
        });
      });
    }
    
  } catch (err) {
    res.status(500).json({
      status:500,
      message:'Internal server error.'
    });
  }
}

function generateToken(username){
    return jwt.sign(
      {
        username: username,
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + 1296000
      },
      process.env.JWT_SECRET
    );
}

function verifyJwt(token){
  jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
    if (err) {
      res.status(401).json({ errors: { global: "Invalid token" } });
    } 
  });
}

module.exports = {
  login,
  generateToken
}


