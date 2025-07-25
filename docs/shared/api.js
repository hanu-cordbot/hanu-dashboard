// API wrapper for HANU Dashboard - Complete Implementation
import HanuAuth from './auth.js';

class HanuAPI {
  constructor() {
    this.baseUrl = 'https://hanu-cordbot.snacky496.workers.dev';
    this.railwayUrl = 'https://web-production-b0a5.up.railway.app';
  }

  // Get authentication headers
  getHeaders() {
    const headers = {
      'Content-Type': 'application/json'
    };

    // Add authorization if available
    try {
      if (HanuAuth && HanuAuth.getToken && HanuAuth.getToken()) {
        headers['Authorization'] = `Bearer ${HanuAuth.getToken()}`;
      }
    } catch (error) {
      console.warn('Could not get auth token:', error);
    }

    return headers;
  }

  // Generic request method with comprehensive error handling
  async request(endpoint, options = {}) {
    // Determine if this should go to Railway or Cloudflare Worker
    const isRailwayEndpoint = ['/run', '/health', '/get-current-prompt', '/save-current-prompt', 
                               '/test-gemini', '/test-entries', '/all-feeds', '/random-entry', '/test-discord'].includes(endpoint);
    
    const baseUrl = isRailwayEndpoint ? this.railwayUrl : this.baseUrl;
    const url = endpoint.startsWith('http') ? endpoint : `${baseUrl}${endpoint}`;
    
    const config = {
      headers: this.getHeaders(),
      ...options
    };

    // Handle request body
    if (options.body && typeof options.body === 'object') {
      config.body = JSON.stringify(options.body);
    }

    // Add Railway-specific headers for certain endpoints
    if (isRailwayEndpoint && HanuAuth.getToken()) {
      config.headers['X-Auth'] = HanuAuth.getToken();
    }

    try {
      console.log(`🌐 API Request: ${options.method || 'GET'} ${url}`);
      
      const response = await fetch(url, config);
      
      // Handle authentication errors
      if (response.status === 401) {
        console.error('❌ Authentication failed');
        if (HanuAuth && HanuAuth.logout) {
          HanuAuth.logout();
        }
        throw new Error('Authentication expired. Please login again.');
      }

      // Handle other HTTP errors
      if (!response.ok) {
        const errorText = await response.text();
        console.error(`❌ API Error ${response.status}:`, errorText);
        throw new Error(`HTTP ${response.status}: ${errorText || response.statusText}`);
      }

      // Parse response based on content type
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        const data = await response.json();
        console.log(`✅ API Success: ${url}`, data);
        return data;
      } else {
        const text = await response.text();
        console.log(`✅ API Success: ${url}`, text);
        return text;
      }

    } catch (error) {
      console.error(`❌ API request failed: ${endpoint}`, error);
      throw error;
    }
  }

  // HTTP method helpers
  async get(endpoint) {
    return this.request(endpoint, { method: 'GET' });
  }

  async post(endpoint, body = null) {
    return this.request(endpoint, {
      method: 'POST',
      body
    });
  }

  async put(endpoint, body = null) {
    return this.request(endpoint, {
      method: 'PUT',
      body
    });
  }

  async delete(endpoint, body = null) {
    return this.request(endpoint, {
      method: 'DELETE',
      body
    });
  }

  // ===== SYSTEM STATUS & HEALTH =====

  async getSystemStatus() {
    return this.get('/api/status');
  }

  async getDiagnostics() {
    return this.get('/api/diagnostics');
  }

  async getSystemStats() {
    try {
      return await this.get('/api/stats');
    } catch (error) {
      console.warn('Stats endpoint not available, returning mock data');
      return {
        memory: 0,
        cpu: 0,
        activityRate: 0,
        healthScore: 100,
        activeFeedCount: 0,
        feedCount: 0
      };
    }
  }

  // ===== FEED MANAGEMENT =====

  async getFeeds() {
    return this.get('/api/feeds');
  }

  async addFeed(feedUrl) {
    if (!feedUrl || !feedUrl.trim()) {
      throw new Error('Feed URL is required');
    }
    return this.post('/api/feeds', { feedUrl: feedUrl.trim() });
  }

  async removeFeed(feedUrl) {
    if (!feedUrl) {
      throw new Error('Feed URL is required');
    }
    return this.delete('/api/feeds', { feedUrl });
  }

  async updateFeedMapping(feedUrl, channelId) {
    return this.post('/api/feed-mappings', { 
      feedUrl, 
      channelId: channelId || null 
    });
  }

  async updateFeedGroup(feedUrl, groupName) {
    return this.post('/api/feed-groups', { 
      feedUrl, 
      groupName: groupName || null 
    });
  }

  async getFeedPerformance() {
    try {
      return await this.get('/api/stats/feeds');
    } catch (error) {
      console.warn('Feed performance endpoint not available');
      return { feeds: [] };
    }
  }

  // ===== CHANNEL MANAGEMENT =====

  async getChannels() {
    return this.get('/api/channels');
  }

  async addChannel(channelId) {
    if (!channelId || !channelId.trim()) {
      throw new Error('Channel ID is required');
    }
    
    // Validate Discord channel ID format
    const cleanId = channelId.trim();
    if (!/^\d{17,20}$/.test(cleanId)) {
      throw new Error('Invalid Discord channel ID format (should be 17-20 digits)');
    }
    
    return this.post('/api/channels', { channelId: cleanId });
  }

  async removeChannel(channelId) {
    if (!channelId) {
      throw new Error('Channel ID is required');
    }
    return this.delete('/api/channels', { channelId });
  }

  async fetchChannelName(channelId) {
    if (!channelId) {
      throw new Error('Channel ID is required');
    }
    try {
      return await this.post('/api/channels/fetch-name', { channelId });
    } catch (error) {
      console.warn('Channel name fetch failed:', error);
      return { success: false, error: error.message };
    }
  }

  async getChannelStats() {
    try {
      return await this.get('/api/stats/channels');
    } catch (error) {
      console.warn('Channel stats endpoint not available');
      return { channels: [] };
    }
  }

  // ===== GROUP MANAGEMENT =====

  async getGroups() {
    return this.get('/api/groups');
  }

  async addGroup(groupName) {
    if (!groupName || !groupName.trim()) {
      throw new Error('Group name is required');
    }
    return this.post('/api/groups', { groupName: groupName.trim() });
  }

  async renameGroup(oldName, newName) {
    if (!oldName || !newName) {
      throw new Error('Both old and new group names are required');
    }
    if (oldName.trim() === newName.trim()) {
      throw new Error('New name must be different from old name');
    }
    return this.put('/api/groups', { 
      oldName: oldName.trim(), 
      newName: newName.trim() 
    });
  }

  async removeGroup(groupName) {
    if (!groupName) {
      throw new Error('Group name is required');
    }
    // Use URL parameter format as expected by the worker
    return this.delete(`/api/groups?name=${encodeURIComponent(groupName)}`);
  }

  // ===== PROMPT MANAGEMENT =====

  async getSystemPrompt() {
    return this.get('/get-current-prompt'); // Railway endpoint
  }

  async updateSystemPrompt(sections) {
    if (!sections || !Array.isArray(sections)) {
      throw new Error('Sections array is required');
    }
    return this.post('/save-current-prompt', { sections }); // Railway endpoint
  }

  async testPrompt(content) {
    try {
      return await this.post('/api/prompt/test', { content });
    } catch (error) {
      console.warn('Prompt test endpoint not available');
      return { success: false, error: error.message };
    }
  }

  async testRandomPrompt(config) {
    try {
      return await this.post('/api/prompt/test-random', config);
    } catch (error) {
      console.warn('Random prompt test endpoint not available');
      return { success: false, error: error.message };
    }
  }

  // ===== BOT CONTROL & TESTING =====

  async runBot() {
    return this.post('/run'); // Railway endpoint
  }

  async testGemini(promptData) {
    return this.post('/test-gemini', promptData); // Railway endpoint
  }

  async getTestEntries(feedUrl = null) {
    const endpoint = feedUrl ? `/test-entries?feed=${encodeURIComponent(feedUrl)}` : '/test-entries';
    return this.get(endpoint); // Railway endpoint
  }

  async getRandomEntry() {
    return this.get('/random-entry'); // Railway endpoint
  }

  async getAllFeeds() {
    return this.get('/all-feeds'); // Railway endpoint
  }

  async testDiscord(channelId, content, entry = {}) {
    if (!channelId || !content) {
      throw new Error('Channel ID and content are required');
    }
    return this.post('/test-discord', { // Railway endpoint
      channel_id: channelId,
      content: content,
      entry: entry
    });
  }

  // ===== CACHE & DATA MANAGEMENT =====

  async clearCache() {
    try {
      return await this.delete('/api/cache');
    } catch (error) {
      console.warn('Clear cache endpoint not available');
      return { success: false, error: error.message };
    }
  }

  async resetSeenData() {
    try {
      return await this.post('/api/reset-seen');
    } catch (error) {
      console.warn('Reset seen data endpoint not available');
      return { success: false, error: error.message };
    }
  }

  async exportData() {
    try {
      return await this.get('/api/export');
    } catch (error) {
      console.warn('Export data endpoint not available');
      return { success: false, error: error.message };
    }
  }

  // ===== SETTINGS MANAGEMENT =====

  async getSettings() {
    try {
      return await this.get('/api/settings');
    } catch (error) {
      console.warn('Settings endpoint not available, returning defaults');
      return {
        maxAgeHours: 168,
        skipUnmappedFeeds: true,
        continueParsingAll: true
      };
    }
  }

  async updateSettings(settings) {
    if (!settings || typeof settings !== 'object') {
      throw new Error('Settings object is required');
    }
    try {
      return await this.post('/api/settings', { settings });
    } catch (error) {
      console.warn('Update settings endpoint not available');
      return { success: false, error: error.message };
    }
  }

  // ===== PUBLIC ENDPOINTS (No Auth Required) =====

  async getPublicFeeds() {
    try {
      const url = `${this.baseUrl}/api/public/feeds`;
      const response = await fetch(url, {
        headers: { 'Content-Type': 'application/json' }
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.warn('Public feeds endpoint not available');
      return { feeds: [] };
    }
  }

  async getPublicStats() {
    try {
      const url = `${this.baseUrl}/api/public/stats`;
      const response = await fetch(url, {
        headers: { 'Content-Type': 'application/json' }
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.warn('Public stats endpoint not available');
      return { stats: {} };
    }
  }

  // ===== UTILITY METHODS =====

  async healthCheck() {
    try {
      const [workerHealth, railwayHealth] = await Promise.allSettled([
        fetch(`${this.baseUrl}/health`),
        fetch(`${this.railwayUrl}/health`)
      ]);

      return {
        worker: {
          status: workerHealth.status === 'fulfilled' && workerHealth.value.ok ? 'healthy' : 'unhealthy',
          response: workerHealth.status === 'fulfilled' ? workerHealth.value.status : 'error'
        },
        railway: {
          status: railwayHealth.status === 'fulfilled' && railwayHealth.value.ok ? 'healthy' : 'unhealthy',
          response: railwayHealth.status === 'fulfilled' ? railwayHealth.value.status : 'error'
        }
      };
    } catch (error) {
      return {
        worker: { status: 'error', response: error.message },
        railway: { status: 'error', response: error.message }
      };
    }
  }

  async ping() {
    const start = Date.now();
    try {
      await this.get('/health');
      return {
        success: true,
        latency: Date.now() - start,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      return {
        success: false,
        latency: Date.now() - start,
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }

  // ===== DEBUG METHODS =====

  getDebugInfo() {
    return {
      baseUrl: this.baseUrl,
      railwayUrl: this.railwayUrl,
      hasAuth: !!HanuAuth,
      hasToken: !!(HanuAuth && HanuAuth.getToken && HanuAuth.getToken()),
      headers: this.getHeaders()
    };
  }

  logDebugInfo() {
    console.table(this.getDebugInfo());
  }
}

// Create singleton instance
const HanuAPIInstance = new HanuAPI();

// Make available globally for non-module scripts
if (typeof window !== 'undefined') {
  window.HanuAPI = HanuAPIInstance;
}

// Export for ES6 modules
export default HanuAPIInstance;

// Export for modules
export default window.HanuAPI;

export async function runBotTest(authToken, feedUrl = '') {
  return fetch(`${API_ORIGIN}/run`, {
    method : 'POST',
    headers: {
      'X-Auth'        : authToken,
      'X-Test-Mode'   : '1',
      'X-Skip-Filters': '1',
      'X-Test-Feed'   : feedUrl
    }
  });
}
