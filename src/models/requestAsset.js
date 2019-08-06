const database = require('../services/database.js');
const fs = require('fs');
const oracledb = require('oracledb');
const createError = require('http-errors')
var isBase64 = require('is-base64');
const url = require('url');
const transform = require('../transformers/requestAsset.js');

function current_url(req){
  const requrl = url.format({
    protocol: req.protocol,
    host: req.get('host'),
    pathname: req.originalUrl.split("?").shift(),
  });
  return requrl
}

async function getList(req){    
  const listLahan= await getListLahan(req.currentUser.nik) 
  const listGedung= await getListGedung(req.currentUser.nik) 
  return {lahan:listLahan, gedung:listGedung}
}

async function listRequestGedung(req)
{
    const res ={}
    const params = req.query
    let per_page=10;
    let page=1;
    if(params.per_page !== undefined){
        per_page=parseInt(params.per_page,10);
    }

    if(params.page!== undefined){
        page=parseInt(params.page,10);
    }

    const sql=`
    SELECT
      a.ID, a.NAMA, a.IDGEDUNG, a.ALAMAT, a.STATUS_REQUEST, a.REQUEST_DATE, s2.PATH_FILE,
      ROW_NUMBER() OVER (ORDER BY a.ID) RN
    FROM
      LA_REQUEST_GEDUNG a
    LEFT OUTER JOIN (SELECT IDREQUEST, MAX(FILE_PATH) PATH_FILE 
			FROM LA_REQUEST_ATTACHMENT WHERE "TYPE"='GEDUNG' GROUP BY IDREQUEST ) s2
     ON a.ID = s2.IDREQUEST WHERE a.REQUEST_BY=${req.currentUser.nik} 
     AND (a.IDGEDUNG IS NOT NULL OR a.ID_REQUEST_LAHAN IS NOT NULL) ORDER BY a.REQUEST_DATE DESC`;

    const totalQuery = await database.simpleExecute(`SELECT count(*) as total_count FROM(${sql})`, {});
    const total= totalQuery.rows[0].TOTAL_COUNT;
    const totalPages=Math.ceil(total/per_page);
    const awal=(page===1)?1:((page-1)*per_page+1);
    const akhir=(page===1)?per_page:(page*per_page);

    const result = await database.simpleExecute(`SELECT * FROM(${sql})
    WHERE RN >= ${awal} AND RN <= ${akhir}`, {});
    const transformedListLahan= await result.rows.map(data => {
      return transform.transformList(data)
    });
    res.data = transformedListLahan
    const prevPage=(page==1)?"":current_url(req)+"?page="+(page-1)+`&per_page=${per_page}`;
    const nextPage=(page==totalPages)?"":current_url(req)+`?page=${(page+1)}&per_page=${per_page}`;

    res.paginator = {
        'total_count': parseInt(total),
        'total_pages':totalPages,
        'first_page': current_url(req)+`?page=1&per_page=${per_page}`,
        'prev_page':prevPage,
        'next_page':nextPage,
        'last_page':current_url(req)+`?page=${totalPages}&per_page=${per_page}`,
        'limit':per_page
    }
    return res;
}

