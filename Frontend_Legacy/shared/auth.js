/**
 * ConEco Shared Auth Helper
 * 
 * Since the frontend (port 5500) and backend (port 8000) are on different origins,
 * browsers block cookies (SameSite policy). We use localStorage tokens + 
 * Authorization: Bearer header instead. (Legacy Comment)
 * 
 * UPDATE: Both run on localhost:8000 now. We use secure HttpOnly cookies.
 * The token is handled automatically by the browser.
 */

const API_BASE = 'http://localhost:8000/api';

/**
 * Make an authenticated fetch request to the ConEco API.
 * The browser automatically attaches the HttpOnly 'session_token' cookie.
 */
function authFetch(url, options = {}) {
    const headers = {
        'Content-Type': 'application/json',
        ...(options.headers || {})
    };
    return fetch(url, {
        ...options,
        headers,
        credentials: 'include'  // Ensures cookies are sent!
    });
}

/**
 * Check if user is logged in and optionally verify role.
 * Redirects to login if not authenticated.
 */
function requireLogin(requiredRole = null) {
    const isLoggedIn = localStorage.getItem('is_logged_in');
    const role = localStorage.getItem('user_role');
    
    // Fallback: clear the old insecure token if it still exists
    localStorage.removeItem('auth_token');
    
    if (!isLoggedIn) {
        window.location.href = '/Main/Login.html';
        return false;
    }
    if (requiredRole && role !== requiredRole) {
        window.location.href = '/Main/Login.html';
        return false;
    }
    return true;
}

/**
 * Logout the current user by destroying the cookie and clearing frontend state.
 */
function logout() {
    localStorage.removeItem('is_logged_in');
    localStorage.removeItem('user_role');
    localStorage.removeItem('auth_token');
    fetch(`${API_BASE}/auth/logout`, { method: 'POST', credentials: 'include' });
    window.location.href = '/Main/Login.html';
}
