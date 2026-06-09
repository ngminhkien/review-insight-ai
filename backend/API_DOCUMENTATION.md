# Tài liệu API Backend - Review Insight AI

Tệp này giải thích chi tiết các API được định nghĩa trong PHP Backend (`backend/public/index.php`), bao gồm phương thức (Method), đường dẫn (Path), mô tả chức năng, tham số đầu vào (Request) và dữ liệu trả về mẫu (Response).

---

## Danh sách API

### 1. Kiểm tra trạng thái hệ thống (Health Check)
* **Endpoint:** `GET /api/health`
* **Mô tả:** Kiểm tra trạng thái hoạt động của PHP Backend và kết nối từ Backend tới Python AI Service.
* **Tham số (Request Query):** Không có.
* **Kết quả trả về mẫu (Response - JSON):**
  * **Khi kết nối thành công:**
    ```json
    {
      "status": "ok",
      "service": "review-insight-php-backend",
      "ai_service": {
        "status": "ok",
        "service": "review-insight-ai"
      }
    }
    ```
  * **Khi mất kết nối tới AI Service:**
    ```json
    {
      "status": "ok",
      "service": "review-insight-php-backend",
      "ai_service": {
        "status": "unavailable",
        "message": "Connection refused..."
      }
    }
    ```

---

### 2. Tải lên và phân tích file CSV (Upload & Analyze CSV)
* **Endpoint:** `POST /api/reviews/upload`
* **Mô tả:** Tiếp nhận file CSV chứa danh sách các review sản phẩm từ phía Client, thực hiện chuẩn hóa dữ liệu, gọi Python AI Service để chạy phân tích hàng loạt (batch analysis), sau đó lưu toàn bộ dữ liệu thô và kết quả phân tích vào SQLite database.
* **Định dạng dữ liệu gửi lên (Request - Multipart Form Data):**
  * Key: `file` (Kiểu file CSV. Xem cấu trúc mẫu trong `data/sample_reviews.csv`).
* **Kết quả trả về mẫu (Response - JSON, HTTP Status 201):**
  ```json
  {
    "message": "CSV uploaded and analyzed successfully.",
    "dataset_id": 1,
    "report_id": 1,
    "total_reviews": 120,
    "analytics": {
      "sentiment_distribution": {
        "positive": 80,
        "neutral": 20,
        "negative": 20
      },
      "aspect_distribution": {
        "quality": 50,
        "price": 30,
        "delivery": 40
      }
    },
    "insights": [
      "Khách hàng đánh giá rất cao về chất lượng sản phẩm.",
      "Có nhiều phản hồi tiêu cực liên quan đến khâu đóng gói."
    ],
    "recommendations": [
      "Cần tối ưu lại quy trình đóng gói và đối tác vận chuyển."
    ],
    "results": [
      {
        "review_text": "Sản phẩm dùng rất tốt, giao hàng nhanh",
        "sentiment": "positive",
        "confidence": 0.95,
        "aspects": ["quality", "delivery"],
        "priority": "low"
      }
    ]
  }
  ```

---

### 3. Phân tích một đánh giá đơn lẻ (Analyze Single Review)
* **Endpoint:** `POST /api/reviews/analyze-single`
* **Mô tả:** Phân tích một bài review đơn lẻ, gửi yêu cầu sang AI Service, lưu review và kết quả phân tích vào DB và trả về kết quả ngay lập tức.
* **Định dạng dữ liệu gửi lên (Request - JSON Body):**
  ```json
  {
    "review_text": "Sản phẩm giao quá chậm, hộp bị móp méo nặng",
    "product_id": "P102",
    "product_type": "electronics",
    "rating": 2,
    "date": "2026-06-09"
  }
  ```
  * *`review_text` (Bắt buộc)*: Nội dung nhận xét.
  * *`rating` (Tùy chọn)*: Điểm đánh giá (1 đến 5).
* **Kết quả trả về mẫu (Response - JSON, HTTP Status 201):**
  ```json
  {
    "message": "Review analyzed successfully.",
    "review_id": 42,
    "result": {
      "sentiment": "negative",
      "confidence": 0.985,
      "aspects": ["delivery", "packaging"],
      "priority": "high"
    }
  }
  ```

