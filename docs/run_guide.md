# Run Guide Chung

## Yeu cau

May can cai san:

- PHP 8.1+ voi `pdo_sqlite` va `curl`.
- Node.js 18+ va npm.
- Python 3.

## Chay toan bo he thong

Tu thu muc goc `review-insight-ai`, chi chay mot lenh:

```bash
./scripts/dev.sh
```

Script tu dong:

1. Cai frontend dependencies neu chua co.
2. Tao `ai-service/.venv` neu chua co.
3. Cai Python requirements neu chua co.
4. Chay Python AI Service.
5. Chay PHP Backend.
6. Chay React Frontend.

Backend va frontend chi duoc khoi dong sau khi AI Service tai port `8001`
da tra health check thanh cong.

Sau khi khoi dong:

```text
Frontend:   http://127.0.0.1:5173
Backend:    http://127.0.0.1:8080
AI Service: http://127.0.0.1:8001
AI Docs:    http://127.0.0.1:8001/docs
```

Lan chay dau tien se lau hon vi script can cai npm va Python packages.
Hay doi den khi terminal hien:

```text
Python AI service ready.
Development servers are running.
```

Nhan `Ctrl+C` mot lan de dung ca ba service.

## Kiem tra

Kiem tra AI service:

```bash
curl http://127.0.0.1:8001/health
```

Kiem tra backend va ket noi AI:

```bash
curl http://127.0.0.1:8080/api/health
```

Mo ung dung:

```text
http://127.0.0.1:5173
```

## Che do mock

Neu chi can test giao dien va backend ma khong muon chay model Python:

```bash
AI_MODE=mock ./scripts/dev.sh
```

## Xu ly loi port dang ban

Dung cum server cu bang `Ctrl+C`. Neu terminal cu da mat, chay:

```bash
pkill -f "scripts/dev.sh"
pkill -f "php -S 127.0.0.1:8080"
pkill -f "uvicorn src.api:app"
pkill -f "vite --host 127.0.0.1"
```

Sau do chay lai:

```bash
./scripts/dev.sh
```

## Kien truc ket noi

```text
React Frontend :5173
    -> PHP Backend :8080
        -> Python AI Service :8001
```
