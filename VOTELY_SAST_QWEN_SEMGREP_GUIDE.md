# Panduan Lengkap Menjalankan SAST LLM (Qwen) dan Semgrep pada Proyek Votely

## Tujuan

Dokumen ini mengadaptasi workshop **Hands-On SAST: LLM vs Semgrep** ke struktur proyek **Votely** yang ada di repository ini. Versi ini:

- memakai **Qwen** sebagai LLM analyzer,
- mempertahankan alur kerja workshop asli,
- menyesuaikan target scan ke struktur folder Votely,
- memakai contoh command yang cocok untuk **Windows PowerShell**,
- tetap bisa dijalankan sebagai workflow lokal maupun sebagai fondasi integrasi CI/CD.

Panduan ini tidak mengubah source code aplikasi Votely. Kita menambahkan workspace SAST terpisah di root repository agar mudah dijalankan, dibandingkan, dan dibersihkan.

---

## 1. Memahami Struktur Votely yang Akan Dianalisis

Struktur proyek Votely saat ini:

```text
CI-CD/
├── Jenkinsfile
├── README.md
└── app/
    ├── main.py
    ├── database.py
    ├── models.py
    ├── requirements.txt
    ├── routes/
    │   ├── auth_routes.py
    │   └── voting_routes.py
    ├── tests/
    │   └── test_app.py
    └── frontend/
        ├── package.json
        ├── vite.config.js
        └── src/
            ├── App.jsx
            ├── context/
            │   └── AuthContext.jsx
            ├── components/
            └── pages/
```

### Area target scan backend

| File/Folder | Fokus SAST |
| --- | --- |
| `app/main.py` | hardcoded/default secret, debug mode, CORS, secure headers, file serving |
| `app/routes/auth_routes.py` | login, register, JWT handling, auth middleware, validation |
| `app/routes/voting_routes.py` | authorization, file upload, access ke private poll, comments, results exposure |
| `app/models.py` | data exposure, relasi objek, sensitive fields |
| `app/tests/` | test coverage terhadap fix security |

### Area target scan frontend

| File/Folder | Fokus SAST |
| --- | --- |
| `app/frontend/src/context/AuthContext.jsx` | token handling, `localStorage`, auth flow |
| `app/frontend/src/components/CommentsSection.jsx` | user-generated content, request auth, client-side interaction |
| `app/frontend/src/pages/*.jsx` | input handling, upload flow, routing, fetch calls |
| `app/frontend/src/components/**/*.jsx` | sink DOM yang berisiko seperti `dangerouslySetInnerHTML` bila nanti ditambahkan |

### Risiko yang realistis untuk Votely

Walau SAST harus tetap netral dan berbasis bukti, area yang paling masuk akal untuk diperiksa pada Votely adalah:

- hardcoded atau default `SECRET_KEY`,
- `debug=True` pada Flask,
- validasi upload file,
- broken access control / IDOR pada private poll, comment, vote, delete, reset,
- JWT misuse,
- penyimpanan token di `localStorage`,
- potensi XSS pada konten comment,
- informasi sensitif yang terekspos lewat API result atau error handling,
- insecure configuration di CORS atau header.

---

## 2. Struktur Workspace SAST yang Disarankan

Tambahkan folder baru di root repo:

```text
CI-CD/
├── app/
├── sast-workshop/
│   ├── qwen-sast/
│   │   ├── analyzer.py
│   │   ├── prompts.py
│   │   ├── requirements.txt
│   │   └── .env.example
│   ├── semgrep-sast/
│   │   ├── rules/
│   │   │   ├── python-votely.yaml
│   │   │   ├── javascript-votely.yaml
│   │   │   └── generic-secrets.yaml
│   │   └── run_semgrep.ps1
│   ├── comparison/
│   │   └── compare.py
│   ├── results/
│   └── run_all.py
└── VOTELY_SAST_QWEN_SEMGREP_GUIDE.md
```

Alasan struktur ini:

- memisahkan tooling SAST dari source app,
- mudah dibersihkan tanpa menyentuh aplikasi,
- mirip dengan struktur workshop asli,
- memudahkan automasi di Jenkins atau GitHub Actions nanti.

---

## 3. Prasyarat

### 3.1 Python

Gunakan Python 3.11+.

```powershell
python --version
```

### 3.2 Buat virtual environment khusus SAST

```powershell
cd "D:\6 Semester\DevSecOps\Votely\CI-CD"
python -m venv .venv-sast
.\.venv-sast\Scripts\Activate.ps1
```

### 3.3 Install dependency Qwen SAST + comparison + Semgrep

```powershell
python -m pip install --upgrade pip
pip install openai python-dotenv rich pyyaml semgrep
```

