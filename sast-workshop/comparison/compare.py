import argparse
import json
from datetime import datetime
from pathlib import Path


def load_json(path: str) -> dict:
    return json.loads(Path(path).read_text(encoding="utf-8"))


def flatten_llm(payload: dict):
    rows = []
    for item in payload.get("results", []):
        file_path = item.get("file", "")
        for vuln in item.get("vulnerabilities", []):
            rows.append(
                {
                    "source": "Qwen",
                    "file": file_path,
                    "title": vuln.get("title", ""),
                    "category": vuln.get("category", ""),
                    "severity": vuln.get("severity", ""),
                    "line": vuln.get("line_start", ""),
                    "cwe": vuln.get("cwe_id", ""),
                }
            )
    return rows


def flatten_semgrep(payload: dict):
    rows = []
    for item in payload.get("results", []):
        extra = item.get("extra", {})
        start = item.get("start", {})
        rows.append(
            {
                "source": "Semgrep",
                "file": item.get("path", ""),
                "title": extra.get("message", ""),
                "category": extra.get("metadata", {}).get("category", extra.get("metadata", {}).get("confidence", "")),
                "severity": extra.get("severity", ""),
                "line": start.get("line", ""),
                "cwe": extra.get("metadata", {}).get("cwe", ""),
            }
        )
    return rows


def build_html(qwen_rows, semgrep_rows) -> str:
    def render_rows(rows):
        if not rows:
            return "<tr><td colspan='6'>No findings</td></tr>"
        return "\n".join(
            f"<tr><td>{r['file']}</td><td>{r['line']}</td><td>{r['severity']}</td><td>{r['category']}</td><td>{r['cwe']}</td><td>{r['title']}</td></tr>"
            for r in rows
        )

    return f"""
<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <title>Votely SAST Comparison Report</title>
  <style>
    body {{ font-family: Arial, sans-serif; margin: 32px; color: #1e293b; background: #f8fafc; }}
    h1, h2 {{ color: #0f172a; }}
    .cards {{ display: flex; gap: 16px; margin: 16px 0 24px; flex-wrap: wrap; }}
    .card {{ background: white; border: 1px solid #e2e8f0; border-radius: 12px; padding: 16px 20px; min-width: 220px; }}
    table {{ width: 100%; border-collapse: collapse; background: white; margin-bottom: 24px; }}
    th, td {{ border: 1px solid #e2e8f0; padding: 10px; text-align: left; vertical-align: top; }}
    th {{ background: #e2e8f0; }}
    code {{ background: #e2e8f0; padding: 2px 6px; border-radius: 6px; }}
  </style>
</head>
<body>
  <h1>Votely SAST Comparison Report</h1>
  <p>Generated at: {datetime.utcnow().isoformat()}Z</p>

  <div class="cards">
    <div class="card"><strong>Qwen Findings</strong><br />{len(qwen_rows)}</div>
    <div class="card"><strong>Semgrep Findings</strong><br />{len(semgrep_rows)}</div>
  </div>

  <h2>Qwen Findings</h2>
  <table>
    <thead>
      <tr>
        <th>File</th>
        <th>Line</th>
        <th>Severity</th>
        <th>Category</th>
        <th>CWE</th>
        <th>Title</th>
      </tr>
    </thead>
    <tbody>
      {render_rows(qwen_rows)}
    </tbody>
  </table>

  <h2>Semgrep Findings</h2>
  <table>
    <thead>
      <tr>
        <th>File</th>
        <th>Line</th>
        <th>Severity</th>
        <th>Category</th>
        <th>CWE</th>
        <th>Title</th>
      </tr>
    </thead>
    <tbody>
      {render_rows(semgrep_rows)}
    </tbody>
  </table>
</body>
</html>
"""


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--qwen", required=True)
    parser.add_argument("--semgrep", required=True)
    parser.add_argument("--output", required=True)
    args = parser.parse_args()

    qwen_payload = load_json(args.qwen)
    semgrep_payload = load_json(args.semgrep)

    qwen_rows = flatten_llm(qwen_payload)
    semgrep_rows = flatten_semgrep(semgrep_payload)

    html = build_html(qwen_rows, semgrep_rows)
    output_path = Path(args.output)
    output_path.parent.mkdir(parents=True, exist_ok=True)
    output_path.write_text(html, encoding="utf-8")
    print(f"Saved report to {output_path}")


if __name__ == "__main__":
    main()
