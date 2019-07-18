const reqAsset = require('../models/requestAsset.js');
const { check, validationResult } = require('express-validator')

function getDate(){
  var date = new Date()
  date.setHours(date.getHours() + 7);
  return date.toISOString().replace(/T/, ' ').replace(/\..+/, '');
}

function validate(method){
  return async (req, res, next) => {
    const validations = getValidations(method)
    await Promise.all(validations.map(validation => validation.run(req)));

    const errors = validationResult(req);
    if (errors.isEmpty()) {
      return next();
    }

    res.status(422).json({ errors: errors.array() });
  };
};

function getValidations(method){
  switch (method) {
    case 'createLahan': {
     return [ 
        check('nama').isLength({ min: 6 }).withMessage('must be at least 5 chars long'),
        check('alamat').isLength({ min: 6 }).withMessage('must be at least 6 chars long'),
        check('coor_x').isDecimal().withMessage('must be decimal format'),
        check('coor_y').isDecimal().withMessage('must be decimal format'),
        check('regional_id').isNumeric().withMessage('must be a number'),
        check('id_lahan').optional().isNumeric().withMessage('must be a number'),
       ]   
    }
    case 'createGedung': {
      return [ 
         check('nama').isLength({ min: 6 }).withMessage('must be at least 5 chars long'),
         check('id_lahan').optional().isNumeric().withMessage('must be a number'),
         check('id_request_lahan').optional().isNumeric().withMessage('must be a number'),
         check('id_gedung').optional().isNumeric().withMessage('must be a number'),
        ]   
     }
  }
}

async function listAssets(req, res, next) {
  try {
    const rows = await reqAsset.getList(req);
    res.status(201).json({
      status:201,
			data:rows,
    });
  } catch (err) {
    res.status(500).json({
      status:500,
      message:err.message
    });
  }
}

function setContext(req){
  return {
    id: parseInt(req.params.id, 10),
    nik: req.currentUser.nik
  }
}

async function getRequestAssetGedung(req, res, next) {
  try {
    const context = setContext(req)
    const rows = await reqAsset.getRequestGedung(context);
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
    const context = setContext(req)
    const rows = await reqAsset.getRequestLahan(context);
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

async function getAssetLahan(req, res, next) {
  try {
    const context = setContext(req)
    const rows = await reqAsset.getLahan(context);
    res.status(200).json({
      status:200,
			data:rows,
    });
  } catch (err) {
    res.status(err.status || 500).json({
      status:err.status || 500,
      message:err.message
    });
  }
}

function getLahanFromRec(req) {
  const lahan = {
    nama: req.body.nama,
    alamat: req.body.alamat,
    coor_x: parseFloat(req.body.coor_x),
    coor_y: parseFloat(req.body.coor_y),
    regional: parseInt(req.body.regional_id),
    image: req.body.image,
    status:'PENDING',
    request_by: req.currentUser.nik,
    id_lahan: parseInt(req.body.id_lahan),
    request_date:getDate()
  };

  return lahan;
}

async function storeRequestAssetLahan(req, res, next) {
  try {
    
    let data = getLahanFromRec(req);

    const rows = await reqAsset.storeLahan(data);
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

function getGedungFromRec(req) {
  const gedung = {
    nama: req.body.nama,
    status:'PENDING',
    request_by: req.currentUser.nik,
    id_lahan: parseInt(req.body.id_lahan),
    id_request_lahan: parseInt(req.body.id_request_lahan),
    id_gedung: parseInt(req.body.id_gedung)||null,
    request_date:getDate()
  };

  return gedung;
}

async function storeRequestAssetGedung(req, res, next) {
  try {
    
    const data = getGedungFromRec(req);

    const rows = await reqAsset.storeGedung(data);
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

async function updateRequestAssetLahan(req, res, next) {
  try {
    const id = parseInt(req.params.id, 10);
    
    let data = getLahanFromRec(req);

    const rows = await reqAsset.updateLahan(data, id);
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

async function updateRequestAssetGedung(req, res, next) {
  try {
    const id = parseInt(req.params.id, 10);
    
    let data = getGedungFromRec(req);

    const rows = await reqAsset.updateGedung(data, id);
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

async function uploadImageLahan(req, res, next){
  try {
    const context = {
      id: parseInt(req.params.id, 10),
      images:req.body.images,
      nik: req.currentUser.nik,
      type: 'LAHAN',
      created_date:getDate()
    };
    const rows = await reqAsset.upload(context);
    res.status(200).json({
      status:200,
			data:rows,
    });
  } catch (err) {
    res.status(err.status || 500).json({
      status:err.status||500,
      message:err.message
    });
  }
}

async function uploadImageGedung(req, res, next){
  try {
    const context = {
      id: parseInt(req.params.id, 10),
      images:req.body.images,
      nik: req.currentUser.nik,
      type: 'GEDUNG',
      created_date:getDate()
    };

    const rows = await reqAsset.upload(context);
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
  storeRequestAssetGedung,
  validate,
  updateRequestAssetLahan,
  updateRequestAssetGedung,
  getAssetLahan,
  uploadImageLahan,
  uploadImageGedung
}