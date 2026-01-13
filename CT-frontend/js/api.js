/**
 * SkyHR API 클라이언트
 * 백엔드 API와 통신하는 모듈
 */

const API_BASE_URL = '/api';

// 토큰 관리
const TokenManager = {
    getToken() {
        return localStorage.getItem('skyhr_token');
    },
    
    setToken(token) {
        localStorage.setItem('skyhr_token', token);
    },
    
    removeToken() {
        localStorage.removeItem('skyhr_token');
    },
    
    getUserInfo() {
        const info = localStorage.getItem('skyhr_user');
        return info ? JSON.parse(info) : null;
    },
    
    setUserInfo(user) {
        localStorage.setItem('skyhr_user', JSON.stringify(user));
    },
    
    removeUserInfo() {
        localStorage.removeItem('skyhr_user');
    },
    
    isLoggedIn() {
        return !!this.getToken();
    },
    
    logout() {
        this.removeToken();
        this.removeUserInfo();
        window.location.href = 'login.html';
    }
};

// API 요청 헬퍼
async function apiRequest(endpoint, options = {}) {
    const url = `${API_BASE_URL}${endpoint}`;
    const token = TokenManager.getToken();
    
    const config = {
        headers: {
            'Content-Type': 'application/json',
            ...(token && { 'Authorization': `Bearer ${token}` })
        },
        ...options
    };
    
    try {
        const response = await fetch(url, config);
        
        // 401 Unauthorized - 로그인 페이지로 리다이렉트
        if (response.status === 401) {
            TokenManager.logout();
            return;
        }
        
        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.message || '요청 처리 중 오류가 발생했습니다.');
        }
        
        return data;
    } catch (error) {
        console.error('API Error:', error);
        throw error;
    }
}

// ===== Auth API =====
const AuthAPI = {
    async login(employeeNumber, password, rememberMe = false) {
        const data = await apiRequest('/auth/login', {
            method: 'POST',
            body: JSON.stringify({ employeeNumber, password, rememberMe })
        });
        
        if (data.token) {
            TokenManager.setToken(data.token);
            TokenManager.setUserInfo({
                employeeNumber: data.employeeNumber,
                name: data.name,
                department: data.department,
                position: data.position,
                role: data.role
            });
        }
        
        return data;
    },
    
    async logout() {
        try {
            await apiRequest('/auth/logout', { method: 'POST' });
        } finally {
            TokenManager.logout();
        }
    },
    
    async getCurrentUser() {
        return await apiRequest('/auth/me');
    }
};

// ===== Dashboard API =====
const DashboardAPI = {
    async getDashboard() {
        return await apiRequest('/dashboard');
    }
};

// ===== Employee API =====
const EmployeeAPI = {
    async getAll(page = 0, size = 20, keyword = '', departmentId = null) {
        let url = `/employees?page=${page}&size=${size}`;
        if (keyword) url += `&keyword=${encodeURIComponent(keyword)}`;
        if (departmentId) url += `&departmentId=${departmentId}`;
        return await apiRequest(url);
    },
    
    async getById(id) {
        return await apiRequest(`/employees/${id}`);
    },
    
    async getMyInfo() {
        return await apiRequest('/employees/me');
    },
    
    async update(id, data) {
        return await apiRequest(`/employees/${id}`, {
            method: 'PUT',
            body: JSON.stringify(data)
        });
    }
};

// ===== Attendance API =====
const AttendanceAPI = {
    async getToday() {
        return await apiRequest('/attendance/today');
    },
    
    async checkIn() {
        return await apiRequest('/attendance/check-in', { method: 'POST' });
    },
    
    async checkOut() {
        return await apiRequest('/attendance/check-out', { method: 'POST' });
    },
    
    async getList(page = 0, size = 20) {
        return await apiRequest(`/attendance?page=${page}&size=${size}`);
    },
    
    async getCalendar(startDate, endDate) {
        return await apiRequest(`/attendance/calendar?startDate=${startDate}&endDate=${endDate}`);
    },
    
    async getMonthlyStats() {
        return await apiRequest('/attendance/stats/monthly');
    }
};

// ===== Leave API =====
const LeaveAPI = {
    async create(data) {
        return await apiRequest('/leaves', {
            method: 'POST',
            body: JSON.stringify(data)
        });
    },
    
    async getMyRequests(page = 0, size = 10) {
        return await apiRequest(`/leaves/my?page=${page}&size=${size}`);
    },
    
    async getMyPending() {
        return await apiRequest('/leaves/my/pending');
    },
    
    async cancel(id) {
        return await apiRequest(`/leaves/${id}`, { method: 'DELETE' });
    },
    
    // 관리자용
    async getPending(page = 0, size = 10) {
        return await apiRequest(`/leaves/pending?page=${page}&size=${size}`);
    },
    
    async approve(id) {
        return await apiRequest(`/leaves/${id}/approve`, { method: 'POST' });
    },
    
    async reject(id, reason) {
        return await apiRequest(`/leaves/${id}/reject`, {
            method: 'POST',
            body: JSON.stringify({ reason })
        });
    }
};

// ===== Health API =====
const HealthAPI = {
    async getLatest() {
        return await apiRequest('/health/latest');
    },
    
    async getRecords(page = 0, size = 10) {
        return await apiRequest(`/health?page=${page}&size=${size}`);
    },
    
    async getTrend(days = 7) {
        return await apiRequest(`/health/trend?days=${days}`);
    },
    
    async saveSurvey(data) {
        return await apiRequest('/health/survey', {
            method: 'POST',
            body: JSON.stringify(data)
        });
    }
};

// 페이지 로드 시 로그인 체크
function checkAuth() {
    const publicPages = ['login.html'];
    const currentPage = window.location.pathname.split('/').pop() || 'index.html';
    
    if (!publicPages.includes(currentPage) && !TokenManager.isLoggedIn()) {
        window.location.href = 'login.html';
    }
}

// DOM 로드 시 실행
document.addEventListener('DOMContentLoaded', checkAuth);