---

### 4. Lấy danh sách các đánh giá đã phân tích (List Reviews)
* **Endpoint:** `GET /api/reviews`
* **Mô tả:** Lấy danh sách các đánh giá đã lưu trong database kèm theo kết quả phân tích AI (sentiment, aspect, priority).
* **Tham số (Request Query):**
  * `limit` (Tùy chọn, mặc định là 50): Số lượng bản ghi muốn lấy.
* **Kết quả trả về mẫu (Response - JSON):**
  ```json
  {
    "data": [
      {
        "id": 1,
        "product_id": "P001",
        "product_type": "phone",
        "rating": 5,
        "review_text": "Good quality and fast delivery",
        "date": "2024-01-02",
        "sentiment": "positive",
        "confidence": 0.965,
        "aspects": "quality,delivery",
        "priority": "low"
      }
    ]
  }
  ```

---

### 5. Lấy chi tiết một đánh giá (Get Review Detail)
* **Endpoint:** `GET /api/reviews/{id}`
* **Mô tả:** Xem chi tiết một bài đánh giá cụ thể dựa trên ID hệ thống tự sinh.
* **Kết quả trả về mẫu (Response - JSON):**
  ```json
  {
    "id": 1,
    "dataset_id": 1,
    "review_id": "rev-001",
    "product_id": "P001",
    "product_type": "phone",
    "rating": 5,
    "review_text": "Good quality and fast delivery",
    "date": "2024-01-02",
    "sentiment": "positive",
    "confidence": 0.965,
    "aspects": "quality,delivery",
    "priority": "low"
  }
  ```
  *(Nếu không tồn tại ID, trả về HTTP status 404: `{"error": "Review not found."}`)*

---

### 6. Lấy dữ liệu thống kê tổng quan (Dashboard Analytics)
* **Endpoint:** `GET /api/dashboard`
* **Mô tả:** Tổng hợp nhanh số liệu phân tích từ toàn bộ database (tổng số review, phân bố cảm xúc, phân bố khía cạnh aspect, thống kê theo xếp hạng rating) để hiển thị lên Dashboard.
* **Kết quả trả về mẫu (Response - JSON):**
  ```json
  {
    "total_reviews": 125,
    "sentiment_summary": [
      { "sentiment": "positive", "count": 85 },
      { "sentiment": "neutral", "count": 25 },
      { "sentiment": "negative", "count": 15 }
    ],
    "rating_distribution": [
      { "rating": 5, "count": 60 },
      { "rating": 4, "count": 30 },
      { "rating": 3, "count": 20 },
      { "rating": 2, "count": 10 },
      { "rating": 1, "count": 5 }
    ]
  }
  ```

---

### 7. Lấy nội dung báo cáo tổng hợp theo ID (Get Report Detail)
* **Endpoint:** `GET /api/reports/{id}`
* **Mô tả:** Lấy thông tin báo cáo chi tiết (gồm các đề xuất - recommendations, góc nhìn - insights, và số liệu thống kê) đã được tạo sau một đợt upload file CSV.
* **Kết quả trả về mẫu (Response - JSON):**
  ```json
  {
    "id": 1,
    "dataset_id": 1,
    "total_reviews": 120,
    "analytics": {
      "sentiment_distribution": { "positive": 80, "neutral": 20, "negative": 20 }
    },
    "insights": [
      "Khách hàng đánh giá rất cao về chất lượng sản phẩm."
    ],
    "recommendations": [
      "Cần tối ưu lại quy trình đóng gói."
    ],
    "created_at": "2026-06-09 18:00:00"
  }
  ```

---

### 8. Tài liệu tương tác API (Swagger UI & OpenAPI Spec)
* **Endpoint:** `GET /docs` hoặc `GET /api/docs`
  * **Mô tả:** Hiển thị giao diện Swagger UI giúp lập trình viên chạy thử các API một cách trực quan ngay trên trình duyệt.
* **Endpoint:** `GET /swagger.json`
  * **Mô tả:** Trả về file cấu hình chuẩn OpenAPI Specification của toàn bộ hệ thống API.