Catatan:

- Kita tetap memakai package `openai` karena **Qwen menyediakan endpoint OpenAI-compatible**, sehingga migrasi analyzer lebih sederhana.
- Provider model tetap **Qwen**, bukan OpenAI.

### 3.4 API key Qwen

Panduan ini memakai **Alibaba Cloud Model Studio / DashScope** untuk menjalankan Qwen melalui endpoint OpenAI-compatible.

Buat file `.env` di folder `sast-workshop\qwen-sast\`:

```env
DASHSCOPE_API_KEY=sk-your-qwen-key-here
QWEN_BASE_URL=https://dashscope-intl.aliyuncs.com/compatible-mode/v1
QWEN_MODEL=qwen3.5-plus
QWEN_TEMPERATURE=0
QWEN_MAX_TOKENS=4096
```

Contoh region lain:

- Singapore: `https://dashscope-intl.aliyuncs.com/compatible-mode/v1`
- US (Virginia): `https://dashscope-us.aliyuncs.com/compatible-mode/v1`
- Beijing: `https://dashscope.aliyuncs.com/compatible-mode/v1`
- Hong Kong: `https://cn-hongkong.dashscope.aliyuncs.com/compatible-mode/v1`

### 3.5 Verifikasi aplikasi Votely sebelum scan

SAST paling berguna bila dijalankan pada codebase yang saat ini buildable dan testable.

Backend:

```powershell
cd app
python -m venv venv
.\venv\Scripts\python.exe -m pip install -r requirements.txt
.\venv\Scripts\python.exe -m pytest tests\ -v
```

Frontend:

```powershell
cd app\frontend
npm.cmd install
npm.cmd run build
```

---

## 4. File yang Perlu Dibuat

Bagian ini berisi isi file yang bisa langsung Anda buat di workspace `sast-workshop`.

## 4.1 `sast-workshop\qwen-sast\requirements.txt`

```text
openai>=1.30.0
python-dotenv>=1.0.1
rich>=13.7.1
pyyaml>=6.0.2
```

## 4.2 `sast-workshop\qwen-sast\.env.example`

```env
DASHSCOPE_API_KEY=sk-your-qwen-key-here
QWEN_BASE_URL=https://dashscope-intl.aliyuncs.com/compatible-mode/v1
QWEN_MODEL=qwen3.5-plus
QWEN_TEMPERATURE=0
QWEN_MAX_TOKENS=4096
```

## 4.3 `sast-workshop\qwen-sast\prompts.py`

```python
SYSTEM_PROMPT = """
You are a senior application security reviewer performing SAST on the Votely codebase.

Project context:
- Backend: Flask + SQLAlchemy + JWT + bcrypt + SQLite
- Frontend: React + Vite
- App domain: online voting, polls, comments, auth, file upload

Your task:
- Find real security issues only.
- Prioritize broken access control, IDOR, authentication flaws, JWT misuse,
  file upload risks, XSS, insecure defaults, secret handling, SSRF, path traversal,
  unsafe deserialization, command execution, SQL injection, information disclosure,
  and insecure frontend token handling.
- Ignore style issues and generic refactor suggestions unless they have security impact.
- Do not invent line numbers or vulnerabilities.
- If there is not enough evidence, do not report the issue.

Return JSON only with this schema:
{
  "file": "relative/path",
  "language": "python|javascript|jsx|unknown",
  "summary": "short summary",
  "vulnerabilities": [
    {
      "line_start": 1,
      "line_end": 1,
      "severity": "LOW|MEDIUM|HIGH|CRITICAL",
      "category": "Broken Access Control",
      "cwe_id": "CWE-284",
      "title": "short title",
      "description": "clear explanation grounded in the code",
      "impact": "practical impact in Votely",
      "evidence": "cite the exact risky behavior in the file",
      "remediation": "specific fix for this codebase",
      "confidence": "LOW|MEDIUM|HIGH"
    }
  ]
}
"""


def build_user_prompt(relative_path: str, language: str, code: str) -> str:
    return f"""
Analyze this Votely source file for security vulnerabilities.

File: {relative_path}
Language: {language}

Important rules:
- Return valid JSON only.
- If there are no vulnerabilities, return an empty "vulnerabilities" list.
- Keep findings specific to this file.
- Use exact line numbers when possible.

Code:
```{language}
{code}
```
"""
```

## 4.4 `sast-workshop\qwen-sast\analyzer.py`

