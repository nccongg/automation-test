#!/usr/bin/env python3
"""
Export evaluation log to Excel/CSV.

Usage:
    pip install psycopg2-binary openpyxl python-dotenv
    python export_eval.py                  # -> eval_log_<timestamp>.xlsx
    python export_eval.py --format csv     # -> eval_log_<timestamp>.csv
    python export_eval.py --project 1      # filter by project id
"""

import argparse
import csv
import os
import sys
from datetime import datetime
from pathlib import Path

try:
    import psycopg2
    import psycopg2.extras
except ImportError:
    sys.exit("Missing dependency: pip install psycopg2-binary")

try:
    from dotenv import load_dotenv
    load_dotenv(Path(__file__).parent / "server" / ".env")
except ImportError:
    pass


# ── DB ─────────────────────────────────────────────────────────────────────────

def get_conn():
    database_url = os.getenv("DATABASE_URL")
    if database_url:
        return psycopg2.connect(database_url, sslmode="require")
    return psycopg2.connect(
        host=os.getenv("DB_HOST", "localhost"),
        port=int(os.getenv("DB_PORT", 5432)),
        dbname=os.getenv("DB_NAME", "automation_test"),
        user=os.getenv("DB_USER", "postgres"),
        password=os.getenv("DB_PASSWORD", ""),
    )


# ── Queries ────────────────────────────────────────────────────────────────────

