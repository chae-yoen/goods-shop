# 굿즈샵 🛍️

굿즈를 파는 작은 웹사이트입니다. 회원가입 → 상품 결제(토스 테스트) → 내 결제내역 확인,
관리자는 전체 결제내역을 봅니다.

- **화면**: HTML/CSS/JS · GitHub Pages
- **백엔드**: Supabase (Auth + DB + Edge Function)
- **결제**: 토스페이먼츠 (테스트 모드)

자세한 내용은 [CLAUDE.md](./CLAUDE.md)(핵심) 와 [ARCH.md](./ARCH.md)(세부 구조) 참고.

## 설정 순서 요약

1. Supabase 프로젝트 생성 (이메일 인증 OFF)
2. `supabase/schema.sql` 로 테이블·보안규칙·샘플상품 생성
3. `supabase/functions/confirm-payment` 배포 + 환경변수 `TOSS_SECRET_KEY` 등록
4. `js/config.js` 에 Supabase URL·anon 키 입력
5. GitHub Pages 로 배포
6. `admin@admin.com` / `superadmin` 계정 가입

## 관리자 계정

- ID: `admin@admin.com` / PW: `superadmin`

## 로컬에서 열어보기

정적 파일이라 브라우저로 바로 열 수 있지만, 로그인/결제는 배포 주소에서 테스트하는 것을
권장합니다. 로컬 서버가 필요하면 아래처럼 실행하세요.

```bash
# Python 이 있다면
python -m http.server 5500
# → http://localhost:5500 접속
```
