const admin = require('../models/dashboard');
const fs = require('fs');
const XLSX = require('xlsx');
const ldap = require('ldapjs');
const auth = require('./auth');
const summary = require('../models/summary');
const requestAsset = require('../models/requestAsset');
const {baseUrl} = require('../config/web-server.js');


function getDate(){
  var date = new Date()
  date.setHours(date.getHours() + 7);
  return date.toISOString().replace(/T/, ' ').replace(/\..+/, '');
}

function load_data(file) {
	var wb = XLSX.readFile(file);
	/* generate array of arrays */
	const data = XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]], {header:1});
	return data
}

function redirectToLogin(req, res){
  req.flash('info', 'Maaf, Anda tidak dapat mengakses halaman yang Anda tuju!');
  return res.redirect(baseUrl+'/login');
}

function showLogin(req, res, next){
  if (req.session.loggedin) {
    return res.redirect(baseUrl+'/home');
  }
  res.render('dashboard/login');
}

function showIndex(req, res, next){
  if (req.session.loggedin) {
    return res.redirect(baseUrl+'/home');
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
      req.flash('error', `Maaf, terjadi kesalahan di server <${err.message}>`);
      return res.redirect(baseUrl+'/home')
    }
  }
  redirectToLogin(req, res)
}

async function showDetailRequestLahan(req, res, next){
  if (req.session.loggedin) {
    try{
      const context = {
        id: parseInt(req.params.id, 10),
        nik: req.session.username
      }
      if(isNaN(context.id)){
        return res.redirect(baseUrl+'/request-lahan')
      }
      const data = await requestAsset.getRequestLahan(context)
      res.render('dashboard/detail-request-lahan',{data});
    }catch (err) {
      req.flash('error', `Maaf, terjadi kesalahan di server <${err.message}>`);
      return res.redirect(baseUrl+'/home')
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
      req.flash('error', `Maaf, terjadi kesalahan di server <${err.message}>`);
      return res.redirect(baseUrl+'/home')
    }
  }
  redirectToLogin(req, res)
}

async function showDetailRequestGedung(req, res, next){
  if (req.session.loggedin) {
    try{
      const context = {
        id: parseInt(req.params.id, 10),
        nik: req.session.username
      }
      if(isNaN(context.id)){
        return res.redirect(baseUrl+'/request-gedung')
      }
      const data = await requestAsset.getRequestGedung(context)
      res.render('dashboard/detail-request-gedung',{data});
    }catch (err) {
      req.flash('error', `Maaf, terjadi kesalahan di server <${err.message}>`);
      return res.redirect(baseUrl+'/home')
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
      res.redirect(baseUrl+'/login');
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
    return res.redirect(baseUrl+'/login');
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
          return res.redirect(baseUrl+'/login');
        } 

        req.session.loggedin =true
        req.session.username =context.nik
        req.session.token =auth.generateToken(context.nik)
        return res.redirect(baseUrl+'/home');
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
    const data= load_data(file.path)
    fs.unlinkSync(file.path)
    const result = await admin.storeNKA(data);
    
    req.flash('info', 'Upload dokumen berhasil');
    return res.redirect('/upload-nka');
  } catch (err) {
    req.flash('error', err.message);
    return res.redirect(baseUrl+'/upload-nka');
  }
}

async function acceptRequestLahan(req, res, next){
  if (req.session.loggedin) {
    try{
      const context = {
        id: parseInt(req.params.id, 10),
        update_by: req.session.username,
        updated_date:getDate()
      }
      const result = await requestAsset.acceptRequestLahan(context)
      req.flash('success', `Sukses menerima request.`);
      return res.redirect(baseUrl+'/request-lahan/'+context.id)
    }catch (err) {
      const id= parseInt(req.params.id, 10)
      req.flash('error', `Maaf, terjadi kesalahan di server <${err.message}>`);
      return res.redirect(baseUrl+'/request-lahan/'+id)
    }
  }
  redirectToLogin(req, res)
}