# Sheet 1: Bảng đánh giá chính
QUERY_EVAL_LOG = """
SELECT
  'TC' || LPAD(tc.id::text, 2, '0')                          AS "Task ID",

  CASE
    WHEN LOWER(COALESCE(tra.agent_prompt, tc.goal, '')) LIKE '%login%'
      OR LOWER(COALESCE(tra.agent_prompt, tc.goal, '')) LIKE '%sign in%'
      OR LOWER(COALESCE(tra.agent_prompt, tc.goal, '')) LIKE '%đăng nhập%'
      THEN 'Login'
    WHEN LOWER(COALESCE(tra.agent_prompt, tc.goal, '')) LIKE '%pim%'
      OR LOWER(COALESCE(tra.agent_prompt, tc.goal, '')) LIKE '%employee%'
      OR LOWER(COALESCE(tra.agent_prompt, tc.goal, '')) LIKE '%nhân viên%'
      THEN 'PIM'
    WHEN LOWER(COALESCE(tra.agent_prompt, tc.goal, '')) LIKE '%leave%'
      OR LOWER(COALESCE(tra.agent_prompt, tc.goal, '')) LIKE '%nghỉ phép%'
      THEN 'Leave'
    WHEN LOWER(COALESCE(tra.agent_prompt, tc.goal, '')) LIKE '%recruit%'
      OR LOWER(COALESCE(tra.agent_prompt, tc.goal, '')) LIKE '%tuyển dụng%'
      THEN 'Recruitment'
    WHEN LOWER(COALESCE(tra.agent_prompt, tc.goal, '')) LIKE '%time%'
      OR LOWER(COALESCE(tra.agent_prompt, tc.goal, '')) LIKE '%attendance%'
      THEN 'Time & Attendance'
    WHEN LOWER(COALESCE(tra.agent_prompt, tc.goal, '')) LIKE '%admin%'
      THEN 'Admin'
    ELSE 'Other'
  END                                                         AS "Module",

  -- Prompt gốc người dùng nhập để sinh test case
  COALESCE(b.source_prompt, '')                              AS "User Prompt",

  -- Test case được sinh ra (goal / agent prompt)
  COALESCE(tra.agent_prompt, tc.goal)                        AS "Generated Test Case",

  COALESCE(tr.generated_tree_correct, '')                    AS "Generated Tree Correct?",

  CASE tr.verdict
    WHEN 'pass'              THEN 'Pass'
    WHEN 'pass_with_warning' THEN 'Pass'
    WHEN 'fail'              THEN 'Fail'
    WHEN 'error'             THEN 'Fail'
    ELSE COALESCE(tr.verdict, '')
  END                                                        AS "Execution Result",

  CASE
    WHEN tr.verdict IN ('pass', 'pass_with_warning') THEN ''
    ELSE COALESCE((
      SELECT
        CASE rsl.failure_reason
          WHEN 'element_not_found'   THEN 'Bad locator'
          WHEN 'element_not_visible' THEN 'Bad locator'
          WHEN 'selector_invalid'    THEN 'Bad locator'
          WHEN 'timeout'             THEN 'Timeout'
          WHEN 'navigation_failed'   THEN 'App error'
          WHEN 'assertion_mismatch'  THEN 'Prompt misunderstanding'
          WHEN 'value_not_set'       THEN 'Prompt misunderstanding'
          WHEN 'unexpected_error'    THEN 'App error'
          ELSE rsl.failure_reason
        END
      FROM run_step_logs rsl
      WHERE rsl.test_run_id = tr.id
        AND rsl.status = 'failed'
        AND rsl.failure_reason IS NOT NULL
      ORDER BY rsl.step_no
      LIMIT 1
    ), '')
  END                                                        AS "Failure Type",

  -- Thời gian LLM sinh test case (từ batch generation)
  CASE
    WHEN b.generation_duration_ms IS NOT NULL
    THEN ROUND(b.generation_duration_ms / 1000.0, 2)::text || 's'
    ELSE ''
  END                                                        AS "Generation Time",

  COALESCE(b.input_tokens::text, '')                         AS "Input Tokens",
  COALESCE(b.output_tokens::text, '')                        AS "Output Tokens",
  CASE
    WHEN b.input_tokens IS NOT NULL AND b.output_tokens IS NOT NULL
    THEN (b.input_tokens + b.output_tokens)::text
    ELSE ''
  END                                                        AS "Total Tokens",

  COALESCE(tr.agent_input_tokens::text, '')                  AS "Agent Input Tokens",
  COALESCE(tr.agent_output_tokens::text, '')                 AS "Agent Output Tokens",
  CASE
    WHEN tr.agent_input_tokens IS NOT NULL AND tr.agent_output_tokens IS NOT NULL
    THEN (tr.agent_input_tokens + tr.agent_output_tokens)::text
    ELSE ''
  END                                                        AS "Agent Total Tokens",

  -- Thời gian thực thi test case trên trình duyệt
  CASE
    WHEN tr.started_at IS NOT NULL AND tr.finished_at IS NOT NULL
    THEN ROUND(EXTRACT(EPOCH FROM (tr.finished_at - tr.started_at))::numeric, 1)::text || 's'
    WHEN tr.execution_log->>'totalDurationSeconds' IS NOT NULL
    THEN tr.execution_log->>'totalDurationSeconds' || 's'
    ELSE ''
  END                                                        AS "Execution Time",

  -- Tổng thời gian = generation + execution
  CASE
    WHEN b.generation_duration_ms IS NOT NULL
      AND tr.started_at IS NOT NULL AND tr.finished_at IS NOT NULL
    THEN ROUND(
      (b.generation_duration_ms / 1000.0
        + EXTRACT(EPOCH FROM (tr.finished_at - tr.started_at))
      )::numeric, 1
    )::text || 's'
    ELSE ''
  END                                                        AS "Total Time",

  CASE
    WHEN tr.verdict = 'pass'              AND es.id IS NOT NULL THEN 'Yes'
    WHEN tr.verdict = 'pass_with_warning' AND es.id IS NOT NULL THEN 'Partial'
    WHEN tr.verdict IN ('pass', 'pass_with_warning')            THEN 'Partial'
    ELSE 'No'
  END                                                        AS "Reusable?",

  COALESCE(tr.run_notes,
    CASE
      WHEN tr.verdict IN ('fail','error')
      THEN COALESCE((
        SELECT rsl.message
        FROM run_step_logs rsl
        WHERE rsl.test_run_id = tr.id AND rsl.status = 'failed'
        ORDER BY rsl.step_no LIMIT 1
      ), tr.error_message)
      ELSE NULL
    END
  , '')                                                      AS "Notes",

  tr.id                                                      AS "Run ID",
  tra.trigger_type                                           AS "Run Type",
  p.name                                                     AS "Project",
  tr.started_at                                              AS "Run Date"

FROM test_runs tr
JOIN test_cases tc   ON tc.id = tr.test_case_id
JOIN projects p      ON p.id  = tc.project_id
LEFT JOIN test_case_versions tcv
  ON tcv.id = COALESCE(tr.test_case_version_id, tc.current_version_id)
LEFT JOIN test_run_attempts tra
  ON tra.test_run_id = tr.id
LEFT JOIN test_case_generation_candidates tgc
  ON tgc.selected_test_case_id = tc.id
LEFT JOIN test_case_generation_batches b
  ON b.id = tgc.batch_id
LEFT JOIN execution_scripts es
  ON es.source_test_run_id = tr.id
WHERE tr.status IN ('completed', 'failed')
  {project_filter}
ORDER BY tr.started_at DESC
"""

