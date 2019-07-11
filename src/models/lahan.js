const database = require('../services/database.js');
const transform = require('../transformers/lahan.js');
const url = require('url');


/**
 * 
 * @param {TODO} req 
 * 
 * API
 * Summary status tanah => HGB, HGB Jatuh Tempo, Tidak Bersertifikat
 * Asset Mapping (Q1-Q4) => isinya per regional sampe witel
 * List Request lahan
 * List Request Gedung
 * Input Req Lahan
 * Input Req Gedung
 * Edit Req Lahan
 * Edit Req Gedung
 */
//f.NAMA as STATUS_KEP
async function getAll(req)
{
    const tahunJatuhTempo= getJatuhTempo()
    const params = req.query
    const lat =  (params.lat && params.lat.length>0) ? params.lat : -6.230361;
    const long = (params.long && params.long.length>0) ? params.long : 106.816673;
    let sql =`SELECT DISTINCT(a.IDAREAL), a.COOR_X, a.COOR_Y, a.NAMA_LAHAN, a.ALAMAT,a.LUAS_LAHAN, a.JUMLAH_BANGUNAN, a.GUNA_LAHAN, a.SALEABLE_AREA, e.NAMA_KLASIFIKASI,
    d.SKHAK, d.TANGGAL_AKHIR, CASE e.NAMA_KLASIFIKASI
      WHEN 'PRIMER' then 'Q1'
      WHEN 'SEKUNDER' then 'Q2'
      WHEN 'TERSIER' then 'Q3'
      WHEN 'RESIDU' then 'Q4'
      ELSE null
    END AS NAMA_KLASIFIKASI_ALIAS, 
    CASE 
    WHEN d.SKHAK = 'HGB' AND d.TANGGAL_AKHIR > TO_DATE('${tahunJatuhTempo}','YYYY-MM-DD') then 'Hak Guna Bangunan'
    WHEN d.SKHAK = 'HP' AND d.TANGGAL_AKHIR > TO_DATE('${tahunJatuhTempo}','YYYY-MM-DD') then 'Hak Pakai'
    WHEN d.SKHAK = 'HM' AND d.TANGGAL_AKHIR > TO_DATE('${tahunJatuhTempo}','YYYY-MM-DD') then 'Hak Milik'
    WHEN d.TANGGAL_AKHIR < TO_DATE('${tahunJatuhTempo}','YYYY-MM-DD') then 'HGB Jatuh Tempo'
    ELSE null
    END AS STATUS_KEP, f.DESKRIPSI, a.PATH_LAHAN_IMAGE,
    CASE WHEN d.SKHAK  IS NULL THEN 'Tidak Bersertifikat'
    ELSE 'Bersertifikat' END as STATUS_HGB,
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
    ROW_NUMBER() OVER (ORDER BY a.IDAREAL) RN
    FROM GIS_LAHAN_MASTER a 
    left join LA_ANALISIS_SCORE b on TO_CHAR(a.IDAREAL) = TO_CHAR(b.IDAREAL)
    left join LA_REF_ANALISIS_SCORE_KLAS e on TO_NUMBER(b.KLASIFIKASI) = e.ID
    left join LA_REF_STATUS_KEPEMILIKAN f on TO_CHAR(f.ID) = TO_CHAR(a.STATUS_KEPEMILIKAN)
    left join LA_SERTIPIKAT_BARU d on TO_CHAR(d.IDAREAL) = TO_CHAR(a.IDAREAL)`;

  const query = setFilter(sql, params);
  const result = await database.simpleExecute(query, {});
  const transformedListLahan= await result.rows.map(lahan => transform.transformList(lahan));

  return transformedListLahan;
}

function getJatuhTempo() {
    const date = new Date();
    date.setFullYear(date.getFullYear() + 1)
    return date.toISOString().split('T')[0];
}

