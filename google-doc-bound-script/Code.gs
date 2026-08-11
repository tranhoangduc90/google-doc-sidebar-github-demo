/**
 * @OnlyCurrentDoc
 *
 * Script mỏng gắn với Google Docs.
 * Dữ liệu nhận vào: tài liệu đang mở.
 * Việc chính: lấy ID của tài liệu và tạo link GitHub Pages có query docId.
 * Kết quả: menu “Demo xác nhận” mở sidebar; nút trong sidebar mở trang web.
 * Nếu lỗi, người dùng thấy thông báo trong Google Docs và có thể xem chi tiết
 * tại Apps Script > Executions.
 */

var DEMO_PAGE_BASE_URL = 'https://tranhoangduc90.github.io/google-doc-sidebar-github-demo/';

function onOpen() {
  DocumentApp.getUi()
    .createMenu('Demo xác nhận')
    .addItem('Mở bảng điều khiển', 'showDemoSidebar')
    .addToUi();
}

function showDemoSidebar() {
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
    DocumentApp.getUi().alert('Chưa thể mở sidebar. Hãy tải lại tài liệu và thử lại.');
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
