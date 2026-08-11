/**
 * Backend demo nhận Doc ID từ GitHub Pages và ghi một thông điệp cố định.
 *
 * Dữ liệu nhận vào: POST gồm docId và confirmation=confirm.
 * Việc chính: kiểm tra Doc ID có trong danh sách cho phép, mở tài liệu bằng
 * quyền tài khoản giáo viên triển khai Web App, rồi ghi thông điệp đúng một lần.
 * Kết quả: một trang HTML báo thành công hoặc lỗi. Lỗi chi tiết xem tại
 * Apps Script > Executions; log không chứa Doc ID hay nội dung tài liệu.
 */

var DEMO_CONFIRMATION_VALUE = 'confirm';
var DEMO_MARKER = '✅ ĐÃ XÁC NHẬN TỪ TRANG DEMO GITHUB PAGES';
var DEMO_ALLOWED_HASHES_PROPERTY = 'DEMO_ALLOWED_DOC_HASHES_JSON';
var DEMO_EXPIRES_AT_PROPERTY = 'DEMO_EXPIRES_AT';
var DEMO_FALLBACK_ALLOWED_HASHES = [
  '195381cb7b182b2c419a46e38cf63df11668e39ae54923faed8d0fb5aa977578',
];
var DEMO_FALLBACK_EXPIRES_AT = '2026-09-11T00:00:00+07:00';

function doGet() {
  return renderResultPage_({
    ok: true,
    title: 'Cầu nối Google Docs đang hoạt động',
    message: 'Hãy mở trang demo từ sidebar trong Google Docs rồi bấm “Xác nhận”.',
  });
}

function doPost(e) {
  var lock = LockService.getScriptLock();

  try {
    var data = e && e.parameter ? e.parameter : {};
    var docId = validateDocId_(data.docId);

    if (data.confirmation !== DEMO_CONFIRMATION_VALUE) {
      throw new Error('Yêu cầu xác nhận không hợp lệ.');
    }

    validateConfiguredAccess_(docId);

    if (!lock.tryLock(10000)) {
      throw new Error('Hệ thống đang xử lý một yêu cầu khác. Vui lòng thử lại.');
    }

    var result = writeConfirmationOnce_(docId);

    return renderResultPage_({
      ok: true,
      title: result.alreadyExists ? 'Tài liệu đã được xác nhận trước đó' : 'Đã ghi vào Google Docs',
      message: result.alreadyExists
        ? 'Thông điệp đã có sẵn nên hệ thống không ghi trùng.'
        : 'Thông điệp xác nhận đã được thêm vào cuối tài liệu gốc.',
      docUrl: 'https://docs.google.com/document/d/' + encodeURIComponent(docId) + '/edit',
    });
  } catch (error) {
    console.error(JSON.stringify({
      message: 'Demo writeback failed',
      error: String(error && error.message ? error.message : error),
      at: new Date().toISOString(),
    }));

    return renderResultPage_({
      ok: false,
      title: 'Chưa thể ghi vào Google Docs',
      message: friendlyErrorMessage_(error),
    });
  } finally {
    if (lock.hasLock()) {
      lock.releaseLock();
    }
  }
}

/**
 * Hàm quản trị chạy bằng tài khoản giáo viên trước khi mở demo.
 * Dữ liệu nhận vào: mảng Doc ID được phép và thời điểm hết hạn dạng ISO 8601.
 * Việc chính: băm Doc ID bằng SHA-256 rồi lưu hash vào Script Properties.
 * Kết quả: Web App chỉ có thể ghi vào đúng các tài liệu đã đăng ký. Nếu lỗi,
 * Apps Script > Executions hiển thị chi tiết; hàm không log Doc ID đầu vào.
 */
function setupDemoAccess(docIds, expiresAt) {
  if (!Array.isArray(docIds) || docIds.length === 0) {
    throw new Error('Cần ít nhất một Doc ID trong danh sách cho phép.');
  }

  var expiry = new Date(expiresAt);
  if (isNaN(expiry.getTime()) || expiry.getTime() <= Date.now()) {
    throw new Error('Thời điểm hết hạn phải là một thời điểm hợp lệ trong tương lai.');
  }

  var hashes = docIds.map(function (docId) {
    return sha256Hex_(validateDocId_(docId));
  });

  hashes = Array.from(new Set(hashes)).sort();

  PropertiesService.getScriptProperties().setProperties({
    DEMO_ALLOWED_DOC_HASHES_JSON: JSON.stringify(hashes),
    DEMO_EXPIRES_AT: expiry.toISOString(),
  });

  return {
    ok: true,
    allowedDocumentCount: hashes.length,
    expiresAt: expiry.toISOString(),
  };
}

/**
 * Nhận Doc ID đã kiểm tra, tìm marker và chỉ ghi khi marker chưa tồn tại.
 * Người dùng sẽ thấy ba dòng mới ở cuối tài liệu; bấm lại không tạo bản sao.
 */