async function getAllPagination(req)
{
    const res ={}
    const tahunJatuhTempo= getJatuhTempo()
    const params = req.query
    const lat =  (params.lat && params.lat.length>0) ? params.lat : -6.230361;
    const long = (params.long && params.long.length>0) ? params.long : 106.816673;
    let per_page=10;
    let page=1;
    if(params.per_page !== undefined){
        per_page=parseInt(params.per_page,10);
    }

    if(params.page!== undefined){
        page=parseInt(params.page,10);
    }

    const sql=`SELECT DISTINCT(a.IDAREAL), a.COOR_X, a.COOR_Y, a.NAMA_LAHAN, a.ALAMAT, a.LUAS_LAHAN,
    a.JUMLAH_BANGUNAN, a.GUNA_LAHAN, d.SKHAK, d.TANGGAL_AKHIR, a.SALEABLE_AREA, e.NAMA_KLASIFIKASI,
    CASE e.NAMA_KLASIFIKASI
        WHEN 'PRIMER' then 'Q1'
        WHEN 'SEKUNDER' then 'Q2'
        WHEN 'TERSIER' then 'Q3'
        WHEN 'RESIDU' then 'Q4'
        ELSE null
    END AS NAMA_KLASIFIKASI_ALIAS,
    CASE 
        WHEN d.SKHAK = 'HGB' AND d.TANGGAL_AKHIR > TO_DATE('${tahunJatuhTempo}','YYYY-MM-DD') then 'Hak Guna Bangunan'
        WHEN d.SKHAK = 'HP' AND d.TANGGAL_AKHIR > TO_DATE('${tahunJatuhTempo}','YYYY-MM-DD') then 'Hak Pakai'
        WHEN d.SKHAK = 'HM' AND d.TANGGAL_AKHIR > TO_DATE('${tahunJatuhTempo}','YYYY-MM-DD') then 'Hak Milik'
        WHEN d.TANGGAL_AKHIR < TO_DATE('${tahunJatuhTempo}','YYYY-MM-DD') then 'HGB Jatuh Tempo'
        ELSE null
    END AS STATUS_KEP, f.DESKRIPSI, a.PATH_LAHAN_IMAGE,
    CASE WHEN d.SKHAK  IS NULL THEN 'Tidak Bersertifikat'
    ELSE 'Bersertifikat' END as STATUS_HGB,
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
    ROW_NUMBER() OVER (ORDER BY a.IDAREAL) RN
    FROM GIS_LAHAN_MASTER a 
    left join LA_ANALISIS_SCORE b on TO_CHAR(a.IDAREAL) = TO_CHAR(b.IDAREAL)
        left join LA_REF_ANALISIS_SCORE_KLAS e on TO_NUMBER(b.KLASIFIKASI) = e.ID
        left join LA_REF_STATUS_KEPEMILIKAN f on TO_CHAR(f.ID) = TO_CHAR(a.STATUS_KEPEMILIKAN)
        left join LA_SERTIPIKAT_BARU d on TO_CHAR(d.IDAREAL) = TO_CHAR(a.IDAREAL) `;

    const query = setFilter(sql, params);
    const dataParams = setParams(params);
    
    const totalQuery = await database.simpleExecute(`SELECT count(*) as total_count FROM(${query})`, {});
    const total= totalQuery.rows[0].TOTAL_COUNT;
    const totalPages=Math.ceil(total/per_page);
    const awal=(page===1)?1:((page-1)*per_page+1);
    const akhir=(page===1)?per_page:(page*per_page);

    const result = await database.simpleExecute(`SELECT * FROM(${query})
    WHERE RN >= ${awal} AND RN <= ${akhir}`, {});
    const transformedListLahan= await result.rows.map(lahan => transform.transformList(lahan));
    res.data = transformedListLahan
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
    const tahunJatuhTempo= getJatuhTempo()
    const lat =  (params.lat && params.lat.length>0) ? params.lat : -6.230361;
    const long = (params.long && params.long.length>0) ? params.long : 106.816673;
    const distance = (params.distance && params.distance>0)?params.distance:5;

    const sql=`SELECT * FROM (SELECT DISTINCT(a.IDAREAL), a.COOR_X, a.COOR_Y, a.NAMA_LAHAN, a.ALAMAT, a.STATUS_KEPEMILIKAN, a.LUAS_LAHAN, a.JUMLAH_BANGUNAN, a.GUNA_LAHAN, a.SALEABLE_AREA,  e.NAMA_KLASIFIKASI,
        d.SKHAK, d.TANGGAL_AKHIR, CASE e.NAMA_KLASIFIKASI
        WHEN 'PRIMER' then 'Q1'
        WHEN 'SEKUNDER' then 'Q2'
        WHEN 'TERSIER' then 'Q3'
        WHEN 'RESIDU' then 'Q4'
        ELSE null
    END AS NAMA_KLASIFIKASI_ALIAS, 
    CASE 
    WHEN d.SKHAK = 'HGB' AND d.TANGGAL_AKHIR > TO_DATE('${tahunJatuhTempo}','YYYY-MM-DD') then 'Hak Guna Bangunan'
    WHEN d.SKHAK = 'HP' AND d.TANGGAL_AKHIR > TO_DATE('${tahunJatuhTempo}','YYYY-MM-DD') then 'Hak Pakai'
    WHEN d.SKHAK = 'HM' AND d.TANGGAL_AKHIR > TO_DATE('${tahunJatuhTempo}','YYYY-MM-DD') then 'Hak Milik'
    WHEN d.TANGGAL_AKHIR < TO_DATE('${tahunJatuhTempo}','YYYY-MM-DD') then 'HGB Jatuh Tempo'
    ELSE null
    END AS STATUS_KEP, f.DESKRIPSI, a.PATH_LAHAN_IMAGE, 
        CASE WHEN d.SKHAK  IS NULL THEN 'Tidak Bersertifikat'
        ELSE 'Bersertifikat' END as STATUS_HGB,
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
        FROM GIS_LAHAN_MASTER a 
        left join LA_ANALISIS_SCORE b on TO_CHAR(a.IDAREAL) = TO_CHAR(b.IDAREAL)
        left join LA_REF_ANALISIS_SCORE_KLAS e on TO_NUMBER(b.KLASIFIKASI) = e.ID
        left join LA_REF_STATUS_KEPEMILIKAN f on TO_CHAR(f.ID) = TO_CHAR(a.STATUS_KEPEMILIKAN)
        left join LA_SERTIPIKAT_BARU d on TO_CHAR(d.IDAREAL) = TO_CHAR(a.IDAREAL) ) x WHERE DISTANCE <=${distance}`;

    const query = setFilterNearMe(sql, params);
    const result = await database.simpleExecute(query, {});
    const transformedListLahan= await result.rows.map(lahan => transform.transformList(lahan));

    return transformedListLahan;
}

