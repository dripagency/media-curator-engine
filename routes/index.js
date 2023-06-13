require('dotenv').config();

const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const passport = require('passport');
const db = require('../models');
const multer = require('multer');
const multerS3 = require('multer-s3');
const sharp = require('sharp');
const { S3Client } = require("@aws-sdk/client-s3");
const { PutObjectCommand } = require("@aws-sdk/client-s3");

const s3 = new S3Client({
  region: process.env.REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

const upload = multer({
  storage: multerS3({
    s3,
    bucket: 'media-curator-engine',
    acl: 'public-read',
    key: function (req, file, cb) {
      cb(null, Date.now().toString())
    }
  })
});

router.get('/profile', ensureAuthenticated, async (req, res) => {
  const user = await db.User.findByPk(req.user.id);
  res.render('profile', { title: 'Profile', user });
});

router.post('/profile', ensureAuthenticated, upload.single('profilePicture'), async (req, res) => {
  try {
    const { firstName, lastName, bio } = req.body;
    const user = await db.User.findByPk(req.user.id);

    if (req.file) {
      const buffer = await sharp(req.file.buffer)
        .resize(200, 200)
        .png()
        .toBuffer();

      // Upload image to S3
      const uploadParams = new PutObjectCommand({
        Bucket: 'media-curator-engine',
        Key: `${Date.now().toString()}.png`,
        Body: buffer,
        ACL: 'public-read'
      });
      
      const result = await s3.send(uploadParams);

      user.firstName = firstName;
      user.lastName = lastName;
      user.bio = bio;
      user.profilePicture = result.Location; // Save image URL to the database
      await user.save();

      res.redirect('/profile');
    }
  } catch (err) {
    console.error(err);
    res.redirect('/profile');
  }
});

router.get('/login', (req, res) => res.render('login', { title: 'Login' }));
router.get('/register', (req, res) => res.render('register', { title: 'Register' }));

router.post('/register', (req, res) => {
  const { username, password } = req.body;
  let errors = [];

  // Check required fields
  if (!username || !password) {
    errors.push({ msg: 'Please fill in all fields' });
  }

  if (errors.length > 0) {
    res.render('register', { title: 'Register', errors, username, password });
  } else {
    db.User.findOne({ where: { username: username } })
      .then(user => {
        if (user) {
          errors.push({ msg: 'Username is already registered' });
          res.render('register', { title: 'Register', errors, username, password });
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
  db.Note.findAll({
    where: { userId: req.user.id },
    order: [['createdAt', 'DESC']] // display the latest notes first
  })
    .then(notes => res.render('dashboard', { title: 'Dashboard', username: req.user.username, notes }))
    .catch(err => {
      console.log(err);
      req.flash('error_msg', 'Error retrieving notes');
      res.redirect('/dashboard');
    });
});

router.post('/notes', ensureAuthenticated, (req, res) => {
  const { title, content } = req.body;

  // Validate input
  if (!title || !content) {
    req.flash('error_msg', 'Please fill in all fields');
    return res.redirect('/dashboard');
  }

  db.Note.create({
    title: title.trim(),
    content: content.trim(),
    userId: req.user.id
  })
    .then(note => {
      req.flash('success_msg', 'Note created successfully');
      res.redirect('/dashboard');
    })
    .catch(err => {
      console.log(err);
      req.flash('error_msg', 'Error creating note');
      res.redirect('/dashboard');
    });
});

router.get('/notes/edit/:id', ensureAuthenticated, async (req, res) => {
  try {
    const note = await db.Note.findOne({ where: { id: req.params.id, userId: req.user.id } });
    if (!note) return res.status(404).send('Note not found');
    res.render('edit-note', { title: 'Edit Note', note });
  } catch (err) {
    console.log(err);
    res.redirect('/dashboard');
  }
});

router.post('/notes/edit/:id', ensureAuthenticated, async (req, res) => {
  const { title, content } = req.body;
  
  if (!title || !content) {
    req.flash('error_msg', 'Please fill in all fields');
    return res.redirect(`/notes/edit/${req.params.id}`);
  }

  try {
    const note = await db.Note.findOne({ where: { id: req.params.id, userId: req.user.id } });
    if (!note) return res.status(404).send('Note not found');
    
    note.title = title;
    note.content = content;
    await note.save();
    req.flash('success_msg', 'Note updated successfully');
    res.redirect('/dashboard');
  } catch (err) {
    console.log(err);
    req.flash('error_msg', 'Error updating note');
    res.redirect('/dashboard');
  }
});

router.post('/notes/delete/:id', ensureAuthenticated, async (req, res) => {
  try {
    const note = await db.Note.findOne({ where: { id: req.params.id, userId: req.user.id } });
    if (!note) return res.status(404).send('Note not found');
    
    await note.destroy();
    req.flash('success_msg', 'Note deleted successfully');
    res.redirect('/dashboard');
  } catch (err) {
    console.log(err);
    req.flash('error_msg', 'Error deleting note');
    res.redirect('/dashboard');
  }
});


// ACL
function ensureAuthenticated(req, res, next) {
  if (req.isAuthenticated()) {
    return next();
  } else {
    res.redirect('/login');
  }
}

module.exports = router;
