import express from 'express';
import { createOrder, getOrderById, updateOrderStatus, getAllOrders } from '../controllers/OrderController.js';

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Orders
 *   description: Orders management
 */

/**
 * @swagger
 * /orders:
 *   post:
 *     summary: Place a new order
 *     tags: [Orders]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Order'
 *     responses:
 *       201:
 *         description: Order placed successfully
 */
router.post('/', createOrder);

/**
 * @swagger
 * /orders/{id}:
 *   get:
 *     summary: Get an order by ID
 *     tags: [Orders]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: The order ID
 *     responses:
 *       200:
 *         description: Order data
 */
router.get('/:id', getOrderById);

/**
 * @swagger
 * /orders/{id}:
 *   put:
 *     summary: Update the order status
 *     tags: [Orders]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: The order ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               status:
 *                 type: string
 *     responses:
 *       200:
 *         description: Order status updated
 */
router.put('/:id', updateOrderStatus);

/**
 * @swagger
 * /orders:
 *   get:
 *     summary: Get all orders
 *     tags: [Orders]
 *     responses:
 *       200:
 *         description: List of all orders
 */
router.get('/', getAllOrders);

export default router;
