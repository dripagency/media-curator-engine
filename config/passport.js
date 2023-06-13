const LocalStrategy = require('passport-local').Strategy;
const bcrypt = require('bcryptjs');
const db = require('../models');

module.exports = function(passport) {
 passport.use(
  new LocalStrategy({ usernameField: 'username' }, (username, password, done) => {
    // Match user
    db.User.findOne({ where: { username: username } })
      .then(user => {
        if (!user) {
          console.log('User not found');  // Debug line
          return done(null, false, { message: 'That username is not registered' });
        }

        // Match password
        bcrypt.compare(password, user.password, (err, isMatch) => {
          if (err) throw err;
          if (isMatch) {
            console.log('Password matches');  // Debug line
            return done(null, user);
          } else {
            console.log('Password does not match');  // Debug line
            return done(null, false, { message: 'Password incorrect' });
          }
        });
      })
      .catch(err => console.log(err));
  })
);


  passport.serializeUser((user, done) => {
    done(null, user.id);
  });

passport.deserializeUser((id, done) => {
  db.User.findByPk(id)
    .then(user => {
      done(null, user);
    })
    .catch(err => done(err));
});

};
