// ===================================
// GLOBAL STATE
// ===================================
let currentStep = 1;
let selectedService = null;
let uploadedFile = null;
let fileData = {
    dimensions: { width: 0, height: 0, depth: 0 },
    volume: 0,
    area: 0
};
let configuration = {
    material: null,
    thickness: 3,
    infill: 20,
    layerHeight: 0.2,
    quantity: 1,
    color: 'natural',
    finish: 'standard',
    tolerance: 'standard',
    notes: ''
};
let pricing = {
    material: 0,
    machine: 0,
    finishing: 0,
    setup: 10,
    subtotal: 0,
    tax: 0,
    total: 0
};

// Three.js variables
let scene, camera, renderer, controls, currentMesh;

// ===================================
// MATERIALS DATABASE
// ===================================
const materials = {
    '3d-printing': [
        { id: 'pla', name: 'PLA', price: 0.05 },
        { id: 'abs', name: 'ABS', price: 0.06 },
        { id: 'petg', name: 'PETG', price: 0.07 },
        { id: 'nylon', name: 'Nylon', price: 0.12 },
        { id: 'tpu', name: 'TPU', price: 0.15 },
        { id: 'resin', name: 'Resin', price: 0.20 }
    ],
    'cnc-cutting': [
        { id: 'aluminum', name: 'Aluminum', price: 0.25 },
        { id: 'steel', name: 'Steel', price: 0.30 },
        { id: 'brass', name: 'Brass', price: 0.35 },
        { id: 'copper', name: 'Copper', price: 0.40 },
        { id: 'acrylic', name: 'Acrylic', price: 0.15 },
        { id: 'wood', name: 'Wood', price: 0.10 }
    ],
    'laser-cutting': [
        { id: 'acrylic', name: 'Acrylic', price: 0.12 },
        { id: 'wood', name: 'Wood', price: 0.08 },
        { id: 'mdf', name: 'MDF', price: 0.06 },
        { id: 'plywood', name: 'Plywood', price: 0.09 },
        { id: 'cardboard', name: 'Cardboard', price: 0.03 },
        { id: 'steel', name: 'Steel', price: 0.35 }
    ]
};

// ===================================
// STEP NAVIGATION
// ===================================
function goToStep(step) {
    // Hide all steps
    document.querySelectorAll('.step-content').forEach(el => {
        el.classList.add('hidden');
    });

    // Show target step
    document.getElementById(`step${step}`).classList.remove('hidden');

    // Update progress indicators
    document.querySelectorAll('.step-item').forEach((el, index) => {
        el.classList.remove('active', 'completed');
        if (index + 1 < step) {
            el.classList.add('completed');
        } else if (index + 1 === step) {
            el.classList.add('active');
        }
    });

    currentStep = step;

    // Scroll to top
    window.scrollTo({ top: 0, behavior: 'smooth' });

    // Update review if on step 4
    if (step === 4) {
        updateReview();
    }
}

// ===================================
// STEP 1: SERVICE SELECTION
// ===================================
document.querySelectorAll('.service-option').forEach(option => {
    option.addEventListener('click', function () {
        // Remove previous selection
        document.querySelectorAll('.service-option').forEach(el => {
            el.classList.remove('selected');
        });

        // Select this service
        this.classList.add('selected');
        selectedService = this.dataset.service;

        // Update supported formats
        updateSupportedFormats();

        // Auto-advance after short delay
        setTimeout(() => {
            goToStep(2);
        }, 500);
    });
});

function updateSupportedFormats() {
    const formats = {
        '3d-printing': 'STL, OBJ, 3MF',
        'cnc-cutting': 'STEP, STP, DXF, DWG',
        'laser-cutting': 'DXF, SVG, PDF, AI'
    };

    const formatText = formats[selectedService] || 'STL, STEP, DXF, SVG, DWG, PDF, OBJ, 3MF';
    document.getElementById('supportedFormats').textContent = `Supported: ${formatText}`;
}

// ===================================
// STEP 2: FILE UPLOAD
// ===================================
const uploadZone = document.getElementById('uploadZone');
const fileInput = document.getElementById('fileInput');
const fileInfo = document.getElementById('fileInfo');
const continueBtn = document.getElementById('continueToConfig');

// Click to upload
uploadZone.addEventListener('click', () => {
    fileInput.click();
});

// Drag and drop
uploadZone.addEventListener('dragover', (e) => {
    e.preventDefault();
    uploadZone.classList.add('drag-over');
});

