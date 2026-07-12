// ============================================================
// routes/auth.js
// Google OAuth Login (opsional) + endpoint identitas user.
// ============================================================

const express = require('express');
const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const { config } = require('../config/env');
const createLogger = require('../utils/logger');

const router = express.Router();
const logger = createLogger('auth');

passport.serializeUser((user, done) => done(null, user));
passport.deserializeUser((obj, done) => done(null, obj));

if (config.oauthEnabled) {
  passport.use(new GoogleStrategy({
    clientID: config.GOOGLE_CLIENT_ID,
    clientSecret: config.GOOGLE_CLIENT_SECRET,
    callbackURL: '/auth/google/callback'
  }, (accessToken, refreshToken, profile, done) => {
    const user = {
      id: profile.id,
      name: profile.displayName,
      email: profile.emails[0].value,
      photo: profile.photos[0].value
    };
    return done(null, user);
  }));

  router.get('/auth/google', passport.authenticate('google', { scope: ['profile', 'email'] }));

  router.get('/auth/google/callback',
    passport.authenticate('google', { failureRedirect: '/' }),
    (req, res) => res.redirect('/')
  );
} else {
  logger.warn('Google OAuth belum dikonfigurasi (GOOGLE_CLIENT_ID/SECRET/SESSION_SECRET kosong) — login Google dinonaktifkan sementara.');
  router.get('/auth/google', (req, res) => {
    res.status(503).json({ error: 'Login Google belum diaktifkan di server ini.' });
  });
}

router.get('/auth/logout', (req, res) => {
  req.logout(() => res.redirect('/'));
});

router.get('/api/me', (req, res) => {
  res.json({ loggedIn: !!req.user, user: req.user || null });
});

module.exports = router;
