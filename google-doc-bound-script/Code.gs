/**
 * @OnlyCurrentDoc
 *
 * Script mỏng gắn với Google Docs.
 * Dữ liệu nhận vào: tài liệu đang mở.
 * Việc chính: lấy ID của tài liệu và tạo link GitHub Pages có query docId.
 * Kết quả: sidebar tự mở khi tài liệu được mở; menu “Demo xác nhận” vẫn cho
 * phép người dùng mở lại nếu đã đóng sidebar.
 * Nếu lỗi, người dùng thấy thông báo trong Google Docs và có thể xem chi tiết
 * tại Apps Script > Executions.
 */

var DEMO_PAGE_BASE_URL = 'https://tranhoangduc90.github.io/google-doc-sidebar-github-demo/';

function onOpen() {
  DocumentApp.getUi()
    .createMenu('Demo xác nhận')
    .addItem('Mở bảng điều khiển', 'showDemoSidebar')
    .addToUi();

  // Tự mở sidebar mỗi lần người dùng mở hoặc tải lại tài liệu.
  // Nếu bản sao chưa được cấp quyền, menu vẫn xuất hiện để người dùng mở lại
  // và hoàn tất bước cấp quyền lần đầu.
  openDemoSidebar_(true);
}

function showDemoSidebar() {
  openDemoSidebar_(false);
}

/**
 * Nhận chế độ im lặng khi chạy tự động từ onOpen().
 * Hàm lấy ID tài liệu, tạo URL GitHub Pages và hiển thị sidebar.
 * Nếu chạy tự động mà thiếu quyền, lỗi được ghi trong Executions nhưng không
 * hiện hộp thoại làm gián đoạn việc mở tài liệu.
 */
function openDemoSidebar_(silent) {
  try {
    var doc = DocumentApp.getActiveDocument();
    var docId = doc.getId();
    var template = HtmlService.createTemplateFromFile('Sidebar');

    template.docId = docId;
    template.openUrl = DEMO_PAGE_BASE_URL + '?docId=' + encodeURIComponent(docId);

    var html = template
      .evaluate()
      .setTitle('Demo xác nhận')
      .setSandboxMode(HtmlService.SandboxMode.IFRAME);

    DocumentApp.getUi().showSidebar(html);
  } catch (error) {
    console.error(JSON.stringify({
      message: 'Cannot open demo sidebar',
      error: String(error && error.message ? error.message : error),
      at: new Date().toISOString(),
    }));

    if (!silent) {
      DocumentApp.getUi().alert('Chưa thể mở sidebar. Hãy tải lại tài liệu và thử lại.');
    }
  }
}

/**
 * Kiểm tra cơ học việc tạo URL mà không mở web hay sửa tài liệu.
 * Kết quả trả về dùng ID giả để bảo đảm query được mã hóa đúng.
 */
function testBuildDemoUrl() {
  var fakeDocId = 'DEMO_DOC_ID_12345678901234567890';
  return DEMO_PAGE_BASE_URL + '?docId=' + encodeURIComponent(fakeDocId);
}
