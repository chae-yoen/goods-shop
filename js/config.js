// =============================================================
// 공개 설정값 (config.js)
// -------------------------------------------------------------
// 여기에 있는 값들은 브라우저(손님 화면)에 그대로 노출됩니다.
// 노출돼도 안전한 값만 넣습니다:
//   - Supabase 주소(URL), anon(공개) 키
//   - 토스 결제위젯 "클라이언트" 키 (테스트용)
//
// ⚠️ 절대 넣으면 안 되는 것:
//   - 토스 "시크릿" 키, Supabase service_role 키
//   → 이런 비밀 키는 Supabase Edge Function 안에만 둡니다.
// =============================================================

const CONFIG = {
  // Supabase 프로젝트 연결 값 (공개돼도 안전한 anon 키)
  SUPABASE_URL: "https://gqcsyhmrvdktboyqntuy.supabase.co",
  SUPABASE_ANON_KEY:
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdxY3N5aG1ydmRrdGJveXFudHV5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODI5MDg1NzIsImV4cCI6MjA5ODQ4NDU3Mn0.ie9IfdzgyPZ7FlDeRfUi47uuurPkQB0JiQUgvZ8rS70",

  // 토스페이먼츠 결제위젯 공개 테스트 클라이언트 키 (토스 공식 문서 제공)
  TOSS_CLIENT_KEY: "test_gck_docs_Ovk5rk1EwkEbP0W43n07xlzm",

  // 관리자 이메일. 이 이메일로 로그인하면 화면에 '관리자' 메뉴가 보입니다.
  // (실제 데이터 보호는 화면이 아니라 데이터베이스 보안 규칙(RLS)이 담당합니다)
  ADMIN_EMAIL: "admin@admin.com",
};
