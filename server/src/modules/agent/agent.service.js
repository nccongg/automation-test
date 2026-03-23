'use strict';

const axios = require('axios');
const env = require('../../config/env');

async function startWorkerRun(payload) {
  const response = await axios.post(`${env.AGENT_WORKER_URL}/run`, payload, {
    timeout: 15000,
  });

  return response.data;
}

module.exports = {
  startWorkerRun,
};