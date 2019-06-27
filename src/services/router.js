const express = require('express');
const router = new express.Router();
const basedata = require('../controllers/basedata');
const auth = require('../controllers/auth');
const summary = require('../controllers/summary');
const area = require('../controllers/area');
const lahan = require('../controllers/lahan');
// const gedung = require('../controllers/gedung');

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
router.route('/summary')
      .get(summary.getSummary);

router.route('/provinsi').get(area.getProvinces);

router.route('/provinsi/:idProv/kota').get(area.getCities);

router.route('/provinsi/:idProv/kota/:idCity/kecamatan').get(area.getSubDistrictsByProvince);

router.route('/kota/:idCity/kecamatan').get(area.getSubDistricts);

router.route('/lahan').get(lahan.getAll);
router.route('/lahan/:id').get(lahan.getDetail);

router.route('/login')
      .post(auth.login);

module.exports = router;