// =============================================================
// 상품 목록 페이지 로직 (products.js) — index.html
// -------------------------------------------------------------
// 데이터베이스 products 테이블에서 상품을 불러와 화면에 카드로 보여줍니다.
// =============================================================

async function loadProducts() {
  const grid = document.getElementById("productGrid");

  const { data, error } = await sb
    .from("products")
    .select("*")
    .order("id", { ascending: true });

  if (error) {
    grid.innerHTML = `<p class="error">상품을 불러오지 못했습니다: ${error.message}</p>`;
    return;
  }
  if (!data || data.length === 0) {
    grid.innerHTML = `<p>아직 등록된 상품이 없습니다.</p>`;
    return;
  }

  grid.innerHTML = data
    .map(
      (p) => `
    <div class="card">
      <img src="${p.image_url || "https://placehold.co/300x200?text=Goods"}" alt="${p.name}">
      <div class="card-body">
        <h3>${p.name}</h3>
        <p class="desc">${p.description || ""}</p>
        <p class="price">${Number(p.price).toLocaleString()}원</p>
        <a class="btn" href="checkout.html?productId=${p.id}">결제하기</a>
      </div>
    </div>`
    )
    .join("");
}

document.addEventListener("DOMContentLoaded", loadProducts);
