// backend/utils/cvParser.js
// Extract text from CV files (PDF/DOCX) for accurate matching.

const fs = require('fs');
const path = require('path');

function normalizeText(text) {
  return String(text || '')
    .replace(/\u00a0/g, ' ')
    .replace(/[\t\r]+/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .replace(/ {2,}/g, ' ')
    .trim();
}

async function parsePdf(filePath) {
  const pdfParse = require('pdf-parse');
  const buf = fs.readFileSync(filePath);
  const data = await pdfParse(buf);
  return normalizeText(data.text);
}

async function parseDocx(filePath) {
  const mammoth = require('mammoth');
  const result = await mammoth.extractRawText({ path: filePath });
  return normalizeText(result.value);
}

async function extractCvText(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  if (ext === '.pdf') return await parsePdf(filePath);
  if (ext === '.docx') return await parseDocx(filePath);
  // .doc parsing is unreliable without heavier deps; keep it explicit.
  throw new Error('Unsupported CV file type for parsing. Please upload PDF or DOCX.');
}

module.exports = {
  extractCvText,
  normalizeText
};
