const database = require('../services/database.js');
const transform = require('../transformers/gedung.js');
const url = require('url');

async function getAll(req)
{
    const params = req.query
    const lat = (params.lat && params.lat.length>0)? params.lat : -6.230361;
    const long = (params.long && params.long.length>0) ? params.long : 106.816673;
    let sql =`SELECT DISTINCT(a.IDGEDUNG),a.IDAREAL, a.COOR_X, a.COOR_Y, a.NAMA_GEDUNG, a.ALAMAT, a.LUAS_BANGUNAN, a.JUMLAH_LANTAI, a.SALEABLE_AREA, a.PATH_GEDUNG_IMAGE,
    ROUND(
    (6371* ACOS(
        COS(RADIANS(a.COOR_Y))
        * COS(RADIANS(${lat}))
        * COS(RADIANS(${long}) - RADIANS(a.COOR_X))
        + SIN(RADIANS(a.COOR_Y))
        * SIN(RADIANS(${lat}))
        )
    ), 1
    ) AS DISTANCE, 
    ROW_NUMBER() OVER (ORDER BY a.IDGEDUNG) RN,
    Wm_Concat(c.NAMA) NAMA_KEGIATAN
    FROM GIS_BANGUNAN_MASTER a 
    LEFT JOIN LA_PENGGUNAAN_GEDUNG b on b.ID_GEDUNG = a.IDGEDUNG
    LEFT JOIN LA_PENGGUNAAN c on b.ID_PENGGUNAAN = c.ID 
    LEFT JOIN LA_LAHAN f on TO_CHAR(f.IDAREAL) = TO_CHAR(a.IDAREAL)`;

    const query = setFilter(sql, params);
    const result = await database.simpleExecute(`${query} GROUP BY a.IDGEDUNG, a.IDAREAL, a.COOR_X, a.COOR_Y, a.NAMA_GEDUNG, a.ALAMAT, a.LUAS_BANGUNAN, a.JUMLAH_LANTAI, a.SALEABLE_AREA, a.PATH_GEDUNG_IMAGE
    `, {});
    const transformedList= await result.rows.map(gedung => transform.transformList(gedung));
    return transformedList;
}

async function getAllPagination(req)
{
    const res ={}
    const params = req.query    
    const lat = (params.lat && params.lat.length>0)? params.lat : -6.230361;
    const long = (params.long && params.long.length>0) ? params.long : 106.816673;
    let per_page=10;
    let page=1;
    if(params.per_page !== undefined){
        per_page=parseInt(params.per_page,10);
    }

    if(params.page!== undefined){
        page=parseInt(params.page,10);
    }

    const sql=`SELECT DISTINCT(a.IDGEDUNG),a.IDAREAL, a.COOR_X, a.COOR_Y, a.NAMA_GEDUNG, a.ALAMAT, a.LUAS_BANGUNAN, a.JUMLAH_LANTAI, a.SALEABLE_AREA, a.PATH_GEDUNG_IMAGE,
    ROUND(
    (6371* ACOS(
        COS(RADIANS(a.COOR_Y))
        * COS(RADIANS(${lat}))
        * COS(RADIANS(${long}) - RADIANS(a.COOR_X))
        + SIN(RADIANS(a.COOR_Y))
        * SIN(RADIANS(${lat}))
        )
    ), 1
    ) AS DISTANCE ,
    ROW_NUMBER() OVER (ORDER BY a.IDGEDUNG) RN,
    Wm_Concat(c.NAMA) NAMA_KEGIATAN
    FROM GIS_BANGUNAN_MASTER a 
    LEFT JOIN LA_PENGGUNAAN_GEDUNG b on b.ID_GEDUNG = a.IDGEDUNG
    LEFT JOIN LA_PENGGUNAAN c on b.ID_PENGGUNAAN = c.ID 
    LEFT JOIN LA_LAHAN f on TO_CHAR(f.IDAREAL) = TO_CHAR(a.IDAREAL) `;

    const query = setFilter(sql, params);
    const dataParams = setParams(params);
    
    const totalQuery = await database.simpleExecute(`SELECT count(*) as total_count FROM(${query} GROUP BY a.IDGEDUNG, a.IDAREAL, a.COOR_X, a.COOR_Y, a.NAMA_GEDUNG, a.ALAMAT, a.LUAS_BANGUNAN, a.JUMLAH_LANTAI, a.SALEABLE_AREA, a.PATH_GEDUNG_IMAGE)`, {});
    const total= totalQuery.rows[0].TOTAL_COUNT;
    const totalPages=Math.ceil(total/per_page);
    const awal=(page===1)?1:((page-1)*per_page+1);
    const akhir=(page===1)?per_page:(page*per_page);

    const result = await database.simpleExecute(`SELECT * FROM(${query} GROUP BY a.IDGEDUNG, a.IDAREAL, a.COOR_X, a.COOR_Y, a.NAMA_GEDUNG, a.ALAMAT, a.LUAS_BANGUNAN, a.JUMLAH_LANTAI, a.SALEABLE_AREA, a.PATH_GEDUNG_IMAGE)
    WHERE RN >= ${awal} AND RN <= ${akhir}`, {});
    const transformedList= await result.rows.map(gedung => transform.transformList(gedung));
    res.data = transformedList
    const prevPage=(page==1)?"":current_url(req)+"?page="+(page-1)+`&per_page=${per_page}`+dataParams;
    const nextPage=(page==totalPages)?"":current_url(req)+`?page=${(page+1)}&per_page=${per_page}`+dataParams;

    res.paginator = {
        'total_count': parseInt(total),
        'total_pages':totalPages,
        'first_page': current_url(req)+`?page=1&per_page=${per_page}`+dataParams,
        'prev_page':prevPage,
        'next_page':nextPage,
        'last_page':current_url(req)+`?page=${totalPages}&per_page=${per_page}`+dataParams,
        'limit':per_page
    }
    return res;
}

