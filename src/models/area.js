const database = require('../services/database.js');

async function getProvinces(){     
  let query ="SELECT ID,NAMA FROM LA_REF_PROPINSI";
  const binds = {};

  const result = await database.simpleExecute(query, binds);

  return result.rows;
}

async function getCities(context)
{
  let query = `SELECT ID,NAMA FROM LA_REF_KOTA`;
  const binds = {};

  binds.IDPROV = context.idProv;

  query += `\nWHERE ID_PROPINSI = :IDPROV`;

  const result = await database.simpleExecute(query, binds);

  return result.rows;
}

async function getSubDistricts(context)
{
  let query ="SELECT * FROM LA_REF_KECAMATAN";
  const binds={};

  binds.IDKOTA = context.idCity;

  query += `\nWHERE ID_KOTA= :IDKOTA`;

  const result = await database.simpleExecute(query, binds);

  return result.rows;
}

async function getSubDistrictsByProvince(context)
{
  let queryCity = `SELECT ID,NAMA FROM LA_REF_KOTA`;
  const binds = {};

  binds.IDPROV = context.idProv;
  binds.IDKOTA = context.idCity;

  queryCity += `\nWHERE ID_PROPINSI = :IDPROV AND ID= :IDKOTA`;

  const resultCity = await database.simpleExecute(queryCity, binds);
  if(resultCity.rows.length === 1){

    let query ="SELECT * FROM LA_REF_KECAMATAN";
    const bind = {};

    bind.IDKOTA = context.idCity;
    query += `\nWHERE ID_KOTA= :IDKOTA`;


    const result = await database.simpleExecute(query, bind);

    return result.rows;
  }
  return [];
  
}


module.exports={
  getProvinces : getProvinces,
  getCities : getCities,
  getSubDistricts : getSubDistricts,
  getSubDistrictsByProvince: getSubDistrictsByProvince
};