/**
 * Passport Configuration
 * Google OAuth 2.0 strategy setup
 */

import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import User from "../models/User.js";

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: process.env.GOOGLE_CALLBACK_URL || `${process.env.BACKEND_URL || "http://localhost:5002"}/api/auth/google/callback`,
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        // Check if user already exists
        let user = await User.findOne({ googleId: profile.id });

        if (user) {
          // User exists, return user
          return done(null, user);
        } else {
          // Create new user
          user = new User({
            googleId: profile.id,
            email: profile.emails[0].value,
            name: profile.displayName,
            picture: profile.photos[0]?.value,
            scanLimits: {
              quickScansUsed: 0,
              fullScansUsed: 0,
              quickScansLimit: 3,
              fullScansLimit: 2,
            },
          });

          await user.save();
          return done(null, user);
        }
      } catch (error) {
        console.error("Passport strategy error:", error);
        return done(error, null);
      }
    }
  )
);

// Serialize user for session
passport.serializeUser((user, done) => {
  done(null, user._id);
});

// Deserialize user from session
passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id);
    done(null, user);
  } catch (error) {
    done(error, null);
  }
});

export default passport;