async function nearMe(params)
{
    const lat = (params.lat && params.lat.length>0)? params.lat : -6.230361;
    const long = (params.long && params.long.length>0) ? params.long : 106.816673;
    const distance =(params.distance && params.distance.length>0)?params.distance:5;

    const sql=`SELECT * FROM (
        SELECT DISTINCT(a.IDGEDUNG),a.IDAREAL, a.COOR_X, a.COOR_Y, a.NAMA_GEDUNG, a.ALAMAT, a.LUAS_BANGUNAN, a.JUMLAH_LANTAI, a.SALEABLE_AREA, b.ID_PENGGUNAAN, a.PATH_GEDUNG_IMAGE,f.STATUS_KEPEMILIKAN,
        ROUND(
        (6371* ACOS(
            COS(RADIANS(a.COOR_Y))
            * COS(RADIANS(${lat}))
            * COS(RADIANS(${long}) - RADIANS(a.COOR_X))
            + SIN(RADIANS(a.COOR_Y))
            * SIN(RADIANS(${lat}))
            )
        ), 1
        ) AS DISTANCE,
        Wm_Concat(c.NAMA) NAMA_KEGIATAN 
        FROM GIS_BANGUNAN_MASTER a 
        LEFT JOIN LA_PENGGUNAAN_GEDUNG b on b.ID_GEDUNG = a.IDGEDUNG
        LEFT JOIN LA_PENGGUNAAN c on b.ID_PENGGUNAAN = c.ID
        LEFT JOIN LA_LAHAN f on TO_CHAR(f.IDAREAL) = TO_CHAR(a.IDAREAL) GROUP BY a.IDGEDUNG, a.IDAREAL, a.COOR_X, a.COOR_Y, a.NAMA_GEDUNG, a.ALAMAT, a.LUAS_BANGUNAN, a.JUMLAH_LANTAI, a.SALEABLE_AREA, b.ID_PENGGUNAAN, a.PATH_GEDUNG_IMAGE,f.STATUS_KEPEMILIKAN ) x WHERE DISTANCE <=${distance}`;

    const query = setFilterNearMe(sql, params);
    const result = await database.simpleExecute(query, {});
    const transformedList= await result.rows.map(gedung => transform.transformList(gedung));

    return transformedList;
}

