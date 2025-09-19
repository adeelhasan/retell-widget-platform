import { NextRequest, NextResponse } from 'next/server';

// This endpoint serves a bundled widget with the official Retell SDK
export async function GET(request: NextRequest) {
  const widgetCode = `
(function() {
  'use strict';
  
  // Import the Retell SDK - this will be bundled by Next.js
  const { RetellWebClient } = require('retell-client-js-sdk');
  
  class RetellVoiceWidget {
    constructor(config) {
      this.config = config;
      this.widgetId = config.widgetId;
      this.buttonText = config.buttonText || 'Start Voice Call';
      this.baseUrl = config.baseUrl || this.getBaseUrl();
      this.isConnected = false;
      this.retellClient = null;
      
      this.init();
    }
    
    getBaseUrl() {
      const scripts = document.querySelectorAll('script[src*="widget"]');
      for (let script of scripts) {
        const src = script.getAttribute('src');
        if (src) {
          const url = new URL(src, window.location.href);
          return url.origin;
        }
      }
      return window.location.origin;
    }
    
    init() {
      this.injectStyles();
      this.createWidget();
      this.initializeRetellClient();
    }
    
    initializeRetellClient() {
      this.retellClient = new RetellWebClient();
      
      // Set up event listeners
      this.retellClient.on("call_started", () => {
        console.log("🎉 Voice call started");
        this.setState('connected', 'End Call', '📞');
        this.isConnected = true;
      });

      this.retellClient.on("call_ended", () => {
        console.log("📞 Voice call ended");
        this.setState('idle', this.buttonText, '🎤');
        this.isConnected = false;
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
        this.setState('error', 'Call Failed', '❌');
        setTimeout(() => {
          this.setState('idle', this.buttonText, '🎤');
        }, 3000);
      });
    }
    
    injectStyles() {
      if (!document.getElementById('retell-voice-styles')) {
        const styles = document.createElement('style');
        styles.id = 'retell-voice-styles';
        styles.textContent = \`
          .retell-voice-widget {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            position: relative;
            display: inline-block;
          }
          
          .retell-voice-button {
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
          
          .retell-voice-button:hover {
            transform: translateY(-1px);
            box-shadow: 0 4px 8px rgba(59, 130, 246, 0.4);
          }
          
          .retell-voice-button.connecting {
            background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
            cursor: wait;
          }
          
          .retell-voice-button.connected {
            background: linear-gradient(135deg, #10b981 0%, #059669 100%);
            animation: retell-pulse 2s infinite;
          }
          
          .retell-voice-button.error {
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
        document.head.appendChild(styles);
      }
    }
    
    createWidget() {
      const scripts = document.querySelectorAll('script[data-widget-id]');
      
      scripts.forEach(script => {
        if (script.getAttribute('data-widget-id') === this.widgetId) {
          const container = document.createElement('div');
          container.className = 'retell-voice-widget';
          
          const button = document.createElement('button');
          button.className = 'retell-voice-button';
          button.innerHTML = \`
            <span class="retell-icon">🎤</span>
            <span class="retell-text">\${this.buttonText}</span>
          \`;
          
          button.addEventListener('click', () => this.handleButtonClick());
          
          container.appendChild(button);
          script.parentNode.insertBefore(container, script.nextSibling);
          
          this.container = container;
          this.button = button;
        }
      });
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
        this.setState('connecting', 'Connecting...', '⏳');
        
        // Register call with our platform to get access token
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
        console.log('🎙️ Starting voice call with Retell SDK...');
        
        // Start the actual voice call using Retell SDK
        await this.retellClient.startCall({
          accessToken: callData.access_token,
        });
        
      } catch (error) {
        console.error('❌ Call failed:', error);
        this.setState('error', 'Call Failed', '❌');
        
        setTimeout(() => {
          this.setState('idle', this.buttonText, '🎤');
        }, 3000);
      }
    }
    
    async endCall() {
      try {
        this.setState('connecting', 'Ending...', '⏳');
        
        // Stop the Retell call
        this.retellClient.stopCall();
        
      } catch (error) {
        console.error('❌ Error ending call:', error);
        this.setState('idle', this.buttonText, '🎤');
        this.isConnected = false;
      }
    }
    
    setState(state, text, icon) {
      if (!this.button) return;
      
      this.button.className = \`retell-voice-button \${state}\`;
      
      const iconEl = this.button.querySelector('.retell-icon');
      const textEl = this.button.querySelector('.retell-text');
      
      if (state === 'connecting') {
        iconEl.innerHTML = '<div class="retell-spinner"></div>';
      } else {
        iconEl.textContent = icon;
      }
      
      textEl.textContent = text;
    }
    
    getMetadata() {
      return {
        page_url: window.location.href,
        page_title: document.title,
        timestamp: new Date().toISOString(),
        user_agent: navigator.userAgent,
        widget_version: '2.0.0-bundled'
      };
    }
  }
  
  // Auto-initialize widgets when page loads
  function initializeRetellWidgets() {
    const scripts = document.querySelectorAll('script[data-widget-id][src*="widget-bundled"]');
    
    scripts.forEach(script => {
      const widgetId = script.getAttribute('data-widget-id');
      const buttonText = script.getAttribute('data-button-text');
      
      if (widgetId) {
        new RetellVoiceWidget({
          widgetId: widgetId,
          buttonText: buttonText
        });
      }
    });
  }
  
  // Initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeRetellWidgets);
  } else {
    initializeRetellWidgets();
  }
  
})();
`;

  return new NextResponse(widgetCode, {
    headers: {
      'Content-Type': 'application/javascript',
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0',
    },
  });
}