# Sheet 2: Thời gian sinh testcase (LLM generation)
QUERY_GENERATION_TIME = """
SELECT
  'TC' || LPAD(tc.id::text, 2, '0')                        AS "Task ID",
  tc.title                                                  AS "Test Case",
  b.source_prompt                                           AS "Prompt",
  b.llm_provider                                           AS "LLM Provider",
  b.llm_model                                              AS "LLM Model",
  b.candidate_count                                        AS "Candidates",
  b.generation_started_at                                  AS "Started At",
  b.generation_finished_at                                 AS "Finished At",
  CASE
    WHEN b.generation_duration_ms IS NOT NULL
    THEN ROUND(b.generation_duration_ms / 1000.0, 2)::text || 's'
    ELSE ''
  END                                                      AS "Duration",
  COALESCE(b.input_tokens::text, '')                       AS "Input Tokens",
  COALESCE(b.output_tokens::text, '')                      AS "Output Tokens",
  CASE
    WHEN b.input_tokens IS NOT NULL AND b.output_tokens IS NOT NULL
    THEN (b.input_tokens + b.output_tokens)::text
    ELSE ''
  END                                                      AS "Total Tokens",
  p.name                                                   AS "Project",
  b.created_at                                             AS "Created At"
FROM test_case_generation_batches b
JOIN projects p ON p.id = b.project_id
LEFT JOIN test_case_generation_candidates tgc ON tgc.batch_id = b.id AND tgc.is_selected = TRUE
LEFT JOIN test_cases tc ON tc.id = tgc.selected_test_case_id
{project_filter}
ORDER BY b.created_at DESC
"""

# Sheet 3: Thời gian sinh dataset
QUERY_DATASET_GEN_TIME = """
SELECT
  p.name                                                   AS "Project",
  dgl.prompt                                               AS "Prompt",
  dgl.row_count                                            AS "Row Count",
  dgl.llm_provider                                        AS "LLM Provider",
  dgl.llm_model                                           AS "LLM Model",
  dgl.started_at                                          AS "Started At",
  dgl.finished_at                                         AS "Finished At",
  CASE
    WHEN dgl.duration_ms IS NOT NULL
    THEN ROUND(dgl.duration_ms / 1000.0, 2)::text || 's'
    ELSE ''
  END                                                     AS "Duration",
  COALESCE(dgl.input_tokens::text, '')                     AS "Input Tokens",
  COALESCE(dgl.output_tokens::text, '')                    AS "Output Tokens",
  CASE
    WHEN dgl.input_tokens IS NOT NULL AND dgl.output_tokens IS NOT NULL
    THEN (dgl.input_tokens + dgl.output_tokens)::text
    ELSE ''
  END                                                     AS "Total Tokens",
  CASE WHEN dgl.success THEN 'Success' ELSE 'Failed' END  AS "Result",
  COALESCE(dgl.error_message, '')                         AS "Error",
  dgl.created_at                                          AS "Created At"
FROM dataset_generation_logs dgl
LEFT JOIN projects p ON p.id = dgl.project_id
{project_filter_no_alias}
ORDER BY dgl.created_at DESC
"""

# Sheet 4: Chi tiết từng bước thất bại
QUERY_STEP_FAILURES = """
SELECT
  'TC' || LPAD(tc.id::text, 2, '0')                       AS "Task ID",
  tc.title                                                 AS "Test Case",
  tr.id                                                    AS "Run ID",
  rsl.step_no                                              AS "Step",
  rsl.action                                               AS "Action",
  CASE rsl.failure_reason
    WHEN 'element_not_found'   THEN 'Bad locator'
    WHEN 'element_not_visible' THEN 'Bad locator'
    WHEN 'selector_invalid'    THEN 'Bad locator'
    WHEN 'timeout'             THEN 'Timeout'
    WHEN 'navigation_failed'   THEN 'App error'
    WHEN 'assertion_mismatch'  THEN 'Prompt misunderstanding'
    WHEN 'value_not_set'       THEN 'Prompt misunderstanding'
    WHEN 'unexpected_error'    THEN 'App error'
    ELSE COALESCE(rsl.failure_reason, '')
  END                                                      AS "Failure Type",
  rsl.message                                              AS "Detail",
  rsl.current_url                                          AS "URL",
  tr.started_at                                            AS "Run Date"
FROM run_step_logs rsl
JOIN test_runs tr  ON tr.id = rsl.test_run_id
JOIN test_cases tc ON tc.id = tr.test_case_id
JOIN projects p    ON p.id  = tc.project_id
WHERE rsl.status = 'failed'
  {project_filter}
ORDER BY tr.started_at DESC, rsl.step_no
"""


