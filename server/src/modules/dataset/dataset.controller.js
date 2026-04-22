"use strict";

const service = require("./dataset.service");

async function list(req, res, next) {
  try {
    const { projectId } = req.query;
    if (!projectId) return res.status(400).json({ status: "error", message: "projectId is required" });
    const data = await service.listDatasets(projectId);
    res.json({ status: "ok", data });
  } catch (err) { next(err); }
}

async function get(req, res, next) {
  try {
    const { projectId } = req.query;
    if (!projectId) return res.status(400).json({ status: "error", message: "projectId is required" });
    const data = await service.getDataset(req.params.id, projectId);
    res.json({ status: "ok", data });
  } catch (err) { next(err); }
}

async function create(req, res, next) {
  try {
    const { projectId, name, description } = req.body;
    if (!projectId) return res.status(400).json({ status: "error", message: "projectId is required" });
    const data = await service.createDataset({ projectId, name, description, createdBy: req.user?.id });
    res.status(201).json({ status: "ok", data });
  } catch (err) { next(err); }
}

async function update(req, res, next) {
  try {
    const { projectId, name, description, rows } = req.body;
    if (!projectId) return res.status(400).json({ status: "error", message: "projectId is required" });
    const data = await service.updateDataset({ id: req.params.id, projectId, name, description, rows });
    res.json({ status: "ok", data });
  } catch (err) { next(err); }
}

async function remove(req, res, next) {
  try {
    const { projectId } = req.query;
    if (!projectId) return res.status(400).json({ status: "error", message: "projectId is required" });
    await service.deleteDataset(req.params.id, projectId);
    res.json({ status: "ok" });
  } catch (err) { next(err); }
}

module.exports = { list, get, create, update, remove };
