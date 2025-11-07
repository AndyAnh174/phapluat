
## 🎯 MỤC TIÊU MỚI

Xây dựng một **web trắc nghiệm duy nhất** dành cho học sinh HCMUTE, trong đó:

* **User (học sinh)** chỉ thấy 1 nút “Bắt đầu làm bài thi” (nếu đã được mở).
* **Admin** có quyền chọn bộ trắc nghiệm từ “kho đề”, mở hoặc đóng bài thi, xem kết quả, xuất dữ liệu.

---

## 🏠 1. CẤU TRÚC TRANG WEB

### **1. Trang chủ**

* Giới thiệu ngắn gọn: mục tiêu, hướng dẫn đăng nhập.
* Hai nút:

  * 🔵 **Đăng nhập học sinh** (Google OAuth HCMUTE domain)
  * 🔴 **Đăng nhập admin** (Google OAuth hoặc tài khoản riêng từ ENV: `ADMIN_USERNAME`/`ADMIN_PASSWORD`)
* Khi user đăng nhập:

  * Nếu là học sinh → đi đến trang thi.
  * Nếu là admin → đi đến trang quản trị.

#### Thông tin đăng nhập admin (ENV)

Để dùng tài khoản admin riêng không qua Google OAuth, cấu hình trong file `.env`:

```env
ADMIN_USERNAME=your_admin_username
ADMIN_PASSWORD=your_admin_password
```

Gợi ý bảo mật:
- Không commit `.env` lên git.
- Có thể dùng biến `ADMIN_PASSWORD_HASH` thay cho `ADMIN_PASSWORD` nếu muốn lưu dạng băm (BCrypt/Argon2), khi đó ở runtime so khớp mật khẩu với hash.

---

### **2. Trang làm bài thi (dành cho học sinh)**

* Hiển thị thông tin bài thi hiện tại (tên, mô tả, thời gian làm).
* Nút **“Bắt đầu làm bài thi”** (chỉ hiện nếu bài thi đang mở).
* Khi nhấn:

  * Tạo session làm bài (ghi lại thời điểm bắt đầu).
  * Hiển thị các câu hỏi tuần tự hoặc tất cả cùng lúc.
  * Đồng hồ đếm ngược theo thời gian quy định.
  * Khi hết giờ hoặc nhấn “Nộp bài” → tự động lưu kết quả.
* Sau khi nộp:

  * Hiển thị điểm, đáp án, và ghi chú “Bạn đã hoàn thành bài thi”.

---

### **3. Trang quản trị (Admin)**

Chỉ admin truy cập được sau khi đăng nhập.

Đăng nhập admin hỗ trợ 2 cách:
- Google OAuth (whitelist email admin)
- Username/Password từ ENV (`ADMIN_USERNAME`/`ADMIN_PASSWORD` hoặc `ADMIN_PASSWORD_HASH`)

#### Chức năng chính:

1. **Kho trắc nghiệm (ngân hàng đề)**

   * Danh sách các bộ trắc nghiệm đã tạo.
   * Mỗi bộ gồm:

     * Tên, mô tả
     * Thời gian làm bài
     * Danh sách câu hỏi (nội dung + đáp án đúng)
   * Có thể tạo mới, sửa, xóa, sao chép.

2. **Bật/Tắt bài thi hiện tại**

   * Admin chọn **1 bộ trắc nghiệm từ kho** → “Mở thi”
   * Khi mở, học sinh sẽ thấy nút làm bài tương ứng trên trang của họ.
   * Có thể “Đóng thi” khi muốn ngưng nhận bài.

3. **Kết quả & thống kê**

   * Danh sách học sinh đã làm: tên, email, điểm, thời gian nộp.
   * Có thể xem chi tiết từng học sinh (xem câu trả lời, đúng/sai).
   * Có nút **Xuất JSON** và **Xuất CSV**.
   * Có thể “reset” cho 1 user nếu cần cho làm lại (tùy chọn).

4. **Quản lý admin khác (tùy chọn)**

   * Thêm quyền admin mới qua email.

---

## 🧠 2. LUỒNG HOẠT ĐỘNG (Flow mô tả)

