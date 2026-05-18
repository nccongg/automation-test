"use strict";

const repo = require("./objectRepository.repository");

async function listObjects(userId, projectId) {
  const project = await repo.findOwnedProject(userId, projectId);
  if (!project) throw Object.assign(new Error("Project not found"), { status: 404 });
  return repo.listObjects(projectId);
}

async function getObject(userId, projectId, id) {
  const project = await repo.findOwnedProject(userId, projectId);
  if (!project) throw Object.assign(new Error("Project not found"), { status: 404 });
  const obj = await repo.getObjectById(projectId, id);
  if (!obj) throw Object.assign(new Error("Test object not found"), { status: 404 });
  return obj;
}

async function createObject(userId, projectId, payload) {
  const project = await repo.findOwnedProject(userId, projectId);
  if (!project) throw Object.assign(new Error("Project not found"), { status: 404 });
  return repo.createObject(projectId, payload);
}

async function updateObject(userId, projectId, id, payload) {
  const project = await repo.findOwnedProject(userId, projectId);
  if (!project) throw Object.assign(new Error("Project not found"), { status: 404 });
  const obj = await repo.updateObject(projectId, id, payload);
  if (!obj) throw Object.assign(new Error("Test object not found"), { status: 404 });
  return obj;
}

async function deleteObject(userId, projectId, id) {
  const project = await repo.findOwnedProject(userId, projectId);
  if (!project) throw Object.assign(new Error("Project not found"), { status: 404 });
  const deleted = await repo.deleteObject(projectId, id);
  if (!deleted) throw Object.assign(new Error("Test object not found"), { status: 404 });
}

async function confirmObject(userId, projectId, id) {
  const project = await repo.findOwnedProject(userId, projectId);
  if (!project) throw Object.assign(new Error("Project not found"), { status: 404 });
  const obj = await repo.confirmObject(projectId, id);
  if (!obj) throw Object.assign(new Error("Test object not found"), { status: 404 });
  return obj;
}

async function listCandidates(userId, projectId, objectId) {
  const project = await repo.findOwnedProject(userId, projectId);
  if (!project) throw Object.assign(new Error("Project not found"), { status: 404 });
  return repo.listCandidates(projectId, objectId);
}

async function acceptCandidate(userId, projectId, objectId, candidateId) {
  const project = await repo.findOwnedProject(userId, projectId);
  if (!project) throw Object.assign(new Error("Project not found"), { status: 404 });
  const obj = await repo.acceptCandidate(projectId, objectId, candidateId);
  if (!obj) throw Object.assign(new Error("Candidate not found"), { status: 404 });
  return obj;
}

async function dismissCandidate(userId, projectId, objectId, candidateId) {
  const project = await repo.findOwnedProject(userId, projectId);
  if (!project) throw Object.assign(new Error("Project not found"), { status: 404 });
  const ok = await repo.dismissCandidate(projectId, objectId, candidateId);
  if (!ok) throw Object.assign(new Error("Candidate not found"), { status: 404 });
}

module.exports = {
  listObjects, getObject, createObject, updateObject, deleteObject,
  confirmObject, listCandidates, acceptCandidate, dismissCandidate,
};