async function getDetail(idAreal)
{
    let result={};

    let res = await database.simpleExecute(`SELECT a.IDAREAL,a.NAMA_LAHAN,a.ALAMAT,a.COOR_X,a.COOR_Y,a.LUAS_LAHAN, a.ID_PROPINSI, a.PROPINSI,a.ID_KOTA,a.KOTA, a.ID_KECAMATAN, a.KECAMATAN, a.ID_DESA, a.DESA, a.ID_TREG, a.TREG, a.ID_WITEL, a.WITEL, a.PATH_LAHAN_IMAGE,c.NAMA_KLASIFIKASI, h.NAMA as NAMA_STATUS_KEPEMILIKAN FROM GIS_LAHAN_MASTER a 
    left join LA_ANALISIS_SCORE b on TO_CHAR(a.\"IDAREAL\") = TO_CHAR(b.\"IDAREAL\") 
    left join LA_REF_ANALISIS_SCORE_KLAS c on TO_NUMBER(b.\"KLASIFIKASI\") = c.\"ID\" 
    left join LA_REF_STATUS_KEPEMILIKAN h on a.STATUS_KEPEMILIKAN = h.ID
    WHERE TO_CHAR(a.\"IDAREAL\") = '${idAreal}' AND ROWNUM <= 1`, {});
    res.rows.length > 0 ? result.lahan_master =res.rows.reduce((acc, lahan)=>transform.transformLahanMaster(lahan),0):"";

    const resImgLahan = await database.simpleExecute(`SELECT a.*,b.* FROM LA_ATTACHMENT_lahan a INNER JOIN LA_ATTACHMENT b on TO_NUMBER(a.ID_ATTACHMENT) = b.ID WHERE (TO_CHAR(a.IDAREAL)) = ${idAreal} AND TO_CHAR(a.ID_ATTACHMENT_GROUP) = 1 AND ROWNUM <= 3`,{});
    result.img_lahan =  resImgLahan.rows.length > 0 ? resImgLahan.rows.map(img=>transform.transformImageLahan(img)) : [];

    const resSertifikat = await database.simpleExecute(`SELECT * FROM LA_SERTIPIKAT_BARU WHERE IDAREAL= :ID_AREAL`,{ID_AREAL: idAreal});

    const sertiPromises = resSertifikat.rows.map(async sertifikat=>{
        const resAttachment = await database.simpleExecute(`SELECT * FROM LA_ATT_SERTIPIKAT_LAHAN WHERE ID_SERTIPIKAT = :ID_SERTIPIKAT AND ROWNUM <= 1`, {ID_SERTIPIKAT:sertifikat.ID});
        resAttachment.rows.length > 0 ? sertifikat.attachment =  transform.transformAttSertifikatLahan(resAttachment.rows[0]):"";
        return await transform.transformSertifikatLahan(sertifikat)
    }) ;
    const kepemilikan = await Promise.all(sertiPromises)
    result.kepemilikan= kepemilikan.length > 0?kepemilikan:[];

    const resPBB = await database.simpleExecute(`SELECT * FROM LA_PBB_LAHAN WHERE IDAREAL = :ID_AREAL ORDER BY NVL(TAHUN, -1) DESC`,{ID_AREAL: idAreal});
    result.pbb = resPBB.rows.length > 0 ? resPBB.rows.map(pbb=>transform.transformPBBLahan(pbb)) : [];

    const resKJPP = await database.simpleExecute(`SELECT a.ID, a.LUAS, a.HARGA, a.TANGGAL, a.NAMA FROM LA_KJPP_LAHAN a JOIN GIS_LAHAN_MASTER b on TO_CHAR(a.IDAREAL) = TO_CHAR(b.IDAREAL) WHERE b.IDAREAL = :ID_AREAL AND ROWNUM <= 1`,{ID_AREAL: idAreal});
     resKJPP.rows.length > 0 ? result.nilai_aset = resKJPP.rows.reduce((acc, kjpp)=>transform.transformKJPPLahan(kjpp),0) : "";

    const resNKA = await database.simpleExecute(`SELECT * FROM LA_NKA_LAHAN WHERE IDAREAL = :ID_AREAL`,{ID_AREAL: idAreal});
    result.nka = resNKA.rows.length > 0 ? resNKA.rows.map(nka=>transform.transformNKALahan(nka)) : [];
 
    const resSengketaAset = await database.simpleExecute(`SELECT * FROM LA_POTENSI_SENGKETA_LAHAN  WHERE IDAREAL= :ID_AREAL AND ROWNUM <= 1`,{ID_AREAL: idAreal});
    if(resSengketaAset.rows.length > 0){ 
         const sengketaPromises = resSengketaAset.rows.reduce(async (acc, aset)=>{
            const resAttachment = await database.simpleExecute(`SELECT NAMA_DOKUMEN, DESKRIPSI, FILE_PATH FROM LA_ATT_SENGKETA_LAHAN  WHERE IDAREAL = :ID_AREAL AND ROWNUM <= 1`, {ID_AREAL:idAreal});
            resAttachment.rows.length > 0 ? aset.attachment = transform.transformAttSengketaLahan(resAttachment.rows[0]):"";
            return transform.transformSengketaAset(aset)
        },0) 
        result.potensi_sengketa_lahan = await sengketaPromises
    }

    const resGedung = await database.simpleExecute(`SELECT DISTINCT(a.IDGEDUNG),a.IDAREAL, a.COOR_X, a.COOR_Y, a.NAMA_GEDUNG, a.ALAMAT, a.LUAS_BANGUNAN, a.JUMLAH_LANTAI, a.SALEABLE_AREA, a.PATH_GEDUNG_IMAGE,
         ROW_NUMBER() OVER (ORDER BY a.IDGEDUNG) RN
             FROM GIS_BANGUNAN_MASTER a 
             left join LA_PENGGUNAAN_GEDUNG b on b.ID_GEDUNG = a.IDGEDUNG
             left join LA_LAHAN f on TO_CHAR(f.IDAREAL) = TO_CHAR(a.IDAREAL) 
             WHERE a.IDAREAL = :ID_AREAL`,{ID_AREAL: idAreal});
    result.list_gedung = resGedung.rows.length > 0 ? resGedung.rows.map(gedung=>transform.transformListGedung(gedung)) : [];

    return result;
}