async function getDetail(params, idGedung)
{
    let result={};
    const lat = (params.lat && params.lat.length>0)? params.lat : -6.230361;
    const long = (params.long && params.long.length>0) ? params.long : 106.816673;

    let res = await database.simpleExecute(`SELECT a.IDGEDUNG,a.IDAREAL,a.NAMA_GEDUNG,b.COOR_X,b.COOR_Y,a.ALAMAT, a.DESA, a.KECAMATAN, a.KOTA, a.PROPINSI, a.TREG, a.WITEL, a.UNIT_GSD,a.IDAREAL,
    a.LUAS_BANGUNAN, b.LUAS_LAHAN, a.JUMLAH_LANTAI, a.OCCUPACY_RATE, a.SALEABLE_AREA, a.PATH_GEDUNG_IMAGE,
    ROUND(
        (6371* ACOS(
            COS(RADIANS(a.COOR_Y))
            * COS(RADIANS(${lat}))
            * COS(RADIANS(${long}) - RADIANS(a.COOR_X))
            + SIN(RADIANS(a.COOR_Y))
            * SIN(RADIANS(${lat}))
            )
        ), 1
        ) AS DISTANCE
    FROM GIS_BANGUNAN_MASTER a 
                    left join LA_LAHAN b on TO_CHAR(a.IDAREAL) = TO_CHAR(b.IDAREAL)
           WHERE TO_CHAR(a.IDGEDUNG) = ${idGedung} AND ROWNUM <= 1`, {});
    result.gedung_master =  res.rows.length > 0 ? res.rows.reduce((acc, gedung)=>transform.transformGedungMaster(gedung),0) : "";

    const idAreal = result.gedung_master.IDAREAL
    const resLahan = await database.simpleExecute(`SELECT DISTINCT(a.IDAREAL), a.COOR_X, a.COOR_Y, a.NAMA_LAHAN, a.ALAMAT, a.LUAS_LAHAN, a.JUMLAH_BANGUNAN, a.GUNA_LAHAN, d.SKHAK, d.TANGGAL_AKHIR, 
                CASE e.NAMA_KLASIFIKASI
                    WHEN 'PRIMER' then 'Q1'
                    WHEN 'SEKUNDER' then 'Q2'
                    WHEN 'TERSIER' then 'Q3'
                    WHEN 'RESIDU' then 'Q4'
                    ELSE null
                END AS NAMA_KLASIFIKASI, f.NAMA as STATUS_KEP, f.DESKRIPSI, a.PATH_LAHAN_IMAGE,
                CASE WHEN d.SKHAK  IS NULL THEN 'Tidak Bersertifikat'
                ELSE 'Bersertifikat' END as STATUS_HGB
                FROM GIS_LAHAN_MASTER a 
                left join LA_ANALISIS_SCORE b on TO_CHAR(a.IDAREAL) = TO_CHAR(b.IDAREAL)
                    left join LA_REF_ANALISIS_SCORE_KLAS e on TO_NUMBER(b.KLASIFIKASI) = e.ID
                    left join LA_REF_STATUS_KEPEMILIKAN f on TO_CHAR(f.ID) = TO_CHAR(a.STATUS_KEPEMILIKAN)
                    left join LA_SERTIPIKAT_BARU d on TO_CHAR(d.IDAREAL) = TO_CHAR(a.IDAREAL) 
                WHERE a.IDAREAL=${idAreal}`,{});
    result.lahan =  transform.transformLahan(resLahan.rows[0]);

    const resImgGedung = await database.simpleExecute(`SELECT a.*,b.* FROM LA_ATTACHMENT_GEDUNG a INNER JOIN LA_ATTACHMENT b on TO_NUMBER(a.ID_ATTACHMENT) = b.ID WHERE (TO_CHAR(a.IDGEDUNG)) = ${idGedung} AND TO_CHAR(a.ID_ATTACHMENT_GROUP) = 1 AND ROWNUM <= 3`,{});
    result.img_gedung =  resImgGedung.rows.length > 0 ? resImgGedung.rows.map(img=>transform.transformImageGedung(img)) : [];

    let resPBB = await database.simpleExecute(`SELECT * FROM LA_PBB_GEDUNG WHERE IDGEDUNG = :ID_GEDUNG`, {ID_GEDUNG: idGedung});
    result.pbb =  resPBB.rows.length > 0 ? resPBB.rows.map(pbb=>transform.transformPBBGedung(pbb)) : [];

    let resNKA = await database.simpleExecute(`SELECT * FROM LA_NKA_GEDUNG WHERE IDGEDUNG = :ID_GEDUNG`, {ID_GEDUNG: idGedung});
    result.nka =  resNKA.rows.length > 0 ? resNKA.rows.map(nka=>transform.transformNKAGedung(nka)) : [];

    let resTagihanListrik = await database.simpleExecute(`SELECT t.* FROM LA_LISTRIK_GEDUNG t JOIN ( SELECT IDGEDUNG, MAX(TANGGAL) AS TANGGAL FROM LA_LISTRIK_GEDUNG WHERE IDGEDUNG= :ID_GEDUNG GROUP BY IDGEDUNG ) m
    ON  m.IDGEDUNG = t.IDGEDUNG AND m.TANGGAL = t.TANGGAL WHERE ROWNUM=1`, {ID_GEDUNG: idGedung});
    result.listrik =  resTagihanListrik.rows.length > 0 ? resTagihanListrik.rows.map(listrik=>transform.transformTagihanListrik(listrik)) : [];

    const resTagihanAir = await database.simpleExecute(`SELECT t.* FROM LA_AIR t JOIN (SELECT IDGEDUNG, MAX(TANGGAL) AS TANGGAL FROM LA_AIR WHERE IDGEDUNG= :ID_GEDUNG GROUP BY IDGEDUNG ) m ON  m.IDGEDUNG = t.IDGEDUNG AND m.TANGGAL = t.TANGGAL WHERE ROWNUM=1`, {ID_GEDUNG: idGedung});
    result.air =  resTagihanAir.rows.length > 0 ? resTagihanAir.rows.map(air=>transform.transformTagihanAir(air) ): [];

    const resTenant = await database.simpleExecute(`SELECT * FROM LA_TENANT_BARU WHERE IDGEDUNG = :ID_GEDUNG`, {ID_GEDUNG: idGedung});
    result.tenant =  resTenant.rows.length > 0 ? resTenant.rows.map(tenant=>transform.transformTenantGedung(tenant)) : [];

    const resKtel = await database.simpleExecute(`SELECT * FROM LA_KTEL WHERE IDGEDUNG = :ID_GEDUNG`, {ID_GEDUNG: idGedung});
    result.ktel =  resKtel.rows.length > 0 ? resKtel.rows.reduce((acc, gedung)=>transform.transformGedungKTEL(gedung),0) : "";

    // let resDocOthers = await database.simpleExecute(`SELECT * FROM LA_DOCUMENT_OTHER a
    // LEFT OUTER JOIN (SELECT ID_DOCUMENT, MAX(FILE_PATH) PATH_FILE, MAX(SERVER) SERV
	// 		FROM LA_ATT_DOCUMENT_OTHER GROUP BY ID_DOCUMENT ) b ON a.ID = b.ID_DOCUMENT  WHERE IDGEDUNG = :ID_GEDUNG`, {ID_GEDUNG: idGedung});
    // result.dokumen_lainnya =  resDocOthers.rows.length > 0 ? resDocOthers.rows.map(doc=>transform.transformDocOtherGedung(doc)) : [];

    return result;
}

