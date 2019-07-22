//const admin = require('../models/dashboard.js');
const XLSX = require('xlsx');

function load_data(file) {
	var wb = XLSX.readFile(file);
	/* generate array of arrays */
	data = XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]], {header:1});
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
    // var keys = Object.keys(req.files), k = keys[0];
	
    // var url = URL.parse(req.url, true);
    // let result;
    // if(url.query.f){
    //   result = load_data(url.query.f);
    //   res.status(200).json({
    //     status:200,
    //     data:result,
    //   });
    // } else{
    //   result = load_data(req.files[k].path);
    // }

    res.status(200).json({
      status:200,
      data:req.files,
    });
    //const rows = await admin.store();
    
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