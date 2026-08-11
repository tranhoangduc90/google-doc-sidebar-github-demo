/**
 * Mã giao diện nhận docId từ query URL và nối form với Apps Script Web App.
 * Dữ liệu nhận vào: ?docId=... và bridgeUrl từ config do GitHub Actions tạo.
 * Kết quả: nút “Xác nhận” chỉ bật khi cả hai giá trị hợp lệ. Nếu lỗi, người
 * dùng thấy hướng dẫn ngay trên trang; trang không đọc nội dung Google Docs.
 */
(function () {
  'use strict';

  var params = new URLSearchParams(window.location.search);
  var docId = String(params.get('docId') || '').trim();
  var bridgeUrl = String(
    window.DEMO_CONFIG && window.DEMO_CONFIG.bridgeUrl
      ? window.DEMO_CONFIG.bridgeUrl
      : ''
  ).trim();

  var form = document.getElementById('confirm-form');
  var button = document.getElementById('confirm-button');
  var docIdLabel = document.getElementById('doc-id');
  var docIdInput = document.getElementById('doc-id-input');
  var status = document.getElementById('status');

  if (!isValidDocId_(docId)) {
    showError_('Link thiếu Doc ID hợp lệ. Hãy mở lại trang này từ sidebar Google Docs.');
    return;
  }

  if (!isValidBridgeUrl_(bridgeUrl)) {
    showError_('Trang demo chưa được nối với Apps Script Web App.');
    return;
  }

  docIdLabel.textContent = shortenDocId_(docId);
  docIdLabel.title = docId;
  docIdInput.value = docId;
  form.action = bridgeUrl;
  button.disabled = false;
  status.textContent = 'Sẵn sàng. Kết quả sẽ mở trong một tab mới.';

  form.addEventListener('submit', function () {
    button.disabled = true;
    button.textContent = 'Đang mở trang kết quả…';
    status.textContent = 'Backend đang đối chiếu Doc ID với danh sách giáo viên đã cho phép.';

    window.setTimeout(function () {
      button.disabled = false;
      button.textContent = 'Xác nhận';
    }, 2500);
  });

  function isValidDocId_(value) {
    return /^[A-Za-z0-9_-]{20,200}$/.test(value);
  }

  function isValidBridgeUrl_(value) {
    try {
      var url = new URL(value);
      return url.protocol === 'https:' && /(^|\.)google\.com$/.test(url.hostname);
    } catch (error) {
      return false;
    }
  }

  function shortenDocId_(value) {
    return value.length > 28
      ? value.slice(0, 14) + '…' + value.slice(-10)
      : value;
  }

  function showError_(message) {
    docIdLabel.textContent = 'Không xác định';
    status.textContent = message;
    status.classList.add('error');
    button.disabled = true;
  }
})();
