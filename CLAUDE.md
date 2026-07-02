# 굿즈샵 (Goods Shop)

작은 굿즈를 파는 웹사이트입니다. 손님은 회원가입/로그인 후 상품을 골라
**토스페이먼츠(테스트 모드)** 로 결제하고, 자기 결제 내역을 볼 수 있습니다.
관리자는 모든 사람의 결제 내역을 봅니다.

> 세부 구조(테이블, 결제 흐름, 파일별 역할)는 [ARCH.md](./ARCH.md) 참고.

## 무엇으로 만들었나

| 부분 | 기술 | 역할 |
|------|------|------|
| 화면(프론트) | HTML / CSS / JS (라이브러리 없이) | 손님에게 보이는 가게 화면 |
| 호스팅 | GitHub Pages | 화면을 인터넷에 무료로 공개 |
| 로그인·DB | Supabase (Auth + Postgres) | 회원/상품/결제 데이터 저장 |
| 서버 함수 | Supabase Edge Function | 토스 결제 "승인" + 결제 기록 저장 |
| 결제 | 토스페이먼츠 결제위젯 (테스트 모드) | 카드 결제(실제 결제 아님) |

## 핵심 규칙 (중요)

- **비밀 키는 브라우저에 넣지 않습니다.**
  - 브라우저에 둬도 되는 것: Supabase URL, anon 키, 토스 **클라이언트** 키 → `js/config.js`
  - 서버에만 두는 것: 토스 **시크릿** 키, Supabase **service_role** 키 → Edge Function 환경변수
- **결제 승인은 반드시 서버(Edge Function)에서** 합니다. 정적 사이트만으로는 불가능합니다.
- **데이터 보호는 화면이 아니라 DB 보안 규칙(RLS)** 이 담당합니다. 관리자 메뉴 숨김은 편의일 뿐입니다.
- 회원가입 시 **이메일 인증은 꺼져 있습니다** → 가입 즉시 로그인.

## 관리자 계정

- 이메일: `admin@admin.com`  /  비밀번호: `superadmin`
- 이 계정으로 로그인하면 `admin.html` 에서 전체 결제 내역이 보입니다.

## 폴더 구조

```
/                     프론트엔드 (GitHub Pages 루트)
  index.html          상품 목록
  signup.html         회원가입
  login.html          로그인
  checkout.html       결제 (토스 위젯)
  success.html        결제 성공 → 승인 처리
  fail.html           결제 실패
  history.html        내 결제내역
  admin.html          관리자: 전체 결제내역
  css/style.css       공통 스타일
  js/                 페이지별 로직 (config, supabase-client, auth, ...)
supabase/
  schema.sql          DB 테이블 + 보안 규칙 + 샘플 상품
  functions/confirm-payment/index.ts   결제 승인 서버 함수
```

## 개발 메모

- `js/config.js` 의 `SUPABASE_URL` / `SUPABASE_ANON_KEY` 는 프로젝트 생성 후 실제 값으로 채웁니다.
- 토스 테스트 클라이언트 키: `test_gck_docs_Ovk5rk1EwkEbP0W43n07xlzm` (공식 문서 공개 값)
- 토스 테스트 시크릿 키는 Edge Function 환경변수 `TOSS_SECRET_KEY` 에만 저장합니다.