async function listRequestLahan(req)
{
    const res ={}
    const params = req.query
    let per_page=10;
    let page=1;
    if(params.per_page !== undefined){
        per_page=parseInt(params.per_page,10);
    }

    if(params.page!== undefined){
        page=parseInt(params.page,10);
    }

    const sql=`
    SELECT
      a.ID, a.IDAREAL, a.NAMA_LAHAN as NAMA, a.ALAMAT, a.STATUS_REQUEST, a.REQUEST_DATE, s2.PATH_FILE,
      ROW_NUMBER() OVER (ORDER BY a.ID) RN
    FROM
      LA_REQUEST_LAHAN a
    LEFT OUTER JOIN (SELECT IDREQUEST, MAX(FILE_PATH) PATH_FILE 
			FROM LA_REQUEST_ATTACHMENT WHERE "TYPE"='LAHAN' GROUP BY IDREQUEST ) s2
     ON a.ID = s2.IDREQUEST WHERE a.REQUEST_BY=${req.currentUser.nik} ORDER BY a.REQUEST_DATE DESC`;

    const totalQuery = await database.simpleExecute(`SELECT count(*) as total_count FROM(${sql})`, {});
    const total= totalQuery.rows[0].TOTAL_COUNT;
    const totalPages=Math.ceil(total/per_page);
    const awal=(page===1)?1:((page-1)*per_page+1);
    const akhir=(page===1)?per_page:(page*per_page);

    const result = await database.simpleExecute(`SELECT * FROM(${sql})
    WHERE RN >= ${awal} AND RN <= ${akhir}`, {});
    const transformedListLahan= await result.rows.map(data => {
      return transform.transformList(data)
    });
    res.data = transformedListLahan
    const prevPage=(page==1)?"":current_url(req)+"?page="+(page-1)+`&per_page=${per_page}`;
    const nextPage=(page==totalPages)?"":current_url(req)+`?page=${(page+1)}&per_page=${per_page}`;

    res.paginator = {
        'total_count': parseInt(total),
        'total_pages':totalPages,
        'first_page': current_url(req)+`?page=1&per_page=${per_page}`,
        'prev_page':prevPage,
        'next_page':nextPage,
        'last_page':current_url(req)+`?page=${totalPages}&per_page=${per_page}`,
        'limit':per_page
    }
    return res;
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

  const transformedListLahan= await result.rows.map(data => {
    return transform.transformList(data)
  });
  return transformedListLahan
}

async function getListGedung(nik){
  let query =`SELECT a.ID, a.IDGEDUNG, a.NAMA, a.ALAMAT, a.STATUS_REQUEST, a.REQUEST_DATE, MAX(b.FILE_PATH) AS PATH_FILE
  FROM LA_REQUEST_GEDUNG a
  LEFT JOIN LA_REQUEST_ATTACHMENT b ON a.ID=b.IDREQUEST AND TYPE='GEDUNG' 
  WHERE ROWNUM <= 2 AND REQUEST_BY=${nik}
  GROUP BY a.ID, a.IDGEDUNG, a.NAMA, a.ALAMAT, a.STATUS_REQUEST, a.REQUEST_DATE
  ORDER BY a.REQUEST_DATE DESC`;

  const result = await database.simpleExecute(query, {});

  const transformedListGedung= await result.rows.map(data => {
    return transform.transformList(data)
  });
  return transformedListGedung
}

function getDate(){
  var date = new Date()
  date.setHours(date.getHours() + 7);
  return date.toISOString().replace(/T/, ' ').replace(/\..+/, '');
}

async function queryGetRequestImages(id, type){
  const images = await database.simpleExecute(`SELECT ID, FILE_NAME, FILE_PATH from LA_REQUEST_ATTACHMENT WHERE IDREQUEST= :id AND "TYPE" = :type`, {id, type})
  return images;
}

async function queryInsertAttachImage(data){
  const image = Object.assign({}, data);

  image.id = {
    dir: oracledb.BIND_OUT,
    type: oracledb.NUMBER
  }

  const result = await database.simpleExecute(`INSERT INTO VEAT.LA_ATTACHMENT
      (ID,FILE_NAME, FILE_PATH, BASE_URL, CREATED_DATE)
      VALUES(ID_GEN(),
      :file_name,
      :file_path,
      :base_url, 
      TO_DATE(:created_date, 'yyyy-mm-dd hh24:mi:ss')) returning id into :id`, image)
  image.id = result.outBinds.id[0];
  return image;
}

