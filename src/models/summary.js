const database = require('../services/database.js');

async function getRegional(){     
  let query ="select * from LA_REF_TELKOM_REGIONAL";
  const binds = {};

  const result = await database.simpleExecute(query, binds);

  return result.rows;
}

async function getWitel(context)
{
  let query = `select * from LA_REF_WILAYAH_TELKOM`;
  const binds = {};

  if (context.id) {
    binds.TREG_ID = context.id;

    query += `\nwhere TREG_ID = :TREG_ID`;
  }

  const result = await database.simpleExecute(query, binds);

  return result.rows;
}

async function getSummary()
{
  let query ="SELECT * FROM LA_REF_STATUS_KEPEMILIKAN";
  const binds = {};

  const result = await database.simpleExecute(query, binds);

  return result.rows;
}

async function getSummary(){        

  let data = {
    lahan : await getSummaryLahan(),
    gedung: await getSummaryGedung(),
    primer: await getSummaryKlasifikasiAset('PRIMER'),
    sekunder: await getSummaryKlasifikasiAset('SEKUNDER'),
    tersier: await getSummaryKlasifikasiAset('TERSIER'),
    residu: await getSummaryKlasifikasiAset('RESIDU')
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

module.exports={
  getSummary : getSummary,
};