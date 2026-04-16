from __future__ import annotations

from typing import Any, Dict, List, Literal, Optional

from pydantic import BaseModel, Field, model_validator


# ─── Crawl Schemas ───────────────────────────────────────────────────────────

class FormAuthConfig(BaseModel):
    type: Literal["form"]
    loginUrl: str
    usernameSelector: str
    passwordSelector: str
    submitSelector: str
    username: str
    password: str
    successSelector: Optional[str] = None  # element to wait for after login


class CookieAuthConfig(BaseModel):
    type: Literal["cookie"]
    cookies: List[Dict[str, str]]  # [{"name": "...", "value": "..."}]


AuthConfig = FormAuthConfig | CookieAuthConfig


class CrawlRequest(BaseModel):
    scanId: int
    baseUrl: str
    authConfig: Optional[AuthConfig] = Field(default=None, discriminator="type")
    maxPages: int = 30
    maxDepth: int = 3
    callbackUrl: str
    callbackSecret: str
    progressCallbackUrl: Optional[str] = None  # called after each page crawled


ExecutionMode = Literal["goal_based_agent", "replay_script"]
ReplayScriptType = Literal["strict_replay_json", "browser_use_history"]


class ProjectPayload(BaseModel):
    id: int
    baseUrl: str


class ReplayStepPayload(BaseModel):
    stepNo: int
    actionName: str
    actionInput: Dict[str, Any] = Field(default_factory=dict)
    expectedUrl: Optional[str] = None
    timeoutMs: Optional[int] = None
    continueOnError: bool = False
    captureScreenshot: bool = False
    notes: Optional[str] = None


class ReplayScriptInlinePayload(BaseModel):
    formatVersion: int = 1
    scriptType: ReplayScriptType = "strict_replay_json"
    paramsSchema: Dict[str, Any] = Field(default_factory=dict)
    metadata: Dict[str, Any] = Field(default_factory=dict)
    steps: List[ReplayStepPayload] = Field(default_factory=list)


class ReplayPayload(BaseModel):
    scriptId: Optional[int] = None
    params: Dict[str, Any] = Field(default_factory=dict)
    strict: bool = True
    allowLlmFallback: bool = False
    scriptJson: Optional[ReplayScriptInlinePayload] = None

    @model_validator(mode="after")
    def validate_source(self) -> "ReplayPayload":
        if self.scriptId is None and self.scriptJson is None:
            raise ValueError("Replay payload requires either scriptId or scriptJson")
        return self


class TestCasePayload(BaseModel):
    id: int
    title: str
    goal: str
    executionMode: ExecutionMode
    promptText: Optional[str] = None
    planSnapshot: Optional[Dict[str, Any]] = None
    inputParams: Dict[str, Any] = Field(default_factory=dict)
    replay: Optional[ReplayPayload] = None

    @model_validator(mode="after")
    def validate_replay(self) -> "TestCasePayload":
        if self.executionMode == "replay_script" and self.replay is None:
            raise ValueError("testCase.replay is required when executionMode='replay_script'")
        return self


class RuntimeConfigPayload(BaseModel):
    id: Optional[int] = None
    llmProvider: str
    llmModel: str
    maxSteps: int = 20
    timeoutSeconds: int = 180
    useVision: bool = True
    headless: bool = True
    browserType: str = "chromium"
    allowedDomains: List[str] = Field(default_factory=list)
    viewport: Optional[Dict[str, int]] = None
    locale: Optional[str] = None
    timezone: Optional[str] = None
    extraConfig: Dict[str, Any] = Field(default_factory=dict)


class BrowserProfilePayload(BaseModel):
    id: Optional[int] = None
    provider: str = "local"
    profileType: str = "ephemeral"
    profileRef: Optional[str] = None
    profileDirectory: Optional[str] = None
    profileData: Dict[str, Any] = Field(default_factory=dict)


class RunRequest(BaseModel):
    testRunId: int
    attemptId: int
    attemptNo: int
    project: ProjectPayload
    testCase: TestCasePayload
    runtimeConfig: RuntimeConfigPayload
    browserProfile: Optional[BrowserProfilePayload] = None