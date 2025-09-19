import RetellWidget from '@/components/RetellWidget';

export default function WidgetReactTest() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-2xl p-12 max-w-2xl w-full text-center">
        <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl mx-auto mb-6 flex items-center justify-center text-white text-2xl font-bold">
          🎤
        </div>
        
        <h1 className="text-4xl font-bold text-gray-900 mb-3">
          React Voice Widget Test
        </h1>
        
        <p className="text-lg text-gray-600 mb-8">
          Official Retell SDK integration with proper React bundling
        </p>

        <div className="bg-gray-50 border-2 border-dashed border-gray-300 rounded-2xl p-8 mb-8">
          <div className="text-sm font-medium text-gray-500 mb-4 uppercase tracking-wide">
            Live Voice Widget with Official SDK
          </div>
          
          <RetellWidget 
            widgetId="b36cbed4-0f4f-4af0-9e4f-5e721bb4d7d5"
            buttonText="Start Voice Call"
          />
          
          <p className="text-sm text-gray-500 mt-4">
            ↑ This widget uses the official Retell SDK with proper bundling
          </p>
        </div>

        <div className="bg-green-50 border border-green-200 rounded-xl p-4 mb-6">
          <h4 className="text-green-800 font-semibold text-sm mb-2">
            ✅ Official SDK Integration
          </h4>
          <p className="text-green-700 text-sm">
            This widget uses the official retell-client-js-sdk with proper React bundling,
            event handling, and WebRTC voice streaming capabilities.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-blue-50 p-4 rounded-lg border-l-4 border-blue-400">
            <h4 className="text-blue-800 font-semibold text-sm mb-1">🎙️ Real Voice Stream</h4>
            <p className="text-blue-700 text-xs">Full WebRTC audio connection to Retell</p>
          </div>
          
          <div className="bg-purple-50 p-4 rounded-lg border-l-4 border-purple-400">
            <h4 className="text-purple-800 font-semibold text-sm mb-1">📡 Live Events</h4>
            <p className="text-purple-700 text-xs">Real-time call state and transcript updates</p>
          </div>
          
          <div className="bg-green-50 p-4 rounded-lg border-l-4 border-green-400">
            <h4 className="text-green-800 font-semibold text-sm mb-1">🔐 Secure API</h4>
            <p className="text-green-700 text-xs">Protected access tokens via server endpoint</p>
          </div>
          
          <div className="bg-yellow-50 p-4 rounded-lg border-l-4 border-yellow-400">
            <h4 className="text-yellow-800 font-semibold text-sm mb-1">🎛️ Full Control</h4>
            <p className="text-yellow-700 text-xs">Complete call lifecycle management</p>
          </div>
        </div>
      </div>
    </div>
  );
}