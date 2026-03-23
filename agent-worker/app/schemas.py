from pydantic import BaseModel
from typing import Optional, Any, List, Dict


class ProjectPayload(BaseModel):
    id: int
    baseUrl: str


class TestCasePayload(BaseModel):
    id: int
    title: str
    goal: str
    executionMode: str
    promptText: Optional[str] = None
    planSnapshot: Optional[Dict[str, Any]] = None


class RuntimeConfigPayload(BaseModel):
    id: int
    llmProvider: str
    llmModel: str
    maxSteps: int = 20
    timeoutSeconds: int = 180
    useVision: bool = True
    headless: bool = True
    browserType: str = "chromium"
    allowedDomains: List[str] = []
    viewport: Optional[Dict[str, int]] = None


class BrowserProfilePayload(BaseModel):
    id: Optional[int] = None
    provider: str = "local"
    profileType: str = "ephemeral"
    profileRef: Optional[str] = None


class RunRequest(BaseModel):
    testRunId: int
    attemptId: int
    attemptNo: int
    project: ProjectPayload
    testCase: TestCasePayload
    runtimeConfig: RuntimeConfigPayload
    browserProfile: Optional[BrowserProfilePayload] = None