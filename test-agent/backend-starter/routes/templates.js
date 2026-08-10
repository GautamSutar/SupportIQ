// routes/templates.js
const express = require('express');
const router = express.Router();
const ResponseTemplate = require('../models/responseTemplate');
const { generateId } = require('../utils/helpers');

// GET /api/templates?category=&isShared=&search=
router.get('/', async (req, res, next) => {
  try {
    const { category, isShared, search } = req.query;
    const filter = {};
    if (category && category !== 'all') filter.category = category;
    if (isShared !== undefined) filter.isShared = isShared === 'true';
    if (search) filter.name = { $regex: search, $options: 'i' };

    const templates = await ResponseTemplate.find(filter).sort({ createdAt: -1 });
    res.json(templates);
  } catch (err) {
    next(err);
  }
});

// GET /api/templates/:id
router.get('/:id', async (req, res, next) => {
  try {
    const template = await ResponseTemplate.findOne({ id: req.params.id });
    if (!template) return res.status(404).json({ message: 'Template not found' });
    res.json(template);
  } catch (err) {
    next(err);
  }
});

// POST /api/templates
router.post('/', async (req, res, next) => {
  try {
    const { name, category, content, variables, createdBy, isShared } = req.body;

    if (!name || !category || !content) {
      return res.status(400).json({ message: 'name, category and content are required' });
    }

    const template = new ResponseTemplate({
      id: generateId('tmpl'),
      name,
      category,
      content,
      variables: variables || extractVariables(content),
      createdBy: createdBy || 'supervisor',
      isShared: !!isShared,
    });

    await template.save();
    res.status(201).json(template);
  } catch (err) {
    next(err);
  }
});

// PUT /api/templates/:id
router.put('/:id', async (req, res, next) => {
  try {
    const { name, category, content, variables, isShared } = req.body;
    const template = await ResponseTemplate.findOne({ id: req.params.id });
    if (!template) return res.status(404).json({ message: 'Template not found' });

    if (name !== undefined) template.name = name;
    if (category !== undefined) template.category = category;
    if (content !== undefined) {
      template.content = content;
      template.variables = variables || extractVariables(content);
    }
    if (isShared !== undefined) template.isShared = isShared;

    await template.save();
    res.json(template);
  } catch (err) {
    next(err);
  }
});

// DELETE /api/templates/:id
router.delete('/:id', async (req, res, next) => {
  try {
    const result = await ResponseTemplate.deleteOne({ id: req.params.id });
    if (result.deletedCount === 0) return res.status(404).json({ message: 'Template not found' });
    res.json({ message: 'Template deleted' });
  } catch (err) {
    next(err);
  }
});

// POST /api/templates/:id/render - substitute {{variables}} with provided values
router.post('/:id/render', async (req, res, next) => {
  try {
    const { values = {} } = req.body;
    const template = await ResponseTemplate.findOne({ id: req.params.id });
    if (!template) return res.status(404).json({ message: 'Template not found' });

    const segments = renderTemplate(template.content, values);
    res.json({
      rendered: segments.map(s => s.text).join(''),
      segments, // [{ text, isVariable, resolved }] so the client can highlight substitutions
    });
  } catch (err) {
    next(err);
  }
});

function extractVariables(content) {
  const matches = [...content.matchAll(/{{\s*([\w.]+)\s*}}/g)];
  const seen = new Set();
  return matches
    .map(m => m[1])
    .filter(name => (seen.has(name) ? false : seen.add(name)))
    .map(name => ({ name, description: '' }));
}

function renderTemplate(content, values) {
  const segments = [];
  const regex = /{{\s*([\w.]+)\s*}}/g;
  let lastIndex = 0;
  let match;

  while ((match = regex.exec(content)) !== null) {
    if (match.index > lastIndex) {
      segments.push({ text: content.slice(lastIndex, match.index), isVariable: false });
    }
    const varName = match[1];
    const hasValue = Object.prototype.hasOwnProperty.call(values, varName) && values[varName] !== '';
    segments.push({
      text: hasValue ? String(values[varName]) : `{{${varName}}}`,
      isVariable: true,
      resolved: hasValue,
      name: varName,
    });
    lastIndex = regex.lastIndex;
  }

  if (lastIndex < content.length) {
    segments.push({ text: content.slice(lastIndex), isVariable: false });
  }

  return segments;
}

module.exports = router;