# ── Helpers ────────────────────────────────────────────────────────────────────

def fetch(conn, sql):
    with conn.cursor(cursor_factory=psycopg2.extras.DictCursor) as cur:
        cur.execute(sql)
        rows = cur.fetchall()
        cols = [d[0] for d in cur.description]
    return cols, [list(r) for r in rows]


def clean(val):
    if val is None:
        return ""
    if hasattr(val, "strftime"):
        return val.strftime("%Y-%m-%d %H:%M:%S")
    return val


def clean_row(row):
    return [clean(v) for v in row]


# ── Excel export ───────────────────────────────────────────────────────────────

def export_excel(sheets: dict, path: str):
    try:
        from openpyxl import Workbook
        from openpyxl.styles import Font, PatternFill, Alignment, Border, Side
        from openpyxl.utils import get_column_letter
    except ImportError:
        sys.exit("Missing dependency: pip install openpyxl")

    wb = Workbook()
    wb.remove(wb.active)

    HDR_FILL   = PatternFill("solid", fgColor="1E3A5F")
    HDR_FONT   = Font(bold=True, color="FFFFFF", size=11)
    ALT_FILL   = PatternFill("solid", fgColor="F0F4FA")
    PASS_FONT  = Font(color="1A7A3C", bold=True)
    FAIL_FONT  = Font(color="C0392B", bold=True)
    THIN       = Side(style="thin", color="D0D7E3")
    BORDER     = Border(bottom=Side(style="thin", color="E8ECF4"))

    for sheet_name, (cols, rows) in sheets.items():
        ws = wb.create_sheet(title=sheet_name)

        # Header
        for ci, name in enumerate(cols, 1):
            c = ws.cell(row=1, column=ci, value=name)
            c.font      = HDR_FONT
            c.fill      = HDR_FILL
            c.alignment = Alignment(horizontal="center", vertical="center", wrap_text=True)
        ws.row_dimensions[1].height = 32

        # Data
        result_col = next((i+1 for i, n in enumerate(cols) if n == "Execution Result"), None)
        for ri, row in enumerate(rows, 2):
            row_clean = clean_row(row)
            bg = ALT_FILL if ri % 2 == 0 else None
            for ci, val in enumerate(row_clean, 1):
                c = ws.cell(row=ri, column=ci, value=val)
                c.alignment = Alignment(vertical="center", wrap_text=False)
                c.border    = BORDER
                if bg:
                    c.fill = bg
                # Tô màu cột Execution Result
                if ci == result_col:
                    if val == "Pass":
                        c.font = PASS_FONT
                    elif val == "Fail":
                        c.font = FAIL_FONT

        # Auto column width
        for ci, name in enumerate(cols, 1):
            vals    = [str(name)] + [str(clean_row(r)[ci-1]) for r in rows]
            max_len = min(max((len(v) for v in vals), default=10), 80)
            ws.column_dimensions[get_column_letter(ci)].width = max_len + 3

        ws.freeze_panes = "A2"

    wb.save(path)


# ── CSV export ─────────────────────────────────────────────────────────────────

def export_csv(cols, rows, path: str):
    with open(path, "w", newline="", encoding="utf-8-sig") as f:
        w = csv.writer(f)
        w.writerow(cols)
        for row in rows:
            w.writerow(clean_row(row))


# ── Column Descriptions ────────────────────────────────────────────────────────

