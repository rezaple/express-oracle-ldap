const http = require('http');
const express = require('express');
const session = require('express-session');
const bodyParser = require('body-parser');
const morgan = require('morgan');
const webServerConfig = require('../config/web-server.js');
const router = require('./router.js');
const dashboardRouter = require('./dashboard-router.js');
const flash = require('express-flash');

let httpServer;

function initialize() {
  return new Promise((resolve, reject) => {
    const app = express();
    app.set('view engine', 'pug')
    app.use(morgan('combined'));
    app.use(express.static('public'));
    app.use(session({
      secret: 'myassist2019telkom87',
      resave: true,
      saveUninitialized: true
    }));
    app.use(bodyParser.json({limit: '50mb'}));
    app.use(bodyParser.urlencoded({limit: '50mb', extended: false}));
    app.use(flash());
    app.locals.moment = require('moment');
    app.locals.baseUrl = webServerConfig.baseUrl
    
    app.use((req, res, next) => {
      res.header("Access-Control-Allow-Origin", "*");
      res.header(
        "Access-Control-Allow-Headers",
        "Origin, X-Requested-With, Content-Type, Accept, Authorization"
      );
      if (req.method === "OPTIONS") {
        res.header("Access-Control-Allow-Methods", "PUT, POST, PATCH, DELETE, GET");
        return res.status(200).json({});
      }
      next();
    });

    app.use('/api', router);
    app.use('/', dashboardRouter);

    app.use((req, res, next) => {
      const error = new Error("Not found");
      error.status = 404;
      next(error);
    });
    
    app.use((error, req, res, next) => {
      res.status(error.status || 500).json({
        status:error.status || 500,
        message: error.message
      });
    });

    httpServer = http.createServer(app);
    httpServer.listen(webServerConfig.port)
      .on('listening', () => {
        console.log(`Web server listening on localhost:${webServerConfig.port}`);

        resolve();
      })
      .on('error', err => {
        reject(err);
      });
  });
}

module.exports.initialize = initialize;

function close() {
  return new Promise((resolve, reject) => {
    httpServer.close((err) => {
      if (err) {
        reject(err);
        return;
      }

      resolve();
    });
  });
}

module.exports.close = close;