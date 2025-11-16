import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const widgetScript = `
(function() {
  'use strict';
  
  // Prevent multiple loads
  if (window.RetellWidgetLoader) {
    return;
  }
  
  window.RetellWidgetLoader = {
    loaded: false,
    queue: [],
    widgets: []
  };
  
  // Widget configuration and styling
  const WIDGET_STYLES = \`
    .retell-embed-widget {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      display: inline-block;
      position: relative;
    }
    
    .retell-embed-button {
      background: var(--retell-bg, linear-gradient(135deg, #3b82f6 0%, #1e40af 100%));
      color: var(--retell-color, white);
      border: none;
      padding: var(--retell-padding, 12px 24px);
      border-radius: var(--retell-radius, 8px);
      font-size: var(--retell-font-size, 14px);
      font-weight: var(--retell-font-weight, 600);
      cursor: pointer;
      transition: all 0.2s ease;
      box-shadow: var(--retell-shadow, 0 2px 4px rgba(59, 130, 246, 0.3));
      min-width: var(--retell-min-width, 150px);
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      width: var(--retell-width, auto);
      height: var(--retell-height, auto);
    }
    
    .retell-embed-button:hover {
      transform: var(--retell-hover-transform, translateY(-1px));
      box-shadow: var(--retell-hover-shadow, 0 4px 8px rgba(59, 130, 246, 0.4));
    }
    
    .retell-embed-button.connecting {
      background: var(--retell-connecting-bg, linear-gradient(135deg, #f59e0b 0%, #d97706 100%));
      cursor: wait;
    }
    
    .retell-embed-button.connected {
      background: var(--retell-connected-bg, linear-gradient(135deg, #10b981 0%, #059669 100%));
      animation: retell-pulse 2s infinite;
    }
    
    .retell-embed-button.error {
      background: var(--retell-error-bg, linear-gradient(135deg, #ef4444 0%, #dc2626 100%));
    }
    
    .retell-spinner {
      width: 16px;
      height: 16px;
      border: 2px solid rgba(255, 255, 255, 0.3);
      border-radius: 50%;
      border-top-color: white;
      animation: retell-spin 1s linear infinite;
    }
    
    /* Custom theme classes */
    .retell-theme-minimal .retell-embed-button {
      background: transparent;
      color: #374151;
      border: 2px solid #d1d5db;
      box-shadow: none;
    }
    
    .retell-theme-minimal .retell-embed-button:hover {
      border-color: #3b82f6;
      color: #3b82f6;
      transform: none;
      box-shadow: none;
    }
    
    .retell-theme-dark .retell-embed-button {
      background: linear-gradient(135deg, #1f2937 0%, #111827 100%);
      color: #f3f4f6;
      border: 1px solid #374151;
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
  
  class RetellEmbedWidget {
    constructor(element, config) {
      this.element = element;
      this.config = config;
      this.widgetId = config.widgetId;
      this.buttonText = config.buttonText || 'Start Voice Call';
      this.theme = config.theme || 'default';
      this.baseUrl = config.baseUrl || this.getBaseUrl();
      this.isConnected = false;
      this.retellClient = null;
      this.callState = 'idle';
      
      this.init();
    }
    
    getBaseUrl() {
      return window.location.origin;
    }
    
    init() {
      this.createWidget();
      this.loadRetellSDK().then(() => {
        this.initializeRetellClient();
      }).catch(err => {
        console.error('Failed to load Retell SDK:', err);
      });
    }
    
    async loadRetellSDK() {
      if (window.RetellWebClient) {
        return Promise.resolve();
      }
      
      try {
        // First, load dependencies via CDN
        await this.loadDependencies();
        
        // Then try to load via ES modules with import map
        return new Promise((resolve, reject) => {
          // Create import map for dependencies
          const importMap = document.createElement('script');
          importMap.type = 'importmap';
          importMap.textContent = JSON.stringify({
            imports: {
              'eventemitter3': 'https://unpkg.com/eventemitter3@5.0.1/index.mjs',
              'livekit-client': 'https://unpkg.com/livekit-client@2.5.1/dist/livekit-client.esm.mjs'
            }
          });
          
          // Only add import map if one doesn't exist
          if (!document.querySelector('script[type="importmap"]')) {
            document.head.appendChild(importMap);
          }
          
          // Small delay to ensure import map is processed
          setTimeout(() => {
            const script = document.createElement('script');
            script.type = 'module';
            script.textContent = \`
              try {
                const { RetellWebClient } = await import('https://unpkg.com/retell-client-js-sdk@2.0.7/dist/index.modern.mjs');
                window.RetellWebClient = RetellWebClient;
                window.dispatchEvent(new CustomEvent('retell-sdk-loaded'));
              } catch (error) {
                console.error('Failed to load Retell SDK:', error);
                window.dispatchEvent(new CustomEvent('retell-sdk-error', { detail: error }));
              }
            \`;
            
            window.addEventListener('retell-sdk-loaded', resolve, { once: true });
            window.addEventListener('retell-sdk-error', (e) => reject(e.detail), { once: true });
            document.head.appendChild(script);
          }, 100);
        });
        
      } catch (error) {
        console.error('Failed to load dependencies:', error);
        throw error;
      }
    }
    
    async loadDependencies() {
      // Load dependencies via script tags as fallback
      return Promise.all([
        this.loadScript('https://unpkg.com/eventemitter3@5.0.1/dist/eventemitter3.umd.min.js', 'EventEmitter'),
        this.loadScript('https://unpkg.com/livekit-client@2.5.1/dist/livekit-client.umd.js', 'LiveKit')
      ]);
    }
    
    loadScript(src, globalName) {
      return new Promise((resolve, reject) => {
        const script = document.createElement('script');
        script.src = src;
        script.crossOrigin = 'anonymous';
        script.onload = () => resolve();
        script.onerror = () => reject(new Error(\`Failed to load \${globalName}\`));
        document.head.appendChild(script);
      });
    }
    
    initializeRetellClient() {
      if (!window.RetellWebClient) {
        console.error('RetellWebClient not available');
        return;
      }
      
      this.retellClient = new window.RetellWebClient();
      
      this.retellClient.on("call_started", () => {
        console.log("🎉 Voice call started");
        this.setState('connected');
      });

      this.retellClient.on("call_ended", () => {
        console.log("📞 Voice call ended");
        this.setState('idle');
      });

      this.retellClient.on("agent_start_talking", () => {
        console.log("🤖 Agent started talking");
      });

      this.retellClient.on("agent_stop_talking", () => {
        console.log("🤖 Agent stopped talking");
      });

      this.retellClient.on("update", (update) => {
        console.log("📝 Transcript update:", update);
      });

      this.retellClient.on("error", (error) => {
        console.error("❌ Retell error:", error);
        this.setState('error');
        setTimeout(() => this.setState('idle'), 3000);
      });
    }
    
    createWidget() {
      const container = document.createElement('div');
      container.className = \`retell-embed-widget \${this.theme !== 'default' ? 'retell-theme-' + this.theme : ''}\`;
      
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
        
        if (this.retellClient) {
          console.log('🎙️ Starting voice call...');
          await this.retellClient.startCall({
            accessToken: callData.access_token,
          });
        } else {
          throw new Error('Retell SDK not loaded');
        }
        
      } catch (error) {
        console.error('❌ Call failed:', error);
        this.setState('error');
        setTimeout(() => this.setState('idle'), 3000);
      }
    }
    
    async endCall() {
      try {
        this.setState('connecting');
        if (this.retellClient) {
          this.retellClient.stopCall();
        }
      } catch (error) {
        console.error('❌ Error ending call:', error);
        this.setState('idle');
      }
    }
    
    setState(state) {
      this.callState = state;
      this.isConnected = state === 'connected';
      
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
      return {
        page_url: window.location.href,
        page_title: document.title,
        timestamp: new Date().toISOString(),
        user_agent: navigator.userAgent,
        widget_version: '3.0.0-embed'
      };
    }
  }
  
  function initializeWidgets() {
    injectStyles();
    
    // Find all script tags with data-widget-id
    const scripts = document.querySelectorAll('script[data-widget-id]');
    
    scripts.forEach(script => {
      const widgetId = script.getAttribute('data-widget-id');
      const buttonText = script.getAttribute('data-button-text');
      const theme = script.getAttribute('data-theme');
      const customClass = script.getAttribute('data-class');
      
      if (widgetId && !script.dataset.initialized) {
        script.dataset.initialized = 'true';
        
        const container = document.createElement('div');
        if (customClass) {
          container.className = customClass;
        }
        
        script.parentNode.insertBefore(container, script.nextSibling);
        
        const widget = new RetellEmbedWidget(container, {
          widgetId,
          buttonText,
          theme
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
  
  // Export for manual initialization
  window.RetellWidgetLoader.init = initializeWidgets;
  window.RetellWidgetLoader.Widget = RetellEmbedWidget;
  
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