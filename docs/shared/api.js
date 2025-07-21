// Shared API functions for all dashboard pages
window.HanuAPI = (function() {
  
  // Feed Management
  async function getFeeds() {
    const response = await window.HanuAuth.apiCall('/api/feeds');
    return await response.json();
  }

  async function addFeed(feedUrl) {
    const response = await window.HanuAuth.apiCall('/api/feeds', {
      method: 'POST',
      body: JSON.stringify({ feedUrl })
    });
    return await response.json();
  }

  async function removeFeed(feedUrl) {
    const response = await window.HanuAuth.apiCall('/api/feeds', {
      method: 'DELETE',
      body: JSON.stringify({ feedUrl })
    });
    return await response.json();
  }

  async function updateFeedMapping(feedUrl, channelId) {
    const response = await window.HanuAuth.apiCall('/api/feed-mappings', {
      method: 'POST',
      body: JSON.stringify({ feedUrl, channelId })
    });
    return await response.json();
  }

  async function updateFeedGroup(feedUrl, groupName) {
    const response = await window.HanuAuth.apiCall('/api/feed-groups', {
      method: 'POST', 
      body: JSON.stringify({ feedUrl, groupName })
    });
    return await response.json();
  }

  // Channel Management
  async function getChannels() {
    const response = await window.HanuAuth.apiCall('/api/channels');
    return await response.json();
  }

  async function addChannel(channelId) {
    const response = await window.HanuAuth.apiCall('/api/channels', {
      method: 'POST',
      body: JSON.stringify({ channelId })
    });
    return await response.json();
  }

  // System Prompts
  async function getSystemPrompt() {
    const response = await window.HanuAuth.apiCall('/api/prompt');
    return await response.json();
  }

  async function updateSystemPrompt(sections) {
    const response = await window.HanuAuth.apiCall('/api/prompt', {
      method: 'POST',
      body: JSON.stringify({ sections })
    });
    return await response.json();
  }

  async function testPrompt(content) {
    const response = await window.HanuAuth.apiCall('/api/prompt/test', {
      method: 'POST',
      body: JSON.stringify({ content })
    });
    return await response.json();
  }

  // System Status
  async function getSystemStatus() {
    const response = await window.HanuAuth.apiCall('/api/status');
    return await response.json();
  }

  async function runBotJob() {
    const response = await window.HanuAuth.apiCall('/run', {
      method: 'POST'
    });
    return await response.text();
  }

  // System Stats
  async function getSystemStats() {
    const response = await window.HanuAuth.apiCall('/api/stats');
    return await response.json();
  }

  // Utilities
  async function clearCache() {
    const response = await window.HanuAuth.apiCall('/api/cache', {
      method: 'DELETE'
    });
    return await response.json();
  }

  // Public API
  return {
    // Feed management
    getFeeds,
    addFeed,
    removeFeed,
    updateFeedMapping,
    updateFeedGroup,
    
    // Channel management  
    getChannels,
    addChannel,
    
    // Prompts
    getSystemPrompt,
    updateSystemPrompt,
    testPrompt,
    
    // Status & Stats
    getSystemStatus,
    getSystemStats,
    runBotJob,
    clearCache
  };
})();