```python
import argparse
import json
import os
from datetime import datetime, timezone
from pathlib import Path
from typing import List

from dotenv import load_dotenv
from openai import OpenAI
from rich.console import Console
from rich.progress import track

from prompts import SYSTEM_PROMPT, build_user_prompt

console = Console()

SUPPORTED_EXTENSIONS = {".py", ".js", ".jsx", ".ts", ".tsx"}
IGNORE_DIRS = {
    ".git",
    ".venv",
    ".venv-sast",
    "venv",
    "node_modules",
    "dist",
    "build",
    "__pycache__",
    "results",
    "node_cache",
}


def detect_language(path: Path) -> str:
    mapping = {
        ".py": "python",
        ".js": "javascript",
        ".jsx": "jsx",
        ".ts": "typescript",
        ".tsx": "tsx",
    }
    return mapping.get(path.suffix.lower(), "unknown")


def is_ignored(path: Path) -> bool:
    return any(part in IGNORE_DIRS for part in path.parts)


def collect_files(target: Path) -> List[Path]:
    if target.is_file():
        return [target] if target.suffix.lower() in SUPPORTED_EXTENSIONS else []

    files = []
    for path in target.rglob("*"):
        if (
            path.is_file()
            and path.suffix.lower() in SUPPORTED_EXTENSIONS
            and not is_ignored(path)
        ):
            files.append(path)
    return sorted(files)


def extract_json(text: str) -> dict:
    text = text.strip()
    if text.startswith("```"):
        lines = text.splitlines()
        if lines and lines[0].startswith("```"):
            lines = lines[1:]
        if lines and lines[-1].startswith("```"):
            lines = lines[:-1]
        text = "\n".join(lines).strip()

    start = text.find("{")
    end = text.rfind("}")
    if start == -1 or end == -1:
        raise ValueError("No JSON object found in model response.")
    return json.loads(text[start : end + 1])


def make_client() -> OpenAI:
    api_key = os.getenv("DASHSCOPE_API_KEY")
    base_url = os.getenv(
        "QWEN_BASE_URL",
        "https://dashscope-intl.aliyuncs.com/compatible-mode/v1",
    )
    if not api_key:
        raise EnvironmentError("DASHSCOPE_API_KEY not found.")

    return OpenAI(api_key=api_key, base_url=base_url)


def analyze_file(client: OpenAI, file_path: Path, repo_root: Path, model: str) -> dict:
    relative_path = file_path.relative_to(repo_root).as_posix()
    language = detect_language(file_path)
    code = file_path.read_text(encoding="utf-8", errors="ignore")

    response = client.chat.completions.create(
        model=model,
        temperature=float(os.getenv("QWEN_TEMPERATURE", "0")),
        max_tokens=int(os.getenv("QWEN_MAX_TOKENS", "4096")),
        messages=[
            {"role": "system", "content": SYSTEM_PROMPT},
            {"role": "user", "content": build_user_prompt(relative_path, language, code)},
        ],
    )

    content = response.choices[0].message.content or "{}"
    parsed = extract_json(content)
    parsed.setdefault("file", relative_path)
    parsed.setdefault("language", language)
    parsed.setdefault("summary", "")
    parsed.setdefault("vulnerabilities", [])
    return parsed


def main():
    parser = argparse.ArgumentParser(description="Qwen-based SAST analyzer for Votely.")
    parser.add_argument("--file", help="Single file to analyze")
    parser.add_argument("--dir", help="Directory to analyze")
    parser.add_argument("--model", default=os.getenv("QWEN_MODEL", "qwen3.5-plus"))
    parser.add_argument("--output", required=True, help="Output JSON file path")
    args = parser.parse_args()

    if not args.file and not args.dir:
        raise SystemExit("Use either --file or --dir.")

    load_dotenv(Path(__file__).with_name(".env"))

    repo_root = Path(__file__).resolve().parents[2]
    target = Path(args.file or args.dir).resolve()

    files = collect_files(target)
    if not files:
        raise SystemExit("No supported source files found.")

    client = make_client()
    results = []

    console.print(f"[bold cyan]Scanning {len(files)} file(s) with model {args.model}[/bold cyan]")
    for file_path in track(files, description="Analyzing"):
        try:
            results.append(analyze_file(client, file_path, repo_root, args.model))
        except Exception as exc:
            results.append(
                {
                    "file": file_path.relative_to(repo_root).as_posix(),
                    "language": detect_language(file_path),
                    "summary": f"Analyzer error: {exc}",
                    "vulnerabilities": [],
                }
            )

    total_vulns = sum(len(item.get("vulnerabilities", [])) for item in results)
    payload = {
        "tool": "Qwen SAST Analyzer",
        "model": args.model,
        "generated_at": datetime.now(timezone.utc).isoformat(),
        "target": str(target),
        "total_files": len(files),
        "total_vulnerabilities": total_vulns,
        "results": results,
    }

    output_path = Path(args.output)
    output_path.parent.mkdir(parents=True, exist_ok=True)
    output_path.write_text(json.dumps(payload, indent=2), encoding="utf-8")
    console.print(f"[bold green]Saved results to {output_path}[/bold green]")


