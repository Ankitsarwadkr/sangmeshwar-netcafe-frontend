const API_BASE_URL = 'https://api.sangameshwarnetcafe.in/api';
let currentEditingServiceId = null;
let currentEnquiryId = null;
let enquiriesData = []; 


// ==================== AUTH ====================
function checkAuth() {
    const token = localStorage.getItem('token');
    if (!token) {
        window.location.href = '/admin-login.html';
        return false;
    }
    return token;
}

function logout() {
    localStorage.removeItem('token');
    window.location.href = '/admin-login.html';
}

// ==================== TOAST ====================
function showToast(message, type = 'success') {
    const container = document.getElementById('toastContainer');
    const toast = document.createElement('div');
    
    const icons = {
        success: `<svg class="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"/></svg>`,
        error: `<svg class="w-5 h-5 text-red-500" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd"/></svg>`,
        info: `<svg class="w-5 h-5 text-blue-500" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clip-rule="evenodd"/></svg>`
    };

    toast.className = 'bg-white rounded-xl shadow-2xl p-4 flex items-start gap-3 min-w-[300px] border-l-4 ' + 
        (type === 'error' ? 'border-red-500' : type === 'success' ? 'border-green-500' : 'border-blue-500');
    toast.style.animation = 'slideIn 0.3s ease';
    
    toast.innerHTML = `
        ${icons[type] || icons.info}
        <div class="flex-1">
            <p class="font-semibold text-gray-900">${type === 'error' ? 'Error' : type === 'success' ? 'Success' : 'Info'}</p>
            <p class="text-sm text-gray-600">${message}</p>
        </div>
        <button onclick="this.parentElement.remove()" class="text-gray-400 hover:text-gray-600">
            <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd"/></svg>
        </button>
    `;
    
    container.appendChild(toast);
    
    setTimeout(() => {
        toast.style.animation = 'slideIn 0.3s ease reverse';
        setTimeout(() => toast.remove(), 300);
    }, 4000);
}

// ==================== TAB SWITCHING ====================
function switchTab(tab) {
    const servicesTab = document.getElementById('servicesTab');
    const enquiriesTab = document.getElementById('enquiriesTab');
    const servicesContent = document.getElementById('servicesContent');
    const enquiriesContent = document.getElementById('enquiriesContent');
    
    if (tab === 'services') {
        servicesTab.classList.add('active');
        enquiriesTab.classList.remove('active');
        servicesContent.classList.remove('hidden');
        enquiriesContent.classList.add('hidden');
        fetchServices();
    } else {
        enquiriesTab.classList.add('active');
        servicesTab.classList.remove('active');
        enquiriesContent.classList.remove('hidden');
        servicesContent.classList.add('hidden');
        fetchEnquiries();
    }
}

