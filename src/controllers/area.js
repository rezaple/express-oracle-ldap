const area = require('../models/area.js');

async function getProvinces(req, res, next) {
  try {
    const rows = await area.getProvinces();
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

async function getCities(req, res, next) {
  try {
    const context = {};
    context.idProv = parseInt(req.params.idProv, 10);
    const rows = await area.getCities(context);
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

async function getSubDistricts(req, res, next) {
  try {
    const context = {};
    context.idCity = parseInt(req.params.idCity, 10);
    const rows = await area.getSubDistricts(context);
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

async function getSubDistrictsByProvince(req, res, next) {
  try {
    const context = {};
    context.idProv = parseInt(req.params.idProv, 10);
    context.idCity = parseInt(req.params.idCity, 10);
    const rows = await area.getSubDistrictsByProvince(context);
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
  getProvinces,
  getCities,
  getSubDistricts,
  getSubDistrictsByProvince
}