async function detailAsetGedung(){
    const resultAsets = await database.simpleExecute(`SELECT b.ID, b.TREG_ID, b.NAMA, COALESCE(count(a.IDGEDUNG), 0) as total_gedung, COALESCE(SUM(LUAS_BANGUNAN),0) as luas FROM LA_REF_WILAYAH_TELKOM b LEFT JOIN GIS_BANGUNAN_MASTER a ON TO_CHAR(b.ID) = TO_CHAR(a.ID_WITEL) GROUP BY b.ID, b.TREG_ID, b.NAMA ORDER BY b.TREG_ID ASC`,{});
    const result=[];

    resultAsets.rows.map(aset => {
        if(result[aset.TREG_ID]===undefined){
            result[aset.TREG_ID]={
                id:aset.TREG_ID,
                nama:`Regional ${aset.TREG_ID}`,
                aset:{
                    total:aset.TOTAL_GEDUNG,
                    luas:aset.LUAS,
                },
                witels:[{
                    id:aset.ID,
                    nama:`${aset.NAMA}`,
                    aset:{
                        total: aset.TOTAL_GEDUNG,
                        luas: aset.LUAS
                    },
                }]
            }
        }else{
            result[aset.TREG_ID].aset.total += aset.TOTAL_GEDUNG
            result[aset.TREG_ID].aset.luas += aset.LUAS

            result[aset.TREG_ID].witels.push({
                id:aset.ID,
                nama:`${aset.NAMA}`,
                aset:{
                    total: aset.TOTAL_GEDUNG,
                    luas: aset.LUAS
                },
            })
        }
        
    })

    return result.filter(function() { return true; });
}

async function getListrik(context)
{
    const resTagihanListrik = await database.simpleExecute(`SELECT * FROM LA_LISTRIK_GEDUNG WHERE IDGEDUNG= :ID_GEDUNG AND EXTRACT( YEAR FROM TANGGAL) = :YEAR ORDER BY TANGGAL DESC`, {ID_GEDUNG: context.id, YEAR:context.tahun});
    const result =  resTagihanListrik.rows.length > 0 ? resTagihanListrik.rows.map(listrik=>transform.transformTagihanListrik(listrik)) : [];
    return result
}