1. **Admin đăng nhập**
   → vào dashboard
   → chọn 1 bộ đề trong kho
   → bấm “Mở thi”

   Lưu ý: Với đăng nhập admin bằng ENV, hệ thống so sánh username/password nhập vào với `ADMIN_USERNAME`/`ADMIN_PASSWORD` (hoặc verify hash nếu dùng `ADMIN_PASSWORD_HASH`).

2. **User đăng nhập**
   → kiểm tra email domain (`@student.hcmute.edu.vn` hoặc `@hcmute.edu.vn`)
   → nếu hợp lệ, hiển thị nút “Bắt đầu làm bài thi”
   → khi admin đã bật bài, user làm được
   → nếu chưa bật, hiện thông báo “Hiện chưa có bài thi nào đang mở”.

3. **User làm bài**
   → đồng hồ đếm ngược
   → nộp bài (hoặc hết giờ auto submit)
   → hiển thị kết quả + đáp án

4. **Admin xem kết quả**
   → lọc danh sách, xuất file CSV/JSON
   → có thể đóng bài thi để ngăn thêm người làm

---

## 🗃️ 3. Ý TƯỞNG KHO TRẮC NGHIỆM

Kho này là phần quan trọng nhất.

Mỗi **Bộ trắc nghiệm (ExamSet)** có:

```text
- ID: auto
- Tên bộ đề
- Mô tả
- Thời gian làm (phút)
- Câu hỏi (questionList)
    - Nội dung câu hỏi
    - Các lựa chọn (A/B/C/D)
    - Đáp án đúng
- Ngày tạo
- Người tạo
```

Admin chỉ việc chọn bộ đề → “đưa lên thi chính thức”.

---

## 💡 4. CÁC QUY TẮC

* User chỉ được làm **1 lần mỗi bài thi đang mở**.
* Admin có thể “reset quyền làm lại” cho 1 người.
* Khi bài thi đóng → học sinh không thể truy cập hoặc xem đáp án nữa (nếu admin tắt).
* Có thể bật tùy chọn “ẩn đáp án sau khi làm” hoặc “hiện đáp án luôn”.
* Bảo mật:
  - Không log plaintext password.
  - `.env` chỉ tồn tại trên server; dùng secret manager ở môi trường cloud nếu có.
  - Khuyến nghị bật rate limit cho endpoint đăng nhập admin.

---

## ✨ 5. MỞ RỘNG SAU NÀY

* Thêm tính năng **tự động chọn ngẫu nhiên bộ đề** cho các lớp khác nhau.
* Tạo **mã thi riêng** (ví dụ: “HCMUTE2025A”) cho từng kỳ thi.
* Giao diện “phòng thi” chống gian lận (chặn đổi tab, hiển thị cảnh báo).
* Tích hợp thống kê điểm trung bình, biểu đồ kết quả.

---

## 📚 6. MỤC SÁCH DI SẢN (Book)

### ✅ Mục tiêu

* Bổ sung module “Sách di sản” để lưu trữ và giới thiệu các đầu sách nổi bật.
* Cho phép admin CRUD đầy đủ và hiển thị(chỉnh chế dộ public, private) ở phần giới thiệu.

### 🗂️ Cấu trúc dữ liệu Book

```text
Book
- id: auto
- title: Tiêu đề chính
- subtitle: Tiêu đề phụ
- description: Mô tả chi tiết (có thể hỗ trợ Markdown)
- coverImageUrl: Ảnh bìa (link hoặc upload)
- quote: Trích dẫn nổi bật từ sách
- author: Tác giả
- publishedAt: Ngày xuất bản (ISO date)
- createdAt / updatedAt
```

### ⚙️ CRUD trong trang quản trị

* Danh sách sách di sản với bộ lọc theo tác giả, năm xuất bản.
* Tạo mới / chỉnh sửa / xóa sách.
* Upload hoặc chọn URL ảnh bìa.
* Cho phép bật/tắt hiển thị sách trên trang học sinh.

### 🖥️ Hiển thị phía học sinh (tuỳ chọn)

* Khối giới thiệu “Sách di sản” trên trang chủ hoặc trang riêng.
* Mỗi sách hiển thị ảnh bìa, tiêu đề, trích dẫn, nút “Xem chi tiết”.
* Trang chi tiết: mô tả, tác giả, ngày xuất bản, quote nổi bật.

