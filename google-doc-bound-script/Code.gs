/**
 * @OnlyCurrentDoc
 *
 * Script mỏng gắn với Google Docs.
 * Dữ liệu nhận vào: tài liệu đang mở.
 * Việc chính: lấy ID của tài liệu và tạo link GitHub Pages có query docId.
 * Kết quả: menu cho phép mở sidebar và bật/tắt chế độ tự mở khi mở tài liệu.
 * Nếu lỗi, người dùng thấy thông báo trong Google Docs và có thể xem chi tiết
 * tại Apps Script > Executions.
 */

var DEMO_PAGE_BASE_URL = 'https://tranhoangduc90.github.io/google-doc-sidebar-github-demo/';

function onOpen() {
  DocumentApp.getUi()
    .createMenu('Demo xác nhận')
    .addItem('Mở bảng điều khiển', 'showDemoSidebar')
    .addSeparator()
    .addItem('Bật tự mở sidebar', 'enableAutoOpenSidebar')
    .addItem('Tắt tự mở sidebar', 'disableAutoOpenSidebar')
    .addToUi();
}

function showDemoSidebar() {
  openDemoSidebar_(false);
}

/**
 * Bật trigger có cấp quyền cho đúng tài liệu đang mở.
 * Dữ liệu nhận vào: tài liệu hiện tại và các trigger do tài khoản này tạo.
 * Việc chính: chỉ tạo một trigger mở tài liệu, tránh tạo trùng.
 * Kết quả: từ lần mở/tải lại tiếp theo, sidebar được mở tự động.
 * Nếu lỗi, Apps Script hiện lỗi cấp quyền để người dùng xử lý một lần.
 */
function enableAutoOpenSidebar() {
  var doc = DocumentApp.getActiveDocument();
  var triggers = ScriptApp.getUserTriggers(doc);
  var alreadyEnabled = triggers.some(function (trigger) {
    return trigger.getHandlerFunction() === 'openSidebarFromInstalledTrigger_' &&
      trigger.getEventType() === ScriptApp.EventType.ON_OPEN;
  });

  if (!alreadyEnabled) {
    ScriptApp.newTrigger('openSidebarFromInstalledTrigger_')
      .forDocument(doc)
      .onOpen()
      .create();
  }

  openDemoSidebar_(false, doc);
}

/**
 * Tắt trigger tự mở do tài khoản hiện tại tạo cho đúng tài liệu này.
 * Hàm không xóa trigger khác và không sửa nội dung tài liệu.
 */
function disableAutoOpenSidebar() {
  var doc = DocumentApp.getActiveDocument();
  ScriptApp.getUserTriggers(doc).forEach(function (trigger) {
    if (trigger.getHandlerFunction() === 'openSidebarFromInstalledTrigger_' &&
        trigger.getEventType() === ScriptApp.EventType.ON_OPEN) {
      ScriptApp.deleteTrigger(trigger);
    }
  });

  DocumentApp.getUi().alert('Đã tắt tự mở sidebar cho tài liệu này.');
}

/**
 * Hàm chỉ dành cho trigger mở tài liệu có cấp quyền.
 * Sự kiện cung cấp tài liệu vừa được mở; sidebar được hiển thị trong tài liệu đó.
 */
function openSidebarFromInstalledTrigger_(event) {
  var doc = event && event.source ? event.source : DocumentApp.getActiveDocument();
  openDemoSidebar_(true, doc);
}

/**
 * Nhận chế độ im lặng khi chạy từ trigger có cấp quyền.
 * Hàm lấy ID tài liệu, tạo URL GitHub Pages và hiển thị sidebar.
 * Nếu chạy tự động mà thiếu quyền, lỗi được ghi trong Executions nhưng không
 * hiện hộp thoại làm gián đoạn việc mở tài liệu.
 */
function openDemoSidebar_(silent, sourceDoc) {
  try {
    var doc = sourceDoc || DocumentApp.getActiveDocument();
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
