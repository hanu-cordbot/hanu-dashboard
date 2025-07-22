// API wrapper for HANU Dashboard
import HanuAuth from './auth.js';

class HanuAPI {
  constructor() {
    this.baseUrl = 'https://hanu-cordbot.snacky496.workers.dev';
  }
  
  // Generic request method
  async request(endpoint, options = {}) {
    const url = `${this.baseUrl}${endpoint}`;
    const config = {
      headers: HanuAuth.getAuthHeaders(),
      ...options
    };
    
    // Add content-type for POST/PUT/DELETE requests with body
    if (options.body && typeof options.body === 'object') {
      config.body = JSON.stringify(options.body);
      config.headers['Content-Type'] = 'application/json';
    }
    
    try {
      const response = await fetch(url, config);
      
      // Handle authentication errors
      if (response.status === 401) {
        HanuAuth.logout();
        throw new Error('Authentication expired. Please login again.');
      }
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      // Return response for different content types
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        return await response.json();
      } else {
        return await response.text();
      }
      
    } catch (error) {
      console.error(`API request failed: ${endpoint}`, error);
      throw error;
    }
  }
  
  // GET request
  async get(endpoint) {
    return this.request(endpoint, { method: 'GET' });
  }
  
  // POST request
  async post(endpoint, body = null) {
    return this.request(endpoint, {
      method: 'POST',
      body
    });
  }
  
  // PUT request
  async put(endpoint, body = null) {
    return this.request(endpoint, {
      method: 'PUT', 
      body
    });
  }
  
  // DELETE request - FIXED to support request body
  async delete(endpoint, body = null) {
    return this.request(endpoint, { 
      method: 'DELETE',
      body
    });
  }
  
  // System Status
  async getSystemStatus() {
    return this.get('/api/status');
  }
  
  async getDiagnostics() {
    return this.get('/api/diagnostics');
  }
  
  // Feed Management
  async getFeeds() {
    return this.get('/api/feeds');
  }
  
  async addFeed(feedUrl) {
    return this.post('/api/feeds', { feedUrl });
  }
  
  async removeFeed(feedUrl) {
    return this.delete('/api/feeds', { feedUrl });
  }
  
  async updateFeedMapping(feedUrl, channelId) {
    return this.post('/api/feed-mappings', { feedUrl, channelId });
  }
  
  async updateFeedGroup(feedUrl, groupName) {
    return this.post('/api/feed-groups', { feedUrl, groupName });
  }
  
  // Channel Management - FIXED
  async getChannels() {
    return this.get('/api/channels');
  }
  
  async addChannel(channelId) {
    return this.post('/api/channels', { channelId });
  }
  
  async removeChannel(channelId) {
    return this.delete('/api/channels', { channelId }); // Now sends body correctly
  }
  
  // Group Management
  async getGroups() {
    return this.get('/api/groups');
  }
  
  async addGroup(groupName) {
    return this.post('/api/groups', { groupName });
  }
  
  async renameGroup(oldName, newName) {
    return this.put('/api/groups', { oldName, newName });
  }
  
  async removeGroup(groupName) {
    return this.delete('/api/groups', { groupName });
  }
  
  // System Prompts
  async getSystemPrompt() {
    return this.get('/api/prompt');
  }
  
  async updateSystemPrompt(sections) {
    return this.post('/api/prompt', { sections });
  }
  
  async testPrompt(content) {
    return this.post('/api/prompt/test', { content });
  }
  
  async testRandomPrompt(config) {
    return this.post('/api/prompt/test-random', config);
  }
  
  // Statistics - ENHANCED
  async getSystemStats() {
    return this.get('/api/stats');
  }
  
  async getFeedPerformance() {
    return this.get('/api/stats/feeds');
  }
  
  async getChannelStats() {
    return this.get('/api/stats/channels');
  }
  
  // Bot Controls
  async runBot() {
    return this.post('/run');
  }
  
  async clearCache() {
    return this.delete('/api/cache');
  }
  
  async resetSeenData() {
    return this.post('/api/reset-seen');
  }
  
  // Settings
  async getSettings() {
    return this.get('/api/settings');
  }
  
  async updateSettings(settings) {
    return this.post('/api/settings', { settings });
  }
  
  // Public endpoints (no auth required)
  async getPublicFeeds() {
    const url = `${this.baseUrl}/api/public/feeds`;
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    return response.json();
  }
}

// Create global instance
window.HanuAPI = new HanuAPI();

// Export for modules
export default window.HanuAPI;