//luas aset idle lahan dari saleable area datanya
async function getAsetLahan(){
    const query = `SELECT
    b.ID,    
    b.TREG_ID,
    b.NAMA,
    COALESCE(count(a.IDAREAL), 0) as total_lahan, 
    COALESCE(SUM(LUAS_LAHAN),0) as luas
    FROM
        LA_REF_WILAYAH_TELKOM b
    LEFT JOIN LA_LAHAN a
            ON TO_CHAR(b.ID) = TO_CHAR(a.WILAYAH_TELKOM) AND (a.SALEABLE_AREA = 0 OR a.SALEABLE_AREA IS NULL)
    GROUP BY b.ID, b.TREG_ID, b.NAMA ORDER BY b.TREG_ID ASC`
    const result = await database.simpleExecute(query, {});

    return result.rows;
}

async function getAsetLahanIdle(){
    const query = `SELECT
    b.ID,    
    b.TREG_ID,
    b.NAMA,
    COALESCE(count(a.IDAREAL), 0) as total_lahan, 
    COALESCE(SUM(a.SALEABLE_AREA),0) as luas
    FROM
        LA_REF_WILAYAH_TELKOM b
    LEFT JOIN LA_LAHAN a
            ON TO_CHAR(b.ID) = TO_CHAR(a.WILAYAH_TELKOM) AND a.SALEABLE_AREA > 0
    GROUP BY b.ID, b.TREG_ID, b.NAMA ORDER BY b.TREG_ID ASC`
    const result = await database.simpleExecute(query, {});

    return result.rows;
}

