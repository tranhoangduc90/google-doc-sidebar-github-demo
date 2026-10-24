# Docs sidebar/demo — bảo toàn master #170

Đọc [nguồn chuẩn và cách kế thừa](https://github.com/tranhoangduc90/izone-AI-team/blob/main/docs/interface-master170/README.md), gồm bộ chuẩn21mục/17hình, mốc cuối và giới hạn. Lần sửa sau giữ Source Sans 3, nền Reading, nút navy và nghĩa trạng thái Linh ở sản phẩm đã chuyển; không copy font/palette cũ từ skill/demo.

Mốc UI đợt24/10: PR1, merge08aedf4; Apps Script backend7/Sidebar2, Scan5 ở Root. Nguồn trong repo: `site/master170/theme.css`, `site/master170.css`, `site/index.html`, `google-doc-bound-script/Sidebar.html`, `apps-script-backend/Code.gs`. Đây là checkpoint, không phải lệnh quay main hoặc live về commit cũ.

Giữ Doc ID/allowlist/handler/manifest và version live. Trước push Apps Script clone exact live; merge tài liệu không cập nhật Apps Script hoặc các bản sao Docs cũ.

Web mới trong phạm vi kế thừa master và adapter đúng nhiệm vụ; sửa hẹp giữ bố cục/luồng hiện hành. Kiểm đúng màn/popup/trạng thái và consumer chịu ảnh hưởng, gồm desktop/mobile, focus/nháp/lỗi/phục hồi. Font/CSS chung thay đổi phải kiểm cả consumer loại trừ. Test, Progress Log và mọi handout Writing SW có chuẩn/thread riêng, không tự chuyển từ hồ sơ này.

Mỗi lần sửa dùng bằng chứng hồi quy còn hợp lệ, kiểm phần thiếu và ghi rõ điều chưa kiểm; mock/GET không thay nghiệm thu tài khoản, thiết bị hoặc ghi dữ liệu thật. Không phát lại runtime khi chỉ lưu/đọc bộ nhớ. Đây là hướng dẫn chất lượng, không thêm cổng công cụ/manifest hoặc quyền Git/production.
