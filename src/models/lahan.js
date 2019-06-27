const database = require('../services/database.js');
const transform = require('../transformers/lahan.js');
const url = require('url');

async function getAll(req)
{
  const params = req.query
  let sql =`SELECT DISTINCT(a.IDAREAL), a.COOR_X, a.COOR_Y, a.NAMA_LAHAN, a.ALAMAT,a.LUAS_LAHAN, a.JUMLAH_BANGUNAN, a.GUNA_LAHAN,
  d.SKHAK, d.TANGGAL_AKHIR, CASE e.NAMA_KLASIFIKASI
      WHEN 'PRIMER' then 'Q1'
      WHEN 'SEKUNDER' then 'Q2'
      WHEN 'TERSIER' then 'Q3'
      WHEN 'RESIDU' then 'Q4'
      ELSE null
  END AS NAMA_KLASIFIKASI, f.NAMA as STATUS_KEP, f.DESKRIPSI, a.PATH_LAHAN_IMAGE,
  CASE WHEN d.SKHAK  IS NULL THEN 'Tidak Ada'
  ELSE 'Ada' END as STATUS_HGB,
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

async function getAllPagination(req)
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

    const sql=`SELECT DISTINCT(a.IDAREAL), a.COOR_X, a.COOR_Y, a.NAMA_LAHAN, a.ALAMAT, a.LUAS_LAHAN,
    a.JUMLAH_BANGUNAN, a.GUNA_LAHAN, d.SKHAK, d.TANGGAL_AKHIR, 
    CASE e.NAMA_KLASIFIKASI
        WHEN 'PRIMER' then 'Q1'
        WHEN 'SEKUNDER' then 'Q2'
        WHEN 'TERSIER' then 'Q3'
        WHEN 'RESIDU' then 'Q4'
        ELSE null
    END AS NAMA_KLASIFIKASI, f.NAMA as STATUS_KEP, f.DESKRIPSI, a.PATH_LAHAN_IMAGE,
    CASE WHEN d.SKHAK  IS NULL THEN 'Tidak Ada'
    ELSE 'Ada' END as STATUS_HGB,
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
    const lat =  params.lat ? params.lat : -6.230361;
    const long =params.long ? params.long : 106.816673;
    const distance = params.distance?params.distance:5;

    const sql=`SELECT * FROM (SELECT DISTINCT(a.IDAREAL), a.COOR_X, a.COOR_Y, a.NAMA_LAHAN, a.ALAMAT, a.STATUS_KEPEMILIKAN, a.LUAS_LAHAN, a.JUMLAH_BANGUNAN, a.GUNA_LAHAN,
        d.SKHAK, d.TANGGAL_AKHIR, CASE e.NAMA_KLASIFIKASI
        WHEN 'PRIMER' then 'Q1'
        WHEN 'SEKUNDER' then 'Q2'
        WHEN 'TERSIER' then 'Q3'
        WHEN 'RESIDU' then 'Q4'
        ELSE null
    END AS NAMA_KLASIFIKASI, f.NAMA as STATUS_KEP, f.DESKRIPSI, a.PATH_LAHAN_IMAGE, 
        CASE WHEN d.SKHAK  IS NULL THEN 'Tidak Ada'
        ELSE 'Ada' END as STATUS_HGB,
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
    result.lahan_master =  res.rows.length > 0 ? res.rows.reduce((acc, lahan)=>transform.transformLahanMaster(lahan),0) : "";

    const resImgLahan = await database.simpleExecute(`SELECT a.*,b.* FROM LA_ATTACHMENT_lahan a INNER JOIN LA_ATTACHMENT b on TO_NUMBER(a.ID_ATTACHMENT) = b.ID WHERE (TO_CHAR(a.IDAREAL)) = ${idAreal} AND TO_CHAR(a.ID_ATTACHMENT_GROUP) = 1 AND ROWNUM <= 3`,{});
    result.img_lahan =  resImgLahan.rows.length > 0 ? resImgLahan.rows.map(img=>transform.transformImageLahan(img)) : "";

    const resSertifikat = await database.simpleExecute(`SELECT * FROM LA_SERTIPIKAT_BARU WHERE IDAREAL= :ID_AREAL`,{ID_AREAL: idAreal});

    const sertiPromises = resSertifikat.rows.map(async sertifikat=>{
        const resAttachment = await database.simpleExecute(`SELECT * FROM LA_ATT_SERTIPIKAT_LAHAN WHERE ID_SERTIPIKAT = :ID_SERTIPIKAT AND ROWNUM <= 1`, {ID_SERTIPIKAT:sertifikat.ID});
        sertifikat.attachment = resAttachment.rows.length > 0 ? transform.transformAttSertifikatLahan(resAttachment.rows[0]):"";
        return await transform.transformSertifikatLahan(sertifikat)
    }) ;
    result.kepemilikan = await Promise.all(sertiPromises)

    const resPBB = await database.simpleExecute(`SELECT * FROM LA_PBB_LAHAN WHERE IDAREAL = :ID_AREAL ORDER BY NVL(TAHUN, -1) DESC`,{ID_AREAL: idAreal});
    result.pbb = resPBB.rows.length > 0 ? resPBB.rows.map(pbb=>transform.transformPBBLahan(pbb)) : "";

    const resKJPP = await database.simpleExecute(`SELECT a.ID, a.LUAS, a.HARGA, a.TANGGAL, a.NAMA FROM LA_KJPP_LAHAN a JOIN GIS_LAHAN_MASTER b on TO_CHAR(a.IDAREAL) = TO_CHAR(b.IDAREAL) WHERE b.IDAREAL = :ID_AREAL AND ROWNUM <= 1`,{ID_AREAL: idAreal});
    result.nilai_aset = resKJPP.rows.length > 0 ? resKJPP.rows.reduce((acc, kjpp)=>transform.transformKJPPLahan(kjpp),0) : "";

    const resNKA = await database.simpleExecute(`SELECT * FROM LA_NKA_LAHAN WHERE IDAREAL = :ID_AREAL`,{ID_AREAL: idAreal});
    result.nka = resNKA.rows.length > 0 ? resNKA.rows.map(nka=>transform.transformNKALahan(nka)) : "";
 
    const resSengketaAset = await database.simpleExecute(`SELECT * FROM LA_POTENSI_SENGKETA_LAHAN  WHERE IDAREAL= :ID_AREAL AND ROWNUM <= 1`,{ID_AREAL: idAreal});
    const sengketaPromises= resSengketaAset.rows.length > 0 ? resSengketaAset.rows.reduce(async (acc, aset)=>{
        const resAttachment = await database.simpleExecute(`SELECT NAMA_DOKUMEN, DESKRIPSI, FILE_PATH FROM LA_ATT_SENGKETA_LAHAN  WHERE IDAREAL = :ID_AREAL AND ROWNUM <= 1`, {ID_AREAL:idAreal});
        aset.attachment = resAttachment.rows.length > 0 ? transform.transformAttSengketaLahan(resAttachment.rows[0]):"";
        return transform.transformSengketaAset(aset)
    },0) : "";
    result.potensi_sengketa_lahan = await sengketaPromises

    const resGedung = await database.simpleExecute(`SELECT DISTINCT(a.IDGEDUNG),a.IDAREAL, a.COOR_X, a.COOR_Y, a.NAMA_GEDUNG, a.ALAMAT, a.LUAS_BANGUNAN, a.JUMLAH_LANTAI, a.SALEABLE_AREA, b.NAMA_KEGIATAN, a.PATH_GEDUNG_IMAGE,
         ROW_NUMBER() OVER (ORDER BY a.IDGEDUNG) RN
             FROM GIS_BANGUNAN_MASTER a 
             left join LA_PENGGUNAAN_BANGUNAN b on b.IDGEDUNG = a.IDGEDUNG
             left join LA_LAHAN f on TO_CHAR(f.IDAREAL) = TO_CHAR(a.IDAREAL) 
             WHERE a.IDAREAL = :ID_AREAL`,{ID_AREAL: idAreal});
    result.list_gedung = resGedung.rows.length > 0 ? resGedung.rows.map(gedung=>transform.transformListGedung(gedung)) : "";

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
      let administrasiInfo = ""
        if(params.provinsi !== undefined){
            const idPropinsi=parseInt(params.provinsi,10);
            administrasiInfo = ` WHERE a.ID_PROPINSI=${idPropinsi}`;
        }
        if(params['kota'] !== undefined){
            const idKota=parseInt(params.kota,10);
            administrasiInfo = ` WHERE a.ID_KOTA=${idKota}`;
        }
        if(params.kec !== undefined){
            const idKec=parseInt(params.kec,10);
            administrasiInfo = ` WHERE a.ID_KECAMATAN=${idKec}`;
        }
        sql += administrasiInfo
    }else if(params.witel!== undefined){
        const idWitel=parseInt(params.witel,10);
        const administrasiInfo = ` WHERE a.ID_WITEL=${idWitel}`;
        sql += administrasiInfo;
    }else{
        sql += ` WHERE a.ID_PROPINSI=31`;
    }

    // if(params.kepemilikan!== undefined){
    //     let paramsKep=params.kepemilikan.split(",");
    //     for(i=0;i<count(paramsKep);i++){
    //         paramsKep[i] = this->db->qstr(paramsKep[i]);
    //     }
    //     res = paramsKep.join();

    //     sql += ` AND STATUS_KEPEMILIKAN IN (${paramsKep})`;
    // }

    // if(params['penggunaan']!== undefined){
    //     paramsPenggunaan=this->dataFilterPenggunaan(params['penggunaan']);
    //     res='';
    //     i = 0;
    //     len = count(paramsPenggunaan);
    //     foreach (paramsPenggunaan as item) {
    //         if (i == len - 1) {
    //             res.="'item'";
    //         }else{
    //             res.="'item',";
    //         }
    //         i++;
    //     }

    //     penggunaan = " AND a.GUNA_LAHAN IN (res)";
    //     sql .= penggunaan;
    // }

    if(params.nama!== undefined){
        const nama=params.nama;
        const namaCapital= nama.toUpperCase();
        sql += ` AND (a.NAMA_LAHAN like '%${nama}%' OR a.NAMA_LAHAN like '%${namaCapital}%')`;
    }

    if(params.luas!== undefined){
        const luas=params.luas.split('-');
        sql += ` AND a.LUAS_LAHAN BETWEEN ${luas[0]} AND ${luas[1]}`;
    }

    return sql;
}

function setFilterNearMe(sql, params)
{
    // if(params['kepemilikan']!== undefined){
    //     paramsKep=explode(',',params['kepemilikan']);
    //     for($i=0;$i<count(paramsKep);$i++){
    //         paramsKep[$i] = $this->db->qstr(paramsKep[$i]);
    //     }
    //     $res = join(',',paramsKep);
        
    //     $kepemilikan = " AND STATUS_KEPEMILIKAN IN ($res)";
    //     $sql .= $kepemilikan;
    // }

    // if(params['penggunaan']!== undefined){
    //     paramsPenggunaan=$this->dataFilterPenggunaan(params['penggunaan']);
    //     $res='';
    //     $i = 0;
    //     $len = count(paramsPenggunaan);
    //     foreach (paramsPenggunaan as $item) {
    //         if ($i == $len - 1) {
    //            $res.="'$item'";
    //         }else{
    //             $res.="'$item',";
    //         }
    //         $i++;
    //     }

    //     $penggunaan = " AND GUNA_LAHAN IN ($res)";
    //     $sql .= $penggunaan;
    // }

    if(params.luas!== undefined){
        const luas = params.luas.split('-');
        sql += ` AND LUAS_LAHAN BETWEEN ${luas[0]} AND ${luas[1]}`;
    }

    if(params.nama !== undefined){
        const nama=params['nama'];
        const namaCapital= strtoupper(nama);
        sql += ` AND (NAMA_LAHAN like '%${nama}%' OR NAMA_LAHAN like '%${namaCapital}%')`;
        
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

    if(params.kepemilikan !==undefined){
        dataParams+= '&kepemilikan='.params.kepemilikan;
    }

    if(params['luas']!==undefined){
        dataParams+= '&luas='.params.luas;
    }

    if(params.nama!==undefined){
        dataParams+= '&nama='.params.nama;
    }

    return dataParams;
}

module.exports={
  getAll,
  getAllPagination,
  nearMe,
  getDetail
};