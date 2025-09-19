'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { RetellWebClient } from 'retell-client-js-sdk';

export default function VoiceCallPage() {
  const searchParams = useSearchParams();
  const [callState, setCallState] = useState<'connecting' | 'connected' | 'ended' | 'error'>('connecting');
  const [retellClient, setRetellClient] = useState<RetellWebClient | null>(null);
  const [callDuration, setCallDuration] = useState<number>(0);
  const [callStartTime, setCallStartTime] = useState<number | null>(null);

  useEffect(() => {
    const token = searchParams.get('token');
    
    if (!token) {
      setCallState('error');
      return;
    }

    // Initialize and auto-start the call
    initializeCall(token);
  }, [searchParams]);

  // Timer effect for call duration
  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (callState === 'connected' && callStartTime) {
      interval = setInterval(() => {
        setCallDuration(Math.floor((Date.now() - callStartTime) / 1000));
      }, 1000);
    }
    
    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [callState, callStartTime]);

  const initializeCall = async (accessToken: string) => {
    try {
      const client = new RetellWebClient();
      setRetellClient(client);

      // Set up event listeners
      client.on("call_started", () => {
        console.log("🎉 Voice call started");
        setCallState('connected');
        setCallStartTime(Date.now());
      });

      client.on("call_ended", () => {
        console.log("📞 Voice call ended");
        setCallState('ended');
        // Notify parent window to close modal
        if (window.parent !== window) {
          window.parent.postMessage({ type: 'call-ended' }, '*');
        }
      });

      client.on("agent_start_talking", () => {
        console.log("🤖 Agent started talking");
      });

      client.on("agent_stop_talking", () => {
        console.log("🤖 Agent stopped talking");
      });

      client.on("update", (update: unknown) => {
        console.log("📝 Transcript update:", update);
      });

      client.on("error", (error: unknown) => {
        console.error("❌ Retell error:", error);
        setCallState('error');
      });

      // Auto-start the call
      console.log('🎙️ Starting voice call automatically...');
      await client.startCall({
        accessToken: accessToken,
      });

    } catch (error) {
      console.error('❌ Failed to initialize call:', error);
      setCallState('error');
    }
  };

  const endCall = () => {
    if (retellClient) {
      retellClient.stopCall();
    }
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getStateContent = () => {
    switch (callState) {
      case 'connecting':
        return (
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <h3 className="text-lg font-semibold text-gray-800 mb-2">Connecting...</h3>
            <p className="text-sm text-gray-600">Starting your voice call</p>
          </div>
        );
      
      case 'connected':
        return (
          <div className="text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <div className="w-4 h-4 bg-green-500 rounded-full animate-pulse"></div>
            </div>
            <h3 className="text-lg font-semibold text-gray-800 mb-2">Connected</h3>
            <p className="text-sm text-gray-600 mb-2">You&apos;re now talking with the AI agent</p>
            <div className="text-lg font-mono text-green-600 mb-4">
              {formatDuration(callDuration)}
            </div>
            <button
              onClick={endCall}
              className="bg-red-500 hover:bg-red-600 text-white px-6 py-2 rounded-lg font-medium transition-colors"
            >
              End Call
            </button>
          </div>
        );
      
      case 'ended':
        return (
          <div className="text-center">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl">📞</span>
            </div>
            <h3 className="text-lg font-semibold text-gray-800 mb-2">Call Ended</h3>
            <p className="text-sm text-gray-600">Thank you for using our voice service</p>
          </div>
        );
      
      case 'error':
        return (
          <div className="text-center">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl">❌</span>
            </div>
            <h3 className="text-lg font-semibold text-gray-800 mb-2">Connection Failed</h3>
            <p className="text-sm text-gray-600">Unable to start the voice call</p>
          </div>
        );
      
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full">
        {getStateContent()}
      </div>
    </div>
  );
}