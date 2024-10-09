import express from 'express';
import { getAllMenuItems, getMenuItemById, createMenuItem, updateMenuItem, deleteMenuItem } from '../controllers/MenuItemController.js';
import auth from '../middleware/authMiddleware.js';

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: MenuItems
 *   description: Menu items management
 */

/**
 * @swagger
 * /api/menuitems:
 *   get:
 *     summary: Get all menu items
 *     tags: [MenuItems]
 *     responses:
 *       200:
 *         description: List of all menu items
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/MenuItem'
 */
router.get('/', getAllMenuItems);

/**
 * @swagger
 * /api/menuitems/{id}:
 *   get:
 *     summary: Get a menu item by ID
 *     tags: [MenuItems]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: The menu item ID
 *     responses:
 *       200:
 *         description: The menu item data
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/MenuItem'
 *       404:
 *         description: Menu item not found
 */
router.get('/:id', getMenuItemById);

/**
 * @swagger
 * /api/menuitems:
 *   post:
 *     summary: Create a new menu item
 *     tags: [MenuItems]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/MenuItem'
 *     responses:
 *       201:
 *         description: The menu item was created successfully
 *       500:
 *         description: Error creating menu item
 */
router.post('/', auth, createMenuItem);

/**
 * @swagger
 * /api/menuitems/{id}:
 *   put:
 *     summary: Update a menu item
 *     tags: [MenuItems]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: The menu item ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/MenuItem'
 *     responses:
 *       200:
 *         description: The menu item was updated successfully
 *       404:
 *         description: Menu item not found
 *       500:
 *         description: Error updating menu item
 */
router.put('/:id', auth, updateMenuItem);

/**
 * @swagger
 * /api/menuitems/{id}:
 *   delete:
 *     summary: Delete a menu item
 *     tags: [MenuItems]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: The menu item ID
 *     responses:
 *       200:
 *         description: Menu item deleted successfully
 *       404:
 *         description: Menu item not found
 */
router.delete('/:id', auth, deleteMenuItem);

export default router;
