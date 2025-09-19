'use client';

import React, { useEffect, useState, useRef } from 'react';
import { RetellWebClient } from 'retell-client-js-sdk';

interface RetellWidgetProps {
  widgetId: string;
  buttonText?: string;
  baseUrl?: string;
}

export default function RetellWidget({ widgetId, buttonText = 'Start Voice Call', baseUrl }: RetellWidgetProps) {
  const [callState, setCallState] = useState<'idle' | 'connecting' | 'connected' | 'error'>('idle');
  const [isConnected, setIsConnected] = useState(false);
  const retellClientRef = useRef<RetellWebClient | null>(null);

  useEffect(() => {
    // Initialize Retell client
    retellClientRef.current = new RetellWebClient();
    const retellClient = retellClientRef.current;

    // Set up event listeners
    retellClient.on("call_started", () => {
      console.log("🎉 Voice call started");
      setCallState('connected');
      setIsConnected(true);
    });

    retellClient.on("call_ended", () => {
      console.log("📞 Voice call ended");
      setCallState('idle');
      setIsConnected(false);
    });

    retellClient.on("agent_start_talking", () => {
      console.log("🤖 Agent started talking");
    });

    retellClient.on("agent_stop_talking", () => {
      console.log("🤖 Agent stopped talking");
    });

    retellClient.on("update", (update: any) => {
      console.log("📝 Transcript update:", update);
    });

    retellClient.on("error", (error: any) => {
      console.error("❌ Retell error:", error);
      setCallState('error');
      setTimeout(() => {
        setCallState('idle');
      }, 3000);
    });

    return () => {
      // Cleanup on unmount
      if (retellClient && isConnected) {
        retellClient.stopCall();
      }
    };
  }, [isConnected]);

  const getBaseUrl = () => {
    if (baseUrl) return baseUrl;
    return window.location.origin;
  };

  const getMetadata = () => {
    return {
      page_url: window.location.href,
      page_title: document.title,
      timestamp: new Date().toISOString(),
      user_agent: navigator.userAgent,
      widget_version: '2.0.0-react'
    };
  };

  const startCall = async () => {
    try {
      setCallState('connecting');
      
      // Register call with our platform to get access token
      console.log('📞 Registering call...');
      const response = await fetch(`${getBaseUrl()}/api/v1/register-call`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Origin': window.location.origin
        },
        body: JSON.stringify({
          widget_id: widgetId,
          metadata: getMetadata()
        })
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
      }
      
      const callData = await response.json();
      console.log('✅ Call registered:', callData.call_id);
      console.log('🎙️ Starting voice call with Retell SDK...');
      
      // Start the actual voice call using Retell SDK
      if (retellClientRef.current) {
        await retellClientRef.current.startCall({
          accessToken: callData.access_token,
        });
      }
      
    } catch (error) {
      console.error('❌ Call failed:', error);
      setCallState('error');
      
      setTimeout(() => {
        setCallState('idle');
      }, 3000);
    }
  };

  const endCall = async () => {
    try {
      setCallState('connecting');
      
      // Stop the Retell call
      if (retellClientRef.current) {
        retellClientRef.current.stopCall();
      }
      
    } catch (error) {
      console.error('❌ Error ending call:', error);
      setCallState('idle');
      setIsConnected(false);
    }
  };

  const handleButtonClick = () => {
    if (isConnected) {
      endCall();
    } else {
      startCall();
    }
  };

  const getButtonContent = () => {
    switch (callState) {
      case 'connecting':
        return (
          <>
            <div className="retell-spinner"></div>
            <span>Connecting...</span>
          </>
        );
      case 'connected':
        return (
          <>
            <span>📞</span>
            <span>End Call</span>
          </>
        );
      case 'error':
        return (
          <>
            <span>❌</span>
            <span>Call Failed</span>
          </>
        );
      default:
        return (
          <>
            <span>🎤</span>
            <span>{buttonText}</span>
          </>
        );
    }
  };

  return (
    <>
      <style jsx>{`
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
      `}</style>
      
      <div className="retell-voice-widget">
        <button 
          className={`retell-voice-button ${callState}`}
          onClick={handleButtonClick}
          disabled={callState === 'connecting'}
        >
          {getButtonContent()}
        </button>
      </div>
    </>
  );
}