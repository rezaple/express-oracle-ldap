const database = require('../services/database.js');

async function getRegional(){     
  let query ="select * from LA_REF_TELKOM_REGIONAL";
  const binds = {};

  const result = await database.simpleExecute(query, binds);

  return result.rows;
}

async function getWitel(context)
{
  let query = `select * from LA_REF_WILAYAH_TELKOM`;
  const binds = {};

  if (context.id) {
    binds.TREG_ID = context.id;

    query += `\nwhere TREG_ID = :TREG_ID`;
  }

  const result = await database.simpleExecute(query, binds);

  return result.rows;
}

async function getStatusKepemilikan()
{
  let query ="SELECT * FROM LA_REF_STATUS_KEPEMILIKAN";
  const binds = {};

  const result = await database.simpleExecute(query, binds);

  return result.rows;
}

module.exports={
  getWitel : getWitel,
  getStatusKepemilikan : getStatusKepemilikan,
  getRegional : getRegional,
};