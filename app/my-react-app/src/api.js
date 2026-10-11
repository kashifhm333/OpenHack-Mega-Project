/**
 * API Service Helper
 * Handles all HTTP communication with the Node.js / Express backend.
 * Uses Vite environment variables with graceful fallback.
 */

// Retrieve base URL: use VITE_API_URL if explicitly set, else localhost in dev, or relative in production
const RAW_API_URL = (import.meta.env.VITE_API_URL !== undefined && import.meta.env.VITE_API_URL !== '')
  ? import.meta.env.VITE_API_URL
  : (import.meta.env.DEV ? 'http://localhost:5000' : '');

// Ensure no trailing slash for consistent endpoint concatenation
export const API_BASE_URL = RAW_API_URL.replace(/\/+$/, '');


/**
 * Standard HTTP error class with status and response payload
 */
export class ApiError extends Error {
  constructor(message, status, data = null) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.data = data;
  }
}

/**
 * Generic fetch wrapper with timeout, json parsing, and error normalization
 */
async function request(endpoint, options = {}) {
  const url = `${API_BASE_URL}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;

  const defaultHeaders = {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  };

  const config = {
    ...options,
    headers: {
      ...defaultHeaders,
      ...options.headers,
    },
  };

  // 10-second request timeout to avoid hanging UI
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 10000);
  config.signal = controller.signal;

  try {
    const response = await fetch(url, config);
    clearTimeout(timeoutId);

    // Parse response body if present
    let responseData = null;
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      responseData = await response.json().catch(() => null);
    } else {
      responseData = await response.text().catch(() => null);
    }

    if (!response.ok) {
      const errorMessage =
        (responseData && typeof responseData === 'object' && (responseData.message || responseData.error)) ||
        `Request failed with status ${response.status}: ${response.statusText}`;
      throw new ApiError(errorMessage, response.status, responseData);
    }

    return responseData;
  } catch (error) {
    clearTimeout(timeoutId);

    if (error.name === 'AbortError') {
      throw new ApiError('The request timed out. Please check if your backend server is responding.', 408);
    }

    if (error instanceof ApiError) {
      throw error;
    }

    // Network error (e.g. CORS failed, server offline, DNS resolution failed)
    throw new ApiError(
      `Unable to connect to backend at ${API_BASE_URL}. Ensure your server is running and CORS is configured.`,
      0,
      { originalError: error.message }
    );
  }
}

/**
 * API Methods for Task Management & Notes
 */

// GET: Fetch all tasks / notes
export async function getTasks() {
  return await request('/api/tasks');
}

// POST: Create a new task / note
export async function createTask(taskData) {
  return await request('/api/tasks', {
    method: 'POST',
    body: JSON.stringify(taskData),
  });
}

// DELETE: Remove an existing task / note by ID
export async function deleteTask(id) {
  return await request(`/api/tasks/${id}`, {
    method: 'DELETE',
  });
}

// PATCH/PUT: Optional toggle completion or update task
export async function updateTask(id, updates) {
  return await request(`/api/tasks/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(updates),
  });
}

// GET: Backend health check
export async function checkHealth() {
  return await request('/api/health');
}
