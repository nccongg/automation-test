"use strict";

const express = require("express");
const authMiddleware = require("../../middleware/auth.middleware");
const ctrl = require("./testSheet.controller");

const router = express.Router();
router.use(authMiddleware);

/**
 * @swagger
 * tags:
 *   name: Test Sheets
 *   description: Test collection management — group test cases into sheets and run them
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     TestSheet:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *         projectId:
 *           type: integer
 *         name:
 *           type: string
 *         description:
 *           type: string
 *           nullable: true
 *         itemCount:
 *           type: integer
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 *     TestSheetItem:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *         testSheetId:
 *           type: integer
 *         testCaseId:
 *           type: integer
 *         itemOrder:
 *           type: integer
 *         title:
 *           type: string
 *         goal:
 *           type: string
 *         status:
 *           type: string
 */

// ─── Test Sheets CRUD ─────────────────────────────────────────────────────────

/**
 * @swagger
 * /test-sheets:
 *   get:
 *     summary: List all test sheets for a project
 *     tags: [Test Sheets]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: projectId
 *         required: true
 *         schema:
 *           type: integer
 *         description: Project ID to filter sheets
 *     responses:
 *       200:
 *         description: List of test sheets
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/TestSheet'
 *       400:
 *         description: projectId is required
 *       401:
 *         description: Unauthorized
 */
router.get("/", ctrl.listSheets);

/**
 * @swagger
 * /test-sheets:
 *   post:
 *     summary: Create a new test sheet
 *     tags: [Test Sheets]
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
 *                 example: Quick sanity checks before every deploy
 *     responses:
 *       201:
 *         description: Test sheet created
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/TestSheet'
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 */
router.post("/", ctrl.createSheet);

/**
 * @swagger
 * /test-sheets/{id}:
 *   get:
 *     summary: Get a test sheet with its items
 *     tags: [Test Sheets]
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
 *         description: Test sheet detail with items
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   allOf:
 *                     - $ref: '#/components/schemas/TestSheet'
 *                     - type: object
 *                       properties:
 *                         items:
 *                           type: array
 *                           items:
 *                             $ref: '#/components/schemas/TestSheetItem'
 *       404:
 *         description: Test sheet not found
 */
router.get("/:id", ctrl.getSheet);

/**
 * @swagger
 * /test-sheets/{id}:
 *   put:
 *     summary: Update a test sheet name or description
 *     tags: [Test Sheets]
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
 *             properties:
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *     responses:
 *       200:
 *         description: Updated test sheet
 *       404:
 *         description: Test sheet not found
 */
router.put("/:id", ctrl.updateSheet);

/**
 * @swagger
 * /test-sheets/{id}:
 *   delete:
 *     summary: Delete a test sheet (soft delete)
 *     tags: [Test Sheets]
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
 *         description: Deleted successfully
 *       404:
 *         description: Test sheet not found
 */
router.delete("/:id", ctrl.deleteSheet);

// ─── Items Management ─────────────────────────────────────────────────────────

/**
 * @swagger
 * /test-sheets/{id}/items:
 *   post:
 *     summary: Add test cases to a sheet
 *     tags: [Test Sheets]
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
 *                 example: [1, 2, 3]
 *     responses:
 *       201:
 *         description: Items added
 *       400:
 *         description: testCaseIds must be a non-empty array
 *       404:
 *         description: Test sheet not found
 */
router.post("/:id/items", ctrl.addItems);

/**
 * @swagger
 * /test-sheets/{id}/items/{itemId}:
 *   delete:
 *     summary: Remove a test case from a sheet
 *     tags: [Test Sheets]
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
 *         description: Item or sheet not found
 */
router.delete("/:id/items/:itemId", ctrl.removeItem);

/**
 * @swagger
 * /test-sheets/{id}/items/reorder:
 *   put:
 *     summary: Reorder test cases within a sheet
 *     tags: [Test Sheets]
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
 *               - orders
 *             properties:
 *               orders:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: integer
 *                     order:
 *                       type: integer
 *                 example: [{"id": 1, "order": 1}, {"id": 2, "order": 2}]
 *     responses:
 *       200:
 *         description: Reordered successfully
 *       404:
 *         description: Test sheet not found
 */
router.put("/:id/items/reorder", ctrl.reorderItems);

// ─── Trigger Run ──────────────────────────────────────────────────────────────

/**
 * @swagger
 * /test-sheets/{id}/run:
 *   post:
 *     summary: Run all test cases in a sheet as a batch
 *     tags: [Test Sheets]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       202:
 *         description: Sheet run accepted and dispatched
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     sheetRun:
 *                       type: object
 *                       properties:
 *                         id:
 *                           type: integer
 *                         testSheetId:
 *                           type: integer
 *                         status:
 *                           type: string
 *                           enum: [queued, running, completed, failed, cancelled]
 *                         totalCases:
 *                           type: integer
 *                         startedAt:
 *                           type: string
 *                           format: date-time
 *                     runItems:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           id:
 *                             type: integer
 *                           testCaseId:
 *                             type: integer
 *                           testRunId:
 *                             type: integer
 *                             nullable: true
 *                           status:
 *                             type: string
 *       400:
 *         description: Sheet has no test cases
 *       404:
 *         description: Test sheet not found
 */
router.post("/:id/run", ctrl.runSheet);

module.exports = router;
