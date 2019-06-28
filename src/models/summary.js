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

async function getSengketaAset()
{
    const binds = {};
    let query =`SELECT count(case when STATUS = 'LITIGASI' then 1 end) LITIGASI,
    count(case when STATUS = 'NON LITIGASI' then 1 end) NON_LITIGASI,
    count(case when STATUS = 'TIDAK ADA MASALAH' then 1 end) TIDAK_ADA_MASALAH,
    count(case when STATUS IS NULL then 1 end) TIDAK_ADA_STATUS FROM LA_POTENSI_SENGKETA_LAHAN`;

    const result = await database.simpleExecute(query, binds);

    return result.rows[0];
}

//logika ge jatuh tempo
//yang tanggal akihirnya setahun lagi akan habis atau yang udah expired
//jadi tgl sekarang + 1 tahun
//tg_lakhir_database < tgl_tahun_depan 
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
};