function writeConfirmationOnce_(docId) {
  var doc = DocumentApp.openById(docId);
  var body = doc.getBody();
  var markerPattern = escapeRegex_(DEMO_MARKER);

  if (body.findText(markerPattern)) {
    doc.saveAndClose();
    return { alreadyExists: true };
  }

  body.appendHorizontalRule();
  body
    .appendParagraph(DEMO_MARKER)
    .setBold(true)
    .setForegroundColor('#188038');
  body.appendParagraph('Thông điệp này được gửi sau khi người dùng bấm “Xác nhận” trên GitHub Pages.');
  body.appendParagraph(
    'Thời gian xác nhận: ' +
      Utilities.formatDate(new Date(), 'Asia/Ho_Chi_Minh', 'yyyy-MM-dd HH:mm:ss')
  );

  doc.saveAndClose();
  return { alreadyExists: false };
}

/**
 * Chỉ chấp nhận định dạng ID của tệp Google. Nếu sai, trang kết quả báo lỗi
 * và không mở hay sửa bất kỳ tài liệu nào.
 */
function validateDocId_(value) {
  var docId = String(value || '').trim();
  if (!/^[A-Za-z0-9_-]{20,200}$/.test(docId)) {
    throw new Error('Doc ID bị thiếu hoặc sai định dạng.');
  }
  return docId;
}

/**
 * Đối chiếu hash Doc ID và hạn dùng trước khi mở tài liệu bằng quyền giáo viên.
 * Doc ID không được lưu thô trong cấu hình hoặc log.
 */
function validateConfiguredAccess_(docId) {
  var props = PropertiesService.getScriptProperties();
  var expiryText = props.getProperty(DEMO_EXPIRES_AT_PROPERTY) || DEMO_FALLBACK_EXPIRES_AT;
  var expiry = new Date(expiryText);

  if (!expiryText || isNaN(expiry.getTime()) || expiry.getTime() <= Date.now()) {
    throw new Error('Demo chưa được cấu hình hoặc đã hết hạn.');
  }

  var rawHashes =
    props.getProperty(DEMO_ALLOWED_HASHES_PROPERTY) ||
    JSON.stringify(DEMO_FALLBACK_ALLOWED_HASHES);
  var allowedHashes = JSON.parse(rawHashes);
  var requestedHash = sha256Hex_(docId);

  if (!Array.isArray(allowedHashes) || allowedHashes.indexOf(requestedHash) === -1) {
    throw new Error('Tài liệu này không nằm trong danh sách được phép của demo.');
  }
}

function sha256Hex_(value) {
  return Utilities.computeDigest(
    Utilities.DigestAlgorithm.SHA_256,
    String(value),
    Utilities.Charset.UTF_8
  )
    .map(function (byte) {
      var normalized = byte < 0 ? byte + 256 : byte;
      return ('0' + normalized.toString(16)).slice(-2);
    })
    .join('');
}

function friendlyErrorMessage_(error) {
  var message = String(error && error.message ? error.message : error);
  if (/permission|access|authorize|not have/i.test(message)) {
    return 'Tài khoản giáo viên triển khai Web App chưa có quyền sửa tài liệu này.';
  }
  return message;
}

function renderResultPage_(state) {
  var color = state.ok ? '#188038' : '#d93025';
  var icon = state.ok ? '✓' : '!';
  var docLink = state.docUrl
    ? '<a class="button" href="' + escapeHtml_(state.docUrl) + '" target="_blank">Mở lại Google Docs</a>'
    : '';

  var html =
    '<!doctype html><html lang="vi"><head><meta charset="utf-8">' +
    '<meta name="viewport" content="width=device-width,initial-scale=1">' +
    '<title>' + escapeHtml_(state.title) + '</title>' +
    '<style>' +
    'body{margin:0;background:#f6f8fc;color:#202124;font:16px/1.55 Arial,sans-serif}' +
    '.card{max-width:560px;margin:12vh auto;padding:32px;background:#fff;border:1px solid #dadce0;border-radius:16px;box-shadow:0 8px 30px rgba(60,64,67,.12)}' +
    '.icon{display:grid;width:48px;height:48px;place-items:center;border-radius:50%;background:' + color + ';color:#fff;font-size:28px;font-weight:700}' +
    'h1{font-size:24px;margin:20px 0 8px}p{color:#5f6368}.button{display:inline-block;margin-top:12px;padding:11px 18px;border-radius:8px;background:#1a73e8;color:#fff;text-decoration:none;font-weight:700}' +
    '</style></head><body><main class="card">' +
    '<div class="icon">' + icon + '</div>' +
    '<h1>' + escapeHtml_(state.title) + '</h1>' +
    '<p>' + escapeHtml_(state.message) + '</p>' +
    docLink +
    '</main></body></html>';

  return HtmlService.createHtmlOutput(html).setTitle(state.title);
}

function escapeHtml_(value) {
  return String(value || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function escapeRegex_(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
