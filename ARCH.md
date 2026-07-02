# ARCH.md — 세부 구조

굿즈샵의 내부 구조를 자세히 설명합니다. 큰 그림은 [CLAUDE.md](./CLAUDE.md) 참고.

## 1. 전체 흐름도

```
[손님 브라우저 — GitHub Pages]
   │  회원가입/로그인, 상품 조회        (Supabase anon 키 사용)
   ▼
[Supabase Auth + Postgres]
   ▲                                     결제 버튼 클릭
   │                                        │
   │                                        ▼
   │                              [토스 결제창 (테스트)]
   │                                        │ 성공 시 success.html?paymentKey&orderId&amount 로 복귀
   │                                        ▼
   │   결제 기록 저장          [Edge Function: confirm-payment]
   └───────────────────────────  1) 로그인 토큰으로 사용자 확인
                                  2) 상품가격 == 결제금액 검사
                                  3) 토스에 시크릿키로 승인 요청
                                  4) payments 테이블에 insert (service_role)
```

## 2. 데이터베이스 테이블

### products (상품)
| 컬럼 | 타입 | 설명 |
|------|------|------|
| id | bigint (자동증가) | 기본키 |
| name | text | 상품명 |
| price | integer | 가격(원) |
| image_url | text | 이미지 주소 |
| description | text | 설명 |
| created_at | timestamptz | 등록 시각 |

### payments (결제내역)
| 컬럼 | 타입 | 설명 |
|------|------|------|
| id | bigint (자동증가) | 기본키 |
| user_id | uuid | 구매자 (auth.users 참조) |
| user_email | text | 구매자 이메일(관리자 표시용) |
| product_id | bigint | 상품 참조 |
| product_name | text | 상품명(표시용 복사본) |
| order_id | text (unique) | 토스 주문번호, 중복저장 방지 |
| payment_key | text | 토스 결제 식별자 |
| amount | integer | 결제 금액 |
| status | text | 결제 상태(기본 DONE) |
| created_at | timestamptz | 결제 시각 |

## 3. 보안 규칙 (RLS) — 누가 무엇을 볼 수 있나

| 테이블 | 동작 | 규칙 |
|--------|------|------|
| products | 읽기 | 누구나 (공개) |
| payments | 읽기(본인) | `auth.uid() = user_id` |
| payments | 읽기(관리자) | `auth.jwt()->>'email' = 'admin@admin.com'` |
| payments | 쓰기 | 정책 없음 → Edge Function(service_role)만 저장 |

핵심: 손님은 결제내역을 **직접 쓸 수 없습니다.** 오직 서버 함수가 저장하므로
금액을 조작해 가짜 결제를 기록할 수 없습니다.

## 4. 파일별 역할

### 프론트엔드 JS (`js/`)
| 파일 | 역할 |
|------|------|
| config.js | 공개 설정값(Supabase URL·anon 키, 토스 클라이언트 키, 관리자 이메일) |
| supabase-client.js | Supabase 클라이언트 `sb` 생성 |
| auth.js | 로그인/가입/로그아웃/현재 사용자, 상단 메뉴 그리기 |
| auth-pages.js | 회원가입/로그인 폼 제출 처리 |
| products.js | 상품 목록 불러와 카드로 표시 |
| checkout.js | 상품 로드 → 토스 위젯 렌더 → 결제 요청 |
| success.js | 성공 파라미터를 Edge Function에 보내 승인·저장 |
| history.js | 내 결제내역 표 렌더 |
| admin.js | 관리자 전체 결제내역 표 + 합계 |

### 서버 (`supabase/functions/confirm-payment/index.ts`)
- 입력(JSON): `paymentKey`, `orderId`, `amount`, `productId` + `Authorization: Bearer <로그인토큰>`
- 사용하는 환경변수: `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`(기본 제공), `TOSS_SECRET_KEY`(직접 등록)
- 토스 승인 API: `POST https://api.tosspayments.com/v1/payments/confirm`,
  헤더 `Authorization: Basic base64("<시크릿키>:")`, 본문 `{paymentKey, orderId, amount}`

## 5. 결제 상세 흐름

1. `checkout.html` — 로그인 확인 → `products` 에서 상품 로드 → 토스 위젯 렌더
   - `customerKey` = 로그인 사용자 id
   - `setAmount({currency:'KRW', value: price})`
2. `결제하기` 클릭 → `requestPayment({orderId, orderName, successUrl, failUrl})`
   - `successUrl` = 현재 폴더 기준 `success.html?productId=<id>` (GitHub Pages 하위경로 대응)
   - `orderId` = `order_ + crypto.randomUUID()`
3. 토스가 `success.html?paymentKey&orderId&amount&productId` 로 복귀
4. `success.js` → Edge Function 호출 → 승인 + `payments` insert → 완료 메시지
5. 실패 시 `fail.html` (토스가 `message`, `code` 파라미터 전달)

## 6. 배포 (GitHub Pages)

- 저장소 루트에 정적 파일이 있으므로 Settings → Pages → `main` 브랜치 `/ (root)` 로 게시
- 공개 주소: `https://<사용자>.github.io/<저장소>/`
- `successUrl`/`failUrl` 은 코드에서 현재 경로 기준으로 자동 계산 → 저장소 이름이 바뀌어도 동작
- 주의: `.mcp.json` 은 토큰이 들어 있으므로 `.gitignore` 로 제외(업로드 금지)

## 7. 테스트 방법

토스 테스트 결제는 실제 카드가 필요 없습니다. 결제창에서 테스트 카드 정보를 입력하거나
토스가 제공하는 테스트 수단을 선택하면 됩니다. 승인까지 끝나면 `history.html` 과
관리자 `admin.html` 에서 기록을 확인할 수 있습니다.