async function queryInsertAttachImageGedung(data){
  const image = Object.assign({}, data);

  image.id = {
    dir: oracledb.BIND_OUT,
    type: oracledb.NUMBER
  }
  image.id_attachment_group=1
  image.status=1

  const result = await database.simpleExecute(`INSERT INTO VEAT.LA_ATTACHMENT_GEDUNG
      (ID,IDGEDUNG, ID_ATTACHMENT, ID_ATTACHMENT_GROUP, STATUS)
      VALUES(ID_GEN_ATTGED(),
      :idgedung,
      :id_attachment,
      :id_attachment_group,
      :status) returning id into :id`, image)
  image.id = result.outBinds.id[0];
  return image;
}

async function queryInsertAttachImageLahan(data){
  const image = Object.assign({}, data);

  image.id = {
    dir: oracledb.BIND_OUT,
    type: oracledb.NUMBER
  }
  image.id_attachment_group=1
  image.status=1

  const result = await database.simpleExecute(`INSERT INTO VEAT.LA_ATTACHMENT_LAHAN
      (ID,IDAREAL, ID_ATTACHMENT, ID_ATTACHMENT_GROUP, STATUS)
      VALUES(ID_GENATTLAH(),
      :idareal,
      :id_attachment,
      :id_attachment_group,
      :status) returning id into :id`, image)
  image.id = result.outBinds.id[0];
  return image;
}

async function queryInsertGedung(data){
  //const gedung = Object.assign({}, data);
  data.id = {
    dir: oracledb.BIND_OUT,
    type: oracledb.NUMBER
  }
  const result = await database.simpleExecute(`INSERT INTO VEAT.GIS_BANGUNAN_MASTER
        (IDGEDUNG, IDAREAL, NAMA_GEDUNG, ALAMAT, COOR_X, COOR_Y)
        VALUES(ID_GENGISGED(),
        :idareal,
        :nama,
        :alamat,
        :coor_x,
        :coor_y) returning IDGEDUNG into :id`, data
  )
  data.id = result.outBinds.id[0]
  return data;
}

async function queryInsertLahan(data){
  //const lahan = Object.assign({}, data);
  data.id = {
    dir: oracledb.BIND_OUT,
    type: oracledb.NUMBER
  }
  const result = await database.simpleExecute(`INSERT INTO VEAT.GIS_LAHAN_MASTER
        (IDAREAL, NAMA_LAHAN, ALAMAT, COOR_X, COOR_Y)
        VALUES(ID_GENLAHAN(),
        :nama_lahan,
        :alamat,
        :coor_x,
        :coor_y) returning IDAREAL into :id`, data
  )
  data.id = result.outBinds.id[0]
  return data;
}

//base url pindahin ke .env
async function getImageRequest(id, type){
  const images = await queryGetRequestImages(id, type)
  return images.rows.length > 0 ? images.rows.map(img=>{
    return {
      ID: img.ID,
      PATH : 'http://10.60.164.5/myassist/'+img.FILE_PATH
    }
  }) : [];
}

async function getRequestGedungByRequestLahan(id){
  const result =  await database.simpleExecute(`SELECT * from LA_REQUEST_GEDUNG WHERE ID_REQUEST_LAHAN= :id`, {id:id})
  return result
}

