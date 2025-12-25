import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import { supabase, isAdmin } from './supabase.js';
import dotenv from 'dotenv';

dotenv.config();

// Only configure Google OAuth if credentials are provided
if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
    // Configure Google OAuth Strategy
    passport.use(new GoogleStrategy({
        clientID: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        callbackURL: process.env.GOOGLE_CALLBACK_URL || 'http://localhost:3000/auth/google/callback'
    }, async (accessToken, refreshToken, profile, done) => {
        try {
            const email = profile.emails[0].value;
            const userData = {
                google_id: profile.id,
                email: email,
                name: profile.displayName,
                picture: profile.photos[0]?.value,
                is_admin: isAdmin(email)
            };

            // If Supabase is not configured, just return user data
            if (!supabase) {
                return done(null, userData);
            }

            // Store or update user in Supabase
            const { data: existingUser, error: fetchError } = await supabase
                .from('users')
                .select('*')
                .eq('email', email)
                .single();

            if (existingUser) {
                // Update existing user
                const { data, error } = await supabase
                    .from('users')
                    .update({
                        name: userData.name,
                        picture: userData.picture,
                        is_admin: userData.is_admin,
                        last_login: new Date().toISOString()
                    })
                    .eq('email', email)
                    .select()
                    .single();

                return done(null, data || existingUser);
            } else {
                // Create new user
                const { data, error } = await supabase
                    .from('users')
                    .insert([{
                        ...userData,
                        created_at: new Date().toISOString(),
                        last_login: new Date().toISOString()
                    }])
                    .select()
                    .single();

                return done(null, data || userData);
            }
        } catch (error) {
            return done(error, null);
        }
    }));

    // Serialize user for session
    passport.serializeUser((user, done) => {
        done(null, user.email);
    });

    // Deserialize user from session
    passport.deserializeUser(async (email, done) => {
        try {
            const { data, error } = await supabase
                .from('users')
                .select('*')
                .eq('email', email)
                .single();

            if (error) throw error;
            done(null, data);
        } catch (error) {
            done(error, null);
        }
    });
} else {
    console.warn('⚠️  Google OAuth not configured. Authentication features disabled.');
}

// Middleware to check if user is authenticated
export function isAuthenticated(req, res, next) {
    if (req.isAuthenticated()) {
        return next();
    }
    res.status(401).json({ error: 'Not authenticated' });
}

// Middleware to check if user is admin
export function requireAdmin(req, res, next) {
    if (req.isAuthenticated() && req.user.is_admin) {
        return next();
    }
    res.status(403).json({ error: 'Admin access required' });
}

export default passport;
