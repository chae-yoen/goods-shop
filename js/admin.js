// =============================================================
// 관리자 페이지 (admin.js) — admin.html
// -------------------------------------------------------------
// admin@admin.com 으로 로그인했을 때만 '모든 사람'의 결제 내역을 봅니다.
// 보안 규칙(RLS)이 관리자 이메일일 때만 전체 조회를 허용합니다.
// 화면에서도 한 번 더 확인해 권한 없는 사람은 안내 문구를 보여줍니다.
// =============================================================

async function loadAdmin() {
  const user = await requireLogin();
  if (!user) return;

  const tbody = document.getElementById("adminBody");

  // 화면상의 1차 확인 (진짜 보안은 데이터베이스 RLS)
  if (user.email !== CONFIG.ADMIN_EMAIL) {
    document.getElementById("adminMain").innerHTML =
      `<p class="error">관리자만 볼 수 있는 페이지입니다.</p>`;
    return;
  }

  const { data, error } = await sb
    .from("payments")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    tbody.innerHTML = `<tr><td colspan="5" class="error">불러오기 실패: ${error.message}</td></tr>`;
    return;
  }
  if (!data || data.length === 0) {
    tbody.innerHTML = `<tr><td colspan="5">결제 내역이 없습니다.</td></tr>`;
    return;
  }

  // 총 매출 계산
  const total = data.reduce((sum, p) => sum + Number(p.amount), 0);
  document.getElementById("adminSummary").textContent =
    `총 ${data.length}건 · 합계 ${total.toLocaleString()}원`;

  tbody.innerHTML = data
    .map(
      (p) => `
    <tr>
      <td>${new Date(p.created_at).toLocaleString("ko-KR")}</td>
      <td>${p.user_email || p.user_id}</td>
      <td>${p.product_name || "-"}</td>
      <td>${Number(p.amount).toLocaleString()}원</td>
      <td>${p.status}</td>
    </tr>`
    )
    .join("");
}

document.addEventListener("DOMContentLoaded", loadAdmin);
