# Chạy FE

cd frontend
npm install
npm run dev

# Nhật ký Công việc (Worklog) - Phát triển Frontend React

Nhật ký này tóm tắt nhanh tiến trình khởi tạo, phát triển và sửa lỗi để hoàn thành cấu phần Frontend React cho dự án **Review Insight AI**.

---

## 📅 Nhật ký Chi tiết (Ngày: 09/06/2026)

### 1. Khởi tạo & Cài đặt Dự án
* **Hoạt động:** Khởi tạo dự án React + TypeScript sử dụng Vite trong thư mục `frontend/`.
* **Cú pháp thực hiện:** 
  ```bash
  npx -y create-vite@latest ./ --template react-ts --overwrite --no-interactive
  ```
* **Cài đặt thư viện bổ sung:**
  * **Dependencies:** `axios`, `react-router-dom`, `recharts`, `lucide-react`.
  * **DevDependencies (Tailwind v4):** `tailwindcss`, `postcss`, `autoprefixer`, `@tailwindcss/vite` (Vite plugin cho Tailwind v4).
* **Cấu hình:** Cập nhật tệp `vite.config.ts` để nạp plugin `@tailwindcss/vite`. Thiết lập tệp `src/index.css` để nạp bộ thiết kế giao diện Glassmorphism và biến HSL Dark Mode.

### 2. Thiết lập Dịch vụ API & Routing
* **API Client (`src/services/api.ts`):** Xây dựng Axios client kết nối trực tiếp đến PHP Backend (`http://localhost:8080`). Định nghĩa các cấu trúc dữ liệu kiểu dữ liệu (interface) rõ ràng cho `Review`, `Dataset`, `AnalysisReport`, và `DashboardStats`.
* **Định tuyến (`src/App.tsx`):** Cấu hình Layout tổng quan với thanh Sidebar cố định ở bên trái và vùng hiển thị nội dung động định tuyến theo React Router ở bên phải.

### 3. Lập trình Các Thành phần Dùng chung (Components)
* **`Sidebar.tsx`**: Menu điều hướng, tích hợp luồng Polling tự động gửi request đến `/api/health` mỗi 30 giây để kiểm tra và thông báo trực quan trạng thái kết nối tới Backend & AI Service.
* **`FileUploadBox.tsx`**: Hộp kéo thả file CSV, tự động kiểm tra định dạng và chặn file > 20MB.
* **`ReviewPreviewTable.tsx`**: Trích xuất và phân tích trực tiếp file CSV ở client để hiển thị trước 15 dòng đầu.
* **`SentimentChart.tsx`**: Biểu đồ Doughnut hiển thị phân phối sắc thái Tích cực / Trung lập / Tiêu cực.
* **`AspectBarChart.tsx`**: Biểu đồ cột ngang hiển thị tần suất đề cập các khía cạnh.
* **`InsightCard.tsx` & `RecommendationCard.tsx`**: Thẻ nhận định thông minh và khuyến nghị hành động từ kết quả AI.
* **`ReviewTable.tsx`**: Bảng hiển thị toàn bộ đánh giá, hỗ trợ tìm kiếm từ khóa, phân trang, và bộ lọc nhanh theo 3 chỉ số (Sentiment, Aspect, Priority).
* **`LoadingOverlay.tsx`**: Giao diện chờ và hiển thị thanh tiến trình giả lập thông minh khi tải dữ liệu phân tích.

### 4. Xây dựng các Trang (Pages)
* **`UploadPage.tsx`**: Quản lý kéo thả file, xem trước dữ liệu và kích hoạt gửi request phân tích.
* **`DashboardPage.tsx`**: Hỗ trợ 2 chế độ:
  1. Thống kê lũy kế toàn hệ thống (Global Dashboard).
  2. Báo cáo chi tiết của một lượt upload cụ thể theo `report_id` trong Query Parameter.
* **`HistoryPage.tsx`**: Xem danh sách các đợt chạy phân tích cũ kèm theo trạng thái, cho phép click xem lại báo cáo nhanh.
* **`ProductComparisonPage.tsx`**: So sánh chất lượng và cảm xúc giữa 2 ngành hàng hoặc 2 mã sản phẩm khác nhau qua biểu đồ cột kép.
* **`SingleAnalyzePage.tsx`**: Sandbox thử nghiệm nhập trực tiếp nhận xét đơn lẻ để kiểm tra mô hình AI.

---

## 🛠️ Các Lỗi đã Khắc phục (Bug Fixes)

1. **Lỗi lồng cấu trúc `responses` trong Swagger:**
   * *Mô tả:* Tệp `swagger.json` định nghĩa responses của `/api/reviews/analyze-single` bị lồng sai bên trong `requestBody`.
   * *Giải quyết:* Cập nhật đúng cấp cấu trúc để Swagger UI hiển thị thông tin phản hồi.

2. **Lỗi rỗng dữ liệu Báo cáo Chi tiết (`report_id`):**
   * *Mô tả:* Dữ liệu từ Backend trả về đối tượng đã được giải mã JSON (`analytics`, `insights`, `recommendations`), nhưng Frontend lại tìm thuộc tính dạng chuỗi thô (`analytics_json`...) và gọi `JSON.parse()` dẫn đến lỗi JavaScript.
   * *Giải quyết:* Sửa kiểu dữ liệu trong `api.ts` và trực tiếp trích xuất dữ liệu mảng/đối tượng từ tệp báo cáo.

3. **Thiếu Tỷ lệ Trung Lập (Neutral Rate):**
   * *Mô tả:* Giao diện chỉ hiển thị 4 thẻ KPI thô (Tổng đánh giá, Hài lòng, Tiêu cực, Khẩn cấp), bỏ sót Tỷ lệ Trung lập.
   * *Giải quyết:* Bổ sung tham số `neutralPct` vào bộ tính toán `useMemo` và thêm thẻ KPI thứ 5 sử dụng icon `Meh` của Lucide.

4. **Lỗi Không Hiển thị Biểu đồ Khía cạnh trong Báo cáo Chi tiết:**
   * *Mô tả:* Đối tượng `analytics` trong báo cáo chi tiết không có thuộc tính `aspect_distribution` mà trả về tách biệt qua `top_positive_aspects` và `top_negative_aspects`.
   * *Giải quyết:* Thiết lập bộ cộng gộp tự động kết hợp cả 2 nguồn này thành một đối tượng tổng để nạp cho biểu đồ.

---

## 🚀 Đóng gói & Nghiệm thu
* **Build kiểm tra:** Thực hiện lệnh `npm run build` thành công:
  * Nạp và tối ưu hóa thành công **2.374 module**.
  * Tạo ra bundle hoàn chỉnh: `dist/assets/index.js` (~713 KB) và `dist/assets/index.css` (~46 KB).
  * Không phát sinh lỗi biên dịch TypeScript.
