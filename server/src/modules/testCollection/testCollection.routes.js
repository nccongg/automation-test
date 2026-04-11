"use strict";

const express = require("express");
const authMiddleware = require("../../middleware/auth.middleware");
const ctrl = require("./testCollection.controller");

const router = express.Router();
router.use(authMiddleware);

/**
 * @swagger
 * tags:
 *   name: Test Collections
 *   description: Organize test cases into label/folder collections (no execution)
 */

// ─── Collections CRUD ─────────────────────────────────────────────────────────

/**
 * @swagger
 * /test-collections:
 *   get:
 *     summary: List all collections for a project
 *     tags: [Test Collections]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: projectId
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: List of collections
 *       400:
 *         description: projectId is required
 */
router.get("/", ctrl.listCollections);

/**
 * @swagger
 * /test-collections:
 *   post:
 *     summary: Create a new collection
 *     tags: [Test Collections]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - projectId
 *               - name
 *             properties:
 *               projectId:
 *                 type: integer
 *               name:
 *                 type: string
 *                 example: Smoke Tests
 *               description:
 *                 type: string
 *               color:
 *                 type: string
 *                 example: indigo
 *     responses:
 *       201:
 *         description: Collection created
 */
router.post("/", ctrl.createCollection);

/**
 * @swagger
 * /test-collections/{id}:
 *   get:
 *     summary: Get a collection with its test cases
 *     tags: [Test Collections]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Collection detail with items
 *       404:
 *         description: Collection not found
 */
router.get("/:id", ctrl.getCollection);

/**
 * @swagger
 * /test-collections/{id}:
 *   put:
 *     summary: Update a collection
 *     tags: [Test Collections]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Updated collection
 *       404:
 *         description: Collection not found
 */
router.put("/:id", ctrl.updateCollection);

/**
 * @swagger
 * /test-collections/{id}:
 *   delete:
 *     summary: Delete a collection (soft delete)
 *     tags: [Test Collections]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       204:
 *         description: Deleted
 *       404:
 *         description: Collection not found
 */
router.delete("/:id", ctrl.deleteCollection);

// ─── Items ────────────────────────────────────────────────────────────────────

/**
 * @swagger
 * /test-collections/{id}/items:
 *   post:
 *     summary: Add test cases to a collection
 *     tags: [Test Collections]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - testCaseIds
 *             properties:
 *               testCaseIds:
 *                 type: array
 *                 items:
 *                   type: integer
 *     responses:
 *       201:
 *         description: Items added
 *       404:
 *         description: Collection not found
 */
router.post("/:id/items", ctrl.addItems);

/**
 * @swagger
 * /test-collections/{id}/items/{itemId}:
 *   delete:
 *     summary: Remove a test case from a collection
 *     tags: [Test Collections]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *       - in: path
 *         name: itemId
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       204:
 *         description: Item removed
 *       404:
 *         description: Item or collection not found
 */
router.delete("/:id/items/:itemId", ctrl.removeItem);

module.exports = router;
