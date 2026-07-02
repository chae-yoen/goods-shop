// =============================================================
// 내 결제내역 페이지 (history.js) — history.html
// -------------------------------------------------------------
// payments 테이블에서 내 결제 내역만 불러옵니다.
// (보안 규칙(RLS) 덕분에 자동으로 '내 것'만 조회됩니다)
// =============================================================

async function loadHistory() {
  const user = await requireLogin();
  if (!user) return;

  const tbody = document.getElementById("historyBody");

  const { data, error } = await sb
    .from("payments")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    tbody.innerHTML = `<tr><td colspan="4" class="error">불러오기 실패: ${error.message}</td></tr>`;
    return;
  }
  if (!data || data.length === 0) {
    tbody.innerHTML = `<tr><td colspan="4">아직 결제 내역이 없습니다.</td></tr>`;
    return;
  }

  tbody.innerHTML = data
    .map(
      (p) => `
    <tr>
      <td>${new Date(p.created_at).toLocaleString("ko-KR")}</td>
      <td>${p.product_name || "-"}</td>
      <td>${Number(p.amount).toLocaleString()}원</td>
      <td>${p.status}</td>
    </tr>`
    )
    .join("");
}

document.addEventListener("DOMContentLoaded", loadHistory);
