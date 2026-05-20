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
