# Demo Google Docs sidebar → GitHub Pages → ghi ngược vào Docs

## Mục tiêu

Demo chứng minh luồng sau hoạt động với tài khoản Google cá nhân:

1. Google Docs tự mở sidebar khi người dùng mở hoặc tải lại tài liệu; menu vẫn cho phép mở lại sau khi đóng.
2. Nút trong sidebar mở GitHub Pages với query `docId` của chính tài liệu đang mở.
3. Nút **Xác nhận** trên GitHub Pages gửi `docId` sang Apps Script Web App.
4. Web App chạy bằng quyền tài khoản giáo viên triển khai, nhưng chỉ ghi khi Doc ID đã được đăng ký trước.
5. Khi nhân bản Google Docs, bound script đi cùng bản sao; sidebar lấy ID mới của bản sao.

## Dữ liệu đầu vào và kết quả

- Đầu vào: một Google Docs ID thử nghiệm, không chứa dữ liệu học viên.
- Backend chỉ chấp nhận `confirmation=confirm`; trang web không được gửi nội dung tùy ý để ghi vào Docs.
- Danh sách cho phép lưu hash SHA-256 của Doc ID trong Script Properties và có ngày hết hạn.
- Riêng demo hiện tại có fallback là hash SHA-256 của tài liệu thử nghiệm trong source để có thể chạy khi CLI chưa được cấp quyền Execution API; source không chứa Doc ID thật.
- Kết quả: ba dòng xác nhận được thêm ở cuối tài liệu. Bấm lại không ghi trùng.
- Khi lỗi: trang Apps Script báo lỗi dễ hiểu; chi tiết kỹ thuật nằm trong **Apps Script → Executions** và log không chứa Doc ID.

## Cấu trúc

- `google-doc-bound-script/`: script gắn với Google Docs và sidebar.
- `site/`: giao diện GitHub Pages.
- `apps-script-backend/`: Web App ghi thông điệp vào Docs.
- `.github/workflows/pages.yml`: xuất bản site và chèn URL backend từ GitHub Variables.

## Quyền và rủi ro

- Web App demo dùng `USER_DEPLOYING` + `ANYONE_ANONYMOUS`: backend ghi bằng quyền tài khoản giáo viên triển khai và trang GitHub không bị chặn do học viên dùng tài khoản Google khác.
- Execution API dùng `MYSELF` chỉ để giáo viên cấu hình danh sách tài liệu từ CLI; học viên không thể gọi hàm quản trị này.
- Trước khi ghi, backend đối chiếu hash Doc ID với danh sách giáo viên đã đăng ký và kiểm tra hạn dùng demo.
- Người biết đúng Doc ID đã được cho phép vẫn có thể kích hoạt thông điệp cố định sớm. Với production, cần thêm ticket một lần do n8n/backend tin cậy cấp.
- Với Classroom thật, n8n hoặc quy trình lấy bài từ Classroom phải đăng ký Doc ID từ nguồn tin cậy; không cho trang học viên tự thêm ID vào danh sách.
- Doc ID xuất hiện trong URL GitHub Pages. Với hệ thống thật, không thêm tên học viên, điểm hoặc dữ liệu riêng tư vào query.
- Bound script được sao chép cùng tài liệu và người có quyền sửa tài liệu có thể xem code. Vì vậy script không chứa token, API key hoặc logic bảo mật.
- Bản sao cũ không tự nhận code mới nếu sau này sửa script của tài liệu mẫu.
- Bản sao chưa cấp quyền có thể chỉ hiện menu ở lần mở đầu; người dùng chọn **Demo xác nhận → Mở bảng điều khiển** để cấp quyền, rồi các lần mở sau sidebar sẽ tự hiện.

## Cấu hình danh sách tài liệu được phép

Chạy hàm quản trị sau trong Apps Script bằng tài khoản giáo viên:

```javascript
setupDemoAccess(
  ['DOC_ID_GOC', 'DOC_ID_BAN_SAO'],
  '2026-09-11T00:00:00+07:00'
);
```

Hàm nhận các Doc ID thử nghiệm, băm từng ID rồi lưu hash và thời điểm hết hạn. Hàm không ghi vào Docs. Nếu dữ liệu sai, Apps Script dừng và hiển thị lỗi trong **Executions**.

## Kiểm tra local

1. Sao chép `site/config.example.js` thành `site/config.js` và thay URL Web App thử nghiệm.
2. Mở `site/index.html?docId=DEMO_DOC_ID_12345678901234567890`.
3. Chạy `node --check site/app.js` và kiểm tra cú pháp các file `.gs` bằng `node --check` trên bản sao tạm `.js`.
