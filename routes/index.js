const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const passport = require('passport');
const db = require('../models');

router.get('/login', (req, res) => res.render('login'));
router.get('/register', (req, res) => res.render('register'));

router.post('/register', (req, res) => {
  const { username, password } = req.body;
  let errors = [];

  // Check required fields
  if (!username || !password) {
    errors.push({ msg: 'Please fill in all fields' });
  }

  if (errors.length > 0) {
    res.render('register', { errors, username, password });
  } else {
    db.User.findOne({ where: { username: username } })
      .then(user => {
        if (user) {
          errors.push({ msg: 'Username is already registered' });
          res.render('register', { errors, username, password });
        } else {
          const newUser = new db.User({
            username,
            password
          });

          bcrypt.genSalt(10, (err, salt) =>
            bcrypt.hash(newUser.password, salt, (err, hash) => {
              if (err) throw err;
              newUser.password = hash;
              newUser.save()
                .then(user => {
                  req.flash('success_msg', 'You are now registered and can log in');
                  res.redirect('/login');
                })
                .catch(err => console.log(err));
            })
          );
        }
      });
  }
});

router.post('/login', (req, res, next) => {
  passport.authenticate('local', {
    successRedirect: '/dashboard',
    failureRedirect: '/login',
    failureFlash: true
  })(req, res, next);
});

router.get('/logout', (req, res) => {
  req.logout();
  req.flash('success_msg', 'You are logged out');
  res.redirect('/login');
});

router.get('/dashboard', ensureAuthenticated, (req, res) => {
  db.Note.findAll({ where: { userId: req.user.id } })
    .then(notes => res.render('dashboard', { username: req.user.username, notes }))
    .catch(err => console.log(err));
});

router.post('/notes', ensureAuthenticated, (req, res) => {
  const { title, content } = req.body;
  db.Note.create({ title, content, userId: req.user.id })
    .then(note => res.redirect('/dashboard'))
    .catch(err => console.log(err));
});

router.get('/notes/:id/edit', ensureAuthenticated, (req, res) => {
  db.Note.findByPk(req.params.id)
    .then(note => res.render('edit-note', { note }))
    .catch(err => console.log(err));
});

router.post('/notes/:id/update', ensureAuthenticated, (req, res) => {
  db.Note.update(req.body, { where: { id: req.params.id } })
    .then(note => res.redirect('/dashboard'))
    .catch(err => console.log(err));
});

router.post('/notes/:id/delete', ensureAuthenticated, (req, res) => {
  db.Note.destroy({ where: { id: req.params.id } })
    .then(note => res.redirect('/dashboard'))
    .catch(err => console.log(err));
});

// ACL
function ensureAuthenticated(req, res, next) {
  if (req.isAuthenticated()) {
    return next();
  } else {
    res.redirect('/login');
  }
}

router.get('/user/:username', (req, res) => {
  db.User.findOne({ where: { username: req.params.username } })
    .then(user => {
      if (user) {
        db.Note.findAll({ where: { userId: user.id } })
          .then(notes => res.render('public-profile', { username: user.username, notes }))
          .catch(err => console.log(err));
      } else {
        res.status(404).send('User not found');
      }
    })
    .catch(err => console.log(err));
});

module.exports = router;