// ==================== SERVICES ====================
async function fetchServices() {
    const token = checkAuth();
    if (!token) return;

    document.getElementById('servicesLoading').classList.remove('hidden');
    document.getElementById('servicesGrid').classList.add('hidden');
    document.getElementById('servicesEmpty').classList.add('hidden');

    try {
        const response = await fetch(`${API_BASE_URL}/admin/services`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (response.status === 401) {
            logout();
            return;
        }

        if (response.ok) {
            const services = await response.json();
            displayServices(services);
        }
    } catch (error) {
        console.error('Error:', error);
        showToast('Failed to fetch services', 'error');
    } finally {
        document.getElementById('servicesLoading').classList.add('hidden');
    }
}

function displayServices(services) {
    const grid = document.getElementById('servicesGrid');
    const empty = document.getElementById('servicesEmpty');

    if (services.length === 0) {
        empty.classList.remove('hidden');
        return;
    }

    grid.classList.remove('hidden');
    grid.innerHTML = services.map(service => `
        <div class="card-hover glass-effect rounded-lg overflow-hidden">
            ${service.imageUrl ? `
                <img 
  src="${service.imageUrl.startsWith('http') 
      ? service.imageUrl 
      : `${API_BASE_URL.replace('/api', '')}/${service.imageUrl.replace(/^\/+/, '')}`}" 
  alt="${service.titleEn}" 
  class="w-full h-44 object-cover rounded-t-lg"
/>

            ` : `
                <div class="w-full h-44 bg-gradient-to-br from-indigo-400 to-indigo-600 flex items-center justify-center">
                    <svg class="w-12 h-12 text-white opacity-60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
                    </svg>
                </div>
            `}
            <div class="p-5">
                <div class="flex items-start justify-between mb-2">
                    <h3 class="text-lg font-bold text-gray-900 flex items-center gap-1.5">
                        ${service.titleEn}
                        ${service.isFeatured ? `
                            <svg class="w-4 h-4 text-yellow-500 fill-current" viewBox="0 0 20 20">
                                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>
                            </svg>
                        ` : ''}
                    </h3>
                    <span class="px-2.5 py-1 text-xs font-semibold rounded-full ${service.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}">
                        ${service.isActive ? 'Active' : 'Inactive'}
                    </span>
                </div>
                ${service.titleMr ? `<p class="text-sm text-gray-500 mb-2">${service.titleMr}</p>` : ''}
                
                <p class="text-gray-600 text-sm mb-3 line-clamp-2">${service.descriptionEn}</p>
                
                <div class="flex gap-2 mb-4">
                    <span class="px-2.5 py-1 text-xs bg-indigo-50 text-indigo-700 rounded-md font-medium">${service.categoryEn}</span>
                    ${service.categoryMr ? `<span class="px-2.5 py-1 text-xs bg-orange-50 text-orange-700 rounded-md font-medium">${service.categoryMr}</span>` : ''}
                </div>

                <div class="flex gap-2">
                    <button onclick="editService(${service.id})" class="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-lg hover:border-indigo-500 hover:bg-indigo-50 transition-all font-medium flex items-center justify-center gap-1.5">
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path>
                        </svg>
                        Edit
                    </button>
                    <button onclick="deleteService(${service.id})" class="px-3 py-2 text-sm bg-red-500 text-white rounded-lg hover:bg-red-600 transition-all font-medium flex items-center justify-center gap-1.5">
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
                        </svg>
                        Delete
                    </button>
                </div>
            </div>
        </div>
    `).join('');
}

function openServiceModal(service = null) {
    currentEditingServiceId = service ? service.id : null;
    
    if (service) {
        document.getElementById('serviceModalTitle').textContent = 'Edit Service';
        document.getElementById('serviceModalDesc').textContent = 'Update service details';
        document.getElementById('serviceSubmitText').textContent = 'Update Service';
        
        document.getElementById('serviceId').value = service.id;
        document.getElementById('titleEn').value = service.titleEn || '';
        document.getElementById('titleMr').value = service.titleMr || '';
        document.getElementById('descriptionEn').value = service.descriptionEn || '';
        document.getElementById('descriptionMr').value = service.descriptionMr || '';
        document.getElementById('categoryEn').value = service.categoryEn || '';
        document.getElementById('categoryMr').value = service.categoryMr || '';
        document.getElementById('isActive').checked = service.isActive ?? true;
        document.getElementById('isFeatured').checked = service.isFeatured ?? false;
        
        if (service.imageUrl) {
            document.getElementById('previewImg').src = `${API_BASE_URL.replace('/api', '')}/uploads/${service.imageUrl}`;
            document.getElementById('imagePreview').classList.remove('hidden');
        }
    } else {
        document.getElementById('serviceModalTitle').textContent = 'Create New Service';
        document.getElementById('serviceModalDesc').textContent = 'Fill in the details';
        document.getElementById('serviceSubmitText').textContent = 'Create Service';
        document.getElementById('serviceForm').reset();
        document.getElementById('imagePreview').classList.add('hidden');
        document.getElementById('isActive').checked = true;
    }
    
    document.getElementById('serviceModal').classList.add('active');
}

function closeServiceModal() {
    document.getElementById('serviceModal').classList.remove('active');
    currentEditingServiceId = null;
    document.getElementById('serviceForm').reset();
    document.getElementById('imagePreview').classList.add('hidden');
}

function handleImageChange(input) {
    const file = input.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = (e) => {
            document.getElementById('previewImg').src = e.target.result;
            document.getElementById('imagePreview').classList.remove('hidden');
        };
        reader.readAsDataURL(file);
    }
}

function removeImage() {
    document.getElementById('imageFile').value = '';
    document.getElementById('imagePreview').classList.add('hidden');
}

