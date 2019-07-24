const admin = require('../models/dashboard');
const fs = require('fs');
const XLSX = require('xlsx');
const ldap = require('ldapjs');
const auth = require('./auth');
const summary = require('../models/summary');
const requestAsset = require('../models/requestAsset');

function load_data(file) {
	var wb = XLSX.readFile(file);
	/* generate array of arrays */
	const data = XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]], {header:1});
	return data
}

function redirectToLogin(req, res){
  req.flash('info', 'Maaf, Anda tidak dapat mengakses halaman yang Anda tuju!');
  return res.redirect('/login');
}

function showLogin(req, res, next){
  if (req.session.loggedin) {
    return res.redirect('/home');
  }
  res.render('dashboard/login');
}

function showIndex(req, res, next){
  if (req.session.loggedin) {
    return res.redirect('/home');
  }
  res.render('dashboard/blank');
}

function showUploadNKA(req, res, next){
  if (req.session.loggedin) {
    res.render('dashboard/upload-nka');
  }
  redirectToLogin(req, res)
}

async function showRequestLahan(req, res, next){
  if (req.session.loggedin) {
    try{
      req.currentUser = {
        nik:req.session.username
      }
      const result = await requestAsset.listRequestLahan(req)
      res.render('dashboard/request-lahan', {data:result.data, paginator: result.paginator});
    }catch (err) {
      console.log(err.message)
      req.flash('error', `Maaf, terjadi kesalahan di server <${err.message}>`);
      return res.redirect('/home')
    }
  }
  redirectToLogin(req, res)
}

async function showRequestGedung(req, res, next){
  if (req.session.loggedin) {
    try{
      req.currentUser = {
        nik:req.session.username
      }
      const result = await requestAsset.listRequestGedung(req)
      res.render('dashboard/request-gedung', {data:result.data, paginator: result.paginator});
    }catch (err) {
      console.log(err.message)
      req.flash('error', `Maaf, terjadi kesalahan di server <${err.message}>`);
      return res.redirect('/home')
    }
  }
  redirectToLogin(req, res)
}

function logout(req, res, next){
  req.session.destroy(function(err){
    if(err){
      console.log(err);
    }
    else
    {
      res.redirect('/login');
    }
  });
}

async function showHome(req, res, next){
  if (req.session.loggedin) {
    try {
      const data = await summary.getSummary()
      res.render('dashboard/index', {data});
    } catch (err) {
      res.status(500).json({
        status:500,
        message:err.message
      });
    }
  } 
  
  redirectToLogin(req, res)
}

function login(req, res, next){
  if (!req.body.nik || !req.body.password) {
    req.flash('info', 'Maaf, kredential yang anda masukkan salah!');
    return res.redirect('/login');
  }else{
    const context = {};
    context.nik = req.body.nik;
    context.password = req.body.password;

    var client = ldap.createClient({
      url: 'ldap://ldap01a.telkom.co.id'
    });
  
    client.on('connect', function () {
      client.bind(context.nik, context.password, function(err) {
        if (err) {
          req.flash('info', 'Maaf, kredential yang anda masukkan salah!');
          return res.redirect('/login');
        } 

        req.session.loggedin =true
        req.session.username =context.nik
        req.session.token =auth.generateToken(context.nik)
        return res.redirect('/home');
      });
    });
  }
}

async function uploadNKA(req, res, next) {
  try {
    const file = req.file
    if (!file) {
      const error = new Error('Please upload a file')
      error.status = 400
      return next(error)
    }
    // res.send(file)
    const data= load_data(file.path)
    fs.unlinkSync(file.path)
    const result = await admin.storeNKA(data);
    
    res.status(200).json({
        status:200,
        message:result
    });
  } catch (err) {
    res.status(err.status || 500).json({
      status:err.status || 500,
      message:err.message
    });
  }
}

async function uploadNKA2(req, res, next) {
  try {
    const file = req.file
    if (!file) {
        req.flash('error', 'Dokumen dibutuhkan!');
        return res.redirect('/upload-nka');
    }
    // res.send(file)
    const data= load_data(file.path)
    fs.unlinkSync(file.path)
    const result = await admin.storeNKA(data);
    
    req.flash('info', 'Upload dokumen berhasil');
    return res.redirect('/upload-nka');
  } catch (err) {
    req.flash('error', err.message);
    return res.redirect('/upload-nka');
  }
}

module.exports = {
  uploadNKA2,
  uploadNKA,
  showLogin,
  showIndex,
  showHome,
  showUploadNKA,
  showRequestLahan,
  showRequestGedung,
  login,
  logout
}