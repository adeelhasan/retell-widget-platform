import { NextRequest, NextResponse } from 'next/server';

export async function GET() {
  const widgetScript = `
(function() {
  'use strict';
  
  // Prevent multiple loads
  if (window.RetellWidgetLoader) {
    return;
  }
  
  window.RetellWidgetLoader = {
    loaded: false,
    widgets: []
  };
  
  // Widget styling
  const WIDGET_STYLES = \`
    .retell-embed-widget {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      display: inline-block;
      position: relative;
    }
    
    .retell-embed-button {
      background: linear-gradient(135deg, #3b82f6 0%, #1e40af 100%);
      color: white;
      border: none;
      padding: 12px 24px;
      border-radius: 8px;
      font-size: 14px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s ease;
      box-shadow: 0 2px 4px rgba(59, 130, 246, 0.3);
      min-width: 150px;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
    }
    
    .retell-embed-button:hover {
      transform: translateY(-1px);
      box-shadow: 0 4px 8px rgba(59, 130, 246, 0.4);
    }
    
    .retell-embed-button.connecting {
      background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
      cursor: wait;
    }
    
    .retell-embed-button.connected {
      background: linear-gradient(135deg, #10b981 0%, #059669 100%);
      animation: retell-pulse 2s infinite;
    }
    
    .retell-embed-button.error {
      background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
    }
    
    .retell-spinner {
      width: 16px;
      height: 16px;
      border: 2px solid rgba(255, 255, 255, 0.3);
      border-radius: 50%;
      border-top-color: white;
      animation: retell-spin 1s linear infinite;
    }
    
    @keyframes retell-spin {
      to { transform: rotate(360deg); }
    }
    
    @keyframes retell-pulse {
      0%, 100% { 
        box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);
        transform: translateY(-1px);
      }
      50% { 
        box-shadow: 0 8px 25px rgba(16, 185, 129, 0.6);
        transform: translateY(-2px);
      }
    }
  \`;
  
  function injectStyles() {
    if (!document.getElementById('retell-embed-styles')) {
      const style = document.createElement('style');
      style.id = 'retell-embed-styles';
      style.textContent = WIDGET_STYLES;
      document.head.appendChild(style);
    }
  }
  
  class RetellSimpleWidget {
    constructor(element, config) {
      this.element = element;
      this.config = config;
      this.widgetId = config.widgetId;
      this.buttonText = config.buttonText || 'Start Voice Call';
      this.baseUrl = config.baseUrl || window.location.origin;
      this.isConnected = false;
      this.callState = 'idle';
      
      this.init();
    }
    
    init() {
      this.createWidget();
    }
    
    createWidget() {
      const container = document.createElement('div');
      container.className = 'retell-embed-widget';
      
      const button = document.createElement('button');
      button.className = 'retell-embed-button';
      button.innerHTML = \`
        <span class="retell-icon">🎤</span>
        <span class="retell-text">\${this.buttonText}</span>
      \`;
      
      button.addEventListener('click', () => this.handleButtonClick());
      
      container.appendChild(button);
      this.element.appendChild(container);
      
      this.container = container;
      this.button = button;
    }
    
    async handleButtonClick() {
      if (this.isConnected) {
        await this.endCall();
      } else {
        await this.startCall();
      }
    }
    
    async startCall() {
      try {
        this.setState('connecting');
        
        // Request microphone permission
        console.log('🎤 Requesting microphone permission...');
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        stream.getTracks().forEach(track => track.stop()); // Stop immediately, just testing permission
        
        console.log('📞 Registering call...');
        const response = await fetch(\`\${this.baseUrl}/api/v1/register-call\`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Origin': window.location.origin
          },
          body: JSON.stringify({
            widget_id: this.widgetId,
            metadata: this.getMetadata()
          })
        });
        
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.error || \`HTTP \${response.status}: \${response.statusText}\`);
        }
        
        const callData = await response.json();
        console.log('✅ Call registered:', callData.call_id);
        console.log('🔗 Access token received');
        
        // Create inline iframe for voice widget
        console.log('🚀 Loading voice widget inline...');
        this.createVoiceModal(callData.access_token);
        
        this.setState('connected');
        this.isConnected = true;
        
      } catch (error) {
        console.error('❌ Call failed:', error);
        this.setState('error');
        setTimeout(() => this.setState('idle'), 3000);
      }
    }
    
    createVoiceModal(accessToken) {
      // Create modal overlay
      const overlay = document.createElement('div');
      overlay.style.cssText = \`
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.8);
        z-index: 10000;
        display: flex;
        align-items: center;
        justify-content: center;
      \`;
      
      // Create modal content
      const modal = document.createElement('div');
      modal.style.cssText = \`
        background: white;
        border-radius: 12px;
        padding: 20px;
        max-width: 400px;
        width: 90%;
        max-height: 80%;
        position: relative;
        box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3);
      \`;
      
      // Create close button
      const closeBtn = document.createElement('button');
      closeBtn.innerHTML = '×';
      closeBtn.style.cssText = \`
        position: absolute;
        top: 10px;
        right: 15px;
        background: none;
        border: none;
        font-size: 24px;
        cursor: pointer;
        color: #666;
        width: 30px;
        height: 30px;
        display: flex;
        align-items: center;
        justify-content: center;
      \`;
      
      closeBtn.addEventListener('click', () => {
        document.body.removeChild(overlay);
        this.endCall();
      });
      
      // Create iframe for voice call page
      const iframe = document.createElement('iframe');
      const voiceUrl = \`\${this.baseUrl}/voice-call?token=\${encodeURIComponent(accessToken)}\`;
      iframe.src = voiceUrl;
      iframe.style.cssText = \`
        width: 100%;
        height: 300px;
        border: none;
        border-radius: 8px;
      \`;
      iframe.allow = 'microphone';
      
      // Add title
      const title = document.createElement('h3');
      title.textContent = 'Voice Call';
      title.style.cssText = \`
        margin: 0 0 15px 0;
        color: #333;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      \`;
      
      modal.appendChild(closeBtn);
      modal.appendChild(title);
      modal.appendChild(iframe);
      overlay.appendChild(modal);
      document.body.appendChild(overlay);
      
      this.voiceModal = overlay;
      
      // Close on overlay click
      overlay.addEventListener('click', (e) => {
        if (e.target === overlay) {
          document.body.removeChild(overlay);
          this.endCall();
        }
      });
    }

    async endCall() {
      if (this.voiceModal && this.voiceModal.parentNode) {
        document.body.removeChild(this.voiceModal);
        this.voiceModal = null;
      }
      
      this.setState('idle');
      this.isConnected = false;
      console.log('📞 Call ended');
    }
    
    setState(state) {
      this.callState = state;
      
      if (!this.button) return;
      
      this.button.className = \`retell-embed-button \${state}\`;
      
      const iconEl = this.button.querySelector('.retell-icon');
      const textEl = this.button.querySelector('.retell-text');
      
      switch (state) {
        case 'connecting':
          iconEl.innerHTML = '<div class="retell-spinner"></div>';
          textEl.textContent = 'Connecting...';
          break;
        case 'connected':
          iconEl.textContent = '📞';
          textEl.textContent = 'End Call';
          break;
        case 'error':
          iconEl.textContent = '❌';
          textEl.textContent = 'Call Failed';
          break;
        default:
          iconEl.textContent = '🎤';
          textEl.textContent = this.buttonText;
      }
    }
    
    getMetadata() {
      const metadata = {
        page_url: window.location.href,
        page_title: document.title,
        timestamp: new Date().toISOString(),
        user_agent: navigator.userAgent,
        widget_version: '3.1.0-simple'
      };
      
      // Find the metadata form for this specific widget
      const metadataForm = document.querySelector(\`form.retell-metadata[data-widget-id="\${this.widgetId}"]\`);
      
      if (metadataForm) {
        console.log('📝 Found metadata form for widget:', this.widgetId);
        
        // Collect all hidden inputs from this widget's form
        const hiddenInputs = metadataForm.querySelectorAll('input[type="hidden"]');
        hiddenInputs.forEach(input => {
          if (input.name && input.value) {
            metadata[input.name] = input.value;
          }
        });
      } else {
        console.log('ℹ️ No metadata form found for widget:', this.widgetId);
      }
      
      console.log('📊 Final metadata for widget', this.widgetId + ':', metadata);
      return metadata;
    }
  }
  
  function initializeWidgets() {
    injectStyles();
    
    // Find all script tags with data-widget-id
    const scripts = document.querySelectorAll('script[data-widget-id]');
    
    scripts.forEach(script => {
      const widgetId = script.getAttribute('data-widget-id');
      const buttonText = script.getAttribute('data-button-text');
      const customClass = script.getAttribute('data-class');
      
      if (widgetId && !script.dataset.initialized) {
        script.dataset.initialized = 'true';
        
        const container = document.createElement('div');
        if (customClass) {
          container.className = customClass;
        }
        
        script.parentNode.insertBefore(container, script.nextSibling);
        
        const widget = new RetellSimpleWidget(container, {
          widgetId,
          buttonText
        });
        
        window.RetellWidgetLoader.widgets.push(widget);
      }
    });
  }
  
  // Initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeWidgets);
  } else {
    initializeWidgets();
  }
  
})();
`;

  return new NextResponse(widgetScript, {
    headers: {
      'Content-Type': 'application/javascript',
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0',
    },
  });
}