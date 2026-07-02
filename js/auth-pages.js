// =============================================================
// 회원가입 / 로그인 폼 처리 (auth-pages.js)
// -------------------------------------------------------------
// signup.html 과 login.html 에서 함께 사용합니다.
// 페이지에 어떤 폼이 있는지 보고 알맞은 처리를 붙입니다.
// =============================================================

// --- 회원가입 폼 ---
const signupForm = document.getElementById("signupForm");
if (signupForm) {
  signupForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const msg = document.getElementById("msg");
    const email = signupForm.email.value.trim();
    const password = signupForm.password.value;

    msg.textContent = "가입 중...";
    const { data, error } = await signUp(email, password);

    if (error) {
      msg.innerHTML = `<span class="error">가입 실패: ${error.message}</span>`;
      return;
    }
    // 이메일 인증을 꺼두었기 때문에 가입 즉시 로그인 상태가 됩니다.
    if (data.session) {
      msg.textContent = "가입 완료! 이동합니다...";
      location.href = "index.html";
    } else {
      // 혹시 세션이 없으면 로그인 페이지로 안내
      msg.textContent = "가입 완료! 로그인해 주세요.";
      location.href = "login.html";
    }
  });
}

// --- 로그인 폼 ---
const loginForm = document.getElementById("loginForm");
if (loginForm) {
  loginForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const msg = document.getElementById("msg");
    const email = loginForm.email.value.trim();
    const password = loginForm.password.value;

    msg.textContent = "로그인 중...";
    const { error } = await signIn(email, password);

    if (error) {
      msg.innerHTML = `<span class="error">로그인 실패: ${error.message}</span>`;
      return;
    }
    location.href = "index.html";
  });
}
