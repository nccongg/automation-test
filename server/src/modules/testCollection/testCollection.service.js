"use strict";

const repo = require("./testCollection.repository");

function toInt(value) {
  const n = Number(value);
  return Number.isInteger(n) && n > 0 ? n : null;
}

// ─── Collections CRUD ─────────────────────────────────────────────────────────

async function createCollection({ projectId, name, description, color, parentId, userId }) {
  if (!name || !name.trim()) {
    throw { status: 400, message: "Collection name is required" };
  }
  return repo.createCollection({
    projectId,
    name: name.trim(),
    description: description || null,
    color: color || "indigo",
    parentId: parentId || null,
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

// ─── Tree ─────────────────────────────────────────────────────────────────────

async function getTree(projectId) {
  const [cols, items] = await Promise.all([
    repo.findCollectionsByProject(projectId),
    repo.findAllItemsByProject(projectId),
  ]);

  // group items by collectionId
  const itemsByCol = {};
  const categorizedTestCaseIds = new Set();
  for (const item of items) {
    if (!itemsByCol[item.collectionId]) itemsByCol[item.collectionId] = [];
    itemsByCol[item.collectionId].push(item);
    categorizedTestCaseIds.add(item.testCaseId);
  }

  // build node map
  const nodes = {};
  for (const col of cols) {
    nodes[col.id] = {
      ...col,
      items: itemsByCol[col.id] || [],
      children: [],
    };
  }

  // build tree (attach children to parents)
  const roots = [];
  for (const col of cols) {
    if (col.parentId && nodes[col.parentId]) {
      nodes[col.parentId].children.push(nodes[col.id]);
    } else {
      roots.push(nodes[col.id]);
    }
  }

  return {
    tree: roots,
    categorizedTestCaseIds: [...categorizedTestCaseIds],
  };
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
  getTree,
  updateCollection,
  deleteCollection,
  addItems,
  removeItem,
  getCollectionsByTestCase,
};
