const io = require('socket.io-client');

// Test configuration
const AI_SERVICE_URL = 'http://localhost:3004';
const TOKEN = process.argv[2] || '';
const TEST_MESSAGE = process.argv[3] || 'What is Azure?';

console.log('🧪 Testing AI Chat Service');
console.log('═══════════════════════════════════════════════════════════');

// Connect to the AI service
const socket = io(`${AI_SERVICE_URL}/chat`, {
  auth: {
    token: TOKEN,
  },
  reconnection: false,
  transports: ['websocket'],
});

// Track test start time
const startTime = Date.now();
let responseReceived = false;

// Connection handlers
socket.on('connect', () => {
  console.log('✅ Connected to AI service');
  console.log(`📤 Sending message: "${TEST_MESSAGE}"`);
  
  socket.emit('sendMessage', {
    message: TEST_MESSAGE,
  });
});

socket.on('connected', (data) => {
  console.log('✅ Welcome message:', data.message);
});

socket.on('messageChunk', (data) => {
  if (!responseReceived) {
    console.log('📥 Receiving AI response...');
    responseReceived = true;
  }
  process.stdout.write(data.chunk);
});

socket.on('messageComplete', (data) => {
  const responseTime = Date.now() - startTime;
  console.log('\n\n✅ Response complete');
  console.log('═══════════════════════════════════════════════════════════');
  console.log(`⏱️  Response time: ${responseTime}ms (${(responseTime / 1000).toFixed(2)}s)`);
  
  if (data.conversationId) {
    console.log(`💬 Conversation ID: ${data.conversationId}`);
  }
  
  if (data.messageId) {
    console.log(`📝 Message ID: ${data.messageId}`);
  }
  
  // Performance validation
  if (responseTime < 2000) {
    console.log('✅ Performance: Excellent (< 2s)');
  } else if (responseTime < 5000) {
    console.log('✅ Performance: Good (< 5s)');
  } else {
    console.log('⚠️  Performance: Slow (> 5s)');
  }
  
  socket.disconnect();
  process.exit(0);
});

socket.on('error', (error) => {
  console.error('❌ Error:', error);
  socket.disconnect();
  process.exit(1);
});

socket.on('disconnect', () => {
  console.log('🔌 Disconnected from AI service');
});

// Timeout after 30 seconds
setTimeout(() => {
  console.error('❌ Test timeout (30s)');
  socket.disconnect();
  process.exit(1);
}, 30000);
