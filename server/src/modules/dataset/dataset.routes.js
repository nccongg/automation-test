"use strict";

const { Router } = require("express");
const ctrl = require("./dataset.controller");
const authMiddleware = require("../../middleware/auth.middleware");

const router = Router();
router.use(authMiddleware);

router.get("/",        ctrl.list);
router.get("/:id",     ctrl.get);
router.post("/",       ctrl.create);
router.put("/:id",     ctrl.update);
router.delete("/:id",  ctrl.remove);

module.exports = router;
