const database = require('../services/database.js');
const fs = require('fs');
const oracledb = require('oracledb');

async function getList(req){    
  const listLahan= await getListLahan(req.currentUser.nik) 
  const listGedung= await getListGedung(req.currentUser.nik) 
  return {lahan:listLahan, gedung:listGedung}
}

/**
 * 
 * @param {*} nik 
 * @param per_page
 * @param page
 * dibuat pagination jika liat request selengkapnya
 */
async function getListLahan(nik){
  let query =`SELECT a.ID, a.IDAREAL, a.NAMA_LAHAN, a.ALAMAT, a.STATUS_REQUEST, a.REQUEST_DATE, MAX(b.FILE_PATH) AS PATH_FILE
  FROM LA_REQUEST_LAHAN a
  LEFT JOIN LA_REQUEST_ATTACHMENT b ON a.ID=b.IDREQUEST AND TYPE='LAHAN' 
  WHERE ROWNUM <= 2 AND REQUEST_BY=${nik}
  GROUP BY a.ID, a.IDAREAL, a.NAMA_LAHAN, a.ALAMAT, a.STATUS_REQUEST, a.REQUEST_DATE
  ORDER BY a.REQUEST_DATE DESC`;

  const result = await database.simpleExecute(query, {});

  return result.rows;
}

async function getListGedung(nik){
  let query =`SELECT a.ID, a.IDGEDUNG, a.NAMA, a.ALAMAT, a.STATUS_REQUEST, a.REQUEST_DATE, MAX(b.FILE_PATH) AS PATH_FILE
  FROM LA_REQUEST_GEDUNG a
  LEFT JOIN LA_REQUEST_ATTACHMENT b ON a.ID=b.IDREQUEST AND TYPE='GEDUNG' 
  WHERE ROWNUM <= 2 AND REQUEST_BY=${nik}
  GROUP BY a.ID, a.IDGEDUNG, a.NAMA, a.ALAMAT, a.STATUS_REQUEST, a.REQUEST_DATE
  ORDER BY a.REQUEST_DATE DESC`;

  const result = await database.simpleExecute(query, {});

  return result.rows;
}

async function getLahan(id){    

}

async function getGedung(id){    

}

/**
 * 
 * @param {*} req 
 * @param {*} id 
 * store lahan ada dua
 * satu insert lahan baru request-assets/lahan
 * satu update lahan lama request-assest/:id/lahan
 * kalau lahan baru gak butuh idareal yang lama
 * kalau yang update butuh buat patokan
 */
async function storeLahan(data){    

  let result
  const dataLahan = Object.assign({}, data);

  dataLahan.id = {
    dir: oracledb.BIND_OUT,
    type: oracledb.NUMBER
  }

  if(dataLahan.id_lahan===undefined || !dataLahan.id_lahan ){
     result = await storeNewRequestLahan(dataLahan);
     dataLahan.id = result.outBinds.id[0];
  }else{
    const lahan = await database.simpleExecute(`SELECT IDAREAL from LA_LAHAN where IDAREAL = :id`, {id:dataLahan.id_lahan});    

    if(lahan.rows.length > 0 ){
      const reqLahan = await database.simpleExecute(`SELECT ID from LA_REQUEST_LAHAN WHERE IDAREAL= :id AND REQUEST_BY = :request_by AND STATUS_REQUEST='PENDING'`, {id:dataLahan.id_lahan, request_by:dataLahan.request_by})
      if(reqLahan.rows.length < 1){
        result = await storeExistRequestLahan(dataLahan)
        dataLahan.id = result.outBinds.id[0];
      }else{
        throw new Error("Can't add request!");
      }
    }   
  }

  return dataLahan;
}

async function updateLahan(data, id){    
  const dataLahan = Object.assign({}, data);

  const reqLahan = await database.simpleExecute(`SELECT ID from LA_REQUEST_LAHAN WHERE ID= :id AND REQUEST_BY = :request_by AND STATUS_REQUEST IN ('PENDING','REVISI')`, {id:id, request_by:dataLahan.request_by})
  if(reqLahan.rows.length > 0){
    await updateRequestLahan(dataLahan,id)
  }
  
  return dataLahan;
}

async function updateRequestLahan(dataLahan, id) {
  const result = await database.simpleExecute(`UPDATE LA_REQUEST_LAHAN 
  SET NAMA_LAHAN = :nama,
  ALAMAT = :alamat, 
  COOR_X = :coor_x,
  COOR_Y = :coor_y, 
  TELKOM_REGIONAL = :regional 
  WHERE ID= :id`, {
    id:id,
    nama:dataLahan.nama,
    alamat:dataLahan.alamat,
    coor_x:dataLahan.coor_x,
    coor_y:dataLahan.coor_y,
    regional: dataLahan.regional
  });

  if (result.rowsAffected && result.rowsAffected === 1) {
    return dataLahan;
  } else {
    return null;
  }
}

