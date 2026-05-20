# Hands-On SAST: Qwen vs Semgrep

Workshop membangun **Static Application Security Testing (SAST)** menggunakan LLM (**Qwen**), dibandingkan dengan **Semgrep** sebagai tool SAST berbasis aturan (rule-based) pada website **Votely**.

---

## Struktur Proyek

```text
CI-CD/
├── app/                         # Source code website Votely
│   ├── main.py
│   ├── database.py
│   ├── models.py
│   ├── requirements.txt
│   ├── routes/
│   │   ├── auth_routes.py
│   │   └── voting_routes.py
│   ├── tests/
│   │   └── test_app.py
│   └── frontend/
│       ├── package.json
│       ├── vite.config.js
│       └── src/
│           ├── context/
│           │   └── AuthContext.jsx
│           ├── components/
│           │   ├── Navbar.jsx
│           │   ├── Footer.jsx
│           │   └── CommentsSection.jsx
│           └── pages/
│               ├── LoginPage.jsx
│               ├── RegisterPage.jsx
│               ├── DashboardPage.jsx
│               ├── CreatePollPage.jsx
│               ├── EditPollPage.jsx
│               ├── VotingDetailPage.jsx
│               └── ResultsPage.jsx
│
├── qwen-sast/                   # LLM-based SAST tool
│   ├── analyzer.py              # Main analyzer menggunakan API Qwen
│   ├── prompts.py               # Prompt templates
│   └── requirements.txt
│
├── semgrep-sast/                # Semgrep configuration
│   ├── rules/
│   │   ├── python-security.yaml
│   │   └── javascript-security.yaml
│   └── run_semgrep.ps1
│
├── comparison/
│   └── compare.py               # Comparison & HTML report generator
│
├── results/                     # Output (auto-generated)
│   ├── qwen_results.json
│   ├── semgrep_full_results.json
│   └── comparison_report.html
│
└── run_all.py                   # Master runner
```

---

## Prasyarat

### 1. Python 3.11+
```bash
python --version
```

### 2. Install dependencies Python
```bash
pip install openai python-dotenv rich pyyaml
```

### 3. Install Semgrep
```bash
pip install semgrep
```

### 4. Qwen API Key
```bash
set DASHSCOPE_API_KEY=sk-your-qwen-key
```

> **Catatan**: Buat file `.env` di folder `qwen-sast` untuk menyimpan API key:
> ```
> DASHSCOPE_API_KEY=sk-your-qwen-key
> QWEN_BASE_URL=https://dashscope-intl.aliyuncs.com/compatible-mode/v1
> QWEN_MODEL=qwen3.5-plus
> ```

---

## Quick Start

### Jalankan semua (Qwen + Semgrep + Perbandingan)
```bash
python run_all.py
```

### Jalankan hanya LLM SAST
```bash
python run_all.py --only-qwen --model qwen3.5-plus
```

### Jalankan hanya Semgrep
```bash
python run_all.py --only-semgrep
```

### Buat laporan perbandingan (dari hasil yang sudah ada)
```bash
python run_all.py --only-compare
```

---

## Workshop Step-by-Step

### MODUL 1: Memahami Vulnerable Code

Buka dan baca file-file target berikut:

**Python / Backend security targets:**
- `app/main.py` — Default Secret, Debug Mode, Security Headers
- `app/routes/auth_routes.py` — JWT handling, Authentication Flow
- `app/routes/voting_routes.py` — Access Control, File Upload, Voting Logic
- `app/models.py` — Data Exposure, Object Relationships

**JavaScript / Frontend security targets:**
- `app/frontend/src/context/AuthContext.jsx` — Token Storage, Auth Flow
- `app/frontend/src/components/CommentsSection.jsx` — User Input, Comment Rendering
- `app/frontend/src/pages/CreatePollPage.jsx` — Upload Flow, Form Handling
- `app/frontend/src/pages/LoginPage.jsx` — Authentication Request Handling

> Perhatikan pola kode yang berisiko dan area yang berhubungan dengan auth, access control, upload, token, dan comment input.

---

### MODUL 2: Menjalankan LLM SAST

#### 2.1 Analisis satu file backend
```bash
python qwen-sast/analyzer.py --file app/routes/auth_routes.py --model qwen3.5-plus --output results/qwen_auth.json
```

#### 2.2 Analisis satu file frontend
```bash
python qwen-sast/analyzer.py --file app/frontend/src/context/AuthContext.jsx --model qwen3.5-plus --output results/qwen_auth_context.json
```

#### 2.3 Analisis seluruh direktori aplikasi
```bash
python qwen-sast/analyzer.py --dir app/ --model qwen3.5-plus --output results/qwen_results.json
```

#### 2.4 Gunakan model yang lebih hemat
```bash
python qwen-sast/analyzer.py --dir app/ --model qwen-plus --output results/qwen_results_small.json
```

#### 2.5 Lihat hasil
```bash
type results\qwen_results.json | python -m json.tool
```

**Contoh output LLM:**
```json
{
  "tool": "Qwen SAST Analyzer",
  "total_vulnerabilities": 8,
  "results": [
    {
      "file": "app/main.py",
      "vulnerabilities": [
        {
          "line_start": 12,
          "line_end": 12,
          "severity": "HIGH",
          "category": "Insecure Default Configuration",
          "cwe_id": "CWE-798",
          "title": "Default Secret Key Fallback",
          "description": "Aplikasi menggunakan fallback SECRET_KEY default ketika environment variable tidak tersedia.",
          "remediation": "Gunakan SECRET_KEY wajib dari environment dan hentikan startup jika belum diset.",
          "confidence": "HIGH"
        }
      ]
    }
  ]
}
```

