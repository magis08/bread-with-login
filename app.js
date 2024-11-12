var createError = require('http-errors');
var express = require('express');
const fileUpload = require('express-fileupload');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
const { Pool } = require ('pg')
var session = require('express-session')
var flash = require('connect-flash');
// var moment = require('moment')

const pool = new Pool({
  user: 'agis',
  password: '12345',
  host: 'localhost',
  port: 5432,
  database: 'cobadb',
  // timezone: 'Asia/Jakarta',
})

var indexRouter = require('./routes/index')(pool);
var todosRouter = require('./routes/todos')(pool);

var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
app.use(session({
  secret: 'agis0803',
  resave: false,
  saveUninitialized: false,
  cookie : {
    maxAge: 60 * 60 * 1000
  }
}))
app.use(flash());
app.use(fileUpload());

app.use('/', indexRouter);
app.use('/todos', todosRouter);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;