if __name__ == "__main__":
    main()
```

## 4.5 `sast-workshop\semgrep-sast\rules\python-votely.yaml`

```yaml
rules:
  - id: votely-default-secret-key
    message: "Default SECRET_KEY ditemukan. Gunakan secret dari environment/secret manager tanpa fallback yang lemah."
    severity: ERROR
    languages: [python]
    metadata:
      cwe: "CWE-798"
      category: secrets
      technology: [flask]
    patterns:
      - pattern: app.config['SECRET_KEY'] = os.getenv('SECRET_KEY', $DEFAULT)
      - metavariable-regex:
          metavariable: $DEFAULT
          regex: ".*(dev-secret-key|change-this|secret).*"

  - id: votely-flask-debug-enabled
    message: "Flask dijalankan dengan debug=True. Jangan aktifkan debug pada deployment production."
    severity: WARNING
    languages: [python]
    metadata:
      cwe: "CWE-489"
      category: security-misconfiguration
      technology: [flask]
    pattern: $APP.run(..., debug=True, ...)

  - id: votely-bare-except
    message: "Bare except dapat menyembunyikan error keamanan. Tangani exception yang spesifik."
    severity: WARNING
    languages: [python]
    metadata:
      cwe: "CWE-703"
      category: error-handling
    pattern: |
      try:
        ...
      except:
        ...

  - id: votely-broad-except-exception
    message: "except Exception dapat menyembunyikan validation/auth error dan menyulitkan audit."
    severity: INFO
    languages: [python]
    metadata:
      cwe: "CWE-703"
      category: error-handling
    pattern: |
      try:
        ...
      except Exception:
        ...

  - id: votely-file-save-review
    message: "Review file upload. Pastikan validasi MIME, ekstensi, ukuran, nama file, dan scanning antivirus bila diperlukan."
    severity: INFO
    languages: [python]
    metadata:
      cwe: "CWE-434"
      category: file-upload
      technology: [flask]
    pattern: $FILE.save($PATH)
```

## 4.6 `sast-workshop\semgrep-sast\rules\javascript-votely.yaml`

```yaml
rules:
  - id: votely-react-localstorage-token
    message: "Token disimpan di localStorage. Review risiko XSS dan pertimbangkan HttpOnly cookie bila threat model mengharuskan."
    severity: WARNING
    languages: [javascript, typescript]
    metadata:
      cwe: "CWE-922"
      category: token-storage
      technology: [react]
    pattern-either:
      - pattern: localStorage.setItem($KEY, $VALUE)
      - pattern: localStorage.getItem($KEY)

  - id: votely-dangerously-set-inner-html
    message: "dangerouslySetInnerHTML ditemukan. Pastikan sanitasi HTML sebelum render."
    severity: ERROR
    languages: [javascript, typescript]
    metadata:
      cwe: "CWE-79"
      category: xss
      technology: [react]
    pattern: dangerouslySetInnerHTML={{__html: $HTML}}

  - id: votely-innerhtml-assignment
    message: "Assignment ke innerHTML berpotensi menyebabkan XSS."
    severity: ERROR
    languages: [javascript, typescript]
    metadata:
      cwe: "CWE-79"
      category: xss
    pattern: $EL.innerHTML = $VALUE

  - id: votely-window-location-assignment
    message: "Review assignment ke window.location untuk mencegah open redirect."
    severity: INFO
    languages: [javascript, typescript]
    metadata:
      cwe: "CWE-601"
      category: open-redirect
    pattern-either:
      - pattern: window.location = $URL
      - pattern: window.location.href = $URL
```

## 4.7 `sast-workshop\semgrep-sast\rules\generic-secrets.yaml`

```yaml
rules:
  - id: hardcoded-api-key-string
    message: "String yang terlihat seperti API key ditemukan. Review apakah ini secret hardcoded."
    severity: ERROR
    languages: [python, javascript, typescript, generic]
    metadata:
      cwe: "CWE-798"
      category: secrets
    pattern-regex: "(sk-[A-Za-z0-9_-]{10,}|AKIA[0-9A-Z]{16}|AIza[0-9A-Za-z_-]{35})"
```

## 4.8 `sast-workshop\semgrep-sast\run_semgrep.ps1`

```powershell
Param(
  [string]$RepoRoot = "..\.."
)

$ErrorActionPreference = "Stop"

$ResultsDir = Join-Path $PSScriptRoot "..\results"
New-Item -ItemType Directory -Force -Path $ResultsDir | Out-Null

