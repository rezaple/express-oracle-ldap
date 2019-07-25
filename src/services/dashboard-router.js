const express = require('express');
const router = new express.Router();
const dashboard = require('../controllers/dashboard');
const multer = require('multer');

const storage = multer.diskStorage({
  destination: function(req, file, cb) {
    cb(null, './public/sheets/');
  },
  filename: function(req, file, cb) {
    cb(null, Math.floor(new Date() / 1000) + file.originalname);
  }
});

const fileFilter = (req, file, cb) => {
  if (!file.originalname.match(/\.(xls|xlsx)$/)) {
    return cb(null, false)
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
router.get('/', dashboard.showIndex)
router.get('/home', dashboard.showHome);
router.get('/login', dashboard.showLogin)
router.post('/login', dashboard.login);
router.get('/logout', dashboard.logout);
router.get('/upload-nka', dashboard.showUploadNKA);
router.post('/upload-nka',upload.single('file'), dashboard.uploadNKA2);
router.get('/request-lahan', dashboard.showRequestLahan);
router.get('/request-lahan/:id', dashboard.showDetailRequestLahan);
router.get('/request-gedung', dashboard.showDetailRequestGedung);
router.get('/request-gedung/:id', dashboard.showUploadNKA);

router.get('/:page', function(req, res){
      res.render(`dashboard/${req.params.page}`)
});

module.exports = router;