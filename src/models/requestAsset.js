const database = require('../services/database.js');
const fs = require('fs');
const oracledb = require('oracledb');
const createError = require('http-errors')
var isBase64 = require('is-base64');

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

async function getImageRequestLahan(id){
  const images = await database.simpleExecute(`SELECT ID, FILE_PATH from LA_REQUEST_ATTACHMENT WHERE IDREQUEST= :id AND TYPE ='LAHAN'`, {id:id})
  return images.rows.length > 0 ? images.rows.map(img=>{
    return {
      ID: img.ID,
      PATH : 'http://10.60.164.5/myassist/'+img.FILE_PATH
    }
  }) : [];
}

async function getGedungRequestLahan(id){
  const gedung = await database.simpleExecute(`SELECT * from LA_REQUEST_GEDUNG WHERE ID_REQUEST_LAHAN= :id`, {id:id})
  const gdPromises = gedung.rows.map(async gd=>{
    const imgGedung =  await database.simpleExecute(`SELECT ID, FILE_PATH from LA_REQUEST_ATTACHMENT WHERE IDREQUEST= :id AND TYPE ='GEDUNG' AND ROWNUM = 1`, {id:gd.ID})

    return {
      ID: gd.ID,
      NAMA: gd.NAMA,
      ALAMAT: gd.ALAMAT||"",
      PATH : imgGedung.rows.length > 0 ? 'http://10.60.164.5/myassist/'+imgGedung.rows[0].FILE_PATH:""
    }
  });
  const resGedung = await Promise.all(gdPromises)
  return resGedung.length > 0 ? resGedung : [];
}

//cek apakah punya request yang pending jika tidak get lahan
async function getLahan(context){    
  const result ={}
  const reqLahan = await database.simpleExecute(`SELECT * from LA_REQUEST_LAHAN WHERE IDAREAL= :id AND REQUEST_BY = :request_by AND STATUS_REQUEST IN ('PENDING','REVISI')`, {id:context.id, request_by:context.nik})
  const dataLahan = await database.simpleExecute(`SELECT IDAREAL, NAMA_LAHAN, ALAMAT, PATH_LAHAN_IMAGE,COOR_X, COOR_Y, ID_TREG from GIS_LAHAN_MASTER WHERE IDAREAL= :id `, {id:context.id})

  if(reqLahan.rows.length > 0){
    const images = await getImageRequestLahan(reqLahan.rows[0].ID);

    result.lahan = reqLahan.rows.reduce((acc, lahan)=>{
      return {
        ID_LAHAN : lahan.IDAREAL,
        ID_REQUEST : lahan.ID,
        NAMA : lahan.NAMA_LAHAN,
        ALAMAT : lahan.ALAMAT,
        COOR_X : lahan.COOR_X,
        COOR_Y : lahan.COOR_Y,
        REGIONAL : lahan.TELKOM_REGIONAL,
        NOTES : lahan.NOTES||"",
        STATUS : lahan.STATUS_REQUEST,
        IMAGE :  images.length > 0 ? images[0].PATH:""
      }
    },0)
    result.images =  images

    result.gedung = await getGedungRequestLahan(reqLahan.rows[0].ID);

    return result;
  }
  
  if(dataLahan.rows.length >0){
    result.lahan = dataLahan.rows.reduce((acc, lahan)=>{
      return {
        ID_LAHAN : lahan.IDAREAL,
        ID_REQUEST : "",
        NAMA : lahan.NAMA_LAHAN,
        ALAMAT : lahan.ALAMAT,
        COOR_X : lahan.COOR_X,
        COOR_Y : lahan.COOR_Y,
        REGIONAL : lahan.ID_TREG,
        NOTES : "",
        STATUS : "",
        IMAGE :  lahan.PATH_LAHAN_IMAGE? 'http://mrra.telkom.co.id/gis/assets'+lahan.PATH_LAHAN_IMAGE:""
      }
    },0)
    result.images = []
    result.gedung = []
    return result
  }
  throw createError(404, 'Lahan tidak ditemukan!')
}

