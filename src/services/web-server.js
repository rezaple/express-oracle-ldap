const http = require('http');
const express = require('express');
const bodyParser = require('body-parser');
const morgan = require('morgan');
const path = require("path");
const webServerConfig = require('../config/web-server.js');
const router = require('./router.js');

let httpServer;

function initialize() {
  return new Promise((resolve, reject) => {
    const app = express();

    app.use(morgan('combined'));
    app.use(express.static('public'));
    app.use(bodyParser.urlencoded({ extended: false }));
    app.use(bodyParser.json());

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
    
    app.get('/', (req, res)=>{
      res.sendFile(path.join(__dirname+'/../index.html'));
    })
    
    app.use((req, res, next) => {
      const error = new Error("Not found");
      error.status = 404;
      next(error);
    });
    
    app.use((error, req, res, next) => {
      res.status(error.status || 500);
      res.json({
        error: {
          message: error.message
        }
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