const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const User = require('../models/userModel'); 

passport.use(new GoogleStrategy({
    clientID: '945843840979-hg50keqtpolqt188tc3gvh5n69a6ko9h.apps.googleusercontent.com',
    clientSecret: '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',
    callbackURL: 'http://localhost:5000/api/requests/auth/google/callback',
  },
  async (accessToken, refreshToken, profile, done) => {
    try {
      let user = await User.findOne({ googleId: profile.id });

      if (!user) {
        user = new User({
          googleId: profile.id,
          email: profile.emails[0].value,
          name: profile.displayName
        });
        await user.save();
      }

      return done(null, user);
    } catch (error) {
      return done(error, null);
    }
  }
));

// لحفظ واسترجاع المستخدم في السيشن
/*passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
  const user = await User.findById(id);
  done(null, user);
});*/
