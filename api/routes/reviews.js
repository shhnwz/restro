import express from 'express';
import { createReview, getReviewsByMenuItem, deleteReview } from '../controllers/ReviewController.js';

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Reviews
 *   description: Reviews management
 */

/**
 * @swagger
 * /reviews:
 *   post:
 *     summary: Create a new review
 *     tags: [Reviews]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Review'
 *     responses:
 *       201:
 *         description: Review created successfully
 */
router.post('/', createReview);

/**
 * @swagger
 * /reviews/menuitem/{menuItemId}:
 *   get:
 *     summary: Get reviews by menu item
 *     tags: [Reviews]
 *     parameters:
 *       - in: path
 *         name: menuItemId
 *         schema:
 *           type: string
 *         required: true
 *         description: The menu item ID
 *     responses:
 *       200:
 *         description: List of reviews for a menu item
 */
router.get('/menuitem/:menuItemId', getReviewsByMenuItem);

/**
 * @swagger
 * /reviews/{id}:
 *   delete:
 *     summary: Delete a review
 *     tags: [Reviews]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: The review ID
 *     responses:
 *       200:
 *         description: Review deleted successfully
 */
router.delete('/:id', deleteReview);

export default router;