COLUMN_DESCRIPTIONS = {
    "Evaluation Log": [
        ("Task ID",                  "Mã định danh test case, sinh tự động theo định dạng TC01, TC02, …"),
        ("Module",                   "Nhóm chức năng được kiểm thử, tự phát hiện từ nội dung test case (Login, PIM, Leave, Recruitment, Time & Attendance, Admin, Other)."),
        ("User Prompt",              "Prompt gốc do người dùng nhập vào hệ thống để yêu cầu sinh test case. Đây là đầu vào của LLM."),
        ("Generated Test Case",      "Nội dung test case (goal/steps) do LLM sinh ra từ User Prompt. Đây là đầu vào thực tế được truyền cho agent khi thực thi."),
        ("Generated Tree Correct?",  "Đánh giá thủ công: cây hành động do LLM sinh ra có đúng không? (Yes / No / Partial — để trống nếu chưa đánh giá)."),
        ("Execution Result",         "Kết quả thực thi trên trình duyệt: Pass (thành công) hoặc Fail (thất bại)."),
        ("Failure Type",             "Loại lỗi khi thất bại: Bad locator (không tìm được phần tử), Timeout (quá thời gian chờ), App error (lỗi ứng dụng), Prompt misunderstanding (agent hiểu sai prompt)."),
        ("Generation Time",          "Thời gian LLM sinh ra test case từ User Prompt (tính bằng giây). Không có giá trị nếu test case được tạo thủ công."),
        ("Input Tokens",             "Số token đầu vào (prompt) gửi lên LLM khi sinh test case."),
        ("Output Tokens",            "Số token đầu ra (response) LLM trả về khi sinh test case."),
        ("Total Tokens",             "Tổng Input + Output Tokens. Dùng để ước tính chi phí API và so sánh độ phức tạp giữa các lần sinh."),
        ("Agent Input Tokens",       "Số token đầu vào LLM dùng trong quá trình agent tự động điều hướng trình duyệt."),
        ("Agent Output Tokens",      "Số token đầu ra LLM trong quá trình agent chạy."),
        ("Agent Total Tokens",       "Tổng token agent dùng khi thực thi. Dùng để ước tính chi phí chạy test."),
        ("Execution Time",           "Thời gian agent Selenium thực thi toàn bộ test case trên trình duyệt (tính bằng giây)."),
        ("Total Time",               "Tổng thời gian = Generation Time + Execution Time. Đo toàn bộ chu trình từ lúc nhập prompt đến khi có kết quả kiểm thử."),
        ("Reusable?",                "Test case có thể tái sử dụng không? Yes = pass và đã có execution script; Partial = pass nhưng chưa có script; No = fail."),
        ("Notes",                    "Ghi chú bổ sung: thông báo lỗi đầu tiên khi fail, hoặc ghi chú thủ công của người dùng."),
        ("Run ID",                   "ID nội bộ của lần chạy (test_runs.id), dùng để tra cứu chi tiết trong DB."),
        ("Run Type",                 "Loại trigger: initial (chạy lần đầu), replay (chạy lại), scheduled, …"),
        ("Project",                  "Tên project chứa test case này."),
        ("Run Date",                 "Thời điểm bắt đầu thực thi test case (UTC)."),
    ],
    "TC Generation Time": [
        ("Task ID",       "Mã test case được sinh ra từ batch này (TC01, TC02, …)."),
        ("Test Case",     "Tiêu đề test case được chọn từ batch."),
        ("Prompt",        "Prompt gốc người dùng nhập để sinh batch test case."),
        ("LLM Provider",  "Nhà cung cấp LLM được dùng để sinh test case (ví dụ: google)."),
        ("LLM Model",     "Tên model cụ thể (ví dụ: gemini-2.0-flash)."),
        ("Candidates",    "Số lượng test case được sinh ra trong một lần gọi LLM."),
        ("Started At",    "Thời điểm bắt đầu gọi LLM."),
        ("Finished At",   "Thời điểm LLM trả về kết quả."),
        ("Duration",      "Thời gian LLM xử lý (Finished At − Started At), tính bằng giây."),
        ("Input Tokens",  "Số token prompt gửi lên LLM."),
        ("Output Tokens", "Số token response LLM trả về."),
        ("Total Tokens",  "Tổng Input + Output Tokens của batch này."),
        ("Project",       "Tên project."),
        ("Created At",    "Thời điểm tạo batch."),
    ],
    "Dataset Gen Time": [
        ("Project",       "Tên project."),
        ("Prompt",        "Prompt dùng để sinh dataset."),
        ("Row Count",     "Số dòng dữ liệu được sinh ra."),
        ("LLM Provider",  "Nhà cung cấp LLM."),
        ("LLM Model",     "Tên model."),
        ("Started At",    "Thời điểm bắt đầu sinh dataset."),
        ("Finished At",   "Thời điểm hoàn thành sinh dataset."),
        ("Duration",      "Thời gian sinh dataset (tính bằng giây)."),
        ("Input Tokens",  "Số token prompt gửi lên LLM."),
        ("Output Tokens", "Số token response LLM trả về."),
        ("Total Tokens",  "Tổng Input + Output Tokens."),
        ("Result",        "Kết quả: Success hoặc Failed."),
        ("Error",         "Thông báo lỗi nếu sinh thất bại."),
        ("Created At",    "Thời điểm tạo log."),
    ],
    "Step Failures": [
        ("Task ID",      "Mã test case."),
        ("Test Case",    "Tiêu đề test case."),
        ("Run ID",       "ID lần chạy."),
        ("Step",         "Số thứ tự bước bị lỗi."),
        ("Action",       "Hành động agent thực hiện tại bước lỗi (click, type, navigate, …)."),
        ("Failure Type", "Loại lỗi: Bad locator, Timeout, App error, Prompt misunderstanding."),
        ("Detail",       "Thông báo lỗi chi tiết từ agent."),
        ("URL",          "URL trang web tại thời điểm xảy ra lỗi."),
        ("Run Date",     "Thời điểm chạy test."),
    ],
}

