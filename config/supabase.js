import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

// Initialize Supabase client
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.warn('⚠️  Supabase credentials not configured. Using file-based storage.');
}

// Only create clients if credentials are provided
export const supabase = (supabaseUrl && supabaseKey)
    ? createClient(supabaseUrl, supabaseKey)
    : null;

export const supabaseAdmin = (supabaseUrl && supabaseServiceKey)
    ? createClient(supabaseUrl, supabaseServiceKey)
    : null;

// Admin email whitelist
export const adminEmails = (process.env.ADMIN_EMAILS || '')
    .split(',')
    .map(email => email.trim().toLowerCase())
    .filter(email => email.length > 0);

// Check if user is admin
export function isAdmin(email) {
    if (!email) return false;
    return adminEmails.includes(email.toLowerCase());
}

// Database schema setup (run this once)
export async function setupDatabase() {
    try {
        // Create orders table
        const { error: ordersError } = await supabaseAdmin.rpc('create_orders_table', {
            sql: `
                CREATE TABLE IF NOT EXISTS orders (
                    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
                    order_id TEXT UNIQUE NOT NULL,
                    user_id UUID REFERENCES auth.users(id),
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
                
                CREATE INDEX IF NOT EXISTS idx_orders_order_id ON orders(order_id);
                CREATE INDEX IF NOT EXISTS idx_orders_user_id ON orders(user_id);
                CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
                CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at DESC);
            `
        });

        if (ordersError) {
            console.log('Note: Database tables may already exist or need manual setup');
        }

        console.log('✅ Database setup complete');
    } catch (error) {
        console.log('ℹ️  Database setup: Please create tables manually in Supabase dashboard');
    }
}

// Order operations
export async function createOrder(orderData) {
    const { data, error } = await supabase
        .from('orders')
        .insert([orderData])
        .select()
        .single();

    if (error) throw error;
    return data;
}

export async function getOrders(filters = {}) {
    let query = supabase
        .from('orders')
        .select('*')
        .order('created_at', { ascending: false });

    if (filters.status) {
        query = query.eq('status', filters.status);
    }

    if (filters.userId) {
        query = query.eq('user_id', filters.userId);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data;
}

export async function getOrder(orderId) {
    const { data, error } = await supabase
        .from('orders')
        .select('*')
        .eq('order_id', orderId)
        .single();

    if (error) throw error;
    return data;
}

export async function updateOrder(orderId, updates) {
    const { data, error } = await supabase
        .from('orders')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('order_id', orderId)
        .select()
        .single();

    if (error) throw error;
    return data;
}

export default {
    supabase,
    supabaseAdmin,
    isAdmin,
    adminEmails,
    setupDatabase,
    createOrder,
    getOrders,
    getOrder,
    updateOrder
};
