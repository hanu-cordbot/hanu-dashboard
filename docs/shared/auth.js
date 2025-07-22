// Authentication helper for HANU Dashboard
class HanuAuth {
  constructor() {
    this.token = null;
    this.apiBase = 'https://hanu-cordbot.snacky496.workers.dev';
    this.callbacks = {
      onLogin: [],
      onLogout: []
    };
    
    // Auto-restore token on page load
    this.restoreToken();
  }
  
  // Save token to session storage
  saveToken(token) {
    this.token = token;
    sessionStorage.setItem('HANU_AUTH_TOKEN', token);
    localStorage.setItem('HANU_AUTH_TOKEN', token);
  }
  
  // Load token from storage
  loadToken() {
    return sessionStorage.getItem('HANU_AUTH_TOKEN') || 
           localStorage.getItem('HANU_AUTH_TOKEN') || 
           '';
  }
  
  // Restore token from storage
  restoreToken() {
    const stored = this.loadToken();
    if (stored) {
      this.token = stored;
    }
  }
  
  // Get authentication headers
  getAuthHeaders() {
    if (!this.token) return {};
    return {
      'Authorization': `Bearer ${this.token}`,
      'Content-Type': 'application/json'
    };
  }
  
  // Check if user is authenticated
  isAuthenticated() {
    return !!this.token;
  }
  
  // Test if token is valid
  async testAuth() {
    if (!this.token) return false;
    
    try {
      const response = await fetch(`${this.apiBase}/api/status`, {
        headers: this.getAuthHeaders()
      });
      return response.ok;
    } catch (error) {
      console.error('Auth test failed:', error);
      return false;
    }
  }
  
  // Login with token
  async login(token) {
    if (!token || !token.trim()) {
      throw new Error('Token is required');
    }
    
    // Test the token
    const testToken = token.trim();
    const response = await fetch(`${this.apiBase}/api/status`, {
      headers: {
        'Authorization': `Bearer ${testToken}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      throw new Error('Invalid authentication token');
    }
    
    // Save valid token
    this.saveToken(testToken);
    
    // Notify callbacks
    this.callbacks.onLogin.forEach(callback => {
      try {
        callback(testToken);
      } catch (error) {
        console.error('Login callback error:', error);
      }
    });
    
    return true;
  }
  
  // Logout
  logout() {
    this.token = null;
    sessionStorage.removeItem('HANU_AUTH_TOKEN');
    localStorage.removeItem('HANU_AUTH_TOKEN');
    
    // Notify callbacks
    this.callbacks.onLogout.forEach(callback => {
      try {
        callback();
      } catch (error) {
        console.error('Logout callback error:', error);
      }
    });
  }
  
  // Add login callback
  onLogin(callback) {
    this.callbacks.onLogin.push(callback);
  }
  
  // Add logout callback  
  onLogout(callback) {
    this.callbacks.onLogout.push(callback);
  }
  
  // Setup authentication UI
  setupAuthUI(options = {}) {
    const authSection = document.getElementById(options.authSectionId || 'auth-section');
    const mainContent = document.getElementById(options.mainContentId || 'main-content');
    const tokenInput = document.getElementById(options.tokenInputId || 'auth-token');
    const loginButton = document.getElementById(options.loginButtonId || 'login-button');
    const statusDiv = document.getElementById(options.statusId || 'auth-status');
    
    if (!authSection || !mainContent || !tokenInput || !loginButton) {
      console.error('Auth UI elements not found');
      return;
    }
    
    // Restore token to input
    if (this.token) {
      tokenInput.value = this.token;
    }
    
    // Login button handler
    loginButton.addEventListener('click', async () => {
      const token = tokenInput.value.trim();
      
      if (!token) {
        if (statusDiv) statusDiv.textContent = '❌ Please enter AUTH_TOKEN';
        return;
      }
      
      if (statusDiv) statusDiv.textContent = '⏳ Authenticating...';
      
      try {
        await this.login(token);
        
        if (statusDiv) statusDiv.textContent = '✅ Authentication successful';
        authSection.classList.add('hidden');
        mainContent.classList.remove('hidden');
        
      } catch (error) {
        if (statusDiv) statusDiv.textContent = `❌ ${error.message}`;
        console.error('Authentication failed:', error);
      }
    });
    
    // Enter key support
    tokenInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        loginButton.click();
      }
    });
    
    // Auto-login if token exists and is valid
    if (this.token) {
      this.testAuth().then(isValid => {
        if (isValid) {
          authSection.classList.add('hidden');
          mainContent.classList.remove('hidden');
        }
      });
    }
  }
}

// Create global instance
window.HanuAuth = new HanuAuth();

// Export for modules
export default window.HanuAuth;
