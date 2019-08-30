const database = require('../services/database.js');
const oracledb = require('oracledb');

async function store(data){
  const id = {
    dir: oracledb.BIND_OUT,
    type: oracledb.NUMBER
  }
  const result = await database.simpleExecute(`INSERT INTO QUERY HERE) returning id into :id`, {
      id:id,
      //BINDIGN HERE
    })
  return result
}

module.exports={
  store
};