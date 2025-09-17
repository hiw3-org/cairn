const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const JwtStrategy = require('passport-jwt').Strategy;
const ExtractJwt = require('passport-jwt').ExtractJwt;
const User = require('../models/User');

// Local Strategy for username/password authentication
passport.use(new LocalStrategy(
  {
    usernameField: 'email', // Can be email or username
    passwordField: 'password'
  },
  async (email, password, done) => {
    try {
      // Find user by email or username
      const user = await User.findOne({
        $or: [
          { email: email.toLowerCase() },
          { username: email }
        ]
      }).select('+password');

      if (!user) {
        return done(null, false, { message: 'Invalid credentials' });
      }

      // Check if user is active
      if (!user.isActive) {
        return done(null, false, { message: 'Account is deactivated' });
      }

      // Verify password
      const isMatch = await user.correctPassword(password, user.password);
      if (!isMatch) {
        return done(null, false, { message: 'Invalid credentials' });
      }

      // Update last login
      user.lastLogin = new Date();
      await user.save();

      return done(null, user);
    } catch (error) {
      return done(error);
    }
  }
));

// JWT Strategy for token-based authentication
passport.use(new JwtStrategy(
  {
    jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
    secretOrKey: process.env.JWT_SECRET
  },
  async (payload, done) => {
    try {
      const user = await User.findById(payload.id);
      
      if (!user) {
        return done(null, false);
      }

      if (!user.isActive) {
        return done(null, false);
      }

      return done(null, user);
    } catch (error) {
      return done(error);
    }
  }
));

// Serialize user for session (optional)
passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id);
    done(null, user);
  } catch (error) {
    done(error);
  }
});

module.exports = passport;
