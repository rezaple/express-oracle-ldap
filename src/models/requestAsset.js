const database = require('../services/database.js');

async function getList(req){    
  const listLahan= await getListLahan(req.currentUser.nik) 
  const listGedung= await getListGedung(req.currentUser.nik) 
  return listGedung
}

async function getListLahan(nik){
  let query =`SELECT * FROM LA_REQUEST_LAHAN a
  LEFT JOIN LA_REQUEST_ATTACHMENT b ON a.ID=b.IDREQUEST AND TYPE='lahan' WHERE REQUEST_BY=${nik}`;

  const result = await database.simpleExecute(query, {});

  return result.rows;
}

async function getListGedung(nik){
  let query =`SELECT * FROM LA_REQUEST_GEDUNG a
  LEFT JOIN LA_REQUEST_ATTACHMENT b ON a.ID=b.IDREQUEST AND TYPE='gedung' WHERE ROWNUM <= 5 AND REQUEST_BY=${nik}
  ORDER BY a.REQUEST_DATE DESC`;

  const result = await database.simpleExecute(query, {});

  return result.rows;
}

async function getListLahan(nik){
  let query =`SELECT * FROM LA_REQUEST_LAHAN a
  LEFT JOIN LA_REQUEST_ATTACHMENT b ON a.ID=b.IDREQUEST WHERE REQUEST_BY=${nik}`;

  const result = await database.simpleExecute(query, {});

  return result.rows;
}

async function getLahan(id){    

}

async function getGedung(id){    

}

async function storeLahan(req, id){    

}

async function storeGedung(req, id){    

}


module.exports={
  getList,
  getGedung,
  getLahan,
  storeLahan,
  storeGedung
};