$TargetBackend = Join-Path $RepoRoot "app"
$TargetFrontend = Join-Path $RepoRoot "app\frontend\src"
$RulesDir = Join-Path $PSScriptRoot "rules"

Write-Host "Running Semgrep custom rules against backend and frontend..."

semgrep --config $RulesDir `
  --json `
  --output (Join-Path $ResultsDir "semgrep_custom_results.json") `
  $TargetBackend $TargetFrontend

Write-Host "Running Semgrep Python registry rules..."

semgrep --config p/python `
  --json `
  --output (Join-Path $ResultsDir "semgrep_python_results.json") `
  $TargetBackend

Write-Host "Running Semgrep JavaScript registry rules..."

semgrep --config p/javascript `
  --json `
  --output (Join-Path $ResultsDir "semgrep_javascript_results.json") `
  $TargetFrontend

Write-Host "Running Semgrep OWASP Top 10 rules..."

semgrep --config p/owasp-top-ten `
  --json `
  --output (Join-Path $ResultsDir "semgrep_owasp_results.json") `
  $TargetBackend $TargetFrontend
```

## 4.9 `sast-workshop\comparison\compare.py`

```python
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
```

## 4.10 `sast-workshop\run_all.py`

```python
import argparse
import subprocess
import sys
from pathlib import Path


ROOT = Path(__file__).resolve().parent
RESULTS = ROOT / "results"


def run(cmd, cwd=None):
    print(f"\n>>> {' '.join(str(c) for c in cmd)}")
    subprocess.run(cmd, cwd=cwd, check=True)


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--only-qwen", action="store_true")
    parser.add_argument("--only-semgrep", action="store_true")
    parser.add_argument("--only-compare", action="store_true")
    parser.add_argument("--model", default="qwen3.5-plus")
    args = parser.parse_args()

    RESULTS.mkdir(parents=True, exist_ok=True)

    qwen_output = RESULTS / "qwen_results.json"
    semgrep_output = RESULTS / "semgrep_custom_results.json"
    report_output = RESULTS / "comparison_report.html"

    if not args.only_semgrep and not args.only_compare:
        run(
            [
                sys.executable,
                str(ROOT / "qwen-sast" / "analyzer.py"),
                "--dir",
                str((ROOT / ".." / "app").resolve()),
                "--model",
                args.model,
                "--output",
                str(qwen_output),
            ],
            cwd=ROOT / "qwen-sast",
        )

    if not args.only_qwen and not args.only_compare:
        run(
            [
                "powershell",
                "-ExecutionPolicy",
                "Bypass",
                "-File",
                str(ROOT / "semgrep-sast" / "run_semgrep.ps1"),
            ],
            cwd=ROOT / "semgrep-sast",
        )

    if not args.only_qwen and not args.only_semgrep:
        run(
            [
                sys.executable,
                str(ROOT / "comparison" / "compare.py"),
                "--qwen",
                str(qwen_output),
                "--semgrep",
                str(semgrep_output),
                "--output",
                str(report_output),
            ],
            cwd=ROOT / "comparison",
        )


if __name__ == "__main__":
    main()
```

---

## 5. Quick Start

Setelah file di atas dibuat:

```powershell
cd "D:\6 Semester\DevSecOps\Votely\CI-CD"
.\.venv-sast\Scripts\Activate.ps1
cd sast-workshop
```

### Jalankan semua

```powershell
python .\run_all.py
```

### Jalankan hanya Qwen SAST

```powershell
python .\run_all.py --only-qwen --model qwen3.5-plus
```

### Jalankan hanya Semgrep

```powershell
python .\run_all.py --only-semgrep
```

### Buat ulang report perbandingan

```powershell
python .\run_all.py --only-compare
```

---

## 6. Workshop Step-by-Step Versi Votely

## MODUL 1: Memahami Kode Votely yang Akan Dianalisis

Baca file-file ini sebelum scan:

### Backend Python

- `app/main.py`
- `app/routes/auth_routes.py`
- `app/routes/voting_routes.py`
- `app/models.py`

### Frontend JavaScript/React

- `app/frontend/src/context/AuthContext.jsx`
- `app/frontend/src/components/CommentsSection.jsx`
- `app/frontend/src/pages/CreatePollPage.jsx`
- `app/frontend/src/pages/LoginPage.jsx`
- file `src/pages` lain yang memanggil API atau memproses input user

### Hal yang perlu diamati

- Apakah auth dan authorization konsisten antar endpoint.
- Apakah private poll benar-benar terlindungi di semua endpoint.
- Apakah upload image divalidasi cukup kuat.
- Apakah comment yang berasal dari user aman dari XSS.
- Apakah token frontend dikelola dengan aman.
- Apakah ada default secret, debug mode, atau error handling yang terlalu longgar.

---

## MODUL 2: Menjalankan Qwen SAST

### 2.1 Analisis satu file backend

```powershell
python .\qwen-sast\analyzer.py `
  --file ..\app\routes\voting_routes.py `
  --model qwen3.5-plus `
  --output .\results\qwen_voting_routes.json
```