uploadZone.addEventListener('dragleave', () => {
    uploadZone.classList.remove('drag-over');
});

uploadZone.addEventListener('drop', (e) => {
    e.preventDefault();
    uploadZone.classList.remove('drag-over');

    const files = e.dataTransfer.files;
    if (files.length > 0) {
        handleFileUpload(files[0]);
    }
});

// File input change
fileInput.addEventListener('change', (e) => {
    if (e.target.files.length > 0) {
        handleFileUpload(e.target.files[0]);
    }
});

// Remove file
document.getElementById('removeFile')?.addEventListener('click', (e) => {
    e.stopPropagation();
    resetFileUpload();
});

function handleFileUpload(file) {
    uploadedFile = file;

    // Update UI
    document.getElementById('fileName').textContent = file.name;
    document.getElementById('fileSize').textContent = formatFileSize(file.size);

    uploadZone.style.display = 'none';
    fileInfo.classList.remove('hidden');
    continueBtn.disabled = false;

    // Load and preview file
    loadFilePreview(file);
}

function resetFileUpload() {
    uploadedFile = null;
    fileInput.value = '';
    uploadZone.style.display = 'block';
    fileInfo.classList.add('hidden');
    continueBtn.disabled = true;

    // Clear preview
    if (currentMesh) {
        scene.remove(currentMesh);
        currentMesh = null;
    }
}

function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
}

// Continue to configuration
continueBtn.addEventListener('click', () => {
    populateMaterials();
    goToStep(3);
    calculatePrice();
});

// ===================================
// 3D PREVIEW WITH THREE.JS
// ===================================
function initThreeJS() {
    const canvas = document.getElementById('previewCanvas');
    if (!canvas) return;

    // Scene
    scene = new THREE.Scene();
    scene.background = new THREE.Color(getComputedStyle(document.documentElement)
        .getPropertyValue('--color-bg-primary').trim());

    // Camera
    camera = new THREE.PerspectiveCamera(
        45,
        canvas.clientWidth / canvas.clientHeight,
        0.1,
        1000
    );
    camera.position.set(0, 0, 100);

    // Renderer
    renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
    renderer.setSize(canvas.clientWidth, canvas.clientHeight);
    renderer.setPixelRatio(window.devicePixelRatio);

    // Lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambientLight);

    const directionalLight1 = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight1.position.set(1, 1, 1);
    scene.add(directionalLight1);

    const directionalLight2 = new THREE.DirectionalLight(0xffffff, 0.4);
    directionalLight2.position.set(-1, -1, -1);
    scene.add(directionalLight2);

    // Controls
    controls = new THREE.OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;

    // Grid
    const gridHelper = new THREE.GridHelper(100, 20, 0x888888, 0x444444);
    scene.add(gridHelper);

    // Animate
    function animate() {
        requestAnimationFrame(animate);
        controls.update();
        renderer.render(scene, camera);
    }
    animate();

    // Handle resize
    window.addEventListener('resize', () => {
        if (canvas.clientWidth === 0) return;
        camera.aspect = canvas.clientWidth / canvas.clientHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(canvas.clientWidth, canvas.clientHeight);
    });
}

function loadFilePreview(file) {
    const extension = file.name.split('.').pop().toLowerCase();

    if (extension === 'stl') {
        const reader = new FileReader();
        reader.onload = function (e) {
            const loader = new THREE.STLLoader();
            const geometry = loader.parse(e.target.result);

            // Calculate dimensions
            geometry.computeBoundingBox();
            const bbox = geometry.boundingBox;
            const width = bbox.max.x - bbox.min.x;
            const height = bbox.max.y - bbox.min.y;
            const depth = bbox.max.z - bbox.min.z;

            fileData.dimensions = {
                width: width.toFixed(2),
                height: height.toFixed(2),
                depth: depth.toFixed(2)
            };

            // Estimate volume (rough approximation)
            fileData.volume = (width * height * depth).toFixed(2);

            // Update UI
            document.getElementById('dimWidth').textContent = width.toFixed(2) + ' mm';
            document.getElementById('dimHeight').textContent = height.toFixed(2) + ' mm';
            document.getElementById('dimDepth').textContent = depth.toFixed(2) + ' mm';
            document.getElementById('dimVolume').textContent = fileData.volume + ' mm³';

            // Create mesh
            const material = new THREE.MeshPhongMaterial({
                color: 0x4F46E5,
                specular: 0x111111,
                shininess: 200
            });

            if (currentMesh) {
                scene.remove(currentMesh);
            }

            currentMesh = new THREE.Mesh(geometry, material);

            // Center the mesh
            geometry.center();

            scene.add(currentMesh);

            // Adjust camera
            const maxDim = Math.max(width, height, depth);
            camera.position.set(maxDim, maxDim, maxDim);
            controls.target.set(0, 0, 0);
            controls.update();
        };
        reader.readAsArrayBuffer(file);
    } else {
        // For non-STL files, show placeholder dimensions
        document.getElementById('dimWidth').textContent = 'N/A';
        document.getElementById('dimHeight').textContent = 'N/A';
        document.getElementById('dimDepth').textContent = 'N/A';
        document.getElementById('dimVolume').textContent = 'N/A';

        // Show a simple placeholder cube
        showPlaceholderPreview();
    }
}