---

### MODUL 3: Menjalankan Semgrep

#### 3.1 Scan dengan OWASP Top 10 rules
```bash
semgrep --config p/owasp-top-ten --output results/semgrep_owasp.json --json app/
```

#### 3.2 Scan dengan rules Python
```bash
semgrep --config p/python --output results/semgrep_python.json --json app/
```

#### 3.3 Scan dengan custom rules kita
```bash
semgrep --config semgrep-sast/rules/ --output results/semgrep_custom.json --json app/
```

#### 3.4 Scan lengkap (semua rules)
```bash
powershell -ExecutionPolicy Bypass -File semgrep-sast/run_semgrep.ps1
```

#### 3.5 Output teks (langsung di terminal)
```bash
semgrep --config p/owasp-top-ten app/
```

**Contoh output Semgrep:**
```text
app/main.py
  votely-default-secret-key (line 12)
  ❯ VULNERABILITY: default SECRET_KEY masih digunakan.

  12┆ app.config['SECRET_KEY'] = os.getenv('SECRET_KEY', 'dev-secret-key-change-this-in-prod')
```

---

### MODUL 4: Membandingkan Hasil

```bash
python comparison/compare.py --qwen results/qwen_results.json --semgrep results/semgrep_full_results.json --output results/comparison_report.html
```

Kemudian buka laporan HTML di browser:
```bash
start results/comparison_report.html
```

---

### MODUL 5: Membuat Custom Rule Semgrep

Buat file `semgrep-sast/rules/my-custom-rule.yaml`:

```yaml
rules:
  - id: votely-default-secret-key
    pattern: app.config['SECRET_KEY'] = os.getenv('SECRET_KEY', $DEFAULT)
    message: "Insecure default secret key ditemukan."
    languages: [python]
    severity: ERROR
    metadata:
      cwe: "CWE-798"
```

Test rule:
```bash
semgrep --config semgrep-sast/rules/my-custom-rule.yaml app/
```

---

## Perbandingan LLM vs Semgrep

| Aspek | LLM SAST | Semgrep |
|-------|----------|---------|
| **Kecepatan** | Lebih lambat (API call) | Sangat cepat |
| **Biaya** | Berbayar per request/token | Gratis (OSS) |
| **Pattern Matching** | Kontekstual/semantik | Rule-based exact |
| **False Positives** | Bisa ada | Rendah untuk rule yang presisi |
| **Penjelasan** | Sangat detail & kontekstual | Terbatas |
| **Remediation** | Kontekstual dengan contoh | Generic |
| **Bahasa Support** | Fleksibel | Banyak bahasa |
| **CI/CD Integration** | Perlu kontrol biaya | Native & mudah |
| **Offline** | Tidak | Ya |
| **Reprodusibilitas** | Tidak selalu konsisten | Deterministik |
| **Logic Flaws** | Bisa mendeteksi | Terbatas |
| **Konteks Bisnis** | Memahami konteks aplikasi | Tidak |

### Kapan Menggunakan Masing-masing?

**Gunakan Semgrep untuk:**
- CI/CD pipeline
- Pattern-based vulnerability yang well-defined
- Saat kecepatan dan biaya penting
- Integrasi rutin dengan workflow DevSecOps

**Gunakan LLM SAST untuk:**
- Deep security review
- Code audit manual
- Logic flaws dan business logic vulnerabilities
- Saat membutuhkan penjelasan dan remediation detail
- Vulnerability pattern baru yang belum ada rule-nya

**Rekomendasi: Gunakan keduanya secara komplementer.**

---

## Variasi Eksperimen

### Eksperimen 1: Bandingkan model Qwen besar vs lebih hemat
```bash
python qwen-sast/analyzer.py --dir app/ --model qwen3.5-plus --output results/qwen_plus.json
python qwen-sast/analyzer.py --dir app/ --model qwen-plus --output results/qwen_small.json
```

### Eksperimen 2: Tulis custom Semgrep rule untuk area auth atau upload
Baca `app/routes/auth_routes.py` atau `app/routes/voting_routes.py` dan tulis rule yang tepat untuk mendeteksi pola spesifik.

### Eksperimen 3: Tambah kode vulnerable baru
Buat file baru di dalam `app/` dan lihat apakah kedua tool dapat mendeteksinya.

### Eksperimen 4: Test false positive rate
Perbaiki bagian kode yang lemah, lalu jalankan scan ulang untuk memeriksa apakah alert berkurang.

---

## Troubleshooting

### Error: `DASHSCOPE_API_KEY not found`
```bash
set DASHSCOPE_API_KEY=sk-your-qwen-key
```

### Error: `semgrep: command not found`
```bash
pip install semgrep
```

### Error: `ModuleNotFoundError: No module named 'openai'`
```bash
pip install -r qwen-sast/requirements.txt
```

### Semgrep scan sangat lambat
```bash
semgrep --config p/owasp-top-ten --timeout 30 app/
```

---

## Referensi

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [CWE Top 25](https://cwe.mitre.org/top25/)
- [Semgrep Documentation](https://semgrep.dev/docs/)
- [Semgrep Registry](https://semgrep.dev/explore)
- [Qwen API Documentation](https://www.alibabacloud.com/help/en/model-studio/qwen-api-reference/)
- [SANS Top 25 Software Errors](https://www.sans.org/top25-software-errors/)

---

## Lisensi

Dibuat untuk tujuan edukasi. Kode aplikasi yang dianalisis tetap hanya untuk latihan keamanan dan pembelajaran DevSecOps.
