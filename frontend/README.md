# Frontend React - Review Insight AI

Ứng dụng giao diện khách (Frontend Client) của dự án **Review Insight AI**, được xây dựng trên nền tảng React + TypeScript + Vite + Tailwind CSS v4 và Recharts nhằm cung cấp trải nghiệm phân tích phản hồi khách hàng chuyên nghiệp, hiện đại.

## 🚀 Các Tính Năng Đã Triển Khai

1. **Trang Tải Lên CSV (`/` - UploadPage):**
   * Hộp tải kéo thả tệp (`.csv`) với cơ chế kiểm tra định dạng và kích thước (tối đa 20MB).
   * **Xem trước dữ liệu:** Đọc và phân tích trực tiếp phía Client để hiển thị trước 15 dòng dữ liệu đầu tiên trước khi nhấn phân tích.
   * Gọi API chạy batch phân tích thông minh tại Backend PHP.

2. **Dashboard Thống Kê (`/dashboard` - DashboardPage):**
   * **Hai chế độ hoạt động:** Báo cáo chi tiết theo tệp vừa upload (hoặc tệp cũ được chọn) vs. Thống kê lũy kế tổng hợp của toàn hệ thống.
   * Thống kê KPI: Tổng đánh giá, tỷ lệ hài lòng (Positive), tỷ lệ tiêu cực (Negative), lượng việc khẩn cấp.
   * Biểu đồ sắc thái: Biểu đồ tròn (Recharts Doughnut) phân tích sắc thái cảm xúc.
   * Biểu đồ khía cạnh: Biểu đồ cột ngang (Recharts Horizontal Bar) xếp hạng các khía cạnh (quality, price, delivery...).
   * Thẻ nhận định thông minh (Insights) & Đề xuất hành động (Recommendations) tự động sinh từ AI.
   * Bảng lọc tương tác: Tìm kiếm và lọc danh sách đánh giá theo Sắc thái, Khía cạnh, Độ ưu tiên kèm phân trang.
   * Xem chi tiết từng review qua cửa sổ trượt (Drawer Detail).
   * Sau khi model nội bộ phân tích thô, người dùng có thể chủ động bấm
     **"Đưa ra nhận xét và đề xuất cho sản phẩm"** để gọi LLM, nhận đánh giá
     theo từng mã sản phẩm và lưu kết quả vào báo cáo.

3. **Lịch Sử Phân Tích (`/history` - HistoryPage):**
   * Liệt kê danh sách tất cả các tệp CSV đã tải lên hệ thống.
   * Hiển thị trạng thái xử lý thời gian thực (Hoàn tất, Thất bại, Đang xử lý).
   * Cho phép nhấp "Xem báo cáo" để tải lại Dashboard chi tiết của lượt chạy đó.

4. **So Sánh Sản Phẩm (`/compare` - ProductComparisonPage):**
   * So sánh trực quan các chỉ số trung bình giữa 2 Ngành hàng hoặc 2 Mã sản phẩm (SKU) khác nhau.
   * Biểu đồ so sánh cột kép biểu diễn tỷ lệ sắc thái cảm xúc và số lượng đề cập khía cạnh.

5. **Trình Phân Tích Lẻ (`/playground` - SingleAnalyzePage):**
   * Sân chơi Sandbox cho phép nhập thủ công một đánh giá, chọn điểm sao, ngành hàng và chạy phân tích AI ngay lập tức để kiểm chứng mô hình.

6. **Theo Dõi Trạng Thái Hệ Thống (System Health Check):**
   * Tích hợp cơ chế tự động thăm dò (polling) trạng thái của PHP Backend và Python AI Service sau mỗi 30 giây để cảnh báo lập trình viên trên Sidebar.

---

## 🛠️ Bộ Công Nghệ Sử Dụng

* **Core Framework:** React 19 + TypeScript + Vite.
* **Styling (CSS):** Tailwind CSS v4 (sử dụng plugin `@tailwindcss/vite` tích hợp trực tiếp, tối ưu hóa CSS build).
* **Vẽ biểu đồ:** Recharts.
* **Icon:** Lucide React.
* **Router:** React Router DOM (v7).
* **API Client:** Axios.

---

## 💻 Hướng Dẫn Cài Đặt & Chạy Local

### Yêu Cầu Hệ Thống:
* Đã cài đặt **Node.js (18+)** và **npm**.
* PHP Backend đang chạy tại: `http://localhost:8080`
* Python AI Service đang chạy tại: `http://localhost:8001`

### Các bước khởi chạy:

1. **Di chuyển vào thư mục frontend:**
   ```bash
   cd frontend
   ```

2. **Cài đặt các thư viện (nếu chưa thực hiện):**
   ```bash
   npm install
   ```

3. **Khởi chạy máy chủ phát triển (Dev Server):**
   ```bash
   npm run dev
   ```
   *Ứng dụng sẽ khởi chạy tại địa chỉ mặc định:* **`http://localhost:5173`**

4. **Đóng gói sản phẩm (Production Build):**
   ```bash
   npm run build
   ```
   *Thư mục phân phối sẽ được tạo tại:* `frontend/dist/`
