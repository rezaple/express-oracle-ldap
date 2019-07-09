const express = require('express');
const router = new express.Router();
const jwt = require("jsonwebtoken");
const basedata = require('../controllers/basedata');
const auth = require('../controllers/auth');
const summary = require('../controllers/summary');
const area = require('../controllers/area');
const lahan = require('../controllers/lahan');
const gedung = require('../controllers/gedung');

router.route('/basedata/regional')
      .get(basedata.getRegional);
router.route('/basedata/regional/:id/witel')
      .get(basedata.getWitel);
router.route('/basedata/witel')
      .get(basedata.getWitel);
router.route('/basedata/status-kepemilikan')
      .get(basedata.getStatusKepemilikan);
router.route('/basedata/penggunaan')
      .get(basedata.getPenggunaan);
router.route('/basedata/analisis-score')
      .get(basedata.getAnalisisScore);
router.route('/basedata/status-sertifikat')
      .get(basedata.getStatusSertifikat);
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
router.get('/lahan', lahan.getAll);
router.get('/lahan/aset', lahan.getDetailAsetLahan);
router.route('/lahan/:id')
      .get(lahan.getDetail);
router.route('/gedung')
      .get(gedung.getAll);
router.route('/gedung/:id')
      .get(gedung.getDetail);
router.route('/gedung/:id/listrik')
      .get(gedung.getTagihanListrik);
router.route('/gedung/:id/air')
      .get(gedung.getTagihanAir);
router.route('/summary')
      .get(summary.getSummary);


module.exports = router;