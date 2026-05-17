"use strict";

const svc = require("./objectRepository.service");

async function list(req, res, next) {
  try {
    const data = await svc.listObjects(req.user.userId, Number(req.params.projectId));
    res.json({ status: "ok", data });
  } catch (err) { next(err); }
}

async function getOne(req, res, next) {
  try {
    const data = await svc.getObject(req.user.userId, Number(req.params.projectId), Number(req.params.id));
    res.json({ status: "ok", data });
  } catch (err) { next(err); }
}

async function create(req, res, next) {
  try {
    const { name, pageKey, description, selectors, attributesSnapshot, createdFromRunId } = req.body;
    if (!name?.trim()) return res.status(400).json({ status: "error", message: "name is required" });
    if (!Array.isArray(selectors) || selectors.length === 0) {
      return res.status(400).json({ status: "error", message: "selectors must be a non-empty array" });
    }
    const data = await svc.createObject(req.user.userId, Number(req.params.projectId), {
      name: name.trim(), pageKey, description, selectors, attributesSnapshot, createdFromRunId,
    });
    res.status(201).json({ status: "ok", data });
  } catch (err) {
    if (err.code === "23505") return res.status(409).json({ status: "error", message: "An object with this name already exists" });
    next(err);
  }
}

async function update(req, res, next) {
  try {
    const data = await svc.updateObject(
      req.user.userId,
      Number(req.params.projectId),
      Number(req.params.id),
      req.body,
    );
    res.json({ status: "ok", data });
  } catch (err) {
    if (err.code === "23505") return res.status(409).json({ status: "error", message: "An object with this name already exists" });
    next(err);
  }
}

async function remove(req, res, next) {
  try {
    await svc.deleteObject(req.user.userId, Number(req.params.projectId), Number(req.params.id));
    res.json({ status: "ok", message: "Deleted" });
  } catch (err) { next(err); }
}

async function confirm(req, res, next) {
  try {
    const data = await svc.confirmObject(req.user.userId, Number(req.params.projectId), Number(req.params.id));
    res.json({ status: "ok", data });
  } catch (err) { next(err); }
}

async function listCandidates(req, res, next) {
  try {
    const data = await svc.listCandidates(req.user.userId, Number(req.params.projectId), Number(req.params.id));
    res.json({ status: "ok", data });
  } catch (err) { next(err); }
}

async function acceptCandidate(req, res, next) {
  try {
    const data = await svc.acceptCandidate(
      req.user.userId, Number(req.params.projectId),
      Number(req.params.id), Number(req.params.candidateId),
    );
    res.json({ status: "ok", data });
  } catch (err) { next(err); }
}

async function dismissCandidate(req, res, next) {
  try {
    await svc.dismissCandidate(
      req.user.userId, Number(req.params.projectId),
      Number(req.params.id), Number(req.params.candidateId),
    );
    res.json({ status: "ok", message: "Dismissed" });
  } catch (err) { next(err); }
}

module.exports = { list, getOne, create, update, remove, confirm, listCandidates, acceptCandidate, dismissCandidate };
