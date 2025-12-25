import express from 'express';
import multer from 'multer';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import session from 'express-session';
import dotenv from 'dotenv';
import passport from './config/auth.js';
import { isAuthenticated, requireAdmin } from './config/auth.js';
import {
    supabase,
    createOrder,
    getOrders,
    getOrder,
    updateOrder,
    setupDatabase
} from './config/supabase.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// Setup database tables (run once)
setupDatabase().catch(console.error);

// Middleware
app.use(cors({
    origin: process.env.NODE_ENV === 'production'
        ? process.env.FRONTEND_URL
        : 'http://localhost:3000',
    credentials: true
}));
app.use(express.json());
app.use(express.static('public'));

// Session configuration
app.use(session({
    secret: process.env.SESSION_SECRET || 'your-secret-key-change-this',
    resave: false,
    saveUninitialized: false,
    cookie: {
        secure: process.env.NODE_ENV === 'production',
        maxAge: 24 * 60 * 60 * 1000 // 24 hours
    }
}));

// Initialize Passport
app.use(passport.initialize());
app.use(passport.session());

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
}

// Create orders directory if it doesn't exist
const ordersDir = path.join(__dirname, 'orders');
if (!fs.existsSync(ordersDir)) {
    fs.mkdirSync(ordersDir, { recursive: true });
}

// Configure multer for file uploads
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, uploadsDir);
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + '-' + file.originalname);
    }
});

const upload = multer({
    storage: storage,
    limits: {
        fileSize: 50 * 1024 * 1024 // 50MB limit
    },
    fileFilter: function (req, file, cb) {
        const allowedExtensions = ['.stl', '.step', '.stp', '.dxf', '.svg', '.dwg', '.pdf', '.obj', '.3mf'];
        const ext = path.extname(file.originalname).toLowerCase();

        if (allowedExtensions.includes(ext)) {
            cb(null, true);
        } else {
            cb(new Error('Invalid file type. Supported formats: ' + allowedExtensions.join(', ')));
        }
    }
});

// ===================================
// AUTHENTICATION ROUTES
// ===================================

// Google OAuth login
app.get('/auth/google',
    passport.authenticate('google', { scope: ['profile', 'email'] })
);

// Google OAuth callback
app.get('/auth/google/callback',
    passport.authenticate('google', { failureRedirect: '/login-failed.html' }),
    (req, res) => {
        // Successful authentication
        if (req.user.is_admin) {
            res.redirect('/admin.html');
        } else {
            res.redirect('/');
        }
    }
);

// Logout
app.get('/auth/logout', (req, res) => {
    req.logout((err) => {
        if (err) {
            return res.status(500).json({ error: 'Logout failed' });
        }
        res.redirect('/');
    });
});

// Get current user
app.get('/api/auth/user', (req, res) => {
    if (req.isAuthenticated()) {
        res.json({
            user: {
                email: req.user.email,
                name: req.user.name,
                picture: req.user.picture,
                isAdmin: req.user.is_admin
            }
        });
    } else {
        res.json({ user: null });
    }
});

// Check admin status
app.get('/api/auth/is-admin', (req, res) => {
    res.json({
        isAdmin: req.isAuthenticated() && req.user.is_admin
    });
});

// ===================================
// API ROUTES
// ===================================

// Health check
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Submit order
app.post('/api/orders', upload.single('file'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No file uploaded' });
        }

        const orderData = JSON.parse(req.body.orderData);

        // Generate order ID
        const orderId = 'BX' + Date.now().toString(36).toUpperCase();

        // Create order object
        const order = {
            order_id: orderId,
            user_id: req.isAuthenticated() ? req.user.id : null,
            service: orderData.service,
            file_data: {
                ...orderData.file,
                path: req.file.path,
                storedName: req.file.filename
            },
            configuration: orderData.configuration,
            pricing: orderData.pricing,
            customer: orderData.customer,
            status: 'pending',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
        };

        // Try to save to Supabase, fallback to file system
        try {
            if (process.env.SUPABASE_URL) {
                await createOrder(order);
                console.log(`✅ Order saved to Supabase: ${orderId}`);
            } else {
                throw new Error('Supabase not configured');
            }
        } catch (dbError) {
            // Fallback to file system
            const orderFilePath = path.join(ordersDir, `${orderId}.json`);
            fs.writeFileSync(orderFilePath, JSON.stringify(order, null, 2));
            console.log(`📁 Order saved to file system: ${orderId}`);
        }

        console.log(`New order received: ${orderId}`);
        console.log(`Customer: ${order.customer.name} (${order.customer.email})`);
        console.log(`Service: ${order.service}`);
        console.log(`Total: $${order.pricing.total.toFixed(2)}`);

        res.json({
            success: true,
            orderId: orderId,
            message: 'Order submitted successfully'
        });

    } catch (error) {
        console.error('Error processing order:', error);
        res.status(500).json({
            error: 'Failed to process order',
            message: error.message
        });
    }
});

