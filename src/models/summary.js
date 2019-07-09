const database = require('../services/database.js');

async function getSummary(){        

  let data = {
    lahan : await getSummaryLahan(),
    gedung: await getSummaryGedung(),
    primer: await getSummaryKlasifikasiAset('PRIMER'),
    sekunder: await getSummaryKlasifikasiAset('SEKUNDER'),
    tersier: await getSummaryKlasifikasiAset('TERSIER'),
    residu: await getSummaryKlasifikasiAset('RESIDU'),
    sengketa_aset: await getSengketaAset(),
    status_tanah: await getStatusTanah()
  }
  return data;
}

async function getSummaryLahan()
{
  let query ="SELECT count(IDAREAL) as total_lahan , SUM(LUAS_LAHAN) as total_luas_lahan FROM LA_LAHAN";
  const binds = {};

  const result = await database.simpleExecute(query, binds);

  return result.rows[0];
}

async function getSummaryGedung()
{
  let query ="SELECT count(IDGEDUNG) as total_gedung , SUM(LUAS_BANGUNAN) as total_luas_bangunan FROM LA_GEDUNG";
  const binds = {};

  const result = await database.simpleExecute(query, binds);

  return result.rows[0];
}

async function getSummaryKlasifikasiAset(type='PRIMER')
{
    let query ="SELECT COUNT(a.IDAREAL) as total FROM GIS_LAHAN_MASTER a left join LA_ANALISIS_SCORE b on TO_CHAR(a.IDAREAL) = TO_CHAR(b.IDAREAL)left join LA_REF_ANALISIS_SCORE_KLAS e on TO_NUMBER(b.KLASIFIKASI) = e.ID AND a.IDAREAL = b.IDAREAL ";
    const binds = {};

    binds.TYPE = type;

    query += `\nwhere NAMA_KLASIFIKASI = :type`;

    const result = await database.simpleExecute(query, binds);

    return result.rows[0];
}

async function detailKlasifikasiAset(){
  const resultAsets = await database.simpleExecute(`SELECT b.ID, b.TREG_ID, b.NAMA, 
  count(case when d.NAMA_KLASIFIKASI = 'PRIMER' then 1 end) as Q1, 
  count(case when d.NAMA_KLASIFIKASI = 'SEKUNDER' then 1 end) as Q2, 
  count(case when d.NAMA_KLASIFIKASI = 'TERSIER' then 1 end) as Q3, 
  count(case when d.NAMA_KLASIFIKASI = 'RESIDU' then 1 end) as Q4 
  FROM LA_REF_WILAYAH_TELKOM b 
  LEFT JOIN LA_LAHAN a ON TO_CHAR(b.ID) = TO_CHAR(a.WILAYAH_TELKOM) 
  LEFT JOIN LA_ANALISIS_SCORE c on TO_CHAR(a.IDAREAL) = TO_CHAR(c.IDAREAL)
  LEFT JOIN LA_REF_ANALISIS_SCORE_KLAS d on TO_NUMBER(c.KLASIFIKASI) = d.ID
  GROUP BY b.ID, b.TREG_ID, b.NAMA 
  ORDER BY b.TREG_ID ASC`,{});
  const result=[];

  resultAsets.rows.map(aset => {
      if(result[aset.TREG_ID]===undefined){
          result[aset.TREG_ID]={
              id:aset.TREG_ID,
              nama:`Regional ${aset.TREG_ID}`,
              klasifikasi:{
                  q1:aset.Q1,
                  q2:aset.Q2,
                  q3:aset.Q3,
                  q4:aset.Q4,
              },
              witels:[{
                  id:aset.ID,
                  nama:`${aset.NAMA}`,
                  klasifikasi:{
                    q1:aset.Q1,
                    q2:aset.Q2,
                    q3:aset.Q3,
                    q4:aset.Q4,
                  },
              }]
          }
      }else{
          result[aset.TREG_ID].klasifikasi.q1 += aset.Q1
          result[aset.TREG_ID].klasifikasi.q2 += aset.Q2
          result[aset.TREG_ID].klasifikasi.q3 += aset.Q3
          result[aset.TREG_ID].klasifikasi.q4 += aset.Q4

          result[aset.TREG_ID].witels.push({
              id:aset.ID,
              nama:`${aset.NAMA}`,
              klasifikasi:{
                q1:aset.Q1,
                q2:aset.Q2,
                q3:aset.Q3,
                q4:aset.Q4,
              },
          })
      }
      
  })

  return result.filter(function() { return true; });
}

