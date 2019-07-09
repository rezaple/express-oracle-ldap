const basedata = require('../models/basedata.js');

async function getRegional(req, res, next) {
  try {
    const rows = await basedata.getRegional();
    res.status(200).json({
      status:200,
			data:rows,
    });
  } catch (err) {
    res.status(500).json({
      status:500,
      message:'Internal server error'
    });
  }
}

async function getStatusKepemilikan(req, res, next) {
  try {
    const rows = await basedata.getStatusKepemilikan();
    res.status(200).json({
      status:200,
			data:rows,
    });
  } catch (err) {
    res.status(500).json({
      status:500,
      message:'Internal server error'
    });
  }
}

async function getAnalisisScore(req, res, next) {
  try {
    const rows = await basedata.getAnalisisScore();
    res.status(200).json({
      status:200,
			data:rows,
    });
  } catch (err) {
    res.status(500).json({
      status:500,
      message:'Internal server error'
    });
  }
}

function getStatusSertifikat(req, res, next)
{
  res.status(200).json({
    status:200,
    data:[
      {
        ID:1,
        name:'HGB'
      },
      {
        ID:2,
        name:'HGB Jatuh Tempo'
      },
      {
        ID:3,
        name:'Hak Pakai'
      },
      {
        ID:4,
        name:'Hak Milik'
      },
    ]
  }); 
}


function getPenggunaan(req, res, next)
{
  res.status(200).json({
    status:200,
    data:[
      {
        ID:1,
        name:'Kantor'
      },
      {
        ID:2,
        name:'STO/Plasa'
      },
      {
        ID:3,
        name:'Rumah Dinas'
      },
      {
        ID:4,
        name:'Tanah Kosong'
      },
      {
        ID:5,
        name:'Lainnya'
      },
    ]
  }); 
}

async function getWitel(req, res, next) {
  try {
    const context = {};
    context.id = parseInt(req.params.id, 10);
    const rows = await basedata.getWitel(context);
    res.status(200).json({
      status:200,
			data:rows,
    });
  } catch (err) {
    res.status(500).json({
      status:500,
      message:'Internal server error'
    });
  }
}

module.exports = {
  getRegional,
  getWitel,
  getStatusKepemilikan,
  getPenggunaan,
  getAnalisisScore,
  getStatusSertifikat
}