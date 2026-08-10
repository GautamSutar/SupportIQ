const express = require('express');
const router = express.Router();
const Conversation = require('../models/conversation');

async function computeMetrics() {
  const conversations = await Conversation.find({});
  const total = conversations.length;

  const active = conversations.filter(c => c.status === 'active').length;
  const resolved = conversations.filter(c => c.status === 'resolved').length;
  const escalated = conversations.filter(c => c.status === 'escalated').length;

  const withTiming = conversations.filter(c => typeof c.metrics?.responseTime === 'number');
  const avgResponseTime = withTiming.length
    ? withTiming.reduce((sum, c) => sum + c.metrics.responseTime, 0) / withTiming.length
    : 0;

  const withSentiment = conversations.filter(c => typeof c.metrics?.sentiment === 'number');
  const csat = withSentiment.length
    ? (withSentiment.reduce((sum, c) => sum + c.metrics.sentiment, 0) / withSentiment.length) * 10
    : 0;

  return {
    active,
    total,
    resolutionRate: total ? Math.round((resolved / total) * 100) : 0,
    escalationRate: total ? Math.round((escalated / total) * 100) : 0,
    avgResponseTime,
    csat,
    timestamp: new Date(),
  };
}

// GET /api/analytics - one-shot snapshot
router.get('/', async (_req, res, next) => {
  try {
    res.json(await computeMetrics());
  } catch (err) {
    next(err);
  }
});

// GET /api/analytics/stream - Server-Sent Events, pushes live dashboard metrics every 2s
router.get('/stream', async (req, res) => {
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    Connection: 'keep-alive',
    'X-Accel-Buffering': 'no',
  });
  res.flushHeaders?.();

  const push = async () => {
    try {
      const metrics = await computeMetrics();
      res.write(`data: ${JSON.stringify(metrics)}\n\n`);
    } catch (err) {
      console.error('SSE metrics push failed:', err.message);
    }
  };

  await push();
  const interval = setInterval(push, 2000);

  req.on('close', () => {
    clearInterval(interval);
    res.end();
  });
});

module.exports = router;
