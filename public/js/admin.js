// ===================================
// ADMIN DASHBOARD JAVASCRIPT
// ===================================

let allOrders = [];
let filteredOrders = [];

// ===================================
// LOAD ORDERS
// ===================================
async function loadOrders() {
    const loadingState = document.getElementById('loadingState');
    const emptyState = document.getElementById('emptyState');
    const ordersTable = document.getElementById('ordersTable');

    loadingState.classList.remove('hidden');
    emptyState.classList.add('hidden');
    ordersTable.classList.add('hidden');

    try {
        const response = await fetch('/api/orders');
        const data = await response.json();

        allOrders = data.orders || [];
        filteredOrders = [...allOrders];

        loadingState.classList.add('hidden');

        if (allOrders.length === 0) {
            emptyState.classList.remove('hidden');
        } else {
            ordersTable.classList.remove('hidden');
            renderOrders();
            updateStats();
        }
    } catch (error) {
        console.error('Error loading orders:', error);
        loadingState.classList.add('hidden');
        emptyState.classList.remove('hidden');
    }
}

// ===================================
// RENDER ORDERS
// ===================================
function renderOrders() {
    const tbody = document.getElementById('ordersTableBody');

    if (filteredOrders.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="8" style="text-align: center; padding: 2rem; color: var(--color-text-secondary);">
                    No orders found matching your criteria
                </td>
            </tr>
        `;
        return;
    }

    tbody.innerHTML = filteredOrders.map(order => {
        const date = new Date(order.createdAt);
        const formattedDate = date.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric'
        });

        const serviceNames = {
            '3d-printing': '3D Printing',
            'cnc-cutting': 'CNC Cutting',
            'laser-cutting': 'Laser Cutting'
        };

        return `
            <tr>
                <td><span class="order-id">${order.orderId}</span></td>
                <td>
                    <div class="customer-info">
                        <span class="customer-name">${order.customer.name}</span>
                        <span class="customer-email">${order.customer.email}</span>
                    </div>
                </td>
                <td><span class="service-badge">${serviceNames[order.service] || order.service}</span></td>
                <td><span class="file-name" title="${order.file.name}">${order.file.name}</span></td>
                <td><span class="amount">$${order.pricing.total.toFixed(2)}</span></td>
                <td><span class="status-badge ${order.status}">${formatStatus(order.status)}</span></td>
                <td><span class="order-date">${formattedDate}</span></td>
                <td>
                    <div class="table-actions">
                        <button class="action-btn" onclick="viewOrder('${order.orderId}')" title="View details">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                                <circle cx="12" cy="12" r="3"/>
                            </svg>
                        </button>
                        <button class="action-btn" onclick="downloadFile('${order.file.storedName}')" title="Download file">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                                <polyline points="7 10 12 15 17 10"/>
                                <line x1="12" y1="15" x2="12" y2="3"/>
                            </svg>
                        </button>
                    </div>
                </td>
            </tr>
        `;
    }).join('');
}

function formatStatus(status) {
    return status.split('-').map(word =>
        word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
}

// ===================================
// UPDATE STATS
// ===================================
function updateStats() {
    const totalOrders = allOrders.length;
    const totalRevenue = allOrders.reduce((sum, order) => sum + order.pricing.total, 0);
    const pendingOrders = allOrders.filter(o => o.status === 'pending').length;
    const inProductionOrders = allOrders.filter(o => o.status === 'in-production').length;

    document.getElementById('totalOrders').textContent = totalOrders;
    document.getElementById('totalRevenue').textContent = `$${totalRevenue.toFixed(2)}`;
    document.getElementById('pendingOrders').textContent = pendingOrders;
    document.getElementById('inProductionOrders').textContent = inProductionOrders;
}

// ===================================
// VIEW ORDER DETAILS
// ===================================
async function viewOrder(orderId) {
    try {
        const response = await fetch(`/api/orders/${orderId}`);
        const order = await response.json();

        const serviceNames = {
            '3d-printing': '3D Printing',
            'cnc-cutting': 'CNC Cutting',
            'laser-cutting': 'Laser Cutting'
        };

        const date = new Date(order.createdAt);
        const formattedDate = date.toLocaleDateString('en-US', {
            month: 'long',
            day: 'numeric',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });

        const detailContent = `
            <div class="detail-grid">
                <div class="detail-section">
                    <h3>Order Information</h3>
                    <div class="detail-row">
                        <span class="detail-label">Order ID:</span>
                        <span class="detail-value">${order.orderId}</span>
                    </div>
                    <div class="detail-row">
                        <span class="detail-label">Service:</span>
                        <span class="detail-value">${serviceNames[order.service]}</span>
                    </div>
                    <div class="detail-row">
                        <span class="detail-label">Status:</span>
                        <span class="status-badge ${order.status}">${formatStatus(order.status)}</span>
                    </div>
                    <div class="detail-row">
                        <span class="detail-label">Created:</span>
                        <span class="detail-value">${formattedDate}</span>
                    </div>
                </div>
                
                <div class="detail-section">
                    <h3>Customer Details</h3>
                    <div class="detail-row">
                        <span class="detail-label">Name:</span>
                        <span class="detail-value">${order.customer.name}</span>
                    </div>
                    <div class="detail-row">
                        <span class="detail-label">Email:</span>
                        <span class="detail-value">${order.customer.email}</span>
                    </div>
                    <div class="detail-row">
                        <span class="detail-label">Phone:</span>
                        <span class="detail-value">${order.customer.phone}</span>
                    </div>
                    ${order.customer.address ? `
                    <div class="detail-row">
                        <span class="detail-label">Address:</span>
                        <span class="detail-value">${order.customer.address}</span>
                    </div>
                    ` : ''}
                </div>
                
                <div class="detail-section">
                    <h3>File Details</h3>
                    <div class="detail-row">
                        <span class="detail-label">Filename:</span>
                        <span class="detail-value">${order.file.name}</span>
                    </div>
                    <div class="detail-row">
                        <span class="detail-label">Size:</span>
                        <span class="detail-value">${formatFileSize(order.file.size)}</span>
                    </div>
                    ${order.file.dimensions ? `
                    <div class="detail-row">
                        <span class="detail-label">Dimensions:</span>
                        <span class="detail-value">${order.file.dimensions.width} × ${order.file.dimensions.height} × ${order.file.dimensions.depth} mm</span>
                    </div>
                    ` : ''}
                    <div style="margin-top: 1rem;">
                        <a href="/api/files/${order.file.storedName}" class="download-btn" download>
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                                <polyline points="7 10 12 15 17 10"/>
                                <line x1="12" y1="15" x2="12" y2="3"/>
                            </svg>
                            Download File
                        </a>
                    </div>
                </div>
                
                <div class="detail-section">
                    <h3>Configuration</h3>
                    <div class="detail-row">
                        <span class="detail-label">Material:</span>
                        <span class="detail-value">${order.configuration.material.id.toUpperCase()}</span>
                    </div>
                    <div class="detail-row">
                        <span class="detail-label">Quantity:</span>
                        <span class="detail-value">${order.configuration.quantity}</span>
                    </div>
                    <div class="detail-row">
                        <span class="detail-label">Color:</span>
                        <span class="detail-value">${order.configuration.color}</span>
                    </div>
                    <div class="detail-row">
                        <span class="detail-label">Finish:</span>
                        <span class="detail-value">${order.configuration.finish}</span>
                    </div>
                    ${order.configuration.notes ? `
                    <div class="detail-row">
                        <span class="detail-label">Notes:</span>
                        <span class="detail-value">${order.configuration.notes}</span>
                    </div>
                    ` : ''}
                </div>
            </div>
            
            <div class="detail-section">
                <h3>Pricing Breakdown</h3>
                <div class="detail-row">
                    <span class="detail-label">Material Cost:</span>
                    <span class="detail-value">$${order.pricing.material.toFixed(2)}</span>
                </div>
                <div class="detail-row">
                    <span class="detail-label">Machine Time:</span>
                    <span class="detail-value">$${order.pricing.machine.toFixed(2)}</span>
                </div>
                <div class="detail-row">
                    <span class="detail-label">Finishing:</span>
                    <span class="detail-value">$${order.pricing.finishing.toFixed(2)}</span>
                </div>
                <div class="detail-row">
                    <span class="detail-label">Setup Fee:</span>
                    <span class="detail-value">$${order.pricing.setup.toFixed(2)}</span>
                </div>
                <div class="detail-row">
                    <span class="detail-label">Tax:</span>
                    <span class="detail-value">$${order.pricing.tax.toFixed(2)}</span>
                </div>
                <div class="detail-row" style="font-size: 1.125rem; font-weight: 700; padding-top: 1rem; border-top: 2px solid var(--color-border);">
                    <span class="detail-label">Total:</span>
                    <span class="detail-value" style="color: var(--color-primary);">$${order.pricing.total.toFixed(2)}</span>
                </div>
            </div>
            
            <div class="status-update-form">
                <h3>Update Order Status</h3>
                <div class="form-row">
                    <div class="form-group">
                        <label for="updateStatus">Status</label>
                        <select id="updateStatus" class="form-control">
                            <option value="pending" ${order.status === 'pending' ? 'selected' : ''}>Pending</option>
                            <option value="in-production" ${order.status === 'in-production' ? 'selected' : ''}>In Production</option>
                            <option value="completed" ${order.status === 'completed' ? 'selected' : ''}>Completed</option>
                            <option value="cancelled" ${order.status === 'cancelled' ? 'selected' : ''}>Cancelled</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label for="finalPrice">Final Price (optional)</label>
                        <input type="number" id="finalPrice" class="form-control" step="0.01" placeholder="${order.pricing.total.toFixed(2)}">
                    </div>
                </div>
                <div class="form-group">
                    <label for="adminNotes">Admin Notes</label>
                    <textarea id="adminNotes" class="form-control" rows="3" placeholder="Internal notes...">${order.adminNotes || ''}</textarea>
                </div>
                <button class="btn-primary" onclick="updateOrderStatus('${order.orderId}')">
                    <span>Update Order</span>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
                        <polyline points="22 4 12 14.01 9 11.01"/>
                    </svg>
                </button>
            </div>
        `;

        document.getElementById('orderDetailContent').innerHTML = detailContent;
        document.getElementById('orderModal').classList.remove('hidden');
    } catch (error) {
        console.error('Error loading order details:', error);
        alert('Failed to load order details');
    }
}

function closeOrderModal() {
    document.getElementById('orderModal').classList.add('hidden');
}

// ===================================
// UPDATE ORDER STATUS
// ===================================
async function updateOrderStatus(orderId) {
    const status = document.getElementById('updateStatus').value;
    const finalPrice = document.getElementById('finalPrice').value;
    const notes = document.getElementById('adminNotes').value;

    const updateData = { status };
    if (finalPrice) updateData.finalPrice = parseFloat(finalPrice);
    if (notes) updateData.notes = notes;

    try {
        const response = await fetch(`/api/orders/${orderId}`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(updateData)
        });

        if (response.ok) {
            alert('Order updated successfully!');
            closeOrderModal();
            loadOrders();
        } else {
            throw new Error('Update failed');
        }
    } catch (error) {
        console.error('Error updating order:', error);
        alert('Failed to update order');
    }
}

// ===================================
// DOWNLOAD FILE
// ===================================
function downloadFile(filename) {
    window.open(`/api/files/${filename}`, '_blank');
}

// ===================================
// SEARCH AND FILTER
// ===================================
document.getElementById('searchOrders')?.addEventListener('input', (e) => {
    const searchTerm = e.target.value.toLowerCase();
    filterOrders(searchTerm, document.getElementById('filterStatus').value);
});

document.getElementById('filterStatus')?.addEventListener('change', (e) => {
    const searchTerm = document.getElementById('searchOrders').value.toLowerCase();
    filterOrders(searchTerm, e.target.value);
});

function filterOrders(searchTerm, status) {
    filteredOrders = allOrders.filter(order => {
        const matchesSearch = !searchTerm ||
            order.orderId.toLowerCase().includes(searchTerm) ||
            order.customer.name.toLowerCase().includes(searchTerm) ||
            order.customer.email.toLowerCase().includes(searchTerm) ||
            order.file.name.toLowerCase().includes(searchTerm);

        const matchesStatus = status === 'all' || order.status === status;

        return matchesSearch && matchesStatus;
    });

    renderOrders();
}

// ===================================
// UTILITY FUNCTIONS
// ===================================
function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
}

// ===================================
// INITIALIZATION
// ===================================
document.addEventListener('DOMContentLoaded', () => {
    loadOrders();

    // Auto-refresh every 30 seconds
    setInterval(loadOrders, 30000);
});
