const createError = require('http-errors');
const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const morgan = require('morgan');
const cors = require('cors');
const admin = require('firebase-admin');
const serviceAcount = require('./util/localizarte-752d0-firebase-adminsdk-vukyk-36b20d136a.json');

const winston = require('./util/winston');
const resolver = require('./routes/resolver');

const app = express();

app.use(cors());

//app.use(morgan('combined', { stream: winston.logger }));
//app.use(morgan('dev'));
app.use(express.json({ limit: '15mb' }));
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', resolver);

admin.initializeApp({
  credential: admin.credential.cert(serviceAcount)
});

// catch 404 and forward to error handler
app.use((_req, _res, next) => {
  if (app.get('env' === 'development'))
    next(createError(404));
  else {
    _res.sendStatus(404);
    winston.http(`400 || ${_res.statusMessage} - ${_req.originalUrl} - ${_req.method} - ${_req.ip}`);
  }
});

// error handler
app.use((err, _req, res) => {
  res.sendStatus(err.status || 500);
  winston.http(`500 || ${res.statusMessage} - ${_req.originalUrl} - ${_req.method} - ${_req.ip}`);
});

app.disable('etag');

module.exports = app;