async function getSengketaAset()
{
    const binds = {};
    let query =`SELECT count(case when a.STATUS = 'LITIGASI' then 1 end) LITIGASI,
    count(case when a.STATUS = 'NON LITIGASI' then 1 end) NON_LITIGASI,
    count(case when a.STATUS = 'TIDAK ADA MASALAH' then 1 end) TIDAK_ADA_MASALAH,
    count(case when a.STATUS IS NULL then 1 end) TIDAK_ADA_STATUS FROM 
    LA_POTENSI_SENGKETA_LAHAN a JOIN LA_LAHAN b ON TO_CHAR(a.IDAREAL) = TO_CHAR(b.IDAREAL)`;

    const result = await database.simpleExecute(query, binds);

    return result.rows[0];
}

async function detailSengketaAset(){
  const resultAsets = await database.simpleExecute(`SELECT b.ID, b.TREG_ID, b.NAMA, 
  count(case when STATUS = 'LITIGASI' then 1 end) as LITIGASI, 
  count(case when STATUS = 'NON LITIGASI' then 1 end) as NON_LITIGASI 
  FROM LA_REF_WILAYAH_TELKOM b 
  LEFT JOIN LA_LAHAN a ON TO_CHAR(b.ID) = TO_CHAR(a.WILAYAH_TELKOM) 
  LEFT JOIN LA_POTENSI_SENGKETA_LAHAN c ON TO_CHAR(c.IDAREAL) = TO_CHAR(a.IDAREAL) 
  GROUP BY b.ID, b.TREG_ID, b.NAMA 
  ORDER BY b.TREG_ID ASC`,{});
  const result=[];

  resultAsets.rows.map(aset => {
      if(result[aset.TREG_ID]===undefined){
          result[aset.TREG_ID]={
              id:aset.TREG_ID,
              nama:`Regional ${aset.TREG_ID}`,
              sengketa:{
                  litigasi:aset.LITIGASI,
                  non_litigasi:aset.NON_LITIGASI,
              },
              witels:[{
                  id:aset.ID,
                  nama:`${aset.NAMA}`,
                  sengketa:{
                      litigasi: aset.LITIGASI,
                      non_litigasi: aset.NON_LITIGASI
                  },
              }]
          }
      }else{
          result[aset.TREG_ID].sengketa.litigasi += aset.LITIGASI
          result[aset.TREG_ID].sengketa.non_litigasi += aset.NON_LITIGASI

          result[aset.TREG_ID].witels.push({
              id:aset.ID,
              nama:`${aset.NAMA}`,
              sengketa:{
                litigasi: aset.LITIGASI,
                non_litigasi: aset.NON_LITIGASI
            },
          })
      }
      
  })

  return result.filter(function() { return true; });
}


async function getStatusTanah()
{
    const date = new Date();
    date.setFullYear(date.getFullYear() + 1)
    const tahunJatuhTempo = date.toISOString().split('T')[0];
    let query =`SELECT count(case when d.SKHAK = 'HGB' AND d.TANGGAL_AKHIR > TO_DATE('${tahunJatuhTempo}','YYYY-MM-DD') then 1 end) HGB,
    count(case when d.SKHAK = 'HP' AND d.TANGGAL_AKHIR > TO_DATE('${tahunJatuhTempo}','YYYY-MM-DD')  then 1 end) HP,
    count(case when d.SKHAK = 'HM' AND d.TANGGAL_AKHIR > TO_DATE('${tahunJatuhTempo}','YYYY-MM-DD')  then 1 end) HM,
    count(case when d.TANGGAL_AKHIR < TO_DATE('${tahunJatuhTempo}','YYYY-MM-DD') then 1 end) JATUH_TEMPO
    FROM GIS_LAHAN_MASTER a 
    join LA_SERTIPIKAT_BARU d on TO_CHAR(d.IDAREAL) = TO_CHAR(a.IDAREAL)`;

    const result = await database.simpleExecute(query, {});
    return result.rows[0];
    ;
}

module.exports={
  getSummary,
  detailSengketaAset,
  detailKlasifikasiAset
};