async function detailAsetLahan(){
    const resultAsets = await getAsetLahan();
    const resultIdles = await getAsetLahanIdle();
    const result=[];

    resultAsets.map(aset => {
        const idle = resultIdles.find(idle => idle.ID === aset.ID);

        if(result[aset.TREG_ID]===undefined){
            result[aset.TREG_ID]={
                id:aset.TREG_ID,
                nama:`Regional ${aset.TREG_ID}`,
                aset:{
                    total:aset.TOTAL_LAHAN,
                    luas:aset.LUAS,
                },
                idle:{
                    total:idle.TOTAL_LAHAN,
                    luas:idle.LUAS
                },
                witels:[{
                    id:aset.ID,
                    nama:`${aset.NAMA}`,
                    aset:{
                        total: aset.TOTAL_LAHAN,
                        luas: aset.LUAS
                    },
                    idle:{
                        total:idle.TOTAL_LAHAN,
                        luas:idle.LUAS
                    }
                }]
            }
        }else{
            result[aset.TREG_ID].aset.total += aset.TOTAL_LAHAN
            result[aset.TREG_ID].aset.luas += aset.LUAS

            result[aset.TREG_ID].idle.total += idle.TOTAL_LAHAN
            result[aset.TREG_ID].idle.luas += idle.LUAS

            result[aset.TREG_ID].witels.push({
                id:aset.ID,
                nama:`${aset.NAMA}`,
                aset:{
                    total: aset.TOTAL_LAHAN,
                    luas: aset.LUAS
                },
                idle:{
                    total: idle.TOTAL_LAHAN,
                    luas: idle.LUAS
                }
            })
        }
        
    })

    return result.filter(function() { return true; });
}

