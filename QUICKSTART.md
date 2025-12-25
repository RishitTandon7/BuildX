# BuildX - Quick Start Guide

Get your BuildX digital fabrication platform up and running in minutes!

## ⚡ Quick Setup (Without Database)

For testing and development, you can run BuildX without Supabase:

```bash
# 1. Install dependencies
npm install

# 2. Start the server
npm start

# 3. Open in browser
http://localhost:3000
```

**Note**: Without Supabase, orders are saved to local files and there's no authentication.

## 🚀 Full Setup (With Authentication & Database)

### Prerequisites
- Node.js installed
- Google account (for OAuth setup)
- Supabase account (free tier works great)

### Step 1: Install Dependencies
```bash
npm install
```

### Step 2: Set Up Supabase

1. Create account at [supabase.com](https://supabase.com)
2. Create a new project
3. Go to Settings → API and copy:
   - Project URL
   - anon public key
   - service_role key

### Step 3: Set Up Google OAuth

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project
3. Enable Google+ API
4. Create OAuth 2.0 credentials
5. Add authorized redirect URI: `http://localhost:3000/auth/google/callback`
6. Copy Client ID and Client Secret

### Step 4: Configure Environment

Create `.env` file in project root:

```env
# Supabase
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_KEY=your-service-key

# Google OAuth
GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-client-secret
GOOGLE_CALLBACK_URL=http://localhost:3000/auth/google/callback

# Session
SESSION_SECRET=generate-random-secret-here

# Admin Emails (comma-separated)
ADMIN_EMAILS=your-email@gmail.com

# Server
PORT=3000
```

### Step 5: Create Database Tables

1. Open Supabase dashboard
2. Go to SQL Editor
3. Run this SQL:

```sql
-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    google_id TEXT UNIQUE,
    email TEXT UNIQUE NOT NULL,
    name TEXT,
    picture TEXT,
    is_admin BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_login TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Orders table
CREATE TABLE orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id TEXT UNIQUE NOT NULL,
    user_id UUID REFERENCES users(id),
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

-- Indexes
CREATE INDEX idx_orders_order_id ON orders(order_id);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_created_at ON orders(created_at DESC);
```

### Step 6: Start the Server

```bash
npm start
```

You should see:
```
╔════════════════════════════════════════╗
║                                        ║
║         BuildX Server Running          ║
║                                        ║
╚════════════════════════════════════════╝

🚀 Server: http://localhost:3000
```

### Step 7: Test It Out

1. **Visit**: http://localhost:3000
2. **Login**: Click "Login with Google"
3. **Admin**: If your email is in ADMIN_EMAILS, visit http://localhost:3000/admin.html
4. **Order**: Go to Upload & Order page and submit a test order

## 🎯 What You Get

### Customer Experience
- ✅ Beautiful landing page with animations
- ✅ Service selection (3D Printing, CNC, Laser)
- ✅ File upload with 3D preview
- ✅ Real-time pricing calculator
- ✅ Configuration options
- ✅ Order submission
- ✅ Google login (optional)

### Admin Dashboard
- ✅ Order management
- ✅ Statistics overview
- ✅ Status updates
- ✅ File downloads
- ✅ Customer information
- ✅ Search and filters

## 🔧 Customization

### Change Company Name
Edit in HTML files:
- `public/index.html`
- `public/upload.html`
- `public/admin.html`

Replace "BuildX" with your company name.

### Change Colors
Edit `public/css/styles.css`:
```css
:root {
    --color-primary: hsl(220, 90%, 56%);  /* Main brand color */
    --color-accent: hsl(340, 82%, 52%);   /* Accent color */
}
```

### Adjust Pricing
Edit `public/js/upload.js`:
```javascript
const materials = {
    '3d-printing': [
        { id: 'pla', name: 'PLA', price: 0.05 },  // $/cm³
        // Add more materials
    ]
};
```

### Add Admin Emails
Update `.env`:
```env
ADMIN_EMAILS=admin1@company.com,admin2@company.com,admin3@company.com
```

## 📱 Features to Enable

### Email Notifications
1. Configure SMTP in `.env`
2. Uncomment email code in `server.js`
3. Customize email templates

### Payment Integration
1. Choose gateway (Razorpay/Stripe)
2. Add API keys to `.env`
3. Integrate in order submission flow

### WhatsApp Notifications
1. Get WhatsApp Business API access
2. Add credentials to `.env`
3. Send notifications on new orders

## 🐛 Troubleshooting

### Port Already in Use
```bash
PORT=3001 npm start
```

### Google OAuth Not Working
- Check redirect URI matches exactly
- Verify Client ID and Secret
- Enable Google+ API in console

### Admin Access Denied
- Verify email is in ADMIN_EMAILS
- Check for typos or extra spaces
- Login with the correct Google account

### Database Errors
- Verify Supabase credentials
- Check tables were created
- Review server logs

## 📚 Documentation

- **Full Setup**: See [SUPABASE_SETUP.md](./SUPABASE_SETUP.md)
- **Features**: See [README.md](./README.md)
- **API**: Check `server.js` for all endpoints

## 🎉 You're Ready!

Your BuildX platform is now running with:
- ✅ Google OAuth authentication
- ✅ Supabase database
- ✅ Admin access control
- ✅ File uploads
- ✅ 3D preview
- ✅ Real-time pricing
- ✅ Order management

Start accepting orders and growing your digital fabrication business! 🚀

## 💡 Next Steps

1. Customize branding and colors
2. Adjust pricing for your materials
3. Set up email notifications
4. Add payment gateway
5. Deploy to production
6. Market your services!

---

Need help? Check the documentation or create an issue on GitHub.
