const express = require('express');
const router = new express.Router();
const jwt = require("jsonwebtoken");
const auth = require('../controllers/auth');
const area = require('../controllers/area');
const multer = require('multer');

const storage = multer.diskStorage({
  destination: function(req, file, cb) {
    cb(null, './public/images/');
  },
  filename: function(req, file, cb) {
    cb(null, Math.floor(new Date() / 1000) + file.originalname);
  }
});

const fileFilter = (req, file, cb) => {
  if (!file.originalname.match(/\.(jpeg|png|jpg)$/)) {
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
});

router.route('/provinsi')
      .get(area.getProvinces);
router.route('/provinsi/:idProv/kota')
      .get(area.getCities);
router.route('/provinsi/:idProv/kota/:idCity/kecamatan')
      .get(area.getSubDistrictsByProvince);
router.route('/kota/:idCity/kecamatan')
      .get(area.getSubDistricts);
router.route('/login')
      .post(auth.login);
//area need authenticate
router.use(function (req, res, next) {
  const token = req.headers.authorization;
  if (token) {
    jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
      if (err) {
        res.status(401).json({
          status:401,
          message:'The user credentials were incorrect.',
        });
      } else {
       req.currentUser = decoded;
        next();
      }
    });
  } else {
    res.status(401).json({
      status:401,
      message:'No Token.',
    });
  }
});
//route if need authentication
//router.get('/example', example.getAll);
module.exports = router;