async function getAir(context)
{
    const resTagihanAir = await database.simpleExecute(`SELECT * FROM LA_AIR WHERE IDGEDUNG=:ID_GEDUNG AND EXTRACT( YEAR FROM TANGGAL) = :YEAR ORDER BY TANGGAL DESC`, {ID_GEDUNG: context.id, YEAR:context.tahun});
    const result =  resTagihanAir.rows.length > 0 ? resTagihanAir.rows.map(air=>transform.transformTagihanAir(air) ): [];

    return result;
}

function current_url(req){
    const requrl = url.format({
      protocol: req.protocol,
      host: req.get('host'),
      pathname: req.originalUrl.split("?").shift(),
    });
    return requrl
}

function setFilter(sql, params)
{
    if(params.provinsi !== undefined || params.kota !== undefined || params.kec !== undefined ){
        let administrasiInfo = " WHERE a.ID_PROPINSI=31"
        if(params.provinsi !== undefined && params.provinsi.length > 0){
            const idPropinsi=parseInt(params.provinsi,10);
            administrasiInfo = ` WHERE a.ID_PROPINSI=${idPropinsi}`;
        }
        if(params.kota !== undefined && params.kota.length > 0){
            const idKota=parseInt(params.kota,10);
            administrasiInfo = ` WHERE a.ID_KOTA=${idKota}`;
        }
        if(params.kec !== undefined && params.kec.length > 0){
            const idKec=parseInt(params.kec,10);
            administrasiInfo = ` WHERE a.ID_KECAMATAN=${idKec}`;
        }
        sql += administrasiInfo
    }else if(params.witel!== undefined && params.witel.length > 0){
        const idWitel=parseInt(params.witel,10);
        const administrasiInfo = ` WHERE a.ID_WITEL=${idWitel}`;
        sql += administrasiInfo;
    }else{
        sql += ` WHERE a.ID_PROPINSI=31`;
    }

    if(params.penggunaan!== undefined && params.penggunaan.length > 0){
        const dataPenggunaan= params.penggunaan.split(',');
        const penggunaan = dataPenggunaan.map(x => x ).toString();
        sql += ` AND b.ID_PENGGUNAAN IN (${penggunaan})`;
    }

    if(params.nama!== undefined && params.nama.length > 0){
        const nama=params.nama;
        sql += ` AND regexp_like(a.NAMA_GEDUNG, '${nama}', 'i')`;
    }

    if(params.luas!== undefined && params.luas.length > 0){
        const luas=params.luas.split('-');
        if(luas.length ===2)
            sql += ` AND a.LUAS_BANGUNAN BETWEEN ${luas[0]} AND ${luas[1]}`;
    }

    return sql;
}

function setFilterNearMe(sql, params)
{
    if(params.luas!== undefined && params.luas.length > 0){
        const luas = params.luas.split('-');
        if(luas.length ===2)
            sql += ` AND LUAS_BANGUNAN BETWEEN ${luas[0]} AND ${luas[1]}`;
    }

    if(params.penggunaan!== undefined && params.penggunaan.length > 0){
        const dataPenggunaan= params.penggunaan.split(',');
        const penggunaan = dataPenggunaan.map(x => x ).toString();
        sql += ` AND ID_PENGGUNAAN IN (${penggunaan})`;
    }

    if(params.nama !== undefined && params.nama.length > 0){
        const nama=params.nama;
        sql += ` AND regexp_like(NAMA_GEDUNG, '${nama}', 'i')`;
    }
    
    return sql;
}

function setParams(params)
{
    let dataParams='';
    if(params.provinsi !==undefined || params.kota !==undefined || params.kec !==undefined ){
        if(params.provinsi !==undefined){
            dataParams+= '&provinsi='+params.provinsi;
        }

        if(params.kota !==undefined){
           dataParams+= '&kota='+params.kota; 
        }
        if(params.kec !==undefined){
            dataParams+= '&kec='.params.kec;
        }
    //by witel
    }else if(params.witel !==undefined){
        dataParams+= '&witel='+params.witel;
    }else{
        dataParams+= '&provinsi=31';
    }

    if(params.luas!==undefined){
        dataParams+= '&luas='+params.luas;
    }

    if(params.penggunaan!==undefined){
        dataParams+= '&penggunaan='+params.penggunaan;
    }

    if(params.nama!==undefined){
        dataParams+= '&nama='+params.nama;
    }

    return dataParams;
}

module.exports={
  getAll,
  getAllPagination,
  nearMe,
  getDetail,
  getListrik,
  getAir,
  detailAsetGedung
};