async function getRequestLahan(context){    
  const result ={}
  const reqLahan = await database.simpleExecute(`SELECT * from LA_REQUEST_LAHAN WHERE ID= :id AND REQUEST_BY = :request_by AND STATUS_REQUEST IN ('PENDING','REVISI')`, {id:context.id, request_by:context.nik})

  if(reqLahan.rows.length > 0){
      const images = await database.simpleExecute(`SELECT ID, FILE_PATH from LA_REQUEST_ATTACHMENT WHERE IDREQUEST= :id AND TYPE ='LAHAN'`, {id:reqLahan.rows[0].ID})
      const gedung = await database.simpleExecute(`SELECT * from LA_REQUEST_GEDUNG WHERE ID_REQUEST_LAHAN= :id`, {id:reqLahan.rows[0].ID})
      result.lahan = reqLahan.rows.reduce((acc, lahan)=>{
        return {
          ID_LAHAN : lahan.IDAREAL,
          ID_REQUEST : lahan.ID,
          NAMA : lahan.NAMA_LAHAN,
          ALAMAT : lahan.ALAMAT,
          COOR_X : lahan.COOR_X,
          COOR_Y : lahan.COOR_Y,
          REGIONAL : lahan.TELKOM_REGIONAL,
          NOTES : lahan.NOTES||"",
          STATUS : lahan.STATUS_REQUEST,
          IMAGE :  images.rows.length > 0 ? 'http://10.60.164.5/myassist/'+images.rows[0].FILE_PATH:""
        }
      },0)
      result.images =  images.rows.length > 0 ? images.rows.map(img=>{
        return {
          ID: img.ID,
          PATH : 'http://10.60.164.5/myassist/'+img.FILE_PATH
        }
      }) : [];

      const gdPromises = gedung.rows.map(async gd=>{
        const imgGedung =  await database.simpleExecute(`SELECT ID, FILE_PATH from LA_REQUEST_ATTACHMENT WHERE IDREQUEST= :id AND TYPE ='GEDUNG' AND ROWNUM = 1`, {id:gd.ID})

        return {
          ID: gd.ID,
          NAMA: gd.NAMA,
          ALAMAT: gd.ALAMAT||"",
          PATH : imgGedung.rows.length > 0 ? 'http://10.60.164.5/myassist/'+imgGedung.rows[0].FILE_PATH:""
        }
      });
      const resGedung = await Promise.all(gdPromises)
      result.gedung = resGedung.length > 0?resGedung:[];

      return result;
  }

  throw createError(404, 'Request Lahan tidak ditemukan!')
} 

async function getRequestGedung(context){
  const result ={}
  const reqGedung = await database.simpleExecute(`SELECT * from LA_REQUEST_GEDUNG WHERE ID= :id AND REQUEST_BY = :request_by`, {id:context.id, request_by:context.nik})

  if(reqGedung.rows.length > 0){
      const images = await database.simpleExecute(`SELECT ID, FILE_PATH from LA_REQUEST_ATTACHMENT WHERE IDREQUEST= :id AND TYPE ='GEDUNG'`, {id:reqGedung.rows[0].ID})
      result.gedung = reqGedung.rows.reduce((acc, gedung)=>{
        return {
          ID_LAHAN : gedung.IDAREAL||"",
          ID_REQUEST_LAHAN : gedung.ID_REQUEST_LAHAN||"",
          ID_REQUEST : gedung.ID,
          NAMA : gedung.NAMA,
          ALAMAT : gedung.ALAMAT||"",
          NOTES : gedung.NOTES||"",
          STATUS : gedung.STATUS_REQUEST,
          IMAGE :  images.rows.length > 0 ? 'http://10.60.164.5/myassist/'+images.rows[0].FILE_PATH:""
        }
      },0)
      result.images =  images.rows.length > 0 ? images.rows.map(img=>{
        return {
          ID: img.ID,
          PATH : 'http://10.60.164.5/myassist/'+img.FILE_PATH
        }
      }) : [];

      return result;
  }

  throw createError(404, 'Request Gedung tidak ditemukan!')
}  

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
        throw createError(406, 'Gagal menyimpan!')
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
    throw createError(406, 'Gagal menyimpan!')
  }

  return data;
}

