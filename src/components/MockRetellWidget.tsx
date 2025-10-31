'use client';

import React, { useState, useEffect } from 'react';

interface MockRetellWidgetProps {
  buttonText?: string;
}

interface Message {
  role: 'agent' | 'user';
  text: string;
  delay: number; // ms to wait before showing this message
}

const DEMO_CONVERSATION: Message[] = [
  { role: 'agent', text: "Hi! Thanks for trying our demo. I'm an AI voice agent.", delay: 1000 },
  { role: 'user', text: "Hello! This is really cool.", delay: 2500 },
  { role: 'agent', text: "I can help answer questions, schedule appointments, or qualify leads - all through natural voice conversation.", delay: 1500 },
  { role: 'user', text: "How do I create my own widget?", delay: 3000 },
  { role: 'agent', text: "It's super easy! Just sign up for free above, connect your Retell API key, and you'll get an embed code in seconds.", delay: 2000 },
  { role: 'user', text: "That sounds simple!", delay: 2500 },
  { role: 'agent', text: "It really is! You can embed voice AI on any website with just one line of code. Want to give it a try?", delay: 2000 },
];

export default function MockRetellWidget({ buttonText = 'Try Voice Demo' }: MockRetellWidgetProps) {
  const [callState, setCallState] = useState<'idle' | 'connecting' | 'connected' | 'ended'>('idle');
  const [messages, setMessages] = useState<Message[]>([]);
  const [currentMessageIndex, setCurrentMessageIndex] = useState(0);

  // Simulate call flow
  useEffect(() => {
    if (callState === 'connecting') {
      // Simulate connection delay
      const timer = setTimeout(() => {
        setCallState('connected');
        setCurrentMessageIndex(0);
        setMessages([]);
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [callState]);

  // Simulate conversation messages
  useEffect(() => {
    if (callState === 'connected' && currentMessageIndex < DEMO_CONVERSATION.length) {
      const currentMessage = DEMO_CONVERSATION[currentMessageIndex];
      const timer = setTimeout(() => {
        setMessages(prev => [...prev, currentMessage]);
        setCurrentMessageIndex(prev => prev + 1);
      }, currentMessage.delay);
      return () => clearTimeout(timer);
    } else if (callState === 'connected' && currentMessageIndex >= DEMO_CONVERSATION.length) {
      // End call after conversation finishes
      const timer = setTimeout(() => {
        setCallState('ended');
        setTimeout(() => {
          setCallState('idle');
          setMessages([]);
          setCurrentMessageIndex(0);
        }, 3000);
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [callState, currentMessageIndex]);

  const handleButtonClick = () => {
    if (callState === 'idle') {
      setCallState('connecting');
    } else if (callState === 'connected') {
      setCallState('ended');
      setTimeout(() => {
        setCallState('idle');
        setMessages([]);
        setCurrentMessageIndex(0);
      }, 3000);
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
      case 'ended':
        return (
          <>
            <span>✓</span>
            <span>Call Ended</span>
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
        .mock-retell-widget {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          position: relative;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 16px;
          max-width: 600px;
          margin: 0 auto;
        }

        .retell-voice-button {
          background: linear-gradient(135deg, #3b82f6 0%, #1e40af 100%);
          color: white;
          border: none;
          padding: 14px 28px;
          border-radius: 8px;
          font-size: 16px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s ease;
          box-shadow: 0 2px 4px rgba(59, 130, 246, 0.3);
          min-width: 180px;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
        }

        .retell-voice-button:hover:not(:disabled) {
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

        .retell-voice-button.ended {
          background: linear-gradient(135deg, #6b7280 0%, #4b5563 100%);
          cursor: not-allowed;
        }

        .retell-spinner {
          width: 16px;
          height: 16px;
          border: 2px solid rgba(255, 255, 255, 0.3);
          border-radius: 50%;
          border-top-color: white;
          animation: retell-spin 1s linear infinite;
        }

        .demo-disclaimer {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 8px 16px;
          background: linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%);
          border: 1px solid #bfdbfe;
          border-radius: 6px;
          font-size: 13px;
          color: #1e40af;
          margin-top: -8px;
        }

        .conversation-box {
          width: 100%;
          background: white;
          border: 1px solid #e5e7eb;
          border-radius: 12px;
          padding: 20px;
          min-height: 300px;
          max-height: 400px;
          overflow-y: auto;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
        }

        .conversation-box.active {
          animation: fadeIn 0.3s ease;
        }

        .message {
          margin-bottom: 16px;
          animation: slideIn 0.3s ease;
        }

        .message-role {
          font-size: 12px;
          font-weight: 600;
          color: #6b7280;
          margin-bottom: 4px;
          text-transform: uppercase;
        }

        .message-role.agent {
          color: #3b82f6;
        }

        .message-role.user {
          color: #10b981;
        }

        .message-text {
          background: #f9fafb;
          padding: 10px 14px;
          border-radius: 8px;
          font-size: 14px;
          line-height: 1.5;
          color: #1f2937;
        }

        .message.agent .message-text {
          background: #eff6ff;
          border-left: 3px solid #3b82f6;
        }

        .message.user .message-text {
          background: #f0fdf4;
          border-left: 3px solid #10b981;
        }

        .call-status {
          text-align: center;
          padding: 40px 20px;
          color: #6b7280;
          font-size: 14px;
        }

        .call-status-icon {
          font-size: 48px;
          margin-bottom: 12px;
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

        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: scale(0.98);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }

        @keyframes slideIn {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>

      <div className="mock-retell-widget">
        <button
          className={`retell-voice-button ${callState}`}
          onClick={handleButtonClick}
          disabled={callState === 'connecting' || callState === 'ended'}
        >
          {getButtonContent()}
        </button>

        <div className="demo-disclaimer">
          <span>🎬</span>
          <span>This is a simulated demo. Sign up above to create real AI voice widgets!</span>
        </div>

        {(callState === 'connected' || callState === 'ended') && (
          <div className={`conversation-box ${callState === 'connected' ? 'active' : ''}`}>
            {messages.length === 0 && callState === 'connected' && (
              <div className="call-status">
                <div className="call-status-icon">🎙️</div>
                <div>Call connected! Starting conversation...</div>
              </div>
            )}

            {messages.map((message, index) => (
              <div key={index} className={`message ${message.role}`}>
                <div className={`message-role ${message.role}`}>
                  {message.role === 'agent' ? '🤖 AI Agent' : '👤 You'}
                </div>
                <div className="message-text">{message.text}</div>
              </div>
            ))}

            {callState === 'ended' && (
              <div className="call-status">
                <div className="call-status-icon">✓</div>
                <div>Call ended. Thanks for trying the demo!</div>
              </div>
            )}
          </div>
        )}
      </div>
    </>
  );
}