// Get all orders (for admin only)
app.get('/api/orders', requireAdmin, async (req, res) => {
    try {
        let orders = [];

        // Try Supabase first
        if (process.env.SUPABASE_URL) {
            try {
                orders = await getOrders();
            } catch (dbError) {
                console.log('Falling back to file system');
                // Fallback to file system
                const orderFiles = fs.readdirSync(ordersDir).filter(f => f.endsWith('.json'));
                orders = orderFiles.map(file => {
                    const orderData = fs.readFileSync(path.join(ordersDir, file), 'utf8');
                    return JSON.parse(orderData);
                });
            }
        } else {
            // Use file system
            const orderFiles = fs.readdirSync(ordersDir).filter(f => f.endsWith('.json'));
            orders = orderFiles.map(file => {
                const orderData = fs.readFileSync(path.join(ordersDir, file), 'utf8');
                return JSON.parse(orderData);
            });
        }

        // Sort by creation date (newest first)
        orders.sort((a, b) => new Date(b.created_at || b.createdAt) - new Date(a.created_at || a.createdAt));

        res.json({ orders });
    } catch (error) {
        console.error('Error fetching orders:', error);
        res.status(500).json({ error: 'Failed to fetch orders' });
    }
});

// Get single order
app.get('/api/orders/:orderId', (req, res) => {
    try {
        const orderFilePath = path.join(ordersDir, `${req.params.orderId}.json`);

        if (!fs.existsSync(orderFilePath)) {
            return res.status(404).json({ error: 'Order not found' });
        }

        const orderData = fs.readFileSync(orderFilePath, 'utf8');
        res.json(JSON.parse(orderData));
    } catch (error) {
        console.error('Error fetching order:', error);
        res.status(500).json({ error: 'Failed to fetch order' });
    }
});

// Update order status (for admin only)
app.patch('/api/orders/:orderId', requireAdmin, express.json(), async (req, res) => {
    try {
        const updates = {};
        if (req.body.status) updates.status = req.body.status;
        if (req.body.finalPrice) updates.final_price = req.body.finalPrice;
        if (req.body.notes) updates.admin_notes = req.body.notes;

        let orderData;

        // Try Supabase first
        if (process.env.SUPABASE_URL) {
            try {
                orderData = await updateOrder(req.params.orderId, updates);
            } catch (dbError) {
                // Fallback to file system
                const orderFilePath = path.join(ordersDir, `${req.params.orderId}.json`);

                if (!fs.existsSync(orderFilePath)) {
                    return res.status(404).json({ error: 'Order not found' });
                }

                orderData = JSON.parse(fs.readFileSync(orderFilePath, 'utf8'));

                if (req.body.status) orderData.status = req.body.status;
                if (req.body.finalPrice) orderData.finalPrice = req.body.finalPrice;
                if (req.body.notes) orderData.adminNotes = req.body.notes;
                orderData.updatedAt = new Date().toISOString();

                fs.writeFileSync(orderFilePath, JSON.stringify(orderData, null, 2));
            }
        } else {
            // Use file system
            const orderFilePath = path.join(ordersDir, `${req.params.orderId}.json`);

            if (!fs.existsSync(orderFilePath)) {
                return res.status(404).json({ error: 'Order not found' });
            }

            orderData = JSON.parse(fs.readFileSync(orderFilePath, 'utf8'));

            if (req.body.status) orderData.status = req.body.status;
            if (req.body.finalPrice) orderData.finalPrice = req.body.finalPrice;
            if (req.body.notes) orderData.adminNotes = req.body.notes;
            orderData.updatedAt = new Date().toISOString();

            fs.writeFileSync(orderFilePath, JSON.stringify(orderData, null, 2));
        }

        res.json({ success: true, order: orderData });
    } catch (error) {
        console.error('Error updating order:', error);
        res.status(500).json({ error: 'Failed to update order' });
    }
});

// Download uploaded file (for admin)
app.get('/api/files/:filename', (req, res) => {
    try {
        const filePath = path.join(uploadsDir, req.params.filename);

        if (!fs.existsSync(filePath)) {
            return res.status(404).json({ error: 'File not found' });
        }

        res.download(filePath);
    } catch (error) {
        console.error('Error downloading file:', error);
        res.status(500).json({ error: 'Failed to download file' });
    }
});

// Contact form submission
app.post('/api/contact', express.json(), (req, res) => {
    try {
        const { name, email, subject, message } = req.body;

        if (!name || !email || !message) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        // In a real application, send email or save to database
        console.log('Contact form submission:');
        console.log(`Name: ${name}`);
        console.log(`Email: ${email}`);
        console.log(`Subject: ${subject}`);
        console.log(`Message: ${message}`);

        res.json({ success: true, message: 'Message sent successfully' });
    } catch (error) {
        console.error('Error processing contact form:', error);
        res.status(500).json({ error: 'Failed to send message' });
    }
});

// ===================================
// SERVE STATIC PAGES
// ===================================
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// ===================================
// ERROR HANDLING
// ===================================
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({
        error: 'Something went wrong!',
        message: err.message
    });
});

// ===================================
// START SERVER
// ===================================
app.listen(PORT, () => {
    console.log('');
    console.log('╔════════════════════════════════════════╗');
    console.log('║                                        ║');
    console.log('║         BuildX Server Running          ║');
    console.log('║                                        ║');
    console.log('╚════════════════════════════════════════╝');
    console.log('');
    console.log(`🚀 Server: http://localhost:${PORT}`);
    console.log(`📁 Uploads: ${uploadsDir}`);
    console.log(`📋 Orders: ${ordersDir}`);
    console.log('');
    console.log('Press Ctrl+C to stop the server');
    console.log('');
});

export default app;