def build_column_descriptions():
    cols = ["Sheet", "Column", "Description"]
    rows = []
    for sheet, entries in COLUMN_DESCRIPTIONS.items():
        for col, desc in entries:
            rows.append([sheet, col, desc])
    return cols, rows


# ── Main ───────────────────────────────────────────────────────────────────────

def main():
    parser = argparse.ArgumentParser(description="Export evaluation log")
    parser.add_argument("--format", choices=["excel", "csv"], default="excel")
    parser.add_argument("--project", type=int, default=None, help="Filter by project ID")
    parser.add_argument("--output", default=None, help="Output file path")
    args = parser.parse_args()

    pf      = f"AND p.id = {args.project}" if args.project else ""
    pf_noa  = f"AND dgl.project_id = {args.project}" if args.project else ""

    ts  = datetime.now().strftime("%Y%m%d_%H%M%S")
    ext = "xlsx" if args.format == "excel" else "csv"
    out = args.output or f"eval_log_{ts}.{ext}"

    db_url = os.getenv("DATABASE_URL")
    if db_url:
        from urllib.parse import urlparse
        parsed = urlparse(db_url)
        print(f"Connecting to {parsed.hostname} ...")
    else:
        print(f"Connecting to {os.getenv('DB_HOST','localhost')}:{os.getenv('DB_PORT',5432)} ...")
    conn = get_conn()

    try:
        print("Fetching data...")
        eval_cols,  eval_rows  = fetch(conn, QUERY_EVAL_LOG.format(project_filter=pf))
        gen_cols,   gen_rows   = fetch(conn, QUERY_GENERATION_TIME.format(project_filter=pf))
        dgl_cols,   dgl_rows   = fetch(conn, QUERY_DATASET_GEN_TIME.format(project_filter_no_alias=pf_noa))
        fail_cols,  fail_rows  = fetch(conn, QUERY_STEP_FAILURES.format(project_filter=pf))

        print(f"  Evaluation log:    {len(eval_rows)} runs")
        print(f"  TC generation:     {len(gen_rows)} batches")
        print(f"  Dataset generation:{len(dgl_rows)} logs")
        print(f"  Step failures:     {len(fail_rows)} failed steps")

        if args.format == "excel":
            desc_cols, desc_rows = build_column_descriptions()
            export_excel({
                "Evaluation Log":      (eval_cols,  eval_rows),
                "TC Generation Time":  (gen_cols,   gen_rows),
                "Dataset Gen Time":    (dgl_cols,   dgl_rows),
                "Step Failures":       (fail_cols,  fail_rows),
                "Column Descriptions": (desc_cols,  desc_rows),
            }, out)
        else:
            export_csv(eval_cols, eval_rows, out)

        print(f"\n✓ Exported → {out}")

    finally:
        conn.close()


if __name__ == "__main__":
    main()