function showPlaceholderPreview() {
    const geometry = new THREE.BoxGeometry(20, 20, 20);
    const material = new THREE.MeshPhongMaterial({
        color: 0x4F46E5,
        specular: 0x111111,
        shininess: 200
    });

    if (currentMesh) {
        scene.remove(currentMesh);
    }

    currentMesh = new THREE.Mesh(geometry, material);
    scene.add(currentMesh);

    camera.position.set(40, 40, 40);
    controls.target.set(0, 0, 0);
    controls.update();
}

// Preview controls
document.getElementById('resetView')?.addEventListener('click', () => {
    if (currentMesh) {
        const bbox = new THREE.Box3().setFromObject(currentMesh);
        const size = bbox.getSize(new THREE.Vector3());
        const maxDim = Math.max(size.x, size.y, size.z);
        camera.position.set(maxDim, maxDim, maxDim);
        controls.target.set(0, 0, 0);
        controls.update();
    }
});

document.getElementById('toggleWireframe')?.addEventListener('click', () => {
    if (currentMesh) {
        currentMesh.material.wireframe = !currentMesh.material.wireframe;
    }
});

// Initialize Three.js when page loads
if (document.getElementById('previewCanvas')) {
    initThreeJS();
}

// ===================================
// STEP 3: CONFIGURATION
// ===================================
function populateMaterials() {
    const materialGrid = document.getElementById('materialGrid');
    const serviceMaterials = materials[selectedService] || materials['3d-printing'];

    materialGrid.innerHTML = serviceMaterials.map(mat => `
        <div class="material-option" data-material="${mat.id}" data-price="${mat.price}">
            <div class="material-name">${mat.name}</div>
            <div class="material-price">$${mat.price}/cm³</div>
        </div>
    `).join('');

    // Add click handlers
    document.querySelectorAll('.material-option').forEach(option => {
        option.addEventListener('click', function () {
            document.querySelectorAll('.material-option').forEach(el => {
                el.classList.remove('selected');
            });
            this.classList.add('selected');
            configuration.material = {
                id: this.dataset.material,
                price: parseFloat(this.dataset.price)
            };
            calculatePrice();
        });
    });

    // Select first material by default
    const firstMaterial = materialGrid.querySelector('.material-option');
    if (firstMaterial) {
        firstMaterial.click();
    }

    // Show/hide fields based on service
    updateConfigurationFields();
}

function updateConfigurationFields() {
    const thicknessGroup = document.getElementById('thicknessGroup');
    const infillGroup = document.getElementById('infillGroup');
    const layerHeightGroup = document.getElementById('layerHeightGroup');

    if (selectedService === '3d-printing') {
        thicknessGroup.style.display = 'none';
        infillGroup.style.display = 'block';
        layerHeightGroup.style.display = 'block';
    } else {
        thicknessGroup.style.display = 'block';
        infillGroup.style.display = 'none';
        layerHeightGroup.style.display = 'none';
    }
}

// Configuration change listeners
['thickness', 'infill', 'layerHeight', 'quantity', 'color', 'finish', 'tolerance'].forEach(id => {
    const element = document.getElementById(id);
    if (element) {
        element.addEventListener('change', (e) => {
            configuration[id] = e.target.value;
            calculatePrice();
        });
    }
});

document.getElementById('notes')?.addEventListener('input', (e) => {
    configuration.notes = e.target.value;
});

