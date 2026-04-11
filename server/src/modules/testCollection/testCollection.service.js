"use strict";

const repo = require("./testCollection.repository");

function toInt(value) {
  const n = Number(value);
  return Number.isInteger(n) && n > 0 ? n : null;
}

// ─── Collections CRUD ─────────────────────────────────────────────────────────

async function createCollection({ projectId, name, description, color, userId }) {
  if (!name || !name.trim()) {
    throw { status: 400, message: "Collection name is required" };
  }
  return repo.createCollection({
    projectId,
    name: name.trim(),
    description: description || null,
    color: color || "indigo",
    createdBy: userId,
  });
}

async function listCollections(projectId) {
  return repo.findCollectionsByProject(projectId);
}

async function getCollection(collectionId, userId) {
  const collection = await repo.findCollectionWithOwner(collectionId, userId);
  if (!collection) throw { status: 404, message: "Collection not found" };

  const items = await repo.findItemsByCollection(collectionId);
  return { ...collection, items };
}

async function updateCollection(collectionId, userId, { name, description, color }) {
  const collection = await repo.findCollectionWithOwner(collectionId, userId);
  if (!collection) throw { status: 404, message: "Collection not found" };

  return repo.updateCollection(collectionId, { name, description, color });
}

async function deleteCollection(collectionId, userId) {
  const collection = await repo.findCollectionWithOwner(collectionId, userId);
  if (!collection) throw { status: 404, message: "Collection not found" };

  await repo.softDeleteCollection(collectionId);
}

// ─── Items Management ─────────────────────────────────────────────────────────

async function addItems(collectionId, userId, testCaseIds) {
  if (!Array.isArray(testCaseIds) || testCaseIds.length === 0) {
    throw { status: 400, message: "testCaseIds must be a non-empty array" };
  }

  const collection = await repo.findCollectionWithOwner(collectionId, userId);
  if (!collection) throw { status: 404, message: "Collection not found" };

  const validIds = testCaseIds.map(toInt).filter(Boolean);
  return repo.addItemsToCollection(collectionId, validIds);
}

async function removeItem(collectionId, itemId, userId) {
  const collection = await repo.findCollectionWithOwner(collectionId, userId);
  if (!collection) throw { status: 404, message: "Collection not found" };

  const removed = await repo.removeItemFromCollection(collectionId, itemId);
  if (!removed) throw { status: 404, message: "Item not found in collection" };
}

async function getCollectionsByTestCase(testCaseId, projectId) {
  return repo.findCollectionsByTestCase(testCaseId, projectId);
}

module.exports = {
  createCollection,
  listCollections,
  getCollection,
  updateCollection,
  deleteCollection,
  addItems,
  removeItem,
  getCollectionsByTestCase,
};