async function getGedungRequestLahan(id){
  const gedung = await getRequestGedungByRequestLahan(id)
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
    const images = await getImageRequest(reqLahan.rows[0].ID, 'LAHAN');

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

async function getGedung(context){    
  const result ={}
  const reqGedung = await database.simpleExecute(`SELECT * from LA_REQUEST_GEDUNG WHERE IDGEDUNG= :id AND REQUEST_BY = :request_by AND STATUS_REQUEST IN ('PENDING','REVISI')`, {id:context.id, request_by:context.nik})
  const dataGedung = await database.simpleExecute(`SELECT IDGEDUNG, NAMA_GEDUNG, ALAMAT, PATH_GEDUNG_IMAGE,COOR_X, COOR_Y from GIS_BANGUNAN_MASTER WHERE IDGEDUNG= :id `, {id:context.id})

  if(reqGedung.rows.length > 0){
    const images = await getImageRequest(reqGedung.rows[0].ID, 'GEDUNG');

    result.gedung = reqGedung.rows.reduce((acc, data)=>{
      return {
        ID_LAHAN : data.IDGEDUNG,
        ID_REQUEST : data.ID,
        NAMA : data.NAMA,
        ALAMAT : data.ALAMAT,
        COOR_X : data.COOR_X,
        COOR_Y : data.COOR_Y,
        NOTES : data.NOTES||"",
        STATUS : data.STATUS_REQUEST,
        IMAGE :  images.length > 0 ? images[0].PATH:""
      }
    },0)
    result.images =  images

    return result;
  }
  
  if(dataGedung.rows.length >0){
    result.gedung = dataGedung.rows.reduce((acc, data)=>{
      return {
        ID_GEDUNG : data.IDGEDUNG,
        ID_REQUEST : "",
        NAMA : data.NAMA_GEDUNG,
        ALAMAT : data.ALAMAT,
        COOR_X : data.COOR_X,
        COOR_Y : data.COOR_Y,
        NOTES : "",
        STATUS : "",
        IMAGE :  data.PATH_LAHAN_IMAGE? 'http://mrra.telkom.co.id/gis/assets'+data.PATH_LAHAN_IMAGE:""
      }
    },0)
    result.images = []
    return result
  }
  throw createError(404, 'Gedung tidak ditemukan!')
}

async function getRequestLahan(context){    
  const result ={}
  const reqLahan = await database.simpleExecute(`SELECT * from LA_REQUEST_LAHAN WHERE ID= :id AND REQUEST_BY = :request_by`, {id:context.id, request_by:context.nik})

  if(reqLahan.rows.length > 0){
      const images = await database.simpleExecute(`SELECT ID, FILE_PATH from LA_REQUEST_ATTACHMENT WHERE IDREQUEST= :id AND TYPE ='LAHAN'`, {id:reqLahan.rows[0].ID})
      const gedung = await database.simpleExecute(`SELECT * from LA_REQUEST_GEDUNG WHERE ID_REQUEST_LAHAN= :id`, {id:reqLahan.rows[0].ID})
      result.lahan = reqLahan.rows.reduce((acc, lahan)=>{
        return {
          ID_LAHAN : lahan.IDAREAL||"",
          ID_REQUEST : lahan.ID,
          NAMA : lahan.NAMA_LAHAN,
          ALAMAT : lahan.ALAMAT,
          COOR_X : lahan.COOR_X,
          COOR_Y : lahan.COOR_Y,
          REGIONAL : lahan.TELKOM_REGIONAL,
          NOTES : lahan.NOTES||"",
          STATUS : lahan.STATUS_REQUEST,
          TYPE : gedung.IDAREAL?'Edit':'Insert',
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
          STATUS: gd.STATUS_REQUEST||"",
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
          ID_REQUEST : gedung.ID,
          ID_LAHAN : gedung.IDAREAL||"",
          ID_GEDUNG: gedung.IDGEDUNG||"",
          ID_AREAL: gedung.IDAREAL||"",
          ID_REQUEST_LAHAN : gedung.ID_REQUEST_LAHAN||"",
          NAMA : gedung.NAMA,
          ALAMAT : gedung.ALAMAT||"",
          NOTES : gedung.NOTES||"",
          STATUS : gedung.STATUS_REQUEST,
          TYPE : gedung.IDGEDUNG?'Edit':'Insert',
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
        await updateRequestLahan(dataLahan,reqLahan.rows[0].ID)
      }
    }else{
      throw createError(406, 'Gagal menyimpan!')
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

  //jika edit dari gedunglgsg, kan get data master gedung atau request gedung
  //jika pake id gedu 
  if(data.id_gedung!==undefined && data.id_gedung ){
    const reqGedung = await database.simpleExecute(`SELECT ID, ALAMAT, COOR_X, COOR_Y from LA_REQUEST_GEDUNG WHERE IDGEDUNG= :id AND REQUEST_BY = :request_by AND STATUS_REQUEST IN ('PENDING','REVISI')`, {id:data.id_gedung, request_by:data.request_by})

    if(reqGedung.rows.length > 0){
      const update = await updateRequestGedung(data,reqGedung.rows[0],reqGedung.rows[0].ID)
      data.id=reqGedung.rows[0].ID
    }else{
      result = await storeNewRequestGedung(data);
      data.id = result.outBinds.id[0];
    }
   
 }else if(data.id_request_lahan!==undefined && data.id_request_lahan){
  const reqLahan = await database.simpleExecute(`SELECT ID, ALAMAT, COOR_X, COOR_Y from LA_REQUEST_LAHAN WHERE ID= :id AND REQUEST_BY = :request_by AND STATUS_REQUEST IN ('PENDING','REVISI')`, {id:data.id_request_lahan, request_by:data.request_by})
  if(reqLahan.rows.length > 0){
    result = await storeRequestGedung(data, reqLahan.rows[0])
    data.id = result.outBinds.id[0];
  }
 }else{
  throw createError(406, 'Gagal menyimpan!')
 }

  return data;
}

//jika yang edit data gedung lama
async function updateGedung(req, id){    
  const data = Object.assign({}, req);
  const reqGedung = await database.simpleExecute(`SELECT ID, IDGEDUNG, ID_REQUEST_LAHAN, ALAMAT, COOR_Y, COOR_X from LA_REQUEST_GEDUNG WHERE ID= :id AND REQUEST_BY = :request_by AND STATUS_REQUEST IN ('PENDING','REVISI')`, {id:id, request_by:data.request_by})

  if(reqGedung.rows.length > 0 && reqGedung.rows[0].ID_REQUEST_LAHAN!==null){
    const reqLahan = await database.simpleExecute(`SELECT ID,ALAMAT, COOR_X, COOR_Y from LA_REQUEST_LAHAN WHERE ID= :id AND REQUEST_BY = :request_by`, {id:reqGedung.rows[0].ID_REQUEST_LAHAN, request_by:data.request_by})
    if(reqLahan.rows.length > 0){
      const update = await updateRequestGedung(data,reqLahan.rows[0],id)
      return update;
    }
  }

  if(reqGedung.rows.length > 0 && reqGedung.rows[0].IDGEDUNG!==null){
    const update = await updateRequestGedung(data,{
      ALAMAT:reqGedung.rows[0].ALAMAT,
      COOR_X:reqGedung.rows[0].COOR_X,
      COOR_Y:reqGedung.rows[0].COOR_Y
    },id)
    return update;
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
    alamat:dataLahan.ALAMAT,
    coor_x:dataLahan.COOR_X,
    coor_y:dataLahan.COOR_Y
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

async function storeNewRequestGedung(data){
  const result = await database.simpleExecute(`INSERT INTO VEAT.LA_REQUEST_GEDUNG
    (IDGEDUNG, NAMA, STATUS_REQUEST, REQUEST_BY, REQUEST_DATE)
    VALUES(:idgedung, :nama, :status, :request_by, TO_DATE(:request_date, 'yyyy/mm/dd hh24:mi:ss')) returning id into :id`, {
      id:data.id,
      idgedung:data.id_gedung,
      nama:data.nama,
      status:data.status,
      request_by: data.request_by,
      request_date: data.request_date
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

async function uploadLahan(context){
  try {
    const reqLahan =  await database.simpleExecute(`SELECT * from LA_REQUEST_LAHAN WHERE ID= :id AND REQUEST_BY = :request_by AND STATUS_REQUEST IN ('PENDING','REVISI')`, {id:context.id, request_by:context.nik})
    if(reqLahan.rows.length > 0){
      const res = await upload(context)
      return res
    }
    throw createError(404, 'Request Lahan tidak ditemukan!') 
  } catch (e) {
    throw createError(500,e.message);
  }
}

async function uploadLahanForm(context){
  try {
    const reqLahan =  await database.simpleExecute(`SELECT * from LA_REQUEST_LAHAN WHERE ID= :id AND REQUEST_BY = :request_by AND STATUS_REQUEST IN ('PENDING','REVISI')`, {id:context.id, request_by:context.nik})
    if(reqLahan.rows.length > 0){
      const imgPromises = context.images.map(async image=>{
        const res = await storeImageForm({
          ...context,
          image
        })
        return res
      })
      return await Promise.all(imgPromises)
    }
    throw createError(404, 'Request Lahan tidak ditemukan!') 
  } catch (e) {
    throw createError(500,e.message);
  }
}

async function uploadGedungForm(context){
  try {
    const reqLahan =  await database.simpleExecute(`SELECT * from LA_REQUEST_GEDUNG WHERE ID= :id AND REQUEST_BY = :request_by AND STATUS_REQUEST IN ('PENDING','REVISI')`, {id:context.id, request_by:context.nik})
    if(reqLahan.rows.length > 0){
      const imgPromises = context.images.map(async image=>{
        const res = await storeImageForm({
          ...context,
          image
        })
        return res
      })
      return await Promise.all(imgPromises)
    }
    throw createError(404, 'Request Gedung tidak ditemukan!') 
  } catch (e) {
    throw createError(500,e.message);
  }
}

async  function storeImageForm(context){
  const id = {
    dir: oracledb.BIND_OUT,
    type: oracledb.NUMBER
  }

  const result = await database.simpleExecute(`INSERT INTO VEAT.LA_REQUEST_ATTACHMENT
  (IDREQUEST, FILE_NAME, TYPE, FILE_TYPE, FILE_SIZE, FILE_PATH, CREATED_DATE)
  VALUES(:idreq,:nama, :type, :filetype, :filesize, :path, TO_DATE(:created_date, 'yyyy/mm/dd hh24:mi:ss')) returning id into :id`, {
    id:id,
    idreq:context.id,
    nama:context.image.filename,
    type:context.type,
    filetype:context.image.mimetype,
    filesize:parseInt(context.image.size),
    path:context.image.path.slice(6),
    created_date: context.created_date
  })
  return {
      id: result.outBinds.id[0],
      path: 'http://10.60.164.5/myassist'+context.image.path.slice(6)
  }
}

async function uploadGedung(context){
  try {
    const reqGedung =  await database.simpleExecute(`SELECT * from LA_REQUEST_GEDUNG WHERE ID= :id AND REQUEST_BY = :request_by AND STATUS_REQUEST IN ('PENDING','REVISI')`, {id:context.id, request_by:context.nik})
    if(reqGedung.rows.length > 0){
      const res = await upload(context)
      return res
    }
    throw createError(404, 'Request Gedung tidak ditemukan!') 
  } catch (e) {
    throw createError(500,e.message);
  }
}

async function upload(context){
  try {
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
    path:context.path.slice(8),
    created_date: context.created_date
  })
  return {
      id: result.outBinds.id[0],
      path: 'http://10.60.164.5/myassist'+context.path.slice(8)
  }
}

async function deleteImage(context){
  const imageLahan = await database.simpleExecute(`SELECT att.ID from LA_REQUEST_ATTACHMENT att JOIN LA_REQUEST_LAHAN lahan ON att.IDREQUEST= lahan.ID WHERE att.ID= :id AND lahan.REQUEST_BY= :request_by`,{id:context.id, request_by: context.nik})

  const imageGedung = await database.simpleExecute(`SELECT att.ID from LA_REQUEST_ATTACHMENT att JOIN LA_REQUEST_GEDUNG lahan ON att.IDREQUEST= lahan.ID WHERE att.ID= :id AND lahan.REQUEST_BY= :request_by`,{id:context.id, request_by: context.nik})

  if(imageLahan.rows.length > 0 || imageGedung.rows.length > 0){
    const deleteSql =
    `begin
    
       delete from LA_REQUEST_ATTACHMENT
       where ID = :id;

       :rowcount := sql%rowcount;
     end;`
   
     const binds = {
       id: context.id,
       rowcount: {
         dir: oracledb.BIND_OUT,
         type: oracledb.NUMBER
       }
     }
     const result = await database.simpleExecute(deleteSql, binds);
   
     return result.outBinds.rowcount === 1;
  }
  return false;
}

async function acceptRequestLahan(context){
  const id = context.id
  const reqLahan =  await database.simpleExecute(`SELECT * FROM LA_REQUEST_LAHAN WHERE ID= :id AND STATUS_REQUEST IN ('REVISI', 'PENDING')`, {id});

  if(reqLahan.rows.length > 0){
    const dataUpdate={
      ...context,
      status:'ACCEPT'
    }
    const result = await updateRequestStatus(dataUpdate, 'LA_REQUEST_LAHAN')
    if (result) {
      if(reqLahan.rows[0].IDAREAL !== null){
        const resUpdate =  await database.simpleExecute(`UPDATE GIS_LAHAN_MASTER
          SET NAMA_LAHAN = :nama_lahan,
          COOR_X = :coor_x,
          COOR_Y = :coor_y,
          ALAMAT = :alamat
          WHERE IDAREAL= :id`, {
            id: reqLahan.rows[0].IDAREAL,
            nama_lahan: reqLahan.rows[0].NAMA_LAHAN,
            coor_x: reqLahan.rows[0].COOR_X,
            coor_y: reqLahan.rows[0].COOR_Y,
            alamat: reqLahan.rows[0].ALAMAT
        });
        const idLahan = reqLahan.rows[0].IDAREAL
        moveAttachmentRequest(id, idLahan, 'LAHAN')
        updateIdArealReqGedung(id, idLahan)
      }else{
        const dataLahan ={
          nama_lahan: reqLahan.rows[0].NAMA,
          alamat: reqLahan.rows[0].ALAMAT,
          coor_x: reqLahan.rows[0].COOR_X,
          coor_y: reqLahan.rows[0].COOR_Y,
        }
        const resLahan = await queryInsertLahan(dataLahan)
        moveAttachmentRequest(id, resLahan.id, 'LAHAN')
        updateIdArealReqGedung(id, resLahan.id)
      }
      return true;
    } 
  }
  throw createError(404, 'Lahan tidak ditemukan atau tidak memenuhi kriteria!') 
}

async function updateIdArealReqGedung(idReqLahan, idLahan){
  const result =  await database.simpleExecute(`UPDATE LA_REQUEST_GEDUNG SET IDAREAL = :idAreal WHERE ID_REQUEST_LAHAN= :idReq`, { idReq: idReqLahan, idAreal: idLahan });
}

async function declineRequestLahan(context){
  const dataUpdate={
    ...context,
    status:'DECLINE'
  }
  const result = await updateRequestStatus(dataUpdate, 'LA_REQUEST_LAHAN')

  if (result) {
    return true;
  }

  throw createError(404, 'Lahan tidak ditemukan!') 
}

async function revisiRequestLahan(context){
  const dataUpdate={
    ...context,
    status:'REVISI'
  }
  const result = await updateRequestStatus(dataUpdate, 'LA_REQUEST_LAHAN')

  if (result) {
    return true;
  } 

  throw createError(404, 'Lahan tidak ditemukan!') 
}


async function updateRequestStatus(data, table='LA_REQUEST_GEDUNG'){
  let addQuery=""
  if(data.status==="REVISI"){
    addQuery+= `, NOTES= :note`
  }
  const result =  await database.simpleExecute(`UPDATE ${table} SET STATUS_REQUEST = :status,
  UPDATE_BY = :update_by, 
  UPDATE_DATE = TO_DATE(:updated_date, 'yyyy-mm-dd hh24:mi:ss')
  ${addQuery} WHERE ID= :id AND STATUS_REQUEST IN ('REVISI', 'PENDING')`, data);
  if (result.rowsAffected && result.rowsAffected === 1) {
    return true;
  } 
  
  return false;
}

//cek id apakah statusnya masih pending/revisi
//update status request
async function acceptRequestGedung(context){
    const id = context.id
    const reqGedung =  await database.simpleExecute(`SELECT * FROM LA_REQUEST_GEDUNG WHERE ID= :id AND IDGEDUNG IS NOT NULL AND STATUS_REQUEST IN ('REVISI', 'PENDING')`, {id});

    if (reqGedung.rows.length > 0) {
      const dataUpdate={
        ...context,
        status:'ACCEPT'
      }
      const result = await updateRequestStatus(dataUpdate)
      if(result){
        if(reqGedung.rows[0].IDGEDUNG !== null){
          const resUpdate =  await database.simpleExecute(`UPDATE GIS_BANGUNAN_MASTER
            SET NAMA_GEDUNG = :nama_gedung
            WHERE IDGEDUNG= :id`, {
              id: reqGedung.rows[0].IDGEDUNG,
              nama_gedung: reqGedung.rows[0].NAMA,
          });
          const idGedung = reqGedung.rows[0].IDGEDUNG
          moveAttachmentRequest(id, idGedung, 'GEDUNG')
        }else if(reqGedung.rows[0].IDAREAL!==null &&  reqGedung.rows[0].STATUS_REQUEST==='ACCEPT'){
          const dataGedung = {
            idareal: reqGedung.rows[0].IDAREAL,
            nama: reqGedung.rows[0].NAMA,
            alamat: reqGedung.rows[0].ALAMAT,
            coor_x: reqGedung.rows[0].COOR_X,
            coor_y: reqGedung.rows[0].COOR_Y
          }
          const resultInsertGedung = await queryInsertGedung(dataGedung)
          const resID = resultInsertGedung.id
          moveAttachmentRequest(reqGedung.rows[0].ID, resID, 'GEDUNG')
        }
        return true;
      }
      throw createError(500, 'Persetujuan request gagal!') 
    } 
    throw createError(404, 'Gedung tidak ditemukan atau tidak memenuhi kriteria!') 
}

async function moveAttachmentRequest(idRequest,idMaster, type){
  const images = await queryGetRequestImages(idRequest,type)
  const imgPromises = images.rows.map(async image=>{
    const data = {
      file_name: image.FILE_NAME,
      file_path: image.FILE_PATH,
      base_url:'http://10.60.164.5/myassist/',
      created_date: getDate()
    }
    const idAttachment = await queryInsertAttachImage(data)
    const id_attachment = idAttachment.id
    if(type==='GEDUNG')
      await queryInsertAttachImageGedung({idgedung:idMaster, id_attachment})
    else if(type==='LAHAN')
      await queryInsertAttachImageLahan({idareal:idMaster, id_attachment})
  })
  return await Promise.all(imgPromises)
}

async function declineRequestGedung(context){
  const dataUpdate={
    ...context,
    status:'DECLINE'
  }
  const result = await updateRequestStatus(dataUpdate)
  if (result) {
    return true;
  } 

  throw createError(404, 'Gedung tidak ditemukan!') 
}

async function revisiRequestGedung(context){
  const dataUpdate={
    ...context,
    status:'REVISI'
  }
  const result = await updateRequestStatus(dataUpdate)
  if (result) {
    return true;
  } 

  throw createError(404, 'Gedung tidak ditemukan!') 
}

module.exports={
  getList,
  getRequestGedung,
  getRequestLahan,
  listRequestGedung,
  listRequestLahan,
  getLahan,
  getGedung,
  storeLahan,
  storeGedung,
  updateLahan,
  updateGedung,
  uploadGedung,
  uploadGedungForm,
  uploadLahanForm,
  uploadLahan,
  deleteImage,
  acceptRequestGedung,
  declineRequestGedung,
  revisiRequestGedung,
  acceptRequestLahan,
  declineRequestLahan,
  revisiRequestLahan
};