async function editService(id) {
    const token = checkAuth();
    if (!token) return;

    try {
        const response = await fetch(`${API_BASE_URL}/admin/services/${id}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (response.ok) {
            const service = await response.json();
            openServiceModal(service);
        }
    } catch (error) {
        showToast('Failed to load service', 'error');
    }
}

async function deleteService(id) {
    if (!confirm('Are you sure you want to delete this service?')) return;

    const token = checkAuth();
    if (!token) return;

    try {
        const response = await fetch(`${API_BASE_URL}/admin/services/${id}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (response.ok) {
            showToast('Service deleted successfully', 'success');
            fetchServices();
        }
    } catch (error) {
        showToast('Failed to delete service', 'error');
    }
}

document.getElementById('serviceForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const token = checkAuth();
    if (!token) return;

    const btn = document.getElementById('serviceSubmitBtn');
    const text = document.getElementById('serviceSubmitText');
    const spinner = document.getElementById('serviceSubmitSpinner');

    btn.disabled = true;
    text.textContent = currentEditingServiceId ? 'Updating...' : 'Creating...';
    spinner.classList.remove('hidden');

    try {
        const formData = new FormData();
        formData.append('titleEn', document.getElementById('titleEn').value);
        formData.append('titleMr', document.getElementById('titleMr').value);
        formData.append('descriptionEn', document.getElementById('descriptionEn').value);
        formData.append('descriptionMr', document.getElementById('descriptionMr').value);
        formData.append('categoryEn', document.getElementById('categoryEn').value);
        formData.append('categoryMr', document.getElementById('categoryMr').value);
        formData.append('isActive', document.getElementById('isActive').checked);
        formData.append('isFeatured', document.getElementById('isFeatured').checked);

        const fileInput = document.getElementById('imageFile');
        if (fileInput.files[0]) {
            formData.append('file', fileInput.files[0]);
        }

        const url = currentEditingServiceId 
            ? `${API_BASE_URL}/admin/services/${currentEditingServiceId}`
            : `${API_BASE_URL}/admin/services`;
        
        const response = await fetch(url, {
            method: currentEditingServiceId ? 'PUT' : 'POST',
            headers: { 'Authorization': `Bearer ${token}` },
            body: formData
        });

        if (response.ok) {
            showToast(`Service ${currentEditingServiceId ? 'updated' : 'created'} successfully`, 'success');
            closeServiceModal();
            fetchServices();
        }
    } catch (error) {
        showToast('Failed to save service', 'error');
    } finally {
        btn.disabled = false;
        text.textContent = currentEditingServiceId ? 'Update Service' : 'Create Service';
        spinner.classList.add('hidden');
    }
});

