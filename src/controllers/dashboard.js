const admin = require('../models/dashboard');
const fs = require('fs');
const XLSX = require('xlsx');
const ldap = require('ldapjs');
const auth = require('./auth');
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
      const data = {}
      //const data = await model.getData()
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

async function showUpload(req, res, next){
  if (req.session.loggedin) {
    try {
      //upload form
      res.render('dashboard/upload');
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
      url: 'ldap://'
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

async function upload(req, res, next) {
  try {
    const file = req.file
    if (!file) {
        req.flash('error', 'Dokumen dibutuhkan!');
        //redirect to form upload
        return res.redirect('/upload');
    }
    const data= load_data(file.path)
    fs.unlinkSync(file.path)
    const result = await admin.store(data);
    
    req.flash('info', 'Upload dokumen berhasil');
    return res.redirect('/upload');
  } catch (err) {
    req.flash('error', err.message);
    return res.redirect(baseUrl+'/upload');
  }
}

module.exports = {
  upload,
  showLogin,
  showIndex,
  showHome,
  login,
  logout
}