"use strict";

const service = require("./testCollection.service");

function toInt(value) {
  const n = Number(value);
  return Number.isInteger(n) && n > 0 ? n : null;
}

async function listCollections(req, res, next) {
  try {
    const projectId = toInt(req.query?.projectId);
    if (!projectId) {
      return res.status(400).json({ success: false, message: "projectId is required" });
    }
    const data = await service.listCollections(projectId);
    return res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
}

async function createCollection(req, res, next) {
  try {
    const userId = req.user?.userId;
    const projectId = toInt(req.body?.projectId);
    if (!projectId) {
      return res.status(400).json({ success: false, message: "projectId is required" });
    }
    const data = await service.createCollection({
      projectId,
      name: req.body?.name,
      description: req.body?.description,
      color: req.body?.color,
      userId,
    });
    return res.status(201).json({ success: true, data });
  } catch (err) {
    next(err);
  }
}

async function getCollection(req, res, next) {
  try {
    const userId = req.user?.userId;
    const collectionId = toInt(req.params?.id);
    if (!collectionId) {
      return res.status(400).json({ success: false, message: "id must be a positive integer" });
    }
    const data = await service.getCollection(collectionId, userId);
    return res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
}

async function updateCollection(req, res, next) {
  try {
    const userId = req.user?.userId;
    const collectionId = toInt(req.params?.id);
    if (!collectionId) {
      return res.status(400).json({ success: false, message: "id must be a positive integer" });
    }
    const data = await service.updateCollection(collectionId, userId, {
      name: req.body?.name,
      description: req.body?.description,
      color: req.body?.color,
    });
    return res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
}

async function deleteCollection(req, res, next) {
  try {
    const userId = req.user?.userId;
    const collectionId = toInt(req.params?.id);
    if (!collectionId) {
      return res.status(400).json({ success: false, message: "id must be a positive integer" });
    }
    await service.deleteCollection(collectionId, userId);
    return res.status(204).send();
  } catch (err) {
    next(err);
  }
}

async function addItems(req, res, next) {
  try {
    const userId = req.user?.userId;
    const collectionId = toInt(req.params?.id);
    if (!collectionId) {
      return res.status(400).json({ success: false, message: "id must be a positive integer" });
    }
    const data = await service.addItems(collectionId, userId, req.body?.testCaseIds);
    return res.status(201).json({ success: true, data });
  } catch (err) {
    next(err);
  }
}

async function removeItem(req, res, next) {
  try {
    const userId = req.user?.userId;
    const collectionId = toInt(req.params?.id);
    const itemId = toInt(req.params?.itemId);
    if (!collectionId || !itemId) {
      return res.status(400).json({ success: false, message: "Invalid id or itemId" });
    }
    await service.removeItem(collectionId, itemId, userId);
    return res.status(204).send();
  } catch (err) {
    next(err);
  }
}

module.exports = {
  listCollections,
  createCollection,
  getCollection,
  updateCollection,
  deleteCollection,
  addItems,
  removeItem,
};
