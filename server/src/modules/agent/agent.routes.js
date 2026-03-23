'use strict';

const express = require('express');
const agentController = require('./agent.controller');

const router = express.Router();

router.post('/callbacks/step', agentController.handleStepCallback);
router.post('/callbacks/final', agentController.handleFinalCallback);

module.exports = router;