async function declineRequestLahan(req, res, next){
  if (req.session.loggedin) {
    try{
      const context = {
        id: parseInt(req.params.id, 10),
        update_by: req.session.username,
        updated_date:getDate()
      }
      const result = await requestAsset.declineRequestLahan(context)
      req.flash('success', `Sukses menolak request.`);
      return res.redirect(baseUrl+'/request-lahan/'+context.id)
    }catch (err) {
      const id= parseInt(req.params.id, 10)
      req.flash('error', `Maaf, terjadi kesalahan di server <${err.message}>`);
      return res.redirect(baseUrl+'/request-lahan/'+id)
    }
  }
  redirectToLogin(req, res)
}

async function revisiRequestLahan(req, res, next){
  if (req.session.loggedin) {
    try{
      const context = {
        id: parseInt(req.params.id, 10),
        note: req.body.notes||"",
        update_by: req.session.username,
        updated_date:getDate()
      }
      const result = await requestAsset.revisiRequestLahan(context)
      req.flash('success', `Sukses merevisi request.`);
      return res.redirect(baseUrl+'/request-lahan/'+context.id)
    }catch (err) {
      const id= parseInt(req.params.id, 10)
      req.flash('error', `Maaf, terjadi kesalahan di server <${err.message}>`);
      return res.redirect(baseUrl+'/request-lahan/'+id)
    }
  }
  redirectToLogin(req, res)
}

async function acceptRequestGedung(req, res, next){
  if (req.session.loggedin) {
    try{
      const context = {
        id: parseInt(req.params.id, 10),
        update_by: req.session.username,
        updated_date:getDate()
      }
      const result = await requestAsset.acceptRequestGedung(context)
      req.flash('success', `Sukses menerima request.`);
      return res.redirect(baseUrl+'/request-gedung/'+context.id)
    }catch (err) {
      const id= parseInt(req.params.id, 10)
      req.flash('error', `Maaf, terjadi kesalahan di server <${err.message}>`);
      return res.redirect(baseUrl+'/request-gedung/'+id)
    }
  }
  redirectToLogin(req, res)
}

async function declineRequestGedung(req, res, next){
  if (req.session.loggedin) {
    try{
      const context = {
        id: parseInt(req.params.id, 10),
        update_by: req.session.username,
        updated_date:getDate()
      }
      const result = await requestAsset.declineRequestGedung(context)
      req.flash('success', `Sukses menolak request.`);
      return res.redirect(baseUrl+'/request-gedung/'+context.id)
    }catch (err) {
      const id= parseInt(req.params.id, 10)
      req.flash('error', `Maaf, terjadi kesalahan di server <${err.message}>`);
      return res.redirect(baseUrl+'/request-gedung/'+id)
    }
  }
  redirectToLogin(req, res)
}

async function revisiRequestGedung(req, res, next){
  if (req.session.loggedin) {
    try{
      const context = {
        id: parseInt(req.params.id, 10),
        note: req.body.notes||"",
        update_by: req.session.username || 930341,
        updated_date:getDate()
      }
      const result = await requestAsset.revisiRequestGedung(context)
      req.flash('success', `Sukses merevisi request.`);
      return res.redirect(baseUrl+'/request-gedung/'+context.id)
    }catch (err) {
      const id= parseInt(req.params.id, 10)
      req.flash('error', `Maaf, terjadi kesalahan di server <${err.message}>`);
      return res.redirect(baseUrl+'/request-gedung/'+id)
    }
  }
  redirectToLogin(req, res)
}


module.exports = {
  uploadNKA2,
  uploadNKA,
  showLogin,
  showIndex,
  showHome,
  showUploadNKA,
  showRequestLahan,
  showDetailRequestLahan,
  showRequestGedung,
  showDetailRequestGedung,
  login,
  logout,
  revisiRequestGedung,
  acceptRequestGedung,
  declineRequestGedung,
  revisiRequestLahan,
  acceptRequestLahan,
  declineRequestLahan
}