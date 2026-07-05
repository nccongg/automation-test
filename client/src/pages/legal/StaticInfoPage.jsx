import { useLocation } from "react-router-dom";
import useDocumentTitle from "@/hooks/useDocumentTitle";

const PAGES = {
  "/terms": {
    title: "Terms",
    description: "Basic terms for using AutoTesting.",
    updated: "July 2026",
    sections: [
      {
        heading: "Service purpose",
        body: "AutoTesting helps teams create, run, and review automated browser tests for web applications. The platform is intended for quality assurance, regression testing, and workflow validation.",
        items: [
          "Generate test cases from natural language prompts.",
          "Crawl website structure to improve test coverage.",
          "Run browser-based tests and review execution evidence.",
        ],
      },
      {
        heading: "Acceptable use",
        body: "Use AutoTesting only for applications, websites, and environments that you own or have permission to test.",
        items: [
          "Do not run crawls or tests against systems without authorization.",
          "Do not use generated scripts to bypass access controls or rate limits.",
          "Do not upload unlawful, harmful, or intentionally misleading content.",
        ],
      },
      {
        heading: "Account responsibility",
        body: "You are responsible for keeping your account credentials safe and for reviewing activity performed from your workspace.",
        items: [
          "Use strong passwords and rotate shared credentials when needed.",
          "Limit access to projects that contain sensitive test data.",
          "Review generated test steps before running them in critical environments.",
        ],
      },
      {
        heading: "Generated content",
        body: "AI-generated test cases, summaries, and failure analysis are suggestions. They may be incomplete or incorrect and should be reviewed by a human before use.",
        items: [
          "Validate assertions and expected results before saving test cases.",
          "Check generated selectors and credentials handling before execution.",
          "Treat AI analysis as an aid, not as the final source of truth.",
        ],
      },
      {
        heading: "Changes to the service",
        body: "Features, integrations, and model behavior may change as the product improves. When possible, important changes should be communicated through release notes or workspace updates.",
      },
    ],
  },
  "/privacy": {
    title: "Privacy",
    description: "How basic workspace data is handled.",
    updated: "July 2026",
    sections: [
      {
        heading: "Data we store",
        body: "We store account information, project configuration, test cases, test runs, scan results, and related evidence needed to operate the product.",
        items: [
          "User profile details such as name and email.",
          "Project names, base URLs, settings, and runtime configuration.",
          "Generated test cases, run history, logs, screenshots, and scan metadata.",
        ],
      },
      {
        heading: "How data is used",
        body: "Workspace data is used to provide test generation, browser execution, reporting, troubleshooting, and product improvement workflows.",
        items: [
          "Use crawl data to make generated test cases more specific.",
          "Use run logs and evidence to show pass or fail results.",
          "Use account data for authentication and workspace access.",
        ],
      },
      {
        heading: "Prompts and test data",
        body: "Prompts and generated content may include business process details. Avoid placing secrets, private tokens, or production customer data in plain text prompts.",
        items: [
          "Use project secrets for passwords, tokens, and API keys.",
          "Mask or remove sensitive values before sharing screenshots or logs.",
          "Review AI-generated output before saving it into a project library.",
        ],
      },
      {
        heading: "Retention",
        body: "Test cases, run history, and evidence are kept so teams can review trends and reproduce failures. Delete old projects or artifacts when they are no longer needed.",
      },
      {
        heading: "Your choices",
        body: "Workspace owners can update project content, remove obsolete test data, and control who has access to sensitive testing workflows.",
      },
    ],
  },
  "/security": {
    title: "Security",
    description: "Security practices and recommendations.",
    updated: "July 2026",
    sections: [
      {
        heading: "Authorized testing",
        body: "Only run crawls and automated tests against applications you own or have permission to test.",
        items: [
          "Confirm that target domains belong to your organization or test environment.",
          "Avoid running destructive workflows against production unless explicitly approved.",
          "Coordinate with application owners before testing rate-sensitive flows.",
        ],
      },
      {
        heading: "Credential handling",
        body: "Store passwords, tokens, and API keys as project secrets instead of placing them in plain text prompts or test steps.",
        items: [
          "Prefer temporary test accounts over real user accounts.",
          "Rotate credentials used by automation on a regular schedule.",
          "Remove credentials from screenshots, logs, and exported reports before sharing.",
        ],
      },
      {
        heading: "Browser automation safety",
        body: "Automated browser runs can submit forms, click buttons, and change application state. Review test goals carefully before running them.",
        items: [
          "Use staging or sandbox environments for risky workflows.",
          "Add clear assertions so failures are easier to diagnose.",
          "Check generated steps before enabling repeated suite runs.",
        ],
      },
      {
        heading: "Evidence review",
        body: "Screenshots, logs, DOM snapshots, and run artifacts may contain application data. Review access permissions before sharing them.",
        items: [
          "Limit evidence access to people who need it for debugging.",
          "Delete outdated artifacts that contain sensitive information.",
          "Use project-level permissions to separate teams and environments.",
        ],
      },
      {
        heading: "Reporting issues",
        body: "If you find a security issue, include the affected area, reproduction steps, expected impact, and any relevant run IDs so the team can investigate quickly.",
      },
    ],
  },
  "/contact": {
    title: "Contact",
    description: "Ways to reach the AutoTesting team.",
    updated: "July 2026",
    sections: [
      {
        heading: "Support",
        body: "For product support, report the affected project, test case, run ID, and a short description of what happened.",
        items: [
          "Project or workspace name.",
          "Test case ID, run ID, or suite run ID if available.",
          "Screenshots or error messages that show the problem.",
        ],
      },
      {
        heading: "Security reports",
        body: "For security concerns, include reproduction steps and the affected area so the team can investigate quickly.",
        items: [
          "Describe the issue and why it matters.",
          "Include steps to reproduce without exposing real secrets.",
          "Mention whether the issue affects production or a test environment.",
        ],
      },
      {
        heading: "General feedback",
        body: "Feedback about test generation quality, crawl coverage, reporting, or workflow design helps improve the product.",
        items: [
          "Share examples of prompts that generated weak test cases.",
          "Send ideas for integrations or reporting improvements.",
          "Tell us where the automation workflow feels slow or unclear.",
        ],
      },
      {
        heading: "Email contact",
        body: "chicong442004@gmail.com, nguyenhung.9a5.nbk@gmail.com",
      },
      {
        heading: "Response expectations",
        body: "Support response time depends on workspace setup and issue severity. Include enough context in the first message so the team can start investigating without extra back-and-forth.",
      },
    ],
  },
};

export default function StaticInfoPage() {
  const { pathname } = useLocation();
  const page = PAGES[pathname] || PAGES["/terms"];

  useDocumentTitle(page.title);

  return (
    <div className="w-full max-w-5xl space-y-6 py-4">
      <header className="space-y-2">
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">
          {page.title}
        </h1>
        <p className="text-sm text-muted-foreground">{page.description}</p>
        <p className="text-xs text-muted-foreground">
          Last updated: {page.updated}
        </p>
      </header>

      <div className="grid gap-5 lg:grid-cols-2">
        {page.sections.map((section) => (
          <section key={section.heading} className="space-y-2">
            <h2 className="text-base font-semibold text-foreground">
              {section.heading}
            </h2>
            <p className="text-sm leading-6 text-muted-foreground">
              {section.body}
            </p>
            {section.items && (
              <ul className="list-disc space-y-1 pl-5 text-sm leading-6 text-muted-foreground">
                {section.items.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            )}
          </section>
        ))}
      </div>
    </div>
  );
}
