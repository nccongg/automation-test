# Agent Contract

## 1. Server -> Agent Worker

POST /run

{
  "testRunId": 1,
  "attemptId": 1,
  "attemptNo": 1,
  "project": {
    "id": 1,
    "baseUrl": "https://example.com"
  },
  "testCase": {
    "id": 1,
    "title": "Homepage smoke test",
    "goal": "Open website and verify homepage loads successfully",
    "executionMode": "goal_based_agent",
    "promptText": "Open website and verify homepage loads successfully",
    "planSnapshot": {
      "goal": "Open website and verify homepage loads successfully"
    }
  },
  "runtimeConfig": {
    "id": 1,
    "llmProvider": "google",
    "llmModel": "gemini-flash-latest",
    "maxSteps": 20,
    "timeoutSeconds": 180,
    "useVision": true,
    "headless": true,
    "browserType": "chromium",
    "allowedDomains": ["example.com"],
    "viewport": { "width": 1280, "height": 720 }
  },
  "browserProfile": {
    "id": 1,
    "provider": "local",
    "profileType": "ephemeral",
    "profileRef": null
  }
}

## 2. Agent Worker -> Server callback step

POST /api/agent/callbacks/step

{
  "testRunId": 1,
  "attemptId": 1,
  "stepNo": 1,
  "stepTitle": "navigate",
  "action": "navigate",
  "status": "passed",
  "message": "Navigated to homepage",
  "currentUrl": "https://example.com",
  "thoughtText": "Open the target website first",
  "extractedContent": "Homepage loaded",
  "actionInputJson": null,
  "actionOutputJson": null,
  "modelOutputJson": null,
  "durationMs": null,
  "screenshotPath": "artifacts/run_1_step_1.png"
}

## 3. Agent Worker -> Server callback final

POST /api/agent/callbacks/final

{
  "testRunId": 1,
  "attemptId": 1,
  "status": "completed",
  "verdict": "pass",
  "finalResult": "Homepage loaded successfully",
  "structuredOutput": null,
  "errorMessage": null,
  "executionLog": {
    "steps": 3
  },
  "evidenceSummary": {
    "screenshots": 1
  }
}