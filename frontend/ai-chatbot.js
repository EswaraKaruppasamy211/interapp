/**
 * SkillBridge AI Chatbot - Role-Aware UI Component
 * Manages chatbot interface and interaction
 * Integrates with role-aware AI backend
 */

class AIRoleAwareChatbot {
  constructor(containerId = 'ai-chatbot', apiBaseUrl = '/api') {
    this.containerId = containerId;
    this.apiBaseUrl = apiBaseUrl;
    this.chatHistory = [];
    this.currentRole = null;
    this.currentUser = null;
    this.isOpen = false;
    this.isLoading = false;

    this.init();
  }

  /**
   * Initialize chatbot
   */
  async init() {
    this.createChatbotUI();
    await this.initializeRole();
  }

  /**
   * Create chatbot HTML structure
   */
  createChatbotUI() {
    let container = document.getElementById(this.containerId);

    // If container doesn't exist, create it
    if (!container) {
      container = document.createElement('div');
      container.id = this.containerId;
      container.style.position = 'fixed';
      container.style.bottom = '20px';
      container.style.right = '20px';
      container.style.zIndex = '10000';
      document.body.appendChild(container);
    }

    container.innerHTML = `
      <div class="ai-chatbot-widget">
        <!-- Chatbot Toggle Button -->
        <button class="ai-chatbot-toggle" id="ai-chatbot-toggle" aria-label="Toggle AI Assistant">
          <span class="ai-chatbot-icon">💬</span>
          <span class="ai-chatbot-label">AI Assistant</span>
        </button>

        <!-- Chatbot Window -->
        <div class="ai-chatbot-window hidden" id="ai-chatbot-window">
          <!-- Header -->
          <div class="ai-chatbot-header">
            <div class="ai-header-content">
              <h3 id="ai-chatbot-title">SkillBridge AI Assistant</h3>
              <p id="ai-chatbot-subtitle" class="ai-subtitle">Loading...</p>
            </div>
            <button class="ai-close-btn" id="ai-close-btn" aria-label="Close chatbot">×</button>
          </div>

          <!-- Quick Actions -->
          <div class="ai-quick-actions hidden" id="ai-quick-actions">
            <!-- Will be populated dynamically -->
          </div>

          <!-- Chat Messages -->
          <div class="ai-chat-messages" id="ai-chat-messages">
            <!-- Messages will be added here -->
          </div>

          <!-- Input Area -->
          <div class="ai-input-area">
            <div class="ai-input-wrapper">
              <input 
                type="text" 
                id="ai-message-input" 
                class="ai-message-input" 
                placeholder="Ask me anything..."
                autocomplete="off"
              />
              <button class="ai-send-btn" id="ai-send-btn" aria-label="Send message">
                <span>→</span>
              </button>
            </div>
            <small class="ai-hint">Type your question or select a quick action above</small>
          </div>
        </div>
      </div>

      <style>
        .ai-chatbot-widget {
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
        }

        .ai-chatbot-toggle {
          width: 60px;
          height: 60px;
          border-radius: 50%;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          border: none;
          color: white;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          font-size: 24px;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
          transition: all 0.3s ease;
          flex-direction: column;
          padding: 0;
        }

        .ai-chatbot-toggle:hover {
          transform: scale(1.1);
          box-shadow: 0 6px 16px rgba(0, 0, 0, 0.2);
        }

        .ai-chatbot-toggle .ai-chatbot-label {
          display: none;
          font-size: 12px;
        }

        .ai-chatbot-window {
          position: absolute;
          bottom: 80px;
          right: 0;
          width: 400px;
          height: 600px;
          background: white;
          border-radius: 12px;
          box-shadow: 0 5px 40px rgba(0, 0, 0, 0.16);
          display: flex;
          flex-direction: column;
          overflow: hidden;
          animation: slideUp 0.3s ease;
        }

        .ai-chatbot-window.hidden {
          display: none;
        }

        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .ai-chatbot-header {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          padding: 16px;
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
        }

        .ai-header-content {
          flex: 1;
        }

        .ai-chatbot-header h3 {
          margin: 0;
          font-size: 16px;
          font-weight: 600;
        }

        .ai-chatbot-header .ai-subtitle {
          margin: 4px 0 0 0;
          font-size: 12px;
          opacity: 0.9;
        }

        .ai-close-btn {
          background: transparent;
          border: none;
          color: white;
          font-size: 24px;
          cursor: pointer;
          padding: 0;
          width: 30px;
          height: 30px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .ai-quick-actions {
          padding: 12px 16px;
          border-bottom: 1px solid #eee;
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
          background: #f9fafb;
        }

        .ai-quick-action-btn {
          padding: 6px 12px;
          background: white;
          border: 1px solid #ddd;
          border-radius: 16px;
          font-size: 12px;
          cursor: pointer;
          transition: all 0.2s ease;
          white-space: nowrap;
        }

        .ai-quick-action-btn:hover {
          background: #f0f0f0;
          border-color: #667eea;
          color: #667eea;
        }

        .ai-chat-messages {
          flex: 1;
          overflow-y: auto;
          padding: 16px;
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .ai-message {
          display: flex;
          gap: 8px;
          animation: fadeIn 0.3s ease;
        }

        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .ai-message.user {
          justify-content: flex-end;
        }

        .ai-message-content {
          max-width: 80%;
          padding: 10px 14px;
          border-radius: 12px;
          word-wrap: break-word;
          line-height: 1.4;
        }

        .ai-message.ai .ai-message-content {
          background: #f0f0f0;
          color: #333;
          border-radius: 12px 12px 12px 0;
        }

        .ai-message.user .ai-message-content {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          border-radius: 12px 12px 0 12px;
        }

        .ai-typing-indicator {
          display: flex;
          gap: 4px;
        }

        .ai-typing-indicator span {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: #999;
          animation: typing 1.4s infinite;
        }

        .ai-typing-indicator span:nth-child(2) {
          animation-delay: 0.2s;
        }

        .ai-typing-indicator span:nth-child(3) {
          animation-delay: 0.4s;
        }

        @keyframes typing {
          0%, 60%, 100% {
            opacity: 0.5;
            transform: translateY(0);
          }
          30% {
            opacity: 1;
            transform: translateY(-10px);
          }
        }

        .ai-input-area {
          border-top: 1px solid #eee;
          padding: 12px 16px;
          background: #fafafa;
        }

        .ai-input-wrapper {
          display: flex;
          gap: 8px;
        }

        .ai-message-input {
          flex: 1;
          border: 1px solid #ddd;
          border-radius: 20px;
          padding: 10px 16px;
          font-size: 14px;
          outline: none;
          transition: border-color 0.2s ease;
        }

        .ai-message-input:focus {
          border-color: #667eea;
        }

        .ai-send-btn {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          border: none;
          border-radius: 50%;
          color: white;
          width: 36px;
          height: 36px;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.2s ease;
        }

        .ai-send-btn:hover {
          transform: scale(1.05);
        }

        .ai-send-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .ai-hint {
          display: block;
          margin-top: 8px;
          font-size: 11px;
          color: #999;
        }

        @media (max-width: 768px) {
          .ai-chatbot-window {
            width: 100%;
            height: 100%;
            bottom: 0;
            right: 0;
            border-radius: 0;
            max-width: 100%;
            max-height: 100%;
          }
        }
      </style>
    `;

    // Attach event listeners
    this.attachEventListeners();
  }

