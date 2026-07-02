// =============================================================
// 결제 성공 처리 (success.js) — success.html
// -------------------------------------------------------------
// 토스 결제창에서 성공하면 이 페이지로 돌아옵니다.
// 주소에 paymentKey, orderId, amount 가 붙어서 옵니다.
// 이 값들을 Edge Function(confirm-payment)에 보내 "승인"을 완료하고
// 결제 내역을 데이터베이스에 저장합니다.
// =============================================================

async function handleSuccess() {
  const box = document.getElementById("result");

  const user = await getCurrentUser();
  if (!user) {
    box.innerHTML = `<p class="error">로그인 정보가 없습니다. 다시 로그인해 주세요.</p>`;
    return;
  }

  const params = new URLSearchParams(location.search);
  const paymentKey = params.get("paymentKey");
  const orderId = params.get("orderId");
  const amount = Number(params.get("amount"));
  const productId = params.get("productId");

  if (!paymentKey || !orderId || !amount) {
    box.innerHTML = `<p class="error">결제 정보가 올바르지 않습니다.</p>`;
    return;
  }

  // 로그인 토큰을 함께 보내 "누가 결제했는지" 서버가 알 수 있게 합니다.
  const { data: sessionData } = await sb.auth.getSession();
  const token = sessionData.session?.access_token;

  try {
    const res = await fetch(`${CONFIG.SUPABASE_URL}/functions/v1/confirm-payment`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        apikey: CONFIG.SUPABASE_ANON_KEY,
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ paymentKey, orderId, amount, productId }),
    });

    const result = await res.json();

    if (!res.ok) {
      box.innerHTML = `<p class="error">결제 승인에 실패했습니다: ${result.message || res.status}</p>
        <a class="btn" href="index.html">상품 목록으로</a>`;
      return;
    }

    box.innerHTML = `
      <div class="result-ok">✅</div>
      <h2>결제가 완료되었습니다!</h2>
      <p>${result.product_name || ""}</p>
      <p class="price">${amount.toLocaleString()}원</p>
      <div class="actions">
        <a class="btn" href="history.html">내 결제내역 보기</a>
        <a class="btn btn-ghost" href="index.html">상품 더 보기</a>
      </div>`;
  } catch (e) {
    box.innerHTML = `<p class="error">서버 통신 오류: ${e.message}</p>`;
  }
}

document.addEventListener("DOMContentLoaded", handleSuccess);
