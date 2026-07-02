-- =============================================================
-- 데이터베이스 구조 (schema.sql)
-- -------------------------------------------------------------
-- 이 SQL은 Supabase 프로젝트에 테이블과 보안 규칙(RLS)을 만듭니다.
-- (Claude가 MCP apply_migration 으로 대신 실행합니다)
-- =============================================================

-- 1) 상품 테이블 -----------------------------------------------
create table if not exists public.products (
  id          bigint generated always as identity primary key,
  name        text   not null,
  price       integer not null,          -- 원 단위 정수
  image_url   text,
  description text,
  created_at  timestamptz default now()
);

-- 2) 결제내역 테이블 -------------------------------------------
create table if not exists public.payments (
  id           bigint generated always as identity primary key,
  user_id      uuid   not null references auth.users(id),
  user_email   text,                      -- 관리자 화면에서 구매자 표시용
  product_id   bigint references public.products(id),
  product_name text,                       -- 내역 표시용(비정규화)
  order_id     text   not null unique,     -- 토스 주문번호(중복 저장 방지)
  payment_key  text,
  amount       integer not null,
  status       text   default 'DONE',
  created_at   timestamptz default now()
);

-- 3) 보안 규칙(RLS) 켜기 ---------------------------------------
alter table public.products enable row level security;
alter table public.payments enable row level security;

-- 상품: 누구나 읽기 가능(공개)
drop policy if exists "products_public_read" on public.products;
create policy "products_public_read"
  on public.products for select
  using (true);

-- 결제내역: 본인 것만 읽기
drop policy if exists "payments_read_own" on public.payments;
create policy "payments_read_own"
  on public.payments for select
  to authenticated
  using (auth.uid() = user_id);

-- 결제내역: 관리자(admin@admin.com)는 전체 읽기
drop policy if exists "payments_admin_read_all" on public.payments;
create policy "payments_admin_read_all"
  on public.payments for select
  to authenticated
  using ((auth.jwt() ->> 'email') = 'admin@admin.com');

-- 쓰기(insert/update/delete) 정책은 만들지 않습니다.
-- → 손님은 결제내역을 직접 쓸 수 없고, Edge Function(service_role)만 저장합니다.
--   (service_role 은 RLS를 우회하므로 정책 없이도 저장 가능)

-- 4) 이메일 인증 없이 가입 즉시 로그인되게 하기 -----------------
-- (요청 사항: 이메일 인증 기능 사용 안 함)
-- 새 사용자가 만들어질 때 email_confirmed_at 을 자동으로 채워 '인증 완료' 처리합니다.
create or replace function public.auto_confirm_user()
returns trigger
language plpgsql
security definer
as $$
begin
  if new.email_confirmed_at is null then
    new.email_confirmed_at := now();
  end if;
  return new;
end;
$$;

drop trigger if exists auto_confirm_user_trigger on auth.users;
create trigger auto_confirm_user_trigger
  before insert on auth.users
  for each row
  execute function public.auto_confirm_user();

-- 5) 샘플 상품 등록 --------------------------------------------
insert into public.products (name, price, image_url, description) values
  ('굿즈 스티커 팩',  3000,  'https://placehold.co/300x200?text=Sticker', '귀여운 스티커 10종 세트'),
  ('로고 머그컵',      12000, 'https://placehold.co/300x200?text=Mug',     '매일 쓰고 싶은 튼튼한 머그컵'),
  ('캐릭터 키링',      5000,  'https://placehold.co/300x200?text=Keyring', '가방에 다는 아크릴 키링'),
  ('에코백',          15000, 'https://placehold.co/300x200?text=Ecobag',  '심플한 캔버스 에코백'),
  ('떡메모지',        4000,  'https://placehold.co/300x200?text=Memo',    '두툼한 100매 떡메모지'),
  ('한정판 티셔츠',   25000, 'https://placehold.co/300x200?text=T-Shirt', '면 100% 반팔 티셔츠');