### 2.2 Analisis satu file frontend

```powershell
python .\qwen-sast\analyzer.py `
  --file ..\app\frontend\src\context\AuthContext.jsx `
  --model qwen3.5-plus `
  --output .\results\qwen_auth_context.json
```

### 2.3 Analisis seluruh backend Votely

```powershell
python .\qwen-sast\analyzer.py `
  --dir ..\app `
  --model qwen3.5-plus `
  --output .\results\qwen_results.json
```

### 2.4 Gunakan model yang lebih hemat

```powershell
python .\qwen-sast\analyzer.py `
  --dir ..\app `
  --model qwen-plus `
  --output .\results\qwen_results_small.json
```

### 2.5 Lihat hasil JSON

```powershell
Get-Content .\results\qwen_results.json | python -m json.tool
```

### Contoh bentuk output

```json
{
  "tool": "Qwen SAST Analyzer",
  "model": "qwen3.5-plus",
  "total_vulnerabilities": 5,
  "results": [
    {
      "file": "app/main.py",
      "language": "python",
      "summary": "Insecure defaults were found in Flask configuration.",
      "vulnerabilities": [
        {
          "line_start": 12,
          "line_end": 12,
          "severity": "HIGH",
          "category": "Insecure Default Configuration",
          "cwe_id": "CWE-798",
          "title": "Default SECRET_KEY fallback in production path",
          "description": "The application falls back to a hardcoded default secret if the environment variable is absent.",
          "impact": "Attackers who know or guess the default secret may forge JWT tokens or session artifacts.",
          "evidence": "app.config['SECRET_KEY'] = os.getenv('SECRET_KEY', 'dev-secret-key-change-this-in-prod')",
          "remediation": "Fail fast when SECRET_KEY is missing in non-development environments.",
          "confidence": "HIGH"
        }
      ]
    }
  ]
}
```

---

## MODUL 3: Menjalankan Semgrep

### 3.1 Scan dengan OWASP Top 10 rules

```powershell
semgrep --config p/owasp-top-ten `
  --output .\results\semgrep_owasp.json `
  --json `
  ..\app ..\app\frontend\src
```

### 3.2 Scan Python backend Votely

```powershell
semgrep --config p/python `
  --output .\results\semgrep_python.json `
  --json `
  ..\app
```

### 3.3 Scan JavaScript/React frontend Votely

```powershell
semgrep --config p/javascript `
  --output .\results\semgrep_javascript.json `
  --json `
  ..\app\frontend\src
```

### 3.4 Scan dengan custom rules Votely

```powershell
semgrep --config .\semgrep-sast\rules `
  --output .\results\semgrep_custom_results.json `
  --json `
  ..\app ..\app\frontend\src
```

### 3.5 Jalankan semua skenario Semgrep

```powershell
powershell -ExecutionPolicy Bypass -File .\semgrep-sast\run_semgrep.ps1
```

### 3.6 Output teks langsung ke terminal

```powershell
semgrep --config p/owasp-top-ten ..\app ..\app\frontend\src
```

### Contoh finding yang realistis di Votely

Temuan yang kemungkinan muncul dari custom rule:

- `app/main.py`: default `SECRET_KEY`
- `app/main.py`: `debug=True`
- `app/routes/voting_routes.py`: `file.save(...)`
- `app/frontend/src/context/AuthContext.jsx`: token di `localStorage`

---

## MODUL 4: Membandingkan Hasil Qwen vs Semgrep

```powershell
python .\comparison\compare.py `
  --qwen .\results\qwen_results.json `
  --semgrep .\results\semgrep_custom_results.json `
  --output .\results\comparison_report.html
```

Buka file hasil:

```powershell
start .\results\comparison_report.html
```

### Apa yang dibandingkan

- jumlah total finding,
- distribusi severity,
- file yang paling sering ditandai,
- finding yang sama-sama ditemukan,
- finding yang hanya ditemukan Qwen,
- finding yang hanya ditemukan Semgrep.

### Interpretasi hasil

Biasanya:

- **Semgrep** unggul untuk konfigurasi lemah, secret patterns, API misuse yang eksplisit, dan sink tertentu.
- **Qwen** unggul untuk broken access control, IDOR, alur auth yang lintas fungsi, dan penjelasan remediation yang lebih kontekstual.

---

