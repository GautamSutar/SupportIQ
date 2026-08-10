// websocket/socketHandler.js
// WebSocket handler for real-time updates, driven by real MongoDB change streams
// (the original starter simulated random fake conversations disconnected from the DB)

const Conversation = require('../models/conversation');
const Agent = require('../models/agent');

const clients = new Set();
let watchersStarted = false;

function broadcast(payload) {
  const data = JSON.stringify(payload);
  clients.forEach(ws => {
    if (ws.readyState === ws.OPEN) ws.send(data);
  });
}

function startWatchers() {
  if (watchersStarted) return;
  watchersStarted = true;

  try {
    const conversationStream = Conversation.watch([], { fullDocument: 'updateLookup' });
    conversationStream.on('change', (change) => {
      if (change.operationType === 'insert') {
        broadcast({ type: 'new_conversation', data: change.fullDocument, timestamp: new Date() });
      } else if (change.operationType === 'update' || change.operationType === 'replace') {
        broadcast({ type: 'conversation_updated', data: change.fullDocument, timestamp: new Date() });
      }
    });
    conversationStream.on('error', (err) => {
      console.error('Conversation change stream error:', err.message);
      watchersStarted = false;
    });

    const agentStream = Agent.watch([], { fullDocument: 'updateLookup' });
    agentStream.on('change', (change) => {
      if (change.operationType === 'update' || change.operationType === 'replace') {
        broadcast({ type: 'agent_update', agentId: change.fullDocument?.id, data: change.fullDocument, timestamp: new Date() });
      }
    });
    agentStream.on('error', (err) => {
      console.error('Agent change stream error:', err.message);
    });
  } catch (err) {
    console.error('Failed to start change streams (requires a replica set):', err.message);
  }
}

module.exports = (ws, req) => {
  clients.add(ws);
  console.log('WebSocket client connected');

  ws.send(JSON.stringify({
    type: 'connection',
    message: 'Connected to Agent Supervisor WebSocket server',
    timestamp: new Date()
  }));

  startWatchers();

  const pingInterval = setInterval(() => {
    if (ws.readyState === ws.OPEN) {
      ws.send(JSON.stringify({ type: 'ping', timestamp: new Date() }));
    }
  }, 30000);

  ws.on('message', (message) => {
    try {
      const parsedMessage = JSON.parse(message);

      switch (parsedMessage.type) {
        case 'subscribe':
          handleSubscription(ws, parsedMessage);
          break;
        case 'pong':
          break;
        default:
          console.log('Received message:', parsedMessage);
      }
    } catch (error) {
      console.error('Error handling WebSocket message:', error);
    }
  });

  ws.on('close', () => {
    console.log('WebSocket client disconnected');
    clients.delete(ws);
    clearInterval(pingInterval);
  });
};

function handleSubscription(ws, message) {
  const { channel } = message;

  ws.send(JSON.stringify({
    type: 'subscription_confirmation',
    channel,
    message: `Subscribed to ${channel}`,
    timestamp: new Date()
  }));
}
