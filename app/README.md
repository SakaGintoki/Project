# Votely - Modern Multi-Voting Platform

Votely adalah aplikasi pemungutan suara berbasis web untuk membuat poll, membagikan link voting, menerima suara, menampilkan hasil, dan membuka diskusi pada setiap poll. Project ini dibangun untuk kebutuhan pembelajaran DevSecOps dengan pipeline CI/CD menggunakan Jenkins, Docker, automated testing, dan health check.

## Fitur Utama

- Auth pengguna dengan register, login, JWT token, dan endpoint profil.
- Dashboard untuk melihat poll yang dapat diakses oleh pengguna.
- CRUD poll untuk user yang sudah login.
- Poll public dan private.
- Tipe voting single choice dan multiple choice.
- Upload cover image untuk poll.
- Batas waktu voting opsional.
- Pencegahan duplicate vote berdasarkan user/IP.
- Hasil voting dengan persentase dan live refresh.
- Mode anonymous/public voter untuk hasil.
- Comment pada setiap poll.
- Reply comment bertingkat.
- Like/unlike comment per user.
- Sorting comment berdasarkan waktu terlama, terbaru, dan best comment.
- Frontend React SPA yang dilayani oleh Flask pada production build.
- CI/CD dengan Docker dan Jenkins.

## Teknologi

| Area | Teknologi |
| --- | --- |
| Backend | Python, Flask, Flask-SQLAlchemy |
| Auth | JWT, bcrypt |
| Database | SQLite |
| Frontend | React, Vite, Tailwind CSS, React Router |
| UI | Lucide React, custom reusable components |
| Testing | Pytest |
| Runtime | Gunicorn |
| Container | Docker multi-stage build |
| CI/CD | Jenkins |

## Struktur Project

```text
.
├── Jenkinsfile
├── README.md
└── app/
    ├── Dockerfile
    ├── README.md
    ├── database.py
    ├── main.py
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
            ├── components/
            ├── context/
            └── pages/
```

## Cara Menjalankan Dengan Docker

Pastikan Docker Desktop sudah berjalan.

```powershell
docker build -t votely-local:latest ./app
docker run -d --name votely-local-app -p 8083:5000 votely-local:latest
```

Aplikasi tersedia di:

```text
http://localhost:8083
```

Jika container dengan nama yang sama sudah ada:

```powershell
docker rm -f votely-local-app
docker run -d --name votely-local-app -p 8083:5000 votely-local:latest
```

Health check:

```powershell
curl http://localhost:8083/health
curl http://localhost:8083/api/health
```

## Cara Menjalankan Untuk Development Lokal

### Backend Flask

```powershell
cd app
python -m venv venv
.\venv\Scripts\python.exe -m pip install -r requirements.txt
.\venv\Scripts\python.exe main.py
```

Backend berjalan di:

```text
http://localhost:5000
```

### Frontend React/Vite

Gunakan Node.js versi 20.19+ atau 22.12+.

```powershell
cd app\frontend
npm.cmd install
npm.cmd run dev
```

Frontend development berjalan di:

```text
http://localhost:3000
```

Vite sudah dikonfigurasi untuk proxy request `/api` dan `/uploads` ke Flask backend di `http://localhost:5000`.

## Testing

Jalankan test backend:

```powershell
cd app
.\venv\Scripts\python.exe -m pytest tests\ -v
```

Jalankan test di dalam Docker image seperti stage Jenkins:

```powershell
docker run --rm votely-local:latest python -m pytest /app/tests/ -v
```

Test mencakup:

- Pembuatan poll.
- Pengambilan daftar poll.
- Submit vote.
- Pencegahan duplicate vote.
- Create/list comment.
- Restriksi guest comment.
- Permission delete comment.
- Restriksi comment pada private poll.
- Reply comment.
- Like/unlike comment.
- Sorting comment.

## API Endpoint

### Auth

| Method | Endpoint | Deskripsi |
| --- | --- | --- |
| `POST` | `/api/auth/register` | Register user baru |
| `POST` | `/api/auth/login` | Login user |
| `GET` | `/api/auth/me` | Ambil profil user dari token |

### Poll

| Method | Endpoint | Deskripsi |
| --- | --- | --- |
| `GET` | `/api/votings` | Daftar poll public dan poll milik user |
| `GET` | `/api/votings/public` | Daftar poll public untuk homepage |
| `GET` | `/api/votings/<id>` | Detail poll |
| `POST` | `/api/votings` | Membuat poll baru |
| `PUT` | `/api/votings/<id>` | Update poll milik user |
| `DELETE` | `/api/votings/<id>` | Hapus poll milik user |
| `POST` | `/api/vote` | Submit vote |
| `GET` | `/api/results/<id>` | Ambil hasil voting |
| `POST` | `/api/upload` | Upload image |

### Comment

| Method | Endpoint | Deskripsi |
| --- | --- | --- |
| `GET` | `/api/votings/<id>/comments?sort=oldest` | Comment terlama lebih dulu |
| `GET` | `/api/votings/<id>/comments?sort=newest` | Comment terbaru lebih dulu |
| `GET` | `/api/votings/<id>/comments?sort=best` | Comment dengan like terbanyak lebih dulu |
| `POST` | `/api/votings/<id>/comments` | Membuat comment atau reply |
| `POST` | `/api/comments/<id>/like` | Like comment |
| `DELETE` | `/api/comments/<id>/like` | Unlike comment |
| `DELETE` | `/api/comments/<id>` | Hapus comment |

### System

| Method | Endpoint | Deskripsi |
| --- | --- | --- |
| `GET` | `/health` | Health check untuk Jenkins |
| `GET` | `/api/health` | Health check API |
| `GET` | `/api/test` | Test API reachability |

## Environment Variable

| Variable | Default | Deskripsi |
| --- | --- | --- |
| `DATABASE_URL` | `sqlite:///votely.db` | URL koneksi database |
| `SECRET_KEY` | `dev-secret-key-change-this-in-prod` | Secret Flask/JWT |
| `FLASK_APP` | `main.py` | Entry point Flask |
| `PYTHONUNBUFFERED` | `1` | Output log Python tanpa buffer |

Untuk deployment production, set `SECRET_KEY` dari Jenkins credential atau environment server.

## Integrasi Jenkins

Pipeline berada di `Jenkinsfile` pada root repository.

Tahapan pipeline:

1. `Clone`: mengambil source code dari SCM.
2. `Build`: build Docker image dari folder `./app`.
3. `Test`: menjalankan Pytest di dalam Docker image.
4. `Deploy`: menjalankan container pada port yang ditentukan.
5. `Cleanup`: menghapus image build sebelumnya.
6. `Health Check`: memanggil endpoint `/health`.

Konfigurasi port saat ini:

```groovy
APP_PORT = "8083"
```

Setelah deploy Jenkins berhasil, aplikasi dapat diakses melalui host Jenkins/server pada port tersebut.

## Catatan Database dan Deployment

Project saat ini menggunakan SQLite. Jika container dihapus dan tidak memakai volume, data voting, user, dan comment akan hilang. Untuk deployment yang membutuhkan data persisten, gunakan Docker volume atau pindah ke database eksternal seperti PostgreSQL/MySQL.

Contoh volume SQLite:

```powershell
docker run -d --name votely-local-app -p 8083:5000 -v votely-data:/app/instance votely-local:latest
```

## Akun Login

Tidak ada akun default. Buat akun baru melalui halaman register:

```text
http://localhost:8083/register
```

Contoh password valid:

```text
Test1234
```

Password minimal 8 karakter dan harus mengandung huruf besar, huruf kecil, serta angka.
