# Backend C# ASP.NET Core - Goi Y Lam Sau

Folder nay chua can code backend ngay. Day la huong dan de nhom lam sau khi AI service on dinh.

## Vai tro backend

Backend la lop trung gian giua frontend va AI service.

Backend phu trach:

- Nhan file CSV tu frontend.
- Validate file.
- Parse CSV thanh list review.
- Goi AI service Python.
- Luu ket qua vao database.
- Tra response cho frontend.
- Quan ly lich su analyze.

## API de xuat

```text
POST /api/reviews/upload
POST /api/reviews/analyze-single
GET /api/reviews
GET /api/reviews/{id}
GET /api/dashboard
GET /api/reports/{id}
```

## Giao tiep voi AI Service

Backend goi:

```text
POST http://localhost:8001/analyze-batch
```

Request body se lay tu CSV upload.

## Cong nghe de xuat

- ASP.NET Core Web API.
- Entity Framework Core.
- SQLite cho demo hoac PostgreSQL cho ban tot hon.
- CsvHelper de doc CSV.
- ClosedXML neu can export Excel.
- Swagger de test API.

## Database table goi y

```text
Datasets
Reviews
ReviewAnalyses
AnalysisReports
```

## Luu y

Trong demo ban dau, backend co the luu tam vao memory hoac SQLite. Khi san pham that thi dung PostgreSQL/SQL Server.