function current_url(req){
    const requrl = url.format({
      protocol: req.protocol,
      host: req.get('host'),
      pathname: req.originalUrl.split("?").shift(),
    });
    return requrl
}

/**
 * @param {TODO} req 
 * Filter status tanah => bersertifikat atau tidak (cek dari LA_SERTIPIKAT_BARU)
 * Filter Tanah Kosong => ya atau tidak (dari GIS_LAHAN_MASTER dari tanah_kosong? saleable_area?)
 * Status sertifikat => HGB, HGB Jatuh Tempo, Hak Pakai, Hak Milik (masih bingung)
 * Filter Q1 - Q4
 **/
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

    if(params.status_tanah!== undefined && params.status_tanah.length > 0){
        const statusTanah= params.status_tanah==1?1:0;
        if(statusTanah===1)
            sql += ` AND d.SKHAK IS NOT NULL`;
        else
            sql += ` AND d.SKHAK IS NULL`;
    }

    if(params.tanah_kosong!== undefined && params.tanah_kosong.length > 0){
        const tanahKosong= params.tanah_kosong==1?1:0;
        if(tanahKosong===1)
            sql += ` AND a.SALEABLE_AREA > 0`;
        else
            sql += ` AND (a.SALEABLE_AREA = 0 OR a.SALEABLE_AREA IS NULL)`; 
    }

    if(params.status_sertifikat!== undefined && params.status_sertifikat.length > 0){
        const dataStatusSertifikat= params.status_sertifikat.split(',');
        const tahunJatuhTempo= getJatuhTempo()
        for(var i = 0; i < dataStatusSertifikat.length; ++i){
            if(parseInt(dataStatusSertifikat[i])===1)
                sql += ` AND (d.SKHAK = 'HGB' AND d.TANGGAL_AKHIR > TO_DATE('${tahunJatuhTempo}','YYYY-MM-DD'))`;
            else if(parseInt(dataStatusSertifikat[i])===2)
                sql += ` AND d.TANGGAL_AKHIR < TO_DATE('${tahunJatuhTempo}','YYYY-MM-DD')`;
            else if(parseInt(dataStatusSertifikat[i])===3)
                sql += ` AND (d.SKHAK = 'HP' AND d.TANGGAL_AKHIR > TO_DATE('${tahunJatuhTempo}','YYYY-MM-DD'))`;
            else if(parseInt(dataStatusSertifikat[i])===4)
                sql += ` (AND d.SKHAK = 'HM' AND d.TANGGAL_AKHIR > TO_DATE('${tahunJatuhTempo}','YYYY-MM-DD'))`;
        }   
    }

    if(params.klasifikasi!== undefined && params.klasifikasi.length > 0){
        const dataKlasifikasi= params.klasifikasi.split(',');
        const klasifikasi = dataKlasifikasi.map(x => "'" + x.toUpperCase() + "'").toString();
        sql += ` AND e.NAMA_KLASIFIKASI IN (${klasifikasi})`;
    }

    if(params.nama!== undefined && params.nama.length > 0){
        const nama=params.nama;
        sql += ` AND regexp_like(a.NAMA_LAHAN, '${nama}', 'i')`;
    }

    if(params.luas!== undefined){
        const luas=params.luas.split('-');
        if(luas.length ===2)
            sql += ` AND a.LUAS_LAHAN BETWEEN ${luas[0]} AND ${luas[1]}`;
    }

    return sql;
}

