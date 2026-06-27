/**
 * Simple CORS middleware for allowing cross-origin requests.
 * Handles preflight OPTIONS requests automatically.
 */

const ALLOWED_ORIGINS = [
  'http://localhost:3000',
  'http://localhost:8080',
  'https://predictstack.onrender.com',
  'https://predictstack.vercel.app',
];

/**
 * Set CORS headers on response.
 * @param {http.ServerResponse} res
 * @param {string} origin
 */
export function setCorsHeaders(res, origin) {
  const isAllowed = ALLOWED_ORIGINS.includes(origin) || process.env.NODE_ENV === 'development';
  if (isAllowed || !origin) {
    res.setHeader('Access-Control-Allow-Origin', origin || '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    res.setHeader('Access-Control-Allow-Credentials', 'true');
  }
}

/**
 * Handle preflight OPTIONS requests.
 * @param {http.ServerResponse} res
 * @returns {boolean} true if handled (send response), false otherwise
 */
export function handlePreflight(req, res) {
  if (req.method === 'OPTIONS') {
    setCorsHeaders(res, req.headers.origin);
    res.writeHead(204);
    res.end();
    return true;
  }
  return false;
}
