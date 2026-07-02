// =============================================================
// 결제 페이지 로직 (checkout.js) — checkout.html
// -------------------------------------------------------------
// 1) 로그인 확인
// 2) 상품 정보 불러오기 (checkout.html?productId=... 로 전달됨)
// 3) 토스 결제위젯 화면 그리기
// 4) '결제하기' 클릭 → 토스 결제창 열기
// =============================================================

async function initCheckout() {
  // 1) 로그인 필수
  const user = await requireLogin();
  if (!user) return;

  // 2) 주소(URL)에서 productId 읽기
  const productId = new URLSearchParams(location.search).get("productId");
  const info = document.getElementById("orderInfo");

  const { data: product, error } = await sb
    .from("products")
    .select("*")
    .eq("id", productId)
    .single();

  if (error || !product) {
    info.innerHTML = `<p class="error">상품을 찾을 수 없습니다.</p>`;
    return;
  }

  info.innerHTML = `
    <h2>${product.name}</h2>
    <p class="desc">${product.description || ""}</p>
    <p class="price">${Number(product.price).toLocaleString()}원</p>`;

  // 3) 토스 결제위젯 준비
  const tossPayments = TossPayments(CONFIG.TOSS_CLIENT_KEY);
  // customerKey: 손님을 구분하는 값 (여기서는 로그인 사용자 ID 사용)
  const widgets = tossPayments.widgets({ customerKey: user.id });

  await widgets.setAmount({ currency: "KRW", value: product.price });
  await Promise.all([
    widgets.renderPaymentMethods({ selector: "#payment-method", variantKey: "DEFAULT" }),
    widgets.renderAgreement({ selector: "#agreement", variantKey: "AGREEMENT" }),
  ]);

  // 4) 결제 버튼
  document.getElementById("payBtn").disabled = false;
  document.getElementById("payBtn").onclick = async () => {
    // 현재 페이지와 같은 폴더 기준으로 성공/실패 주소를 만듭니다.
    // (GitHub Pages에서 하위 경로(/저장소이름/)에 올려도 올바르게 동작)
    const baseUrl = location.href.substring(0, location.href.lastIndexOf("/") + 1);
    const orderId = "order_" + crypto.randomUUID().replace(/-/g, "");

    try {
      await widgets.requestPayment({
        orderId,
        orderName: product.name,
        successUrl: baseUrl + "success.html?productId=" + product.id,
        failUrl: baseUrl + "fail.html",
        customerEmail: user.email,
      });
    } catch (e) {
      // 사용자가 결제창을 닫으면 여기로 옵니다.
      alert("결제가 취소되었거나 오류가 발생했습니다: " + e.message);
    }
  };
}

document.addEventListener("DOMContentLoaded", initCheckout);
