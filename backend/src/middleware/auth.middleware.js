import { UnauthorizedError } from '../core/errors/AppError.js';
import { supabase } from '../config/supabase.js';

/**
 * Authentication Middleware
 * Validates Supabase JWT from Bearer header or query parameter (?token=...)
 * for SSE EventSource compatibility.
 */
export const requireAuth = async (req, res, next) => {
  try {
    let token = null;
    const authHeader = req.headers.authorization;

    if (authHeader) {
      if (!authHeader.startsWith('Bearer ')) {
        return next(new UnauthorizedError('Authorization header must use Bearer scheme'));
      }
      token = authHeader.split('Bearer ')[1].trim();
    } else if (req.query && req.query.token) {
      token = req.query.token.trim();
      if (token.startsWith('Bearer ')) {
        token = token.split('Bearer ')[1].trim();
      }
    }

    if (!token) {
      return next(new UnauthorizedError('Missing or malformed Authorization header'));
    }

    const { data, error } = await supabase.auth.getUser(token);
    if (error || !data || !data.user) {
      return next(new UnauthorizedError('Invalid or expired authentication token'));
    }

    const authUser = data.user;

    // Ensure user record is synchronized with PostgreSQL users table
    await supabase
      .from('users')
      .upsert({
        id: authUser.id,
        email: authUser.email,
        updated_at: new Date().toISOString(),
      });

    req.user = {
      id: authUser.id,
      email: authUser.email,
      ...authUser.user_metadata,
    };

    return next();
  } catch (err) {
    return next(new UnauthorizedError(err.message));
  }
};

export default requireAuth;
