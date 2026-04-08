"use strict";

const service = require("./testSheet.service");

function toInt(value) {
  const n = Number(value);
  return Number.isInteger(n) && n > 0 ? n : null;
}

// ─── Sheets ───────────────────────────────────────────────────────────────────

async function listSheets(req, res, next) {
  try {
    const userId = req.user?.userId;
    const projectId = toInt(req.query?.projectId);
    if (!projectId) {
      return res.status(400).json({ success: false, message: "projectId is required" });
    }
    const data = await service.listSheets(projectId);
    return res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
}

async function createSheet(req, res, next) {
  try {
    const userId = req.user?.userId;
    const projectId = toInt(req.body?.projectId);
    if (!projectId) {
      return res.status(400).json({ success: false, message: "projectId is required" });
    }
    const data = await service.createSheet({
      projectId,
      name: req.body?.name,
      description: req.body?.description,
      userId,
    });
    return res.status(201).json({ success: true, data });
  } catch (err) {
    next(err);
  }
}

async function getSheet(req, res, next) {
  try {
    const userId = req.user?.userId;
    const sheetId = toInt(req.params?.id);
    if (!sheetId) {
      return res.status(400).json({ success: false, message: "id must be a positive integer" });
    }
    const data = await service.getSheet(sheetId, userId);
    return res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
}

async function updateSheet(req, res, next) {
  try {
    const userId = req.user?.userId;
    const sheetId = toInt(req.params?.id);
    if (!sheetId) {
      return res.status(400).json({ success: false, message: "id must be a positive integer" });
    }
    const data = await service.updateSheet(sheetId, userId, {
      name: req.body?.name,
      description: req.body?.description,
    });
    return res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
}

async function deleteSheet(req, res, next) {
  try {
    const userId = req.user?.userId;
    const sheetId = toInt(req.params?.id);
    if (!sheetId) {
      return res.status(400).json({ success: false, message: "id must be a positive integer" });
    }
    await service.deleteSheet(sheetId, userId);
    return res.status(204).send();
  } catch (err) {
    next(err);
  }
}

// ─── Items ────────────────────────────────────────────────────────────────────

async function addItems(req, res, next) {
  try {
    const userId = req.user?.userId;
    const sheetId = toInt(req.params?.id);
    if (!sheetId) {
      return res.status(400).json({ success: false, message: "id must be a positive integer" });
    }
    const data = await service.addItems(sheetId, userId, req.body?.testCaseIds);
    return res.status(201).json({ success: true, data });
  } catch (err) {
    next(err);
  }
}

async function removeItem(req, res, next) {
  try {
    const userId = req.user?.userId;
    const sheetId = toInt(req.params?.id);
    const itemId = toInt(req.params?.itemId);
    if (!sheetId || !itemId) {
      return res.status(400).json({ success: false, message: "Invalid id or itemId" });
    }
    await service.removeItem(sheetId, itemId, userId);
    return res.status(204).send();
  } catch (err) {
    next(err);
  }
}

async function reorderItems(req, res, next) {
  try {
    const userId = req.user?.userId;
    const sheetId = toInt(req.params?.id);
    if (!sheetId) {
      return res.status(400).json({ success: false, message: "id must be a positive integer" });
    }
    await service.reorderItems(sheetId, userId, req.body?.orders);
    return res.json({ success: true });
  } catch (err) {
    next(err);
  }
}

// ─── Run ──────────────────────────────────────────────────────────────────────

async function runSheet(req, res, next) {
  try {
    const userId = req.user?.userId;
    const sheetId = toInt(req.params?.id);
    if (!sheetId) {
      return res.status(400).json({ success: false, message: "id must be a positive integer" });
    }
    const data = await service.runSheet(sheetId, userId);
    return res.status(202).json({ success: true, data });
  } catch (err) {
    next(err);
  }
}

// ─── Sheet Runs ───────────────────────────────────────────────────────────────

async function listSheetRuns(req, res, next) {
  try {
    const projectId = toInt(req.query?.projectId);
    const limit = Math.min(Number(req.query?.limit) || 20, 100);
    if (!projectId) {
      return res.status(400).json({ success: false, message: "projectId is required" });
    }
    const data = await service.listSheetRuns(projectId, limit);
    return res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
}

async function getSheetRunDetail(req, res, next) {
  try {
    const runId = toInt(req.params?.runId);
    if (!runId) {
      return res.status(400).json({ success: false, message: "runId must be a positive integer" });
    }
    const data = await service.getSheetRunDetail(runId);
    return res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
}

async function analyzeSheetRun(req, res, next) {
  try {
    const runId = toInt(req.params?.runId);
    if (!runId) {
      return res.status(400).json({ success: false, message: "runId must be a positive integer" });
    }
    const data = await service.analyzeSheetRun(runId);
    return res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  listSheets,
  createSheet,
  getSheet,
  updateSheet,
  deleteSheet,
  addItems,
  removeItem,
  reorderItems,
  runSheet,
  listSheetRuns,
  getSheetRunDetail,
  analyzeSheetRun,
};