## MODUL 5: Membuat Custom Rule Semgrep untuk Votely

Contoh rule tambahan untuk mendeteksi `debug=True` secara spesifik:

Buat `sast-workshop\semgrep-sast\rules\flask-debug.yaml`:

```yaml
rules:
  - id: flask-debug-true
    pattern: $APP.run(..., debug=True, ...)
    message: "Flask debug mode aktif."
    languages: [python]
    severity: ERROR
    metadata:
      cwe: "CWE-489"
```

Test rule:

```powershell
semgrep --config .\semgrep-sast\rules\flask-debug.yaml ..\app
```

Contoh rule untuk React `dangerouslySetInnerHTML`:

```yaml
rules:
  - id: react-dangerously-set-inner-html
    pattern: dangerouslySetInnerHTML={{__html: $HTML}}
    message: "Review sanitasi HTML sebelum render."
    languages: [javascript, typescript]
    severity: ERROR
    metadata:
      cwe: "CWE-79"
```

---

## 7. Mapping Temuan ke File Nyata Votely

Gunakan tabel ini saat menjelaskan hasil workshop.

| Area | File | Apa yang dicek |
| --- | --- | --- |
| Flask config | `app/main.py` | `SECRET_KEY`, `debug=True`, CORS, upload serving |
| Auth | `app/routes/auth_routes.py` | token creation, token validation, auth bypass, user lookup |
| Voting access control | `app/routes/voting_routes.py` | private poll access, owner-only update/delete/reset, vote abuse |
| Upload | `app/routes/voting_routes.py` | extension allowlist, file save path, MIME validation gap |
| Comment flow | `app/routes/voting_routes.py`, `app/frontend/src/components/CommentsSection.jsx` | XSS, auth, delete permission |
| Frontend auth | `app/frontend/src/context/AuthContext.jsx` | localStorage token, fetch auth flow |
| Frontend forms | `app/frontend/src/pages/*.jsx` | input flow, upload flow, API calls |

---

## 8. Rekomendasi Eksperimen Khusus untuk Votely

### Eksperimen 1: Bandingkan model Qwen

```powershell
python .\qwen-sast\analyzer.py --dir ..\app --model qwen3.5-plus --output .\results\qwen_plus.json
python .\qwen-sast\analyzer.py --dir ..\app --model qwen-plus --output .\results\qwen_standard.json
```

Bandingkan:

- jumlah temuan,
- kualitas explanation,
- konsistensi severity,
- biaya dan waktu eksekusi.

### Eksperimen 2: Tambahkan kode yang sengaja lemah

Contoh:

- endpoint admin tanpa auth,
- render comment dengan HTML mentah,
- fallback secret baru di file config,
- upload file tanpa allowlist.

Lalu uji apakah Qwen dan Semgrep sama-sama menangkapnya.

### Eksperimen 3: False positive check

Ubah code yang berisiko menjadi lebih aman:

- hapus `debug=True`,
- paksa `SECRET_KEY` wajib dari environment,
- pindahkan token dari `localStorage` ke cookie strategy di arsitektur baru,
- perketat upload validation.

Kemudian scan ulang dan lihat apakah finding turun.

### Eksperimen 4: Scan terpisah backend vs frontend

```powershell
python .\qwen-sast\analyzer.py --dir ..\app\routes --model qwen3.5-plus --output .\results\qwen_backend_routes.json
python .\qwen-sast\analyzer.py --dir ..\app\frontend\src --model qwen3.5-plus --output .\results\qwen_frontend.json
```

Tujuan:

- melihat apakah model lebih kuat di backend atau frontend,
- memisahkan biaya token,
- memudahkan validasi hasil.

---

## 9. Integrasi ke Workflow DevSecOps Votely

### Integrasi lokal sebelum commit

Tambahkan langkah manual:

1. Jalankan `pytest`.
2. Jalankan `npm run build`.
3. Jalankan `Semgrep`.
4. Jalankan `Qwen SAST` untuk review mendalam pada file sensitif.
5. Review HTML comparison report.

### Integrasi ke Jenkins

Untuk tahap awal:

- jalankan Semgrep pada setiap build,
- simpan artifact `semgrep_*.json`,
- jalankan Qwen analyzer hanya untuk branch tertentu, nightly scan, atau manual trigger karena ada biaya API,
- publish `comparison_report.html` sebagai build artifact.

### Strategi yang direkomendasikan

- **Semgrep**: wajib untuk scan cepat dan deterministik.
- **Qwen**: dipakai untuk deep review pada perubahan auth, access control, upload, comments, dan hasil voting.

---

## 10. Troubleshooting

### Error: `DASHSCOPE_API_KEY not found`

Pastikan file `.env` ada di:

