const express = require('express');
const router = new express.Router();
const jwt = require("jsonwebtoken");
const basedata = require('../controllers/basedata');
const auth = require('../controllers/auth');
const summary = require('../controllers/summary');
const area = require('../controllers/area');
const lahan = require('../controllers/lahan');
const gedung = require('../controllers/gedung');
const requestAsset = require('../controllers/requestAsset');

router.route('/basedata/regional')
      .get(basedata.getRegional);
router.route('/basedata/regional/:id/witel')
      .get(basedata.getWitel);
router.route('/basedata/witel')
      .get(basedata.getWitel);
// router.route('/basedata/status-kepemilikan')
//       .get(basedata.getStatusKepemilikan);
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
router.get('/lahan', lahan.getAll);
router.get('/lahan/aset', lahan.getDetailAsetLahan);
router.route('/lahan/:id')
      .get(lahan.getDetail);
router.route('/gedung')
      .get(gedung.getAll);
router.get('/gedung/aset', gedung.getDetailAsetGedung);
router.route('/gedung/:id')
      .get(gedung.getDetail);
router.route('/gedung/:id/listrik')
      .get(gedung.getTagihanListrik);
router.route('/gedung/:id/air')
      .get(gedung.getTagihanAir);
router.route('/summary')
      .get(summary.getSummary);
router.route('/sengketa/aset')
      .get(summary.getDetailSengketaAset);
router.route('/klasifikasi/aset')
      .get(summary.getDetailKlasifikasiAset);
router.route('/status-tanah/aset')
      .get(summary.getDetailStatusTanah);

router.route('/request-assets')
      .get(requestAsset.listAssets);
router.route('/request-gedung/:id')
      .get(requestAsset.getRequestAssetGedung);
router.route('/lahan/:id/edit')
      .get(requestAsset.getAssetLahan);
router.route('/request-lahan/:id')
      .get(requestAsset.getRequestAssetLahan);
router.route('/request-lahan/:id/upload')
      .post(requestAsset.uploadImageLahan);
router.route('/request-gedung/:id/upload')
      .post(requestAsset.uploadImageGedung);
router.post(
      '/request-lahan', 
      requestAsset.validate('createLahan'), 
      requestAsset.storeRequestAssetLahan)
router.post(
      '/request-lahan/:id', 
      requestAsset.validate('createLahan'), 
      requestAsset.updateRequestAssetLahan)
router.post(
      '/request-gedung', 
      requestAsset.validate('createGedung'), 
      requestAsset.storeRequestAssetGedung)
router.post(
      '/request-gedung/:id', 
      requestAsset.validate('createGedung'), 
      requestAsset.updateRequestAssetGedung)
module.exports = router;