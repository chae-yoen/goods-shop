// =============================================================
// confirm-payment (Supabase Edge Function)
// -------------------------------------------------------------
// 토스 결제 "승인"을 담당하는 작은 서버 함수입니다.
// 브라우저(success.html)가 이 함수를 부르면:
//   1) 로그인 토큰으로 "누가 결제했는지" 확인
//   2) productId 의 실제 가격과 결제 금액이 같은지 검사 (금액 조작 방지)
//   3) 토스에 시크릿 키로 결제 승인 요청
//   4) 성공하면 payments 테이블에 결제 기록 저장
//
// 시크릿 키(TOSS_SECRET_KEY)와 service_role 키는 이 서버 안에만 있고,
// 브라우저에는 절대 노출되지 않습니다.
// =============================================================

import { createClient } from "jsr:@supabase/supabase-js@2";

// CORS: GitHub Pages(다른 주소)에서 이 함수를 부를 수 있도록 허용
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

Deno.serve(async (req) => {
  // 브라우저가 먼저 보내는 사전 요청(OPTIONS) 처리
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { paymentKey, orderId, amount, productId } = await req.json();

    if (!paymentKey || !orderId || !amount) {
      return json({ message: "필수 결제 정보가 없습니다." }, 400);
    }

    // --- 1) 로그인한 사용자 확인 (Authorization: Bearer <token>) ---
    const authHeader = req.headers.get("Authorization") ?? "";
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: userData, error: userErr } = await userClient.auth.getUser();
    if (userErr || !userData.user) {
      return json({ message: "로그인이 필요합니다." }, 401);
    }
    const user = userData.user;

    // service_role 클라이언트: RLS를 우회해 안전하게 기록을 저장합니다.
    const admin = createClient(supabaseUrl, serviceKey);

    // --- 2) 상품 가격과 결제 금액 대조 (금액 위조 방지) ---
    let productName = "상품";
    if (productId) {
      const { data: product } = await admin
        .from("products")
        .select("id, name, price")
        .eq("id", productId)
        .single();
      if (!product) return json({ message: "상품을 찾을 수 없습니다." }, 400);
      if (Number(product.price) !== Number(amount)) {
        return json({ message: "결제 금액이 상품 가격과 일치하지 않습니다." }, 400);
      }
      productName = product.name;
    }

    // --- 3) 토스 결제 승인 요청 ---
    // 토스 시크릿 키: 환경변수에 있으면 그걸 쓰고, 없으면 공개 테스트 시크릿 키 사용
    const secretKey =
      Deno.env.get("TOSS_SECRET_KEY") ?? "test_gsk_docs_OaPz8L5KdmQXkzRz3y47BMw6";
    // 토스 인증: "시크릿키:" 를 base64 로 인코딩해 Basic 인증에 사용
    const encoded = btoa(secretKey + ":");

    const tossRes = await fetch("https://api.tosspayments.com/v1/payments/confirm", {
      method: "POST",
      headers: {
        Authorization: `Basic ${encoded}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ paymentKey, orderId, amount }),
    });
    const tossData = await tossRes.json();

    if (!tossRes.ok) {
      return json(
        { message: tossData.message || "토스 결제 승인 실패", code: tossData.code },
        400
      );
    }

    // --- 4) 결제 기록 저장 ---
    const { error: insertErr } = await admin.from("payments").insert({
      user_id: user.id,
      user_email: user.email,
      product_id: productId ? Number(productId) : null,
      product_name: productName,
      order_id: orderId,
      payment_key: paymentKey,
      amount: Number(amount),
      status: tossData.status ?? "DONE",
    });

    if (insertErr) {
      // 이미 저장된 주문이면(새로고침 등) 조용히 성공 처리
      if (!insertErr.message.includes("duplicate")) {
        return json({ message: "결제 기록 저장 실패: " + insertErr.message }, 500);
      }
    }

    return json({ ok: true, product_name: productName, amount, status: tossData.status });
  } catch (e) {
    return json({ message: "서버 오류: " + (e as Error).message }, 500);
  }
});
