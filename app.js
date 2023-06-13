const express = require('express');
const session = require('express-session');
const passport = require('passport');
const flash = require('connect-flash');
const app = express();
const bodyParser = require('body-parser');
// Body parser
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

// Set view engine
app.set('view engine', 'ejs');

// Passport Config
require('./config/passport')(passport);
app.use(express.urlencoded({ extended: false }));

// Express Session middleware
app.use(session({
  secret: 'secret',
  resave: true,
  saveUninitialized: true
}));

// Passport middleware
app.use(passport.initialize());
app.use(passport.session());

// Connect flash
app.use(flash());

// Global Vars
app.use((req, res, next) => {
  res.locals.success_msg = req.flash('success_msg');
  res.locals.error_msg = req.flash('error_msg');
  res.locals.error = req.flash('error');
  next();
});

app.use('/', require('./routes/index.js'));

const PORT = process.env.PORT || 8000;
app.listen(PORT, console.log(`Server started on port ${PORT}`));