  /**
   * Attach event listeners to UI elements
   */
  attachEventListeners() {
    const toggleBtn = document.getElementById('ai-chatbot-toggle');
    const closeBtn = document.getElementById('ai-close-btn');
    const sendBtn = document.getElementById('ai-send-btn');
    const messageInput = document.getElementById('ai-message-input');
    const chatWindow = document.getElementById('ai-chatbot-window');

    toggleBtn?.addEventListener('click', () => this.toggleChatbot());
    closeBtn?.addEventListener('click', () => this.closeChatbot());
    sendBtn?.addEventListener('click', () => this.sendMessage());
    messageInput?.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') this.sendMessage();
    });

    // Prevent scrolling behind chatbot on mobile
    chatWindow?.addEventListener('touchmove', (e) => {
      if (e.target.closest('.ai-chat-messages')) {
        e.stopPropagation();
      }
    });
  }

  /**
   * Toggle chatbot window
   */
  toggleChatbot() {
    const chatWindow = document.getElementById('ai-chatbot-window');
    if (this.isOpen) {
      this.closeChatbot();
    } else {
      this.openChatbot();
    }
  }

  /**
   * Open chatbot
   */
  async openChatbot() {
    const chatWindow = document.getElementById('ai-chatbot-window');
    chatWindow?.classList.remove('hidden');
    this.isOpen = true;

    // Initialize if first time
    if (this.chatHistory.length === 0) {
      await this.initializeChat();
    }

    const messageInput = document.getElementById('ai-message-input');
    messageInput?.focus();
  }

  /**
   * Close chatbot
   */
  closeChatbot() {
    const chatWindow = document.getElementById('ai-chatbot-window');
    chatWindow?.classList.add('hidden');
    this.isOpen = false;
  }

  /**
   * Initialize chatbot role
   */
  async initializeRole() {
    try {
      // Get current user from global context
      const user = window.currentUser || null;
      const role = window.currentRole || 'student';

      this.currentUser = user;
      this.currentRole = role;
    } catch (err) {
      console.error('Failed to initialize chatbot role:', err);
    }
  }

  /**
   * Initialize chat with welcome message
   */
  async initializeChat() {
    try {
      this.showTypingIndicator();

      const response = await fetch(`${this.apiBaseUrl}/ai/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: '__INIT__',
          role: this.currentRole
        })
      });

      if (!response.ok) throw new Error('Failed to initialize chat');

      const data = await response.json();

      if (data.welcome) {
        // Update header
        document.getElementById('ai-chatbot-title').textContent = 
          data.role === 'student' ? 'Career Assistant' :
          data.role === 'company' ? 'Recruitment Assistant' :
          data.role === 'college' ? 'Academic Assistant' :
          'Platform Assistant';

        // Display welcome message
        this.addMessage(data.welcome, 'ai');

        // Display quick actions
        if (data.quickActions && data.quickActions.length > 0) {
          this.displayQuickActions(data.quickActions);
        }

        this.removeTypingIndicator();
      }
    } catch (err) {
      console.error('Failed to initialize chat:', err);
      this.addMessage('Failed to connect to AI Assistant. Please try again.', 'ai');
      this.removeTypingIndicator();
    }
  }

  /**
   * Display quick action buttons
   */
  displayQuickActions(actions) {
    const quickActionsDiv = document.getElementById('ai-quick-actions');
    if (!quickActionsDiv) return;

    quickActionsDiv.innerHTML = '';
    actions.forEach(action => {
      const btn = document.createElement('button');
      btn.className = 'ai-quick-action-btn';
      btn.textContent = action.label;
      btn.onclick = () => {
        this.messageInput = document.getElementById('ai-message-input');
        this.messageInput.value = action.label;
        this.sendMessage();
      };
      quickActionsDiv.appendChild(btn);
    });

    quickActionsDiv.classList.remove('hidden');
  }

  /**
   * Send message to AI
   */
  async sendMessage() {
    const messageInput = document.getElementById('ai-message-input');
    const message = messageInput?.value.trim();

    if (!message) return;

    // Add user message to chat
    this.addMessage(message, 'user');
    messageInput.value = '';
    messageInput.focus();

    // Show typing indicator
    this.showTypingIndicator();

    try {
      const response = await fetch(`${this.apiBaseUrl}/ai/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message,
          role: this.currentRole,
          portal: this.currentRole
        })
      });

      if (!response.ok) throw new Error('Failed to get response');

      const data = await response.json();

      this.removeTypingIndicator();

      if (data.success && data.response) {
        this.addMessage(data.response, 'ai');
      } else if (data.error) {
        this.addMessage(data.response || 'An error occurred. Please try again.', 'ai');
      }
    } catch (err) {
      console.error('Failed to send message:', err);
      this.removeTypingIndicator();
      this.addMessage('Failed to get response. Please try again.', 'ai');
    }
  }

  /**
   * Add message to chat
   */
  addMessage(content, sender = 'ai') {
    const chatMessages = document.getElementById('ai-chat-messages');
    if (!chatMessages) return;

    const messageDiv = document.createElement('div');
    messageDiv.className = `ai-message ${sender}`;

    const contentDiv = document.createElement('div');
    contentDiv.className = 'ai-message-content';
    contentDiv.textContent = content;

    messageDiv.appendChild(contentDiv);
    chatMessages.appendChild(messageDiv);

    // Auto-scroll to latest message
    chatMessages.scrollTop = chatMessages.scrollHeight;

    this.chatHistory.push({ sender, content, timestamp: new Date() });
  }

  /**
   * Show typing indicator
   */
  showTypingIndicator() {
    const chatMessages = document.getElementById('ai-chat-messages');
    if (!chatMessages) return;

    const typingDiv = document.createElement('div');
    typingDiv.id = 'ai-typing-indicator';
    typingDiv.className = 'ai-message ai';

    const contentDiv = document.createElement('div');
    contentDiv.className = 'ai-message-content';
    contentDiv.innerHTML = `
      <div class="ai-typing-indicator">
        <span></span>
        <span></span>
        <span></span>
      </div>
    `;

    typingDiv.appendChild(contentDiv);
    chatMessages.appendChild(typingDiv);
    chatMessages.scrollTop = chatMessages.scrollHeight;
  }

  /**
   * Remove typing indicator
   */
  removeTypingIndicator() {
    const typingDiv = document.getElementById('ai-typing-indicator');
    typingDiv?.remove();
  }

  /**
   * Clear chat history
   */
  clearChat() {
    this.chatHistory = [];
    const chatMessages = document.getElementById('ai-chat-messages');
    if (chatMessages) {
      chatMessages.innerHTML = '';
    }
  }
}

// Auto-initialize chatbot when page loads
document.addEventListener('DOMContentLoaded', () => {
  window.aIChatbot = new AIRoleAwareChatbot('ai-chatbot', '/api');
});
