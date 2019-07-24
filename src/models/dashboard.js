const database = require('../services/database.js');
const oracledb = require('oracledb');

async function storeNKA(data){
  data.shift()
  const nkaPromises = data.map(async nka=>{
      if(nka.length === 13){
        await store(nka)
      }
  })     
  const result = await Promise.all(nkaPromises)
  return "sukses"
}

async function store(data){
  const id = {
    dir: oracledb.BIND_OUT,
    type: oracledb.NUMBER
  }
  const result = await database.simpleExecute(`INSERT INTO VEAT.LA_NKA
    (NO_ASSET,SNO, OR_ASSET, ASSET_DESCRIPTION, DESCRIPTION_1,DESCRIPTION_2, MFR, ASSET_MAIN_NO, CAP_DATE, CURRENCY, ACQUIS_VALUE, ACCUM_DEPRECIATION, BOOK_VALUE)
    VALUES(:no_asset, :sno, :or_asset, :asset_desc, :desc1, :desc2, :mfr, :main_no, :cap_date, :curr, :acq_val, :acc_dep, :book_val) returning id into :id`, {
      id:id,
      no_asset: data[0]?data[0].toString():"",
      sno: data[1],
      or_asset: data[2]?data[2].toString():"",
      asset_desc: data[3],
      desc1: data[4],
      desc2: data[5],
      mfr: data[6],
      main_no: data[7],
      cap_date: data[8],
      curr: data[9],
      acq_val: data[10],
      acc_dep: data[11],
      book_val: data[12],
    })
  return result
}

async function storeNKA2(data){
  data.shift()
  const nkaTrans = data.map( data=>{
      if(data.length === 13){
        // const id = {
        //   dir: oracledb.BIND_OUT,
        //   type: oracledb.NUMBER
        // }
        return {
          id:null,
          no_asset: data[0]?data[0].toString():"",
          sno: data[1],
          or_asset: data[2]?data[2].toString():"",
          asset_desc: data[3],
          desc1: data[4],
          desc2: data[5],
          mfr: data[6],
          main_no: data[7],
          cap_date: data[8],
          curr: data[9],
          acq_val: data[10],
          acc_dep: data[11],
          book_val: data[12],
        }
      }
  })     
  //return nkaTrans
  const result = await store2(nkaTrans)
  return result;
  return "sukses"
}

async function store2(data){
  const result = await database.simpleBatchExecute(`INSERT INTO VEAT.LA_NKA
    (NO_ASSET,SNO, OR_ASSET, ASSET_DESCRIPTION, DESCRIPTION_1,DESCRIPTION_2, MFR, ASSET_MAIN_NO, CAP_DATE, CURRENCY, ACQUIS_VALUE, ACCUM_DEPRECIATION, BOOK_VALUE)
    VALUES(:no_asset, :sno, :or_asset, :asset_desc, :desc1, :desc2, :mfr, :main_no, :cap_date, :curr, :acq_val, :acc_dep, :book_val) returning id into :id`, data)
  return result
}

module.exports={
  storeNKA,
  storeNKA2
};