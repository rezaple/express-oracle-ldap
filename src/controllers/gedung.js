const gedung = require('../models/gedung.js');

async function getAll(req, res, next) {
  try {
    if(req.query.per_page!==undefined){
      const rows = await gedung.getAllPagination(req);
      res.status(200).json({
        status:200,
        data:rows.data,
				paginator:rows.paginator
      });
    }else{
      const rows = (req.query.nearme!==undefined  && parseInt(req.query.nearme,10) === 1 )? await gedung.nearMe(req.query): await gedung.getAll(req);
      
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
    const id = parseInt(req.params.id, 10);
    const rows = await gedung.getDetail(id);
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

async function getTagihanListrik(req, res, next) {
  try {
    const id = parseInt(req.params.id, 10);
    const rows = await gedung.getListrik(id);
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

async function getTagihanAir(req, res, next) {
  try {
    const id = parseInt(req.params.id, 10);
    const rows = await gedung.getAir(id);
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
  getTagihanListrik,
  getTagihanAir
}