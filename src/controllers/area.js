const area = require('../models/area.js');
const fs = require('fs');
const base64Mime = require('base64mime');
const isBase64 = require('is-base64');
const multer = require('multer');

const storage = multer.diskStorage({
  destination: function(req, file, cb) {
    cb(null, './public/images/');
  },
  filename: function(req, file, cb) {
    cb(null, new Date().toISOString() + file.originalname);
  }
});

const fileFilter = (req, file, cb) => {
  if (!file.originalname.match(/\.(jpg|jpeg|png|gif)$/)) {
    return cb(new Error('Only image files are allowed!'));
  }

  cb(null, true)
};

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 1024 * 1024 * 5
  },
  fileFilter: fileFilter
}).single('file');


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

async function uploadImage(req, res, next) {
  try {
      upload(req, res, function (err) {
        if (err instanceof multer.MulterError) {
          res.status(500).json({
            status:500,
            message:err.message
          });
          return;
        } else if (err) {
          res.status(500).json({
            status:500,
            message:err.message
          });
          return;
        }
        res.status(200).json({
          status:200,
          message:'Sukses upload image'
        });
        return;
      })
      // const imgdata = req.body.image;
      
      // if (isBase64(imgdata, {mime: true}) ){
      //   //const mimeType = base64Mime(imgdata).split('/')
      //   // if(mimeType[1]==='png' || mimeType[1]==='jpg'){
      //   //   const path = './public/images/'+Date.now()+'.'+mimeType[1]
      //   //   const base64Data = imgdata.replace(/^data:([A-Za-z-+/]+);base64,/, '');
      //   //   fs.writeFileSync(path, base64Data,  {encoding: 'base64'});
      //   //   return res.send(path);
      //   // }
      //   throw new Error('not base64 image')
      // }
  } catch (e) {
    res.status(500).json({
      status:500,
      message:e.message
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
  getSubDistrictsByProvince,
  uploadImage
}