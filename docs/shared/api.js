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
    
    // Add content-type for POST/PUT requests with body
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
  
  // DELETE request
  async delete(endpoint) {
    return this.request(endpoint, { method: 'DELETE' });
  }
  
  // System Status
  async getSystemStatus() {
    return this.get('/api/status');
  }
  
  // Feed Management
  async getFeeds() {
    return this.get('/api/feeds');
  }
  
  async addFeed(feedUrl) {
    return this.post('/api/feeds', { feedUrl });
  }
  
  async removeFeed(feedUrl) {
    return this.delete(`/api/feeds?url=${encodeURIComponent(feedUrl)}`);
  }
  
  async updateFeedMapping(feedUrl, channelId) {
    return this.post('/api/feed-mappings', { feedUrl, channelId });
  }
  
  async updateFeedGroup(feedUrl, groupName) {
    return this.post('/api/feed-groups', { feedUrl, groupName });
  }
  
  // Channel Management
  async getChannels() {
    return this.get('/api/channels');
  }
  
  async addChannel(channelId, name = null, type = 'text') {
    return this.post('/api/channels', { channelId, name, type });
  }
  
  async removeChannel(channelId) {
    return this.delete(`/api/channels?id=${channelId}`);
  }
  
  // Group Management
  async getGroups() {
    return this.get('/api/groups');
  }
  
  async addGroup(groupName) {
    return this.post('/api/groups', { groupName });
  }
  
  async removeGroup(groupName) {
    return this.delete(`/api/groups?name=${encodeURIComponent(groupName)}`);
  }
  
  async renameGroup(oldName, newName) {
    return this.put('/api/groups', { oldName, newName });
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
  
  // Statistics
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
    return this.post('/api/cache/clear');
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