async function storeGedung(req){    

  let result
  const data = Object.assign({}, req);

  data.id = {
    dir: oracledb.BIND_OUT,
    type: oracledb.NUMBER
  }

  const reqLahan = await database.simpleExecute(`SELECT ID, ALAMAT, COOR_X, COOR_Y from LA_REQUEST_LAHAN WHERE ID= :id AND REQUEST_BY = :request_by AND STATUS_REQUEST IN ('PENDING','REVISI')`, {id:data.id_request_lahan, request_by:data.request_by})
  if(reqLahan.rows.length > 0){
    result = await storeRequestGedung(data, reqLahan.rows[0])
    data.id = result.outBinds.id[0];
  }else{
    throw new Error("Can't add request!");
  }

  return data;
}

async function updateGedung(req, id){    
  const data = Object.assign({}, req);
  const reqGedung = await database.simpleExecute(`SELECT ID, ID_REQUEST_LAHAN from LA_REQUEST_GEDUNG WHERE ID= :id AND REQUEST_BY = :request_by AND STATUS_REQUEST IN ('PENDING','REVISI')`, {id:id, request_by:data.request_by})

  if(reqGedung.rows.length > 0){
    const reqLahan = await database.simpleExecute(`SELECT ID,ALAMAT, COOR_X, COOR_Y from LA_REQUEST_LAHAN WHERE ID= :id AND REQUEST_BY = :request_by`, {id:reqGedung.rows[0].ID_REQUEST_LAHAN, request_by:data.request_by})
    if(reqLahan.rows.length > 0){
      await updateRequestGedung(data,reqLahan.rows[0],id)
      return data;
    }
  }
  throw new Error('Update gedung failed!')
}

async function updateRequestGedung(data, dataLahan, id) {
  const result = await database.simpleExecute(`UPDATE LA_REQUEST_GEDUNG
  SET NAMA = :nama,
  ALAMAT = :alamat, 
  COOR_X = :coor_x,
  COOR_Y = :coor_y
  WHERE ID= :id`, {
    id:id,
    nama:data.nama,
    alamat:dataLahan.alamat,
    coor_x:dataLahan.coor_x,
    coor_y:dataLahan.coor_y
  });

  if (result.rowsAffected && result.rowsAffected === 1) {
    return dataLahan;
  } else {
    return null;
  }
}

async function storeNewRequestLahan(dataLahan){
  const result = await database.simpleExecute(`INSERT INTO VEAT.LA_REQUEST_LAHAN
    (NAMA_LAHAN,ALAMAT, COOR_X, COOR_Y, STATUS_REQUEST, TELKOM_REGIONAL, REQUEST_BY, REQUEST_DATE)
    VALUES(:nama,:alamat,:coor_x,:coor_y,:status, :regional, :request_by, TO_DATE(:request_date, 'yyyy/mm/dd hh24:mi:ss')) returning id into :id`, {
      id:dataLahan.id,
      nama:dataLahan.nama,
      alamat:dataLahan.alamat,
      coor_x:dataLahan.coor_x,
      coor_y:dataLahan.coor_y,
      status:dataLahan.status,
      regional: dataLahan.regional,
      request_by: dataLahan.request_by,
      request_date: dataLahan.request_date
    })
  return result
}

async function storeRequestGedung(data, dataLahan){
  const result = await database.simpleExecute(`INSERT INTO VEAT.LA_REQUEST_GEDUNG
    (ID_REQUEST_LAHAN,IDGEDUNG, NAMA,ALAMAT, COOR_X, COOR_Y, STATUS_REQUEST, REQUEST_BY, REQUEST_DATE)
    VALUES(:idrequest, :idgedung, :nama,:alamat,:coor_x,:coor_y,:status, :request_by, TO_DATE(:request_date, 'yyyy/mm/dd hh24:mi:ss')) returning id into :id`, {
      id:data.id,
      idrequest:dataLahan.ID,
      idgedung:data.id_gedung,
      nama:data.nama,
      alamat:dataLahan.ALAMAT,
      coor_x:dataLahan.COOR_X,
      coor_y:dataLahan.COOR_Y,
      status:data.status,
      request_by: data.request_by,
      request_date: data.request_date
    })
  return result
}

async function storeExistRequestLahan(dataLahan){    
    const result = await database.simpleExecute(`INSERT INTO VEAT.LA_REQUEST_LAHAN
    (NAMA_LAHAN,ALAMAT, IDAREAL, COOR_X, COOR_Y, STATUS_REQUEST, TELKOM_REGIONAL, REQUEST_BY, REQUEST_DATE)
    VALUES(:nama,:alamat,:idareal, :coor_x,:coor_y,:status, :regional, :request_by, TO_DATE(:request_date, 'yyyy/mm/dd hh24:mi:ss')) returning id into :id`, {
      id:dataLahan.id,
      nama:dataLahan.nama,
      alamat:dataLahan.alamat,
      idareal:dataLahan.id_lahan,
      coor_x:dataLahan.coor_x,
      coor_y:dataLahan.coor_y,
      status:dataLahan.status,
      regional: dataLahan.regional,
      request_by: dataLahan.request_by,
      request_date: dataLahan.request_date
    });
    return result
}

module.exports={
  getList,
  getGedung,
  getLahan,
  storeLahan,
  storeGedung,
  updateLahan,
  updateGedung
};