const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const User = require('../models/userModel');
require('dotenv').config();

passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: process.env.GOOGLE_CALLBACK_URL,
  },
  async (accessToken, refreshToken, profile, done) => {
    try {
      const email = profile.emails[0].value;
      let user = await User.findOne({ email });

      if (user) {
        if (!user.googleId) {
          user.googleId = profile.id;
          await user.save();
        }
      } else {
        const [firstname, ...lastnameParts] = profile.displayName.split(" ");
        const lastname = lastnameParts.join(" ");
        
        user = new User({
          googleId: profile.id,
          email,
          firstname: firstname || "First",
          lastname: lastname || "Last",
          image: profile.photos?.[0]?.value || "", 
        });
        await user.save();
      }

      return done(null, user);
    } catch (error) {
      return done(error, null);
    }
  }
));