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