```text
sast-workshop/qwen-sast/.env
```

Atau export manual:

```powershell
$env:DASHSCOPE_API_KEY="sk-your-qwen-key"
```

### Error: `semgrep: command not found`

```powershell
pip install semgrep
```

Jika masih gagal:

```powershell
python -m semgrep --version
```

### Error: `ModuleNotFoundError: No module named 'openai'`

```powershell
pip install -r .\qwen-sast\requirements.txt
```

### Error: registry rules `p/python` atau `p/owasp-top-ten` tidak bisa diunduh

Kemungkinan:

- koneksi internet tidak tersedia,
- environment memblokir akses ke Semgrep Registry.

Solusi:

- jalankan dulu custom rules lokal:

```powershell
semgrep --config .\semgrep-sast\rules ..\app ..\app\frontend\src
```

### Response Qwen bukan JSON valid

Langkah mitigasi:

- gunakan `QWEN_TEMPERATURE=0`,
- kecilkan scope menjadi satu file,
- pecah scan backend dan frontend,
- perketat prompt agar hanya mengembalikan JSON.

### Scan Qwen terlalu mahal atau lambat

Gunakan salah satu strategi:

- scan hanya folder sensitif seperti `app/routes`,
- scan hanya file yang berubah,
- gunakan model yang lebih hemat,
- jalankan Qwen hanya untuk pull request tertentu.

---

## 11. Perbandingan Qwen vs Semgrep untuk Votely

| Aspek | Qwen SAST | Semgrep |
| --- | --- | --- |
| Kecepatan | Lebih lambat karena API call | Sangat cepat |
| Biaya | Berbayar per token/request | Gratis untuk local OSS flow |
| Konteks lintas fungsi | Kuat | Terbatas |
| Rule deterministik | Tidak | Ya |
| Penjelasan remediation | Sangat baik | Biasanya singkat |
| Broken access control | Sering lebih kuat | Butuh rule khusus |
| Secret / config misuse | Bagus | Sangat bagus |
| Integrasi CI/CD | Bisa, tapi perlu kontrol biaya | Sangat cocok |
| Offline | Tidak | Ya untuk local rules |

### Kapan memakai masing-masing di Votely

Gunakan **Semgrep** untuk:

- setiap build Jenkins,
- scan cepat sebelum merge,
- enforcing baseline rules untuk Python/React,
- deteksi config dan pattern berulang.

Gunakan **Qwen** untuk:

- audit file sensitif seperti `auth_routes.py`, `voting_routes.py`, `main.py`,
- review perubahan authorization,
- verifikasi apakah alur private poll benar-benar aman,
- mendapatkan remediation yang lebih kontekstual untuk developer.

### Rekomendasi akhir

Untuk Votely, pendekatan terbaik adalah:

1. **Semgrep sebagai guardrail wajib**.
2. **Qwen sebagai reviewer security kontekstual**.
3. **Comparison report** untuk menunjukkan perbedaan coverage pada workshop atau presentasi.

---

## 12. Checklist Eksekusi Workshop

Gunakan checklist ini saat demo.

1. Pastikan Votely bisa di-test dan di-build.
2. Aktifkan `.venv-sast`.
3. Buat file `.env` untuk Qwen.
4. Jalankan scan satu file backend.
5. Jalankan scan satu file frontend.
6. Jalankan scan seluruh `app`.
7. Jalankan Semgrep registry + custom rules.
8. Generate `comparison_report.html`.
9. Tinjau finding yang sama dan finding yang unik.
10. Pilih 1-2 finding untuk difix lalu scan ulang.

---

## 13. Referensi

- OWASP Top 10: <https://owasp.org/www-project-top-ten/>
- CWE Top 25: <https://cwe.mitre.org/top25/>
- Semgrep Docs: <https://semgrep.dev/docs/>
- Semgrep Registry: <https://semgrep.dev/explore>
- Alibaba Cloud Model Studio Qwen API Reference: <https://www.alibabacloud.com/help/en/model-studio/qwen-api-reference/>
- Alibaba Cloud OpenAI-Compatible Qwen Interface: <https://www.alibabacloud.com/help/en/model-studio/compatibility-of-openai-with-dashscope>

---

## 14. Catatan Penting

- Jangan jalankan kode vulnerable buatan eksperimen di production.
- Jika Anda ingin menjadikan ini bagian permanen dari repo, tambahkan juga `.gitignore` untuk `sast-workshop/results/`.
- Untuk demo workshop, hasil paling menarik biasanya datang dari perbandingan antara:
  `app/main.py`, `app/routes/auth_routes.py`, `app/routes/voting_routes.py`, dan `app/frontend/src/context/AuthContext.jsx`.
