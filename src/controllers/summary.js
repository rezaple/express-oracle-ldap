const summary = require('../models/summary.js');

async function getSummary(req, res, next) {
  try {
    const rows = await summary.getSummary();
    res.status(200).json({
      status:200,
			data:rows,
    });
  } catch (err) {
    res.status(500).json({
      status:500,
      message:'Internal server error.'
    });
  }
}

async function getDetailSengketaAset(req, res, next) {
  try {
    const rows = await summary.detailSengketaAset();
    res.status(200).json({
      status:200,
			data:rows,
    });
  } catch (err) {
    res.status(500).json({
      status:500,
      message:'Internal server error.'
    });
  }
}

async function getDetailKlasifikasiAset(req, res, next) {
  try {
    const rows = await summary.detailKlasifikasiAset();
    res.status(200).json({
      status:200,
			data:rows,
    });
  } catch (err) {
    res.status(500).json({
      status:500,
      message:'Internal server error.'
    });
  }
}

async function getDetailStatusTanah(req, res, next) {
  try {
    const rows = await summary.detailStatusTanah();
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
  getSummary,
  getDetailSengketaAset,
  getDetailKlasifikasiAset,
  getDetailStatusTanah
}