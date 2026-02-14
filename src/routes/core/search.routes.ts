import { Router, type Router as ExpressRouter } from 'express';
import { authRequired } from '../../middleware';
import * as searchController from '../../controllers/core/search.controller';
import { body, param, query } from 'express-validator';
import { validate } from '../../lib';

const router: ExpressRouter = Router();

router.use(authRequired);

// Advanced search
router.post(
  '/',
  [
    body('resourceType').isIn(['user', 'role', 'permission', 'file', 'menu', 'policy', 'tenant']),
    body('query').optional().isString(),
    body('filters').optional().isArray(),
    body('page').optional().isInt({ min: 1 }),
    body('limit').optional().isInt({ min: 1, max: 100 }),
  ],
  validate,
  searchController.search
);

// Global search
router.get(
  '/global',
  [
    query('query').notEmpty().isString(),
    query('resourceTypes').optional().isString(),
    query('limit').optional().isInt({ min: 1, max: 100 }),
  ],
  validate,
  searchController.globalSearch
);

// Saved searches
router.post(
  '/saved',
  [
    body('name').notEmpty().trim(),
    body('resourceType').isIn(['user', 'role', 'permission', 'file', 'menu', 'policy', 'tenant']),
    body('query').notEmpty(),
    body('isPublic').optional().isBoolean(),
  ],
  validate,
  searchController.saveSearch
);

router.get(
  '/saved',
  [query('resourceType').optional().isIn(['user', 'role', 'permission', 'file', 'menu', 'policy', 'tenant'])],
  validate,
  searchController.getSavedSearches
);

router.delete('/saved/:id', [param('id').isUUID()], validate, searchController.deleteSavedSearch);

// Search suggestions
router.get(
  '/suggestions',
  [
    query('resourceType').isIn(['user', 'role', 'permission', 'file', 'menu', 'policy', 'tenant']),
    query('query').notEmpty().isString(),
    query('limit').optional().isInt({ min: 1, max: 50 }),
  ],
  validate,
  searchController.getSuggestions
);

export default router;
