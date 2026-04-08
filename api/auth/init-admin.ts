import type { VercelRequest, VercelResponse } from '@vercel/node';
import { authService } from '../../src/backend/services/AuthService';
import { prisma } from '../../src/backend/lib/prisma';
import { logger } from '../../src/lib/logger';

/**
 * POST /api/auth/init-admin
 *
 * Creates the initial admin user from environment variables.
 * Protected by ADMIN_INIT_SECRET environment variable.
 * Only one admin can be created via this endpoint.
 *
 * Required env vars:
 *   ADMIN_EMAIL         – email address for the admin account
 *   ADMIN_PASSWORD      – password for the admin account (min 12 chars recommended)
 *   ADMIN_INIT_SECRET   – shared secret that must be sent in the X-Admin-Init-Secret header
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const adminInitSecret = process.env.ADMIN_INIT_SECRET;
  if (!adminInitSecret) {
    logger.warn('init-admin called but ADMIN_INIT_SECRET is not set');
    return res.status(503).json({ error: 'Admin initialisation is not configured' });
  }

  const providedSecret = req.headers['x-admin-init-secret'];
  if (!providedSecret || providedSecret !== adminInitSecret) {
    logger.warn('init-admin called with invalid secret', { host: req.headers.host });
    return res.status(403).json({ error: 'Forbidden' });
  }

  const adminEmail = process.env.ADMIN_EMAIL;
  const adminPassword = process.env.ADMIN_PASSWORD;

  if (!adminEmail || !adminPassword) {
    return res.status(400).json({
      error: 'ADMIN_EMAIL and ADMIN_PASSWORD environment variables must be set',
    });
  }

  if (adminPassword.length < 12) {
    return res.status(400).json({ error: 'ADMIN_PASSWORD must be at least 12 characters' });
  }

  try {
    const existingAdmin = await prisma.user.findFirst({ where: { role: 'ADMIN' } });
    if (existingAdmin) {
      return res.status(409).json({
        error: 'An admin user already exists',
        adminEmail: existingAdmin.email,
      });
    }

    const result = await authService.registerAdmin(adminEmail, adminPassword);

    logger.info('Initial admin account created', { email: result.user.email });

    return res.status(201).json({
      success: true,
      message: 'Admin user created successfully',
      email: result.user.email,
    });
  } catch (error: any) {
    logger.error('Admin initialisation failed', { error: error.message });
    return res.status(500).json({ error: 'Admin initialisation failed' });
  } finally {
    await prisma.$disconnect();
  }
}
