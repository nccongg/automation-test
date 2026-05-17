"use strict";

const { Router } = require("express");
const ctrl = require("./objectRepository.controller");
const auth = require("../../middleware/auth.middleware");

const router = Router({ mergeParams: true });
router.use(auth);

router.get("/",                                    ctrl.list);
router.post("/",                                   ctrl.create);
router.get("/:id",                                 ctrl.getOne);
router.put("/:id",                                 ctrl.update);
router.delete("/:id",                              ctrl.remove);
router.patch("/:id/confirm",                       ctrl.confirm);
router.get("/:id/candidates",                      ctrl.listCandidates);
router.post("/:id/candidates/:candidateId/accept", ctrl.acceptCandidate);
router.delete("/:id/candidates/:candidateId",      ctrl.dismissCandidate);

module.exports = router;
