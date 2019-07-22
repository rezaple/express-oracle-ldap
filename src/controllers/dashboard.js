//const admin = require('../models/dashboard.js');
// var fs = require('fs'), path = require('path'), URL = require('url');
const XLSX = require('xlsx');
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
    return cb(new Error('Only excel files are allowed!'));
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

function load_data(file) {
	var wb = XLSX.readFile(file);
	/* generate array of arrays */
	const data = XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]], {header:1});
	return data
}

async function uploadNKA(req, res, next) {
  try {
    // const reader = new FileReader();
    // reader.onload = function (e) {
    //     /* read workbook */
    //     const bstr = e.target.result;
    //     const workbook = XLSX.read(bstr, { type: 'binary' });
    //     /* for each sheet, grab a sheet name */
    //     workbook.SheetNames.forEach(function (workSheetName, index) {
    //         const sheetName = workbook.SheetNames[index];
    //         const workSheet = workbook.Sheets[sheetName];
    //         const excelData = (XLSX.utils.sheet_to_json(workSheet, { header: 1 }));
    //         //mapExcelData(excelData); // do whatever you want with your excel data
    //     });
    // };
    // reader.readAsBinaryString(file);
    upload(req, res, function (err) {
      if (err) {
        res.status(500).json({
          status:500,
          message:err.message
        });
        return;
      }
      const data= load_data(req.file.path)
      res.status(200).json({
        status:200,
        message:data
      });
      return;
    })
    return;
    // res.status(200).json({
    //   status:200,
    //   data:req.files,
    // });
    
  } catch (err) {
    res.status(500).json({
      status:500,
      message:err.message
    });
  }
}

module.exports = {
  uploadNKA,
}