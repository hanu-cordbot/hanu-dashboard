// Shared authentication system for all dashboard pages
window.HanuAuth = (function() {
  const WORKER_URL = 'https://hanu-cordbot.snacky496.workers.dev';
  let authToken = null;
  let authenticated = false;

  // Initialize authentication on page load
  function init() {
    authToken = sessionStorage.getItem('HANU_AUTH_TOKEN') || localStorage.getItem('HANU_AUTH_TOKEN');
    if (authToken) {
      testAuthentication();
    }
    setupAuthUI();
  }

  // Set up authentication UI elements
  function setupAuthUI() {
    // Create auth section if it doesn't exist
    if (!document.getElementById('auth-section')) {
      const authHTML = `
        <div id="auth-section" class="auth-section ${authToken ? 'hidden' : ''}">
          <h3>🔐 Authentication Required</h3>
          <div>
            <input type="password" id="auth-token-input" placeholder="Enter AUTH_TOKEN" value="${authToken || ''}" />
            <button id="auth-login-btn">Login</button>
            <button id="auth-logout-btn" class="hidden">Logout</button>
            <div id="auth-status" style="margin-top: 10px;"></div>
          </div>
        </div>
      `;
      
      const firstElement = document.body.firstElementChild;
      if (firstElement) {
        firstElement.insertAdjacentHTML('afterend', authHTML);
      } else {
        document.body.insertAdjacentHTML('afterbegin', authHTML);
      }
    }

    // Bind events
    document.getElementById('auth-login-btn').onclick = login;
    document.getElementById('auth-logout-btn').onclick = logout;
    document.getElementById('auth-token-input').onkeypress = function(e) {
      if (e.key === 'Enter') login();
    };
  }

  // Login function
  async function login() {
    const input = document.getElementById('auth-token-input');
    const status = document.getElementById('auth-status');
    const token = input.value.trim();

    if (!token) {
      status.textContent = '❌ Please enter AUTH_TOKEN';
      return;
    }

    status.textContent = '⏳ Authenticating...';
    
    try {
      const response = await fetch(`${WORKER_URL}/api/status`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        authToken = token;
        authenticated = true;
        sessionStorage.setItem('HANU_AUTH_TOKEN', token);
        localStorage.setItem('HANU_AUTH_TOKEN', token);
        
        status.textContent = '✅ Authentication successful';
        document.getElementById('auth-section').classList.add('hidden');
        document.getElementById('auth-logout-btn').classList.remove('hidden');
        
        // Trigger custom event for pages to respond
        window.dispatchEvent(new CustomEvent('hanu-authenticated', { detail: { token } }));
        
      } else {
        status.textContent = '❌ Authentication failed';
        authenticated = false;
      }
    } catch (error) {
      status.textContent = '❌ Connection error';
      authenticated = false;
    }
  }

  // Logout function
  function logout() {
    authToken = null;
    authenticated = false;
    sessionStorage.removeItem('HANU_AUTH_TOKEN');
    localStorage.removeItem('HANU_AUTH_TOKEN');
    
    document.getElementById('auth-section').classList.remove('hidden');
    document.getElementById('auth-logout-btn').classList.add('hidden');
    document.getElementById('auth-token-input').value = '';
    document.getElementById('auth-status').textContent = '';
    
    // Trigger custom event
    window.dispatchEvent(new CustomEvent('hanu-logged-out'));
    
    // Reload page to reset state
    window.location.reload();
  }

  // Test authentication without changing UI
  async function testAuthentication() {
    if (!authToken) return false;
    
    try {
      const response = await fetch(`${WORKER_URL}/api/status`, {
        headers: { 'Authorization': `Bearer ${authToken}` }
      });
      authenticated = response.ok;
      return authenticated;
    } catch (error) {
      authenticated = false;
      return false;
    }
  }

  // Test connection (for status indicators)
  async function testConnection() {
    try {
      const response = await fetch(`${WORKER_URL}/run`, {
        method: 'OPTIONS'  // CORS preflight
      });
      return response.ok;
    } catch (error) {
      return false;
    }
  }

  // Make authenticated API calls
  async function apiCall(endpoint, options = {}) {
    if (!authToken) {
      throw new Error('Not authenticated');
    }

    const config = {
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json',
        ...options.headers
      },
      ...options
    };

    const response = await fetch(`${WORKER_URL}${endpoint}`, config);
    
    if (!response.ok) {
      if (response.status === 401) {
        logout();
        throw new Error('Authentication expired');
      }
      throw new Error(`API call failed: ${response.status}`);
    }

    return response;
  }

  // Initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  // Public API
  return {
    isAuthenticated: () => authenticated,
    getToken: () => authToken,
    login,
    logout,
    testConnection,
    testAuthentication,
    apiCall
  };
})();
