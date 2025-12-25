# BuildX - Premium Digital Fabrication Platform

A modern, premium web platform for digital fabrication services including CNC cutting, laser cutting, and 3D printing. Upload designs, get instant pricing, and order with confidence.

## 🚀 Features

### Customer Features
- **Google OAuth Login**: Secure authentication with Google accounts
- **Multi-Service Support**: 3D Printing, CNC Cutting, and Laser Cutting
- **File Upload & Preview**: Support for STL, STEP, DXF, SVG, DWG, PDF, OBJ, 3MF
- **Interactive 3D Preview**: Rotate, zoom, and inspect your designs in real-time
- **Instant Pricing**: Real-time cost estimation based on material, volume, and specifications
- **Configuration Options**: Material selection, finish, color, tolerances, and more
- **Order Tracking**: View your order history (when logged in)
- **Responsive Design**: Works perfectly on desktop, tablet, and mobile
- **Light/Dark Mode**: Beautiful themes for any preference

### Admin Features
- **Email-Based Access Control**: Only specified emails can access admin panel
- **Order Management**: View all orders with filtering and search
- **Order Details**: Complete order information with customer details
- **Status Updates**: Update order status and add admin notes
- **File Downloads**: Download customer design files
- **Statistics Dashboard**: Track orders, revenue, and production status
- **Supabase Integration**: Cloud database with real-time updates

### Technical Features
- **Google OAuth 2.0**: Secure authentication flow
- **Supabase Database**: Scalable PostgreSQL database
- **Session Management**: Secure user sessions
- **File System Fallback**: Works without database for development
- **Admin Email Whitelist**: Configurable admin access control

## 📋 Requirements

- Node.js (v14 or higher)
- npm or yarn

## 🛠️ Installation

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Configure Environment Variables**
   
   Copy `.env.example` to `.env` and fill in your values:
   ```bash
   cp .env.example .env
   ```
   
   Required variables:
   - `SUPABASE_URL` - Your Supabase project URL
   - `SUPABASE_ANON_KEY` - Supabase anonymous key
   - `SUPABASE_SERVICE_KEY` - Supabase service role key
   - `GOOGLE_CLIENT_ID` - Google OAuth client ID
   - `GOOGLE_CLIENT_SECRET` - Google OAuth client secret
   - `SESSION_SECRET` - Random secret for sessions
   - `ADMIN_EMAILS` - Comma-separated list of admin emails

3. **Set Up Supabase**
   
   Follow the detailed guide in [SUPABASE_SETUP.md](./SUPABASE_SETUP.md) to:
   - Create a Supabase project
   - Set up database tables
   - Configure Google OAuth
   - Set admin emails

4. **Start the Server**
   ```bash
   npm start
   ```

5. **Access the Application**
   - Main Site: http://localhost:3000
   - Upload & Order: http://localhost:3000/upload.html
   - Admin Dashboard: http://localhost:3000/admin.html (requires admin email)

## 🔐 Authentication

The platform uses Google OAuth for authentication:

1. **Login**: Click "Login with Google" on any page
2. **Admin Access**: Only emails listed in `ADMIN_EMAILS` can access `/admin.html`
3. **Order Tracking**: Logged-in users can view their order history
4. **Session Duration**: 24 hours (configurable)

**Note**: The platform works without authentication for basic ordering, but login is required for order tracking and admin access.

## 📁 Project Structure

```
BuildX/
├── public/
│   ├── index.html          # Landing page
│   ├── upload.html         # Upload & order page
│   ├── admin.html          # Admin dashboard
│   ├── css/
│   │   ├── styles.css      # Main styles
│   │   ├── upload.css      # Upload page styles
│   │   └── admin.css       # Admin styles
│   └── js/
│       ├── main.js         # Main JavaScript
│       ├── upload.js       # Upload functionality
│       └── admin.js        # Admin functionality
├── server.js               # Express backend
├── uploads/                # Uploaded files (auto-created)
├── orders/                 # Order data (auto-created)
└── package.json
```

## 🎨 Customization

### Branding
The platform name "BuildX" can be easily customized:
1. Update the logo text in HTML files
2. Modify the `--color-primary` and `--color-accent` CSS variables in `styles.css`
3. Update the page titles and meta descriptions

### Pricing
Modify the pricing calculator in `public/js/upload.js`:
- Material costs: Update the `materials` object
- Machine time multiplier: Adjust in `calculatePrice()` function
- Setup fees and tax rates: Modify in the pricing calculation

### Services
Add or remove services by:
1. Updating the service options in `upload.html`
2. Adding materials to the `materials` object in `upload.js`
3. Updating service names throughout the application

## 🔧 Configuration

### File Upload Limits
Edit `server.js` to change upload limits:
```javascript
limits: {
    fileSize: 50 * 1024 * 1024 // 50MB default
}
```

### Supported File Types
Add or remove file types in `server.js`:
```javascript
const allowedExtensions = ['.stl', '.step', '.stp', '.dxf', '.svg', '.dwg', '.pdf', '.obj', '.3mf'];
```

## 📧 Email Notifications (To Implement)

To add email notifications:
1. Install nodemailer (already in dependencies)
2. Configure SMTP settings in `.env` file
3. Uncomment email sending code in `server.js`

Example `.env`:
```
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
ADMIN_EMAIL=admin@buildx.com
```

## 💳 Payment Integration (To Implement)

The platform is ready for payment gateway integration:
- Razorpay
- Stripe
- PayPal

Add payment processing in the order submission flow after price approval.

## 🗄️ Database Integration (Optional)

Currently uses file-based storage. To integrate a database:
1. Install MongoDB/PostgreSQL client
2. Replace file operations in `server.js` with database queries
3. Create appropriate schemas/models

## 🚀 Deployment

### Production Build
1. Set environment variables
2. Configure reverse proxy (nginx/Apache)
3. Use PM2 for process management:
   ```bash
   npm install -g pm2
   pm2 start server.js --name buildx
   ```

### Environment Variables
Create a `.env` file:
```
PORT=3000
NODE_ENV=production
```

## 📱 WhatsApp Integration (Optional)

To add WhatsApp notifications:
1. Use WhatsApp Business API
2. Or integrate with services like Twilio
3. Send notifications on new orders

## 🎯 Features to Add

- [ ] User authentication and accounts
- [ ] Order tracking for customers
- [ ] Payment gateway integration
- [ ] Email notifications
- [ ] WhatsApp notifications
- [ ] Advanced 3D preview with measurements
- [ ] Multi-file upload
- [ ] Batch ordering
- [ ] Quote system
- [ ] Customer reviews
- [ ] Material library with photos

## 🐛 Troubleshooting

### Port Already in Use
Change the port in `server.js` or set PORT environment variable:
```bash
PORT=3001 npm start
```

### File Upload Fails
Check:
- File size is under limit
- File extension is supported
- Uploads directory has write permissions

### 3D Preview Not Working
Ensure Three.js CDN is accessible. Check browser console for errors.

## 📄 License

MIT License - Feel free to use for commercial projects

## 🤝 Support

For issues or questions, please create an issue in the repository.

---

Built with ❤️ for makers, engineers, and businesses