async function updateGedung(req, id){    
  const data = Object.assign({}, req);
  const reqGedung = await database.simpleExecute(`SELECT ID, ID_REQUEST_LAHAN from LA_REQUEST_GEDUNG WHERE ID= :id AND REQUEST_BY = :request_by AND STATUS_REQUEST IN ('PENDING','REVISI')`, {id:id, request_by:data.request_by})

  if(reqGedung.rows.length > 0){
    const reqLahan = await database.simpleExecute(`SELECT ID,ALAMAT, COOR_X, COOR_Y from LA_REQUEST_LAHAN WHERE ID= :id AND REQUEST_BY = :request_by`, {id:reqGedung.rows[0].ID_REQUEST_LAHAN, request_by:data.request_by})
    if(reqLahan.rows.length > 0){
      const update = await updateRequestGedung(data,reqLahan.rows[0],id)
      return update;
    }
  }
  throw createError(406, 'Gagal memperbarui!')
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
    dataLahan.NAMA=data.nama
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

async function upload(context){
  try {
    const reqLahan =  await database.simpleExecute(`SELECT * from LA_REQUEST_LAHAN WHERE ID= :id AND REQUEST_BY = :request_by AND STATUS_REQUEST IN ('PENDING','REVISI')`, {id:context.id, request_by:context.nik})
    if(reqLahan.rows.length > 0){
      if(context.images instanceof Array){
        const imgPromises = context.images.map(async(image)=>{
          if(isBase64(image, {mime: true})){
            const resImage = await writeImageToDisk(context, image)
            return resImage
          }
        })

        const images = await Promise.all(imgPromises)
        return images
      }
      
      if(context.images !== undefined){
        if(isBase64(context.images, {mime: true})){
          const resImage = await writeImageToDisk(context, context.images)
          return [resImage]
        }
        throw createError(400, 'Data yang dikirim bukan dalam format base64!')
      }
      throw createError(400, 'Gambar dibutuhkan!')      
    }
    throw createError(404, 'Request Lahan tidak ditemukan!') 
  } catch (e) {
      throw createError(500,e.message);
  }
}
async function writeImageToDisk({id, type, created_date}, image){
  if(isBase64(image, {mime: true})){
    const nama = +Date.now()+'.png'
    const path = './public/images/'+nama
    const imgdata = image;
    const base64Data = imgdata.replace(/^data:([A-Za-z-+/]+);base64,/, '');
    fs.writeFileSync(path, base64Data,  {encoding: 'base64'});
    const resImage = await storeImage({id, type, created_date, nama, path})
    return resImage
  }
}

async  function storeImage(context){
  const id = {
    dir: oracledb.BIND_OUT,
    type: oracledb.NUMBER
  }

  const result = await database.simpleExecute(`INSERT INTO VEAT.LA_REQUEST_ATTACHMENT
  (IDREQUEST, FILE_NAME, TYPE, FILE_PATH, CREATED_DATE)
  VALUES(:idreq,:nama, :type, :path, TO_DATE(:created_date, 'yyyy/mm/dd hh24:mi:ss')) returning id into :id`, {
    id:id,
    idreq:context.id,
    nama:context.nama,
    type:context.type,
    path:context.path.slice(9),
    created_date: context.created_date
  })
  return {
      id: result.outBinds.id[0],
      path: 'http://10.60.164.5/myassist/'+context.path.slice(9)
  }
}

module.exports={
  getList,
  getRequestGedung,
  getRequestLahan,
  getLahan,
  storeLahan,
  storeGedung,
  updateLahan,
  updateGedung,
  upload
};