function setFilterNearMe(sql, params)
{
    if(params.status_tanah!== undefined && params.status_tanah.length > 0){
        const statusTanah= params.status_tanah==1?1:0;
        if(statusTanah===1)
            sql += ` AND SKHAK IS NOT NULL`;
        else
            sql += ` AND SKHAK IS NULL`;
    }

    if(params.tanah_kosong!== undefined && params.tanah_kosong.length > 0){
        const tanahKosong= params.tanah_kosong==1?1:0;
        if(tanahKosong===1)
            sql += ` AND SALEABLE_AREA > 0`;
        else
            sql += ` AND (SALEABLE_AREA = 0 OR SALEABLE_AREA IS NULL)`; 
    }

    if(params.status_sertifikat!== undefined && params.status_sertifikat.length > 0){
        const dataStatusSertifikat= params.status_sertifikat.split(',');
        const tahunJatuhTempo= getJatuhTempo()
        for(var i = 0; i < dataStatusSertifikat.length; ++i){
            if(parseInt(dataStatusSertifikat[i])===1)
                sql += ` AND (SKHAK = 'HGB' AND TANGGAL_AKHIR > TO_DATE('${tahunJatuhTempo}','YYYY-MM-DD'))`;
            else if(parseInt(dataStatusSertifikat[i])===2)
                sql += ` AND TANGGAL_AKHIR < TO_DATE('${tahunJatuhTempo}','YYYY-MM-DD')`;
            else if(parseInt(dataStatusSertifikat[i])===3)
                sql += ` AND (SKHAK = 'HP' AND TANGGAL_AKHIR > TO_DATE('${tahunJatuhTempo}','YYYY-MM-DD'))`;
            else if(parseInt(dataStatusSertifikat[i])===4)
                sql += ` (AND SKHAK = 'HM' AND TANGGAL_AKHIR > TO_DATE('${tahunJatuhTempo}','YYYY-MM-DD'))`;
        }   
    }

    if(params.klasifikasi!== undefined && params.klasifikasi.length > 0){
        const dataKlasifikasi= params.klasifikasi.split(',');
        const klasifikasi = dataKlasifikasi.map(x => "'" + x.toUpperCase() + "'").toString();
        sql += ` AND NAMA_KLASIFIKASI IN (${klasifikasi})`;
    }

    if(params.luas!== undefined && params.luas.length > 0){
        const luas = params.luas.split('-');
        if(luas.length ==2)
            sql += ` AND LUAS_LAHAN BETWEEN ${luas[0]} AND ${luas[1]}`;
    }

    if(params.nama !== undefined && params.nama.length > 0){
        const nama=params.nama;
        sql += ` AND regexp_like(NAMA_LAHAN, '${nama}', 'i')`;
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
            dataParams+= '&kec='+params.kec;
        }
    //by witel
    }else if(params.witel !==undefined){
        dataParams+= '&witel='+params.witel;
    }else{
        dataParams+= '&provinsi=31';
    }

    if(params.status_tanah !==undefined){
        const statusTanah=params.status_tanah==1?1:0;
        dataParams+= '&status_tanah='+statusTanah;
    }

    if(params.tanah_kosong !==undefined){
        const tanahKosong=params.tanah_kosong==1?1:0;
        dataParams+= '&tanah_kosong='+tanahKosong;
    }

    if(params.status_sertifikat !==undefined){
        const statusSertifikat=params.status_sertifikat;
        dataParams+= '&status_sertifikat='+statusSertifikat;
    }

    if(params.klasifikasi !==undefined){
        const klasifikasi=params.klasifikasi;
        dataParams+= '&klasifikasi='+klasifikasi;
    }

    if(params.luas!==undefined){
        dataParams+= '&luas='+params.luas;
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
  detailAsetLahan
};