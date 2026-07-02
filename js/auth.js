// =============================================================
// 로그인 관련 공통 함수 (auth.js)
// -------------------------------------------------------------
// 회원가입 / 로그인 / 로그아웃 / 현재 사용자 확인 +
// 모든 페이지 위쪽 메뉴(nav) 그리기
// =============================================================

// 현재 로그인한 사용자 정보를 가져옵니다. (없으면 null)
async function getCurrentUser() {
  const { data } = await sb.auth.getUser();
  return data.user;
}

// 로그인이 꼭 필요한 페이지에서 사용합니다.
// 로그인 안 했으면 로그인 페이지로 보냅니다.
async function requireLogin() {
  const user = await getCurrentUser();
  if (!user) {
    alert("로그인이 필요합니다.");
    location.href = "login.html";
    return null;
  }
  return user;
}

// 회원가입 (이메일 인증 없이 바로 가입)
async function signUp(email, password) {
  return sb.auth.signUp({ email, password });
}

// 로그인
async function signIn(email, password) {
  return sb.auth.signInWithPassword({ email, password });
}

// 로그아웃 → 첫 화면으로 이동
async function signOut() {
  await sb.auth.signOut();
  location.href = "index.html";
}

// 페이지 위쪽 메뉴를 로그인 상태에 맞게 그립니다.
async function renderNav() {
  const el = document.getElementById("nav");
  if (!el) return;

  const user = await getCurrentUser();
  let html = `<a href="index.html" class="brand">🛍️ 굿즈샵</a><span class="spacer"></span>`;
  html += `<a href="index.html">상품</a>`;

  if (user) {
    html += `<a href="history.html">내 결제내역</a>`;
    if (user.email === CONFIG.ADMIN_EMAIL) {
      html += `<a href="admin.html">관리자</a>`;
    }
    html += `<span class="nav-user">${user.email}</span>`;
    html += `<button id="logoutBtn" class="btn-small">로그아웃</button>`;
  } else {
    html += `<a href="login.html">로그인</a>`;
    html += `<a href="signup.html">회원가입</a>`;
  }

  el.innerHTML = html;
  const btn = document.getElementById("logoutBtn");
  if (btn) btn.onclick = signOut;
}

document.addEventListener("DOMContentLoaded", renderNav);
