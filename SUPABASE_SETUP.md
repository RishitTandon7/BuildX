# Supabase Setup Guide for BuildX

This guide will help you set up Supabase for the BuildX platform with Google OAuth authentication and database storage.

## Step 1: Create a Supabase Project

1. Go to [https://supabase.com](https://supabase.com)
2. Sign up or log in
3. Click "New Project"
4. Fill in:
   - **Project Name**: BuildX
   - **Database Password**: (generate a strong password and save it)
   - **Region**: Choose closest to your users
5. Click "Create new project"
6. Wait for the project to be ready (1-2 minutes)

## Step 2: Get Your API Keys

1. In your Supabase project dashboard, go to **Settings** → **API**
2. Copy the following values:
   - **Project URL**: `https://your-project.supabase.co`
   - **anon public key**: Your public API key
   - **service_role key**: Your service role key (keep this secret!)

3. Update your `.env` file:
```env
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-public-key-here
SUPABASE_SERVICE_KEY=your-service-role-key-here
```

## Step 3: Create Database Tables

1. In Supabase dashboard, go to **SQL Editor**
2. Click "New Query"
3. Paste and run this SQL:

```sql
-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create users table
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    google_id TEXT UNIQUE,
    email TEXT UNIQUE NOT NULL,
    name TEXT,
    picture TEXT,
    is_admin BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_login TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create orders table
CREATE TABLE IF NOT EXISTS orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id TEXT UNIQUE NOT NULL,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    service TEXT NOT NULL,
    file_data JSONB NOT NULL,
    configuration JSONB NOT NULL,
    pricing JSONB NOT NULL,
    customer JSONB NOT NULL,
    status TEXT DEFAULT 'pending',
    admin_notes TEXT,
    final_price DECIMAL(10, 2),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_google_id ON users(google_id);
CREATE INDEX IF NOT EXISTS idx_orders_order_id ON orders(order_id);
CREATE INDEX IF NOT EXISTS idx_orders_user_id ON orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at DESC);

-- Enable Row Level Security (RLS)
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

-- Users can read their own data
CREATE POLICY "Users can view own profile"
    ON users FOR SELECT
    USING (auth.uid() = id);

-- Users can update their own data
CREATE POLICY "Users can update own profile"
    ON users FOR UPDATE
    USING (auth.uid() = id);

-- Anyone can create orders
CREATE POLICY "Anyone can create orders"
    ON orders FOR INSERT
    WITH CHECK (true);

-- Users can view their own orders
CREATE POLICY "Users can view own orders"
    ON orders FOR SELECT
    USING (user_id = auth.uid() OR user_id IS NULL);

-- Admins can view all orders
CREATE POLICY "Admins can view all orders"
    ON orders FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM users
            WHERE users.id = auth.uid()
            AND users.is_admin = true
        )
    );

-- Admins can update orders
CREATE POLICY "Admins can update orders"
    ON orders FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM users
            WHERE users.id = auth.uid()
            AND users.is_admin = true
        )
    );
```

## Step 4: Configure Google OAuth

### 4.1 Create Google OAuth Credentials

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing one
3. Go to **APIs & Services** → **Credentials**
4. Click **Create Credentials** → **OAuth client ID**
5. Configure OAuth consent screen if prompted:
   - User Type: External
   - App name: BuildX
   - User support email: your email
   - Developer contact: your email
6. For Application type, select **Web application**
7. Add authorized redirect URIs:
   - `http://localhost:3000/auth/google/callback` (for development)
   - `https://your-domain.com/auth/google/callback` (for production)
8. Click **Create**
9. Copy the **Client ID** and **Client Secret**

### 4.2 Update Environment Variables

Add to your `.env` file:
```env
GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-google-client-secret
GOOGLE_CALLBACK_URL=http://localhost:3000/auth/google/callback
```

## Step 5: Configure Admin Emails

In your `.env` file, add the emails that should have admin access:

```env
ADMIN_EMAILS=admin@buildx.com,owner@buildx.com,manager@buildx.com
```

**Important**: Only users with these email addresses will be able to access the admin dashboard.

## Step 6: Configure Supabase Storage (Optional)

For file uploads to Supabase Storage:

1. In Supabase dashboard, go to **Storage**
2. Click **Create a new bucket**
3. Name it `order-files`
4. Set it to **Private** (only authenticated users can access)
5. Click **Create bucket**

6. Set up storage policies:
```sql
-- Allow authenticated users to upload files
CREATE POLICY "Authenticated users can upload files"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'order-files');

-- Allow admins to view all files
CREATE POLICY "Admins can view all files"
ON storage.objects FOR SELECT
TO authenticated
USING (
    bucket_id = 'order-files' AND
    EXISTS (
        SELECT 1 FROM users
        WHERE users.id = auth.uid()
        AND users.is_admin = true
    )
);
```

## Step 7: Test the Setup

1. Start your server:
```bash
npm start
```

2. Visit `http://localhost:3000`
3. Click "Login with Google"
4. Authorize the application
5. Check if you're logged in
6. If your email is in ADMIN_EMAILS, you should be able to access `/admin.html`

## Step 8: Verify Database Connection

Check your server logs. You should see:
```
✅ Database setup complete
🚀 Server: http://localhost:3000
```

If you see errors, verify:
- Supabase URL and keys are correct
- Database tables were created successfully
- Google OAuth credentials are valid

## Troubleshooting

### "Not authenticated" error
- Make sure SESSION_SECRET is set in .env
- Check that cookies are enabled in your browser
- Verify Google OAuth callback URL matches exactly

### "Admin access required" error
- Verify your email is in the ADMIN_EMAILS list
- Make sure there are no extra spaces in the email list
- Check that is_admin is set to true in the users table

### Database connection errors
- Verify SUPABASE_URL and keys are correct
- Check Supabase project is active
- Ensure tables were created successfully

### Google OAuth errors
- Verify redirect URI is authorized in Google Console
- Check Client ID and Secret are correct
- Make sure OAuth consent screen is configured

## Production Deployment

For production:

1. Update `.env` with production values:
```env
NODE_ENV=production
SUPABASE_URL=https://your-production-project.supabase.co
GOOGLE_CALLBACK_URL=https://yourdomain.com/auth/google/callback
SESSION_SECRET=generate-a-strong-random-secret
```

2. Add production domain to Google OAuth authorized redirect URIs

3. Enable HTTPS (required for secure cookies)

4. Consider using Supabase Storage instead of local file storage

## Security Best Practices

1. **Never commit `.env` file** - It's in .gitignore
2. **Use strong SESSION_SECRET** - Generate with: `openssl rand -base64 32`
3. **Keep SUPABASE_SERVICE_KEY secret** - Never expose in frontend
4. **Regularly rotate API keys**
5. **Monitor admin access logs**
6. **Use HTTPS in production**
7. **Enable 2FA for admin accounts**

## Next Steps

- Set up email notifications using Supabase Edge Functions
- Add WhatsApp integration for order notifications
- Implement payment gateway (Razorpay/Stripe)
- Add file upload to Supabase Storage
- Set up automated backups
- Configure monitoring and alerts

## Support

For issues:
1. Check Supabase logs in dashboard
2. Review server console output
3. Verify all environment variables are set
4. Test database connection with SQL Editor

---

**Congratulations!** Your BuildX platform is now set up with Supabase and Google OAuth authentication! 🎉