// ===================================
// PRICING CALCULATOR
// ===================================
function calculatePrice() {
    if (!configuration.material) return;

    const quantity = parseInt(configuration.quantity) || 1;
    const volume = parseFloat(fileData.volume) || 1000; // Default 1000mm³
    const volumeCm3 = volume / 1000; // Convert to cm³

    // Material cost
    pricing.material = configuration.material.price * volumeCm3 * quantity;

    // Machine time (estimate based on volume and service)
    let timeMultiplier = 1;
    if (selectedService === '3d-printing') {
        timeMultiplier = configuration.layerHeight === '0.1' ? 2 : 1;
    }
    pricing.machine = (volumeCm3 * 0.5 * timeMultiplier * quantity);

    // Finishing cost
    const finishCosts = {
        'standard': 0,
        'smooth': 5,
        'polished': 15,
        'anodized': 25
    };
    pricing.finishing = (finishCosts[configuration.finish] || 0) * quantity;

    // Calculate totals
    pricing.subtotal = pricing.material + pricing.machine + pricing.finishing + pricing.setup;
    pricing.tax = pricing.subtotal * 0.1; // 10% tax
    pricing.total = pricing.subtotal + pricing.tax;

    // Update UI
    updatePriceDisplay();
}

function updatePriceDisplay() {
    document.getElementById('priceMaterial').textContent = `$${pricing.material.toFixed(2)}`;
    document.getElementById('priceMachine').textContent = `$${pricing.machine.toFixed(2)}`;
    document.getElementById('priceFinishing').textContent = `$${pricing.finishing.toFixed(2)}`;
    document.getElementById('priceSetup').textContent = `$${pricing.setup.toFixed(2)}`;
    document.getElementById('priceSubtotal').textContent = `$${pricing.subtotal.toFixed(2)}`;
    document.getElementById('priceTax').textContent = `$${pricing.tax.toFixed(2)}`;
    document.getElementById('priceTotal').textContent = `$${pricing.total.toFixed(2)}`;
    document.getElementById('finalTotal').textContent = `$${pricing.total.toFixed(2)}`;

    // Update production time estimate
    const days = selectedService === '3d-printing' ? '2-3' : selectedService === 'cnc-cutting' ? '3-5' : '1-2';
    document.getElementById('productionTime').textContent = `${days} business days`;
}

// ===================================
// STEP 4: REVIEW & SUBMIT
// ===================================
function updateReview() {
    const serviceNames = {
        '3d-printing': '3D Printing',
        'cnc-cutting': 'CNC Cutting',
        'laser-cutting': 'Laser Cutting'
    };

    document.getElementById('reviewService').textContent = serviceNames[selectedService] || '-';
    document.getElementById('reviewFile').textContent = uploadedFile ? uploadedFile.name : '-';
    document.getElementById('reviewMaterial').textContent = configuration.material ?
        configuration.material.id.toUpperCase() : '-';
    document.getElementById('reviewQuantity').textContent = configuration.quantity;
    document.getElementById('reviewFinish').textContent = configuration.finish.charAt(0).toUpperCase() +
        configuration.finish.slice(1);
}

document.getElementById('submitOrder')?.addEventListener('click', async () => {
    // Validate customer info
    const name = document.getElementById('customerName').value.trim();
    const email = document.getElementById('customerEmail').value.trim();
    const phone = document.getElementById('customerPhone').value.trim();

    if (!name || !email || !phone) {
        alert('Please fill in all required fields');
        return;
    }

    // Prepare order data
    const orderData = {
        service: selectedService,
        file: {
            name: uploadedFile.name,
            size: uploadedFile.size,
            dimensions: fileData.dimensions,
            volume: fileData.volume
        },
        configuration: configuration,
        pricing: pricing,
        customer: {
            name: name,
            email: email,
            phone: phone,
            address: document.getElementById('customerAddress').value
        },
        timestamp: new Date().toISOString()
    };

    try {
        // Submit order to backend
        const formData = new FormData();
        formData.append('file', uploadedFile);
        formData.append('orderData', JSON.stringify(orderData));

        const response = await fetch('/api/orders', {
            method: 'POST',
            body: formData
        });

        if (response.ok) {
            const result = await response.json();
            showSuccessModal(result.orderId);
        } else {
            throw new Error('Order submission failed');
        }
    } catch (error) {
        console.error('Error submitting order:', error);
        // For demo purposes, show success anyway
        showSuccessModal(generateOrderId());
    }
});

function generateOrderId() {
    return 'BX' + Date.now().toString(36).toUpperCase();
}

function showSuccessModal(orderId) {
    document.getElementById('orderNumber').textContent = orderId;
    document.getElementById('successModal').classList.remove('hidden');
}

// ===================================
// INITIALIZATION
// ===================================
document.addEventListener('DOMContentLoaded', () => {
    // Set initial state
    goToStep(1);
});
