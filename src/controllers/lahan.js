const lahan = require('../models/lahan.js');

async function getAll(req, res, next) {
  try {
    if(req.query.per_page!==undefined){
      const rows = await lahan.getAllPagination(req);
      res.status(200).json({
        status:200,
        data:rows.data,
				paginator:rows.paginator
      });
    }else{
      const rows = (req.query.nearme!==undefined  && parseInt(req.query.nearme,10) === 1 )? await lahan.nearMe(req.query): await lahan.getAll(req);
      
      res.status(200).json({
        status:200,
        data:rows,
      });
    }
    
  } catch (err) {
    res.status(500).json({
      status:500,
      message:err.message
    });
  }
}

async function getDetail(req, res, next) {
  try {
    const idAreal = parseInt(req.params.id, 10);
    const rows = await lahan.getDetail(idAreal);
    if(rows.lahan_master===undefined || rows.lahan_master ===""){
      res.status(404).json({
        status:404,
        data:"Not Found",
      });
    }else{
      res.status(200).json({
        status:200,
        data:rows,
      });
    }
    
  } catch (err) {
    res.status(500).json({
      status:500,
      message:err.message
    });
  }
}

async function getDetailAsetLahan(req, res, next) {
  try {
    const rows = await lahan.detailAsetLahan();
      res.status(200).json({
        status:200,
        data:rows,
      });
    
  } catch (err) {
    res.status(500).json({
      status:500,
      message:err.message
    });
  }
}

module.exports = {
  getAll,
  getDetail,
  getDetailAsetLahan
}