// ==================== ENQUIRIES ====================
async function fetchEnquiries() {
    const token = checkAuth();
    if (!token) return;

    document.getElementById('enquiriesLoading').classList.remove('hidden');
    document.getElementById('enquiriesGrid').classList.add('hidden');
    document.getElementById('enquiriesEmpty').classList.add('hidden');

    try {
        const response = await fetch(`${API_BASE_URL}/admin/enquires`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (response.status === 401) {
            logout();
            return;
        }

        if (response.ok) {
            const enquiries = await response.json();
            enquiriesData = enquiries;
            displayEnquiries(enquiries);
            updateEnquiryBadge(enquiries);
        }
    } catch (error) {
        console.error('Error:', error);
        showToast('Failed to fetch enquiries', 'error');
    } finally {
        document.getElementById('enquiriesLoading').classList.add('hidden');
    }
}

function updateEnquiryBadge(enquiries) {
    const badge = document.getElementById('enquiryBadge');
    const newCount = enquiries.filter(e => e.status === 'NEW').length;
    
    if (newCount > 0) {
        badge.textContent = newCount;
        badge.classList.remove('hidden');
    } else {
        badge.classList.add('hidden');
    }
}

function displayEnquiries(enquiries) {
    const grid = document.getElementById('enquiriesGrid');
    const empty = document.getElementById('enquiriesEmpty');

    if (enquiries.length === 0) {
        empty.classList.remove('hidden');
        return;
    }

    grid.classList.remove('hidden');
    grid.innerHTML = enquiries.map(enquiry => {
        const statusClass = enquiry.status === 'NEW' ? 'badge-new' : 
                           enquiry.status === 'IN_PROGRESS' ? 'badge-in-progress' : 'badge-resolved';
        const statusText = enquiry.status === 'NEW' ? 'New' : 
                          enquiry.status === 'IN_PROGRESS' ? 'In Progress' : 'Resolved';
        
        return `
            <div class="card-hover glass-effect rounded-lg p-5">
                <div class="flex justify-between items-start mb-3">
                    <div class="flex-1">
                        <div class="flex items-center gap-3 mb-2">
                            <div class="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-400 to-indigo-600 flex items-center justify-center text-white font-bold">
                                ${enquiry.name.charAt(0).toUpperCase()}
                            </div>
                            <div>
                                <h3 class="text-base font-bold text-gray-900">${enquiry.name}</h3>
                                ${enquiry.email ? `<p class="text-sm text-gray-600">${enquiry.email}</p>` : `<p class="text-sm text-gray-600 text-gray-400">Not provided</p>`}
                            </div>
                        </div>
                             ${enquiry.phone ? `
                            <p class="text-sm text-gray-600 flex items-center gap-2 ml-13">
                                <svg class="w-4 h-4" ...></svg>
                                ${enquiry.phone}
                            </p>
                        ` : `<p class="text-sm text-gray-600 text-gray-400 ml-13">Not provided</p>`}

                    </div>
                    <span class="${statusClass} px-3 py-1.5 text-xs font-bold rounded-full">
                        ${statusText}
                    </span>
                </div>

                ${enquiry.service ? `
                    <div class="mb-3 flex items-center gap-2 text-sm text-gray-700">
                        <svg class="w-4 h-4 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path>
                        </svg>
                        <span class="font-medium">Service:</span> ${enquiry.service}
                    </div>
                ` : ''}

                <div class="mb-3 p-3 bg-gray-50 rounded-lg border border-gray-200">
                    <p class="text-sm text-gray-700 line-clamp-2">${enquiry.message}</p>
                </div>

                <div class="flex items-center justify-between text-xs text-gray-500 mb-3">
                    <span class="flex items-center gap-1">
                        <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
                        </svg>
                       <p class="text-sm text-gray-500">
  ${enquiry.createdAt ? formatDate(enquiry.createdAt) : 'Date not available'}

</p>

                    </span>
                </div>

                <div class="flex gap-2">
                    <button onclick="viewEnquiry(${enquiry.id})" class="flex-1 gradient-btn px-3 py-2 text-white rounded-lg font-medium shadow-sm flex items-center justify-center gap-1.5 text-sm">
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path>
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path>
                        </svg>
                        View
                    </button>
                    <button onclick="deleteEnquiry(${enquiry.id})" class="px-3 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-all font-medium flex items-center justify-center gap-1.5 text-sm">
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
                        </svg>
                    </button>
                </div>
            </div>
        `;
    }).join('');
}

async function viewEnquiry(id) {
    const token = checkAuth();
    if (!token) return;

    try {
        const response = await fetch(`${API_BASE_URL}/admin/enquires/${id}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (response.ok) {
            const enquiry = await response.json();
            currentEnquiryId = id;
            showEnquiryModal(enquiry);
        }
    } catch (error) {
        showToast('Failed to load enquiry', 'error');
    }
}

function showEnquiryModal(enquiry) {
    const details = document.getElementById('enquiryDetails');
    
    const statusClass = enquiry.status === 'NEW' ? 'badge-new' : 
                       enquiry.status === 'IN_PROGRESS' ? 'badge-in-progress' : 'badge-resolved';
    const statusText = enquiry.status === 'NEW' ? 'New' : 
                      enquiry.status === 'IN_PROGRESS' ? 'In Progress' : 'Resolved';
    
    details.innerHTML = `
        <div class="flex items-center gap-3 p-4 bg-indigo-50 rounded-lg border border-indigo-200">
            <div class="w-12 h-12 rounded-full bg-gradient-to-br from-indigo-400 to-indigo-600 flex items-center justify-center text-white font-bold text-lg">
                ${enquiry.name.charAt(0).toUpperCase()}
            </div>
            <div class="flex-1">
                <h3 class="text-lg font-bold text-gray-900">${enquiry.name}</h3>
               <p class="text-sm text-gray-600">${enquiry.email || 'Not provided'}</p>
${enquiry.phone ? `<p class="text-sm text-gray-600">${enquiry.phone}</p>` : `<p class="text-sm text-gray-600">Not provided</p>`}

            </div>
            <span class="${statusClass} px-3 py-1.5 text-xs font-bold rounded-full">
                ${statusText}
            </span>
        </div>

        ${enquiry.service ? `
            <div class="p-3 bg-gray-50 rounded-lg border border-gray-200">
                <label class="text-xs font-semibold text-gray-700 block mb-1">Service Requested</label>
                <p class="text-sm text-gray-900">${enquiry.service}</p>
            </div>
        ` : ''}

        <div class="p-3 bg-gray-50 rounded-lg border border-gray-200">
            <label class="text-xs font-semibold text-gray-700 block mb-2">Message</label>
            <p class="text-sm text-gray-900 whitespace-pre-wrap leading-relaxed">${enquiry.message}</p>
        </div>

        <div class="grid grid-cols-2 gap-3">
            <div class="p-3 bg-gray-50 rounded-lg border border-gray-200">
                <label class="text-xs font-semibold text-gray-700 block mb-1">Submitted On</label>
               <p class="text-sm text-gray-600">
   ${enquiry.createdAt ? formatDate(enquiry.createdAt) : 'N/A'}

</p>


            </div>
            <div class="p-3 bg-gray-50 rounded-lg border border-gray-200">
                <label class="text-xs font-semibold text-gray-700 block mb-1">Enquiry ID</label>
                <p class="text-sm text-gray-900">${enquiry.id}</p>
            </div>
        </div>
    `;
    
    document.getElementById('enquiryStatus').value = enquiry.status;
    document.getElementById('enquiryModal').classList.add('active');
}

function closeEnquiryModal() {
    document.getElementById('enquiryModal').classList.remove('active');
    currentEnquiryId = null;
}

function formatDate(dateStr) {
    const date = new Date(dateStr);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = String(date.getFullYear()).slice(-2);

    let hours = date.getHours();
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12;
    hours = hours ? hours : 12; // the hour '0' should be '12'
    hours = String(hours).padStart(2, '0');

    return `${day}-${month}-${year} ${hours}:${minutes} ${ampm}`;
}


async function updateEnquiryStatus() {
    if (!currentEnquiryId) return;
    
    const token = checkAuth();
    if (!token) return;

    const btn = document.getElementById('updateStatusBtn');
    const text = document.getElementById('updateStatusText');
    const spinner = document.getElementById('updateStatusSpinner');

    btn.disabled = true;
    text.textContent = 'Updating...';
    spinner.classList.remove('hidden');

    try {
        const status = document.getElementById('enquiryStatus').value;
        
        const response = await fetch(`${API_BASE_URL}/admin/enquires/${currentEnquiryId}`, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ status })
        });

        if (response.ok) {
            showToast('Status updated successfully', 'success');
            closeEnquiryModal();
            fetchEnquiries();
        }
    } catch (error) {
        showToast('Failed to update status', 'error');
    } finally {
        btn.disabled = false;
        text.textContent = 'Update Status';
        spinner.classList.add('hidden');
    }
}

async function deleteEnquiry(id) {
    if (!confirm('Are you sure you want to delete this enquiry?')) return;

    const token = checkAuth();
    if (!token) return;

    try {
        const response = await fetch(`${API_BASE_URL}/admin/enquires/${id}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (response.ok) {
            showToast('Enquiry deleted successfully', 'success');
            fetchEnquiries();
        }
    } catch (error) {
        showToast('Failed to delete enquiry', 'error');
    }
}

// Close modals on outside click
document.getElementById('serviceModal').addEventListener('click', (e) => {
    if (e.target.id === 'serviceModal') closeServiceModal();
});

document.getElementById('enquiryModal').addEventListener('click', (e) => {
    if (e.target.id === 'enquiryModal') closeEnquiryModal();
});

// Initialize
checkAuth();
fetchServices();
fetchEnquiries();
// ====== Enquiry Status Filter ======
document.getElementById("statusFilter").addEventListener("change", () => {
    const selected = document.getElementById("statusFilter").value;
    let filtered = enquiriesData; // use global copy
    if (selected) {
        filtered = filtered.filter(e => e.status === selected);
    }
    displayEnquiries(filtered);
}
);
