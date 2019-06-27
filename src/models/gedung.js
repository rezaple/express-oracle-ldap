const database = require('../services/database.js');
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
  const binds = {};

  const query = setFilter(sql, params);

  const result = await database.simpleExecute(query, binds);

  const transformedListLahan= await result.rows.map(lahan => transformList(lahan));

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
    
    const binds = {};
    const totalQuery = await database.simpleExecute(`SELECT count(*) as total_count FROM(${query})`, binds);
    const total= totalQuery.rows[0].TOTAL_COUNT;
    const totalPages=Math.ceil(total/per_page);
    const awal=(page===1)?1:((page-1)*per_page+1);
    const akhir=(page===1)?per_page:(page*per_page);

    const result = await database.simpleExecute(`SELECT * FROM(${query})
    WHERE RN >= ${awal} AND RN <= ${akhir}`, binds);
    const transformedListLahan= await result.rows.map(lahan => transformList(lahan));
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
    const binds={};
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
    const result = await database.simpleExecute(query, binds);
    const transformedListLahan= await result.rows.map(lahan => transformList(lahan));

    return transformedListLahan;
}

async function getDetail(idAreal)
{
    let result={
        'potensi_sengketa_lahan':null,
        'list_gedung':null
    };

    let res = await database.simpleExecute(`SELECT a.IDAREAL,a.NAMA_LAHAN,a.ALAMAT,a.COOR_X,a.COOR_Y,a.LUAS_LAHAN, a.ID_PROPINSI, a.PROPINSI,a.ID_KOTA,a.KOTA, a.ID_KECAMATAN, a.KECAMATAN, a.ID_DESA, a.DESA, a.ID_TREG, a.TREG, a.ID_WITEL, a.WITEL, a.PATH_LAHAN_IMAGE,c.NAMA_KLASIFIKASI, h.NAMA as NAMA_STATUS_KEPEMILIKAN FROM GIS_LAHAN_MASTER a 
    left join LA_ANALISIS_SCORE b on TO_CHAR(a.\"IDAREAL\") = TO_CHAR(b.\"IDAREAL\") 
    left join LA_REF_ANALISIS_SCORE_KLAS c on TO_NUMBER(b.\"KLASIFIKASI\") = c.\"ID\" 
    left join LA_REF_STATUS_KEPEMILIKAN h on a.STATUS_KEPEMILIKAN = h.ID
    WHERE TO_CHAR(a.\"IDAREAL\") = '${idAreal}' AND ROWNUM <= 1`, {});
    result.lahan_master =  res.rows.length > 0 ? res.rows.reduce((acc, lahan)=>transformLahanMaster(lahan),0) : "";

    const resImgLahan = await database.simpleExecute(`SELECT a.*,b.* FROM LA_ATTACHMENT_lahan a INNER JOIN LA_ATTACHMENT b on TO_NUMBER(a.ID_ATTACHMENT) = b.ID WHERE (TO_CHAR(a.IDAREAL)) = ${idAreal} AND TO_CHAR(a.ID_ATTACHMENT_GROUP) = 1 AND ROWNUM <= 3`,{});
    result.img_lahan =  resImgLahan.rows.length > 0 ? resImgLahan.rows.map(img=>transformImageLahan(img)) : "";

    const resSertifikat = await database.simpleExecute(`SELECT * FROM LA_SERTIPIKAT_BARU WHERE IDAREAL= :ID_AREAL`,{ID_AREAL: idAreal});

    const sertiPromises = resSertifikat.rows.map(async sertifikat=>{
        const resAttachment = await database.simpleExecute(`SELECT * FROM LA_ATT_SERTIPIKAT_LAHAN WHERE ID_SERTIPIKAT = :ID_SERTIPIKAT AND ROWNUM <= 1`, {ID_SERTIPIKAT:sertifikat.ID});
        sertifikat.attachment = resAttachment.rows.length > 0 ? transformAttSertifikatLahan(resAttachment.rows[0]):"";
        return await transformSertifikatLahan(sertifikat)
    }) ;
    result.kepemilikan = await Promise.all(sertiPromises)

    const resPBB = await database.simpleExecute(`SELECT * FROM LA_PBB_LAHAN WHERE IDAREAL = :ID_AREAL ORDER BY NVL(TAHUN, -1) DESC`,{ID_AREAL: idAreal});
    result.pbb = resPBB.rows.length > 0 ? resPBB.rows.map(pbb=>transformPBBLahan(pbb)) : "";

    const resKJPP = await database.simpleExecute(`SELECT a.ID, a.LUAS, a.HARGA, a.TANGGAL, a.NAMA FROM LA_KJPP_LAHAN a JOIN GIS_LAHAN_MASTER b on TO_CHAR(a.IDAREAL) = TO_CHAR(b.IDAREAL) WHERE b.IDAREAL = :ID_AREAL AND ROWNUM <= 1`,{ID_AREAL: idAreal});
    result.nilai_aset = resKJPP.rows.length > 0 ? resKJPP.rows.reduce((acc, kjpp)=>transformKJPPLahan(kjpp),0) : "";

    const resNKA = await database.simpleExecute(`SELECT * FROM LA_NKA_LAHAN WHERE IDAREAL = :ID_AREAL`,{ID_AREAL: idAreal});
    result.nka = resNKA.rows.length > 0 ? resNKA.rows.map(nka=>transformNKALahan(nka)) : "";
 
    const resSengketaAset = await database.simpleExecute(`SELECT * FROM LA_POTENSI_SENGKETA_LAHAN  WHERE IDAREAL= :ID_AREAL AND ROWNUM <= 1`,{ID_AREAL: idAreal});
    const sengketaPromises= resSengketaAset.rows.length > 0 ? resSengketaAset.rows.reduce(async (acc, aset)=>{
        const resAttachment = await database.simpleExecute(`SELECT NAMA_DOKUMEN, DESKRIPSI, FILE_PATH FROM LA_ATT_SENGKETA_LAHAN  WHERE IDAREAL = :ID_AREAL AND ROWNUM <= 1`, {ID_AREAL:idAreal});
        aset.attachment = resAttachment.rows.length > 0 ? transformAttSengketaLahan(resAttachment.rows[0]):"";
        return transformSengketaAset(aset)
    },0) : "";
    result.potensi_sengketa_lahan = await sengketaPromises

    const resGedung = await database.simpleExecute(`SELECT DISTINCT(a.IDGEDUNG),a.IDAREAL, a.COOR_X, a.COOR_Y, a.NAMA_GEDUNG, a.ALAMAT, a.LUAS_BANGUNAN, a.JUMLAH_LANTAI, a.SALEABLE_AREA, b.NAMA_KEGIATAN, a.PATH_GEDUNG_IMAGE,
         ROW_NUMBER() OVER (ORDER BY a.IDGEDUNG) RN
             FROM GIS_BANGUNAN_MASTER a 
             left join LA_PENGGUNAAN_BANGUNAN b on b.IDGEDUNG = a.IDGEDUNG
             left join LA_LAHAN f on TO_CHAR(f.IDAREAL) = TO_CHAR(a.IDAREAL) 
             WHERE a.IDAREAL = :ID_AREAL`,{ID_AREAL: idAreal});
    result.list_gedung = resGedung.rows.length > 0 ? resGedung.rows.map(gedung=>transformListGedung(gedung)) : "";

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

function transformList(lahan){
  return {
    IDAREAL: parseInt(lahan.IDAREAL),
    COOR_X: lahan.COOR_X,
    COOR_Y: lahan.COOR_Y,
    NAMA_LAHAN: lahan.NAMA_LAHAN,
    ALAMAT: lahan.ALAMAT,
    LUAS_LAHAN: lahan.LUAS_LAHAN?lahan.LUAS_LAHAN:0,
    JUMLAH_BANGUNAN: lahan.JUMLAH_BANGUNAN?lahan.JUMLAH_BANGUNAN:0,
    GUNA_LAHAN: lahan.GUNA_LAHAN?lahan.GUNA_LAHAN:"",
    SKHAK: lahan.SKHAK?lahan.SKHAK:"",
    TANGGAL_AKHIR: lahan.TANGGAL_AKHIR?lahan.TANGGAL_AKHIR:"",
    NAMA_KLASIFIKASI: lahan.NAMA_KLASIFIKASI?lahan.NAMA_KLASIFIKASI:"",
    STATUS_KEP: lahan.STATUS_KEP?lahan.STATUS_KEP:"",
    DESKRIPSI: lahan.DESKRIPSI?lahan.DESKRIPSI:"",
    PATH_LAHAN_IMAGE: lahan.PATH_LAHAN_IMAGE? 'http://mrra.telkom.co.id/gis/assets'+lahan.PATH_LAHAN_IMAGE:"",
    STATUS_HGB: lahan.STATUS_HGB?lahan.STATUS_HGB:"",
    RN: lahan.RN,
    DISTANCE: lahan.DISTANCE
  }
}

function transformListGedung(data){
    return {
        IDGEDUNG: parseInt(data.IDGEDUNG,10),
        COOR_X: data.COOR_X?data.COOR_X:"",
        COOR_Y: data.COOR_Y?data.COOR_Y:"",
        NAMA_GEDUNG: data.NAMA_GEDUNG,
        ALAMAT: data.ALAMAT?data.ALAMAT:"",
        LUAS_BANGUNAN: data.LUAS_BANGUNAN? parseInt(data.LUAS_BANGUNAN,10):0,
        JUMLAH_LANTAI: data.JUMLAH_LANTAI? parseInt(data.JUMLAH_LANTAI,10):0,
        SALEABLE_AREA: data.SALEABLE_AREA? parseInt(data.SALEABLE_AREA,10):0,
        NAMA_KEGIATAN: data.NAMA_KEGIATAN? data.NAMA_KEGIATAN:"",
        PATH_GEDUNG_IMAGE: data.PATH_GEDUNG_IMAGE? 'http://mrra.telkom.co.id/gis/assets'+data.PATH_GEDUNG_IMAGE:""
    }
}

function transformKJPPLahan(kjpp){
    return {
        ID: parseInt(kjpp.ID),
        NAMA: kjpp.NAMA?kjpp.NAMA:"",
        LUAS: kjpp.LUAS?parseInt(kjpp.LUAS,10):0,
        TANGGAL: kjpp.TANGGAL?kjpp.TANGGAL:"",
        HARGA: kjpp.HARGA?parseInt(kjpp.HARGA,10):0,
    }
}

function transformAttSengketaLahan(data){
    return {
        NAMA_DOKUMEN: data.NAMA_DOKUMEN?data.NAMA_DOKUMEN:"",
        DESKRIPSI: data.DESKRIPSI?data.DESKRIPSI:"",
        FILE_PATH: data.FILE_PATH? 'http://mrra.telkom.co.id/gis/assets'+data.FILE_PATH:""
    }
}

function transformNKALahan(nka){
    return {
        ID: parseInt(nka.ID),
        NOMOR_KARTU_ASET: nka.NOMOR_KARTU_ASET?nka.NOMOR_KARTU_ASET:"",
        NOMOR_ANAK_KARTU: nka.NOMOR_ANAK_KARTU?nka.NOMOR_ANAK_KARTU:"",
        NILAI_HARGA_PEROLEHAN: nka.NILAI_HARGA_PEROLEHAN?parseInt(nka.NILAI_HARGA_PEROLEHAN,10):0,
        AKUMULASI_PENYUSUTAN: nka.AKUMULASI_PENYUSUTAN?parseInt(nka.AKUMULASI_PENYUSUTAN,10):0,
        BEBAN_PENYUSUTAN: nka.BEBAN_PENYUSUTAN?parseInt(nka.BEBAN_PENYUSUTAN,10):0,
        DESKRIPSI: nka.DESKRIPSI?nka.DESKRIPSI:"",
        TANGGAL:nka.TANGGAL?nka.TANGGAL:""
    }
}

function transformSengketaAset(aset){
    return {
        ID: parseInt(aset.ID),
        TANGGAL:aset.TANGGAL?aset.TANGGAL:"",
        STATUS:aset.STATUS?aset.STATUS:"",
        PERMASALAHAN_DAN_KATEGORI:aset.PERMASALAHAN_DAN_KATEGORI?aset.PERMASALAHAN_DAN_KATEGORI:"",
        RINGKASAN_PERMASALAHAN:aset.RINGKASAN_PERMASALAHAN?aset.RINGKASAN_PERMASALAHAN:"",
        PROSES_PENANGANAN:aset.PROSES_PENANGANAN?aset.PROSES_PENANGANAN:"",
        ISU_PENTING:aset.ISU_PENTING?aset.ISU_PENTING:"",
        ATTACHMENT:aset.attachment
    }
}

function transformPBBLahan(pbb){
    return {
        ID: parseInt(pbb.ID),
        NOP: pbb.NOP?pbb.NOP:"",
        TAHUN: pbb.TAHUN?pbb.TAHUN:"",
        LUAS_LAHAN_BUMI: pbb.LUAS_LAHAN_BUMI?parseInt(pbb.LUAS_LAHAN_BUMI,10):0,
        NJOP_BUMI: pbb.NJOP_BUMI?parseInt(pbb.NJOP_BUMI,10):0,
        KELAS_BUMI: pbb.KELAS_BUMI?pbb.KELAS_BUMI:"",
        TOTAL_NJOP_BUMI: pbb.TOTAL_NJOP_BUMI?parseInt(pbb.TOTAL_NJOP_BUMI,10):0,
        LUAS_BANGUNAN: pbb.LUAS_BANGUNAN?parseInt(pbb.LUAS_BANGUNAN,10):0,
        NJOP_BANGUNAN: pbb.NJOP_BANGUNAN?parseInt(pbb.NJOP_BANGUNAN,10):0,
        KELAS_BANGUNAN: pbb.KELAS_BANGUNAN?pbb.KELAS_BANGUNAN:"",
        TOTAL_NJOP_BANGUNAN: pbb.TOTAL_NJOP_BANGUNAN?parseInt(pbb.TOTAL_NJOP_BANGUNAN,10):0,
        TOTAL_PBB_DIBAYAR: pbb.TOTAL_PBB_DIBAYAR?parseInt(pbb.TOTAL_PBB_DIBAYAR,10):0
    }
}

function transformSertifikatLahan(sert){
    return {
        ID: parseInt(sert.ID),
        NO_SERTIPIKAT: sert.NO_SERTIPIKAT? sert.NO_SERTIPIKAT:"",
        ATAS_NAMA: sert.ATAS_NAMA?sert.ATAS_NAMA:"",
        SKHAK: sert.SKHAK?sert.SKHAK:"",
        LUAS: sert.LUAS?sert.LUAS:0,
        TANGGAL_AKHIR: sert.TANGGAL_AKHIR?sert.TANGGAL_AKHIR:"",
        LOKASI_ASET: sert.LOKASI_ASET?sert.LOKASI_ASET:"",
        ATTACHMENT:sert.attachment
    }
}

  function transformAttSertifikatLahan(att){
    return {
        ID: parseInt(att.ID),
        NAMA_DOKUMEN: att.NAMA_DOKUMEN?att.NAMA_DOKUMEN:"",
        DESKRIPSI: att.DESKRIPSI?att.DESKRIPSI:"",
        FILE_NAME: att.FILE_NAME?att.FILE_NAME:"",
        FILE_TYPE: att.FILE_TYPE?att.FILE_TYPE:"",
        FILE_PATH: att.FILE_PATH? 'http://mrra.telkom.co.id/gis/assets'+att.FILE_PATH:"",
        FILE_SIZE: att.FILE_SIZE?att.FILE_SIZE:0
    }
  }

function transformImageLahan(img){
    return {
        ID: parseInt(img.ID),
        FILE_NAME: img.FILE_NAME?img.FILE_NAME:"",
        FILE_TITLE: img.FILE_TITLE?img.FILE_TITLE:"",
        FILE_PATH: img.FILE_PATH? 'http://mrra.telkom.co.id/gis/assets'+img.FILE_PATH:"",
        FILE_SIZE: img.FILE_SIZE?img.FILE_SIZE:0,
    }
  }

function transformLahanMaster(lahan){
    return {
      IDAREAL: parseInt(lahan.IDAREAL),
      NAMA_LAHAN: lahan.NAMA_LAHAN,
      ALAMAT: lahan.ALAMAT,
      COOR_X: lahan.COOR_X?lahan.COOR_X:0,
      COOR_Y: lahan.COOR_Y?lahan.COOR_Y:0,
      LUAS_LAHAN: lahan.LUAS_LAHAN?lahan.LUAS_LAHAN:0,
      ID_PROPINSI:lahan.ID_PROPINSI?parseInt(lahan.ID_PROPINSI,10):0,
      PROPINSI:lahan.PROPINSI?lahan.PROPINSI:"",
      ID_KOTA:lahan.ID_KOTA?parseInt(lahan.ID_KOTA,10):0,
      KOTA:lahan.KOTA?lahan.KOTA:"",
      ID_KECAMATAN:lahan.ID_KECAMATAN?parseInt(lahan.ID_KECAMATAN,10):0,
      KECAMATAN:lahan.KECAMATAN?lahan.KECAMATAN:"",
      ID_DESA:lahan.ID_DESA?parseInt(lahan.ID_DESA,10):0,
      DESA:lahan.DESA?lahan.DESA:"",
      ID_TREG:lahan.ID_TREG?parseInt(lahan.ID_TREG,10):0,
      TREG:lahan.TREG?lahan.TREG:"",
      ID_WITEL:lahan.ID_WITEL?parseInt(lahan.ID_WITEL,10):0,
      WITEL:lahan.WITEL?lahan.WITEL:"",
      NAMA_KLASIFIKASI: lahan.NAMA_KLASIFIKASI?lahan.NAMA_KLASIFIKASI:"",
      NAMA_KLASIFIKASI:lahan.NAMA_KLASIFIKASI?lahan.NAMA_KLASIFIKASI:"",
      NAMA_STATUS_KEPEMILIKAN: lahan.NAMA_STATUS_KEPEMILIKAN?lahan.NAMA_STATUS_KEPEMILIKAN:"",
      PATH_LAHAN_IMAGE: lahan.PATH_LAHAN_IMAGE? 'http://mrra.telkom.co.id/gis/assets'+lahan.PATH_LAHAN_IMAGE:"",
    }
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