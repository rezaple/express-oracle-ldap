const reqAsset = require('../models/requestAsset.js');

async function listAssets(req, res, next) {
  try {
    const rows = await reqAsset.getList(req);
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

async function getRequestAssetGedung(req, res, next) {
  try {
    const id = parseInt(req.params.id, 10);
    const rows = await reqAsset.getGedung(req, id);
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

async function getRequestAssetLahan(req, res, next) {
  try {
    const id = parseInt(req.params.id, 10);
    const rows = await reqAsset.getLahan(req, id);
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

async function storeRequestAssetLahan(req, res, next) {
  try {
    const id = parseInt(req.params.id, 10);
    const rows = await reqAsset.storeLahan(req, id);
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

async function storeRequestAssetGedung(req, res, next) {
  try {
    const id = parseInt(req.params.id, 10);
    const rows = await reqAsset.storeGedung(req, id);
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
  listAssets,
  getRequestAssetGedung,
  getRequestAssetLahan,
  storeRequestAssetLahan,
  storeRequestAssetGedung
}