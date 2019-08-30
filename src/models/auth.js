const database = require('../services/database.js');
const ldap = require('ldapjs');

async function ldapLogin(context){ 
  let isAuthenticateUser = false
  var client = ldap.createClient({
    url: 'ldap'
  });

  client.on('connect', function () {
    client.bind(context.nik, context.password, function(err) {
      if (err) {
        isAuthenticateUser = false
      } 
      isAuthenticateUser = true
    });
  });

  return isAuthenticateUser
}

module.exports={
  ldapLogin
};