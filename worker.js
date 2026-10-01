// Cloudflare Worker: PDO2-TT6 AI 생성 프록시 (API 키는 Worker의 비밀 값으로만 보관)
// 필요 설정: 비밀 값 ANTHROPIC_API_KEY, 변수 ALLOWED_ORIGIN(예: https://내계정.github.io), 선택 MODEL / HOURLY_LIMIT
let KEY, MODEL;
const ORDER = ["Ma","Me","St","El","Bi","Mn","Qu","Nu","Sp","Te","Ca","Ae","Mg","An"];
const PD_LEN = [3, 2, 2, 2];

const RULES = `너는 PDO2-TT6 문명 분류 체계의 판정자다. 아래 정의서 규칙만으로 판정한다.
[PDO2] 4축에서 하나씩 고른다. 인덱스: Principle 0=Magic 1=Physics 2=Anomaly / Direction 0=Inner(내부 집중) 1=Outer(외부 확장) / Operator 0=Collective 1=Individual / Objective 0=Stasis(유지) 1=Expansive(확장).
- Principle은 문명이 부르는 이름이 아니라 그 세계에서 실제로 작동하는 원리로 정한다. 마법이라 불려도 실제로 물리법칙으로 설명되면 Physics다.
- Anomaly는 세계관의 물리법칙과 마법 규칙을 무시·위반하고, 작동이 환원되지 않으며 미지에 대한 공포나 이해 불가 자체에 기반하는 현상이다. 아직 밝혀지지 않았지만 물리로 설명 가능하면 Physics, 마법 규칙으로 체계화되면 Magic이다.
[TT6] 14개 분야를 독립적으로 0~6으로 매긴다(0=해당 기술 근거 없음, 1~6=I~VI). 합산·평균·총점 금지.
분야: Ma 재료 / Me 기계·동력 / St 구조물·인프라·거대구조 / El 전기·전자기 / Bi 생명·유전 / Mn 정보·개념·문화·인지 전파 / Qu 양자 이용·제어 / Nu 원자핵·핵반응 / Sp 공간·차원 조작 / Te 시간 조작 / Ca 인과 조작 / Ae 항공·우주 비행 / Mg 마법의 공학적 활용·체계화 / An 이상현상의 기술적 활용·제어.
단계: I 인지(관측·이해·이론화) II 사용(존재하는 현상을 이용) III 응용(목적에 맞게 변형해 실용화) IV 재현(원하는 조건에서 안정적으로 재현) V 제어(조건·범위·결과를 정밀 제어) VI 개변(작동 조건이나 근본 특성 자체에 개입).
[판정 원칙]
- 분야는 결과의 유사성이 아니라 기술이 다루는 대상과 작동 원리로 정한다. 선박이 이동한다고 Ae가 아니고, 공간을 직접 조작해 이동하면 Sp다. 한 기술이 여러 분야의 원리를 쓰면 분야별로 따로 평가한다.
- 단계는 규모나 위력이 아니라 인지→사용→응용→재현→제어→개변의 기술적 도달 과정으로 매긴다. 거대한 시설이나 무기가 있다고 높아지지 않는다.
- 마법 원리가 수식화되어도 기반이 마법이면 Mg다. 이상현상의 원리가 밝혀져 다른 분야로 재분류되는 것은 단계의 상승·하락이 아니다.
- 근거가 없는 분야는 억지로 채우지 말고 낮게 두거나 0으로 둔다. 단계 경계가 애매하면 근거 문장에 "IV~V 경계"처럼 쓰고 더 낮은 쪽을 택한다.
- 문명이 여럿이거나 시점이 여러 개면 요청된 문명·시점만 평가한다.`;

const SCHEMA = `JSON 하나만 출력한다(설명·코드펜스 금지):
{"civ":"문명 이름","world":"작품명","pd":[0,1,0,1],"pdWhy":"4축 판정 근거 2~3문장","lv":{"Ma":0,"Me":0,"St":0,"El":0,"Bi":0,"Mn":0,"Qu":0,"Nu":0,"Sp":0,"Te":0,"Ca":0,"Ae":0,"Mg":0,"An":0},"why":{"Ma":"근거 1~2문장 + 확신도(높음/보통/낮음)", "...":"14개 분야 전부"},"sources":[{"title":"출처 제목","url":"https://..."}],"issues":[]}`;

async function claude(body) {
  const r = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: { "content-type": "application/json", "x-api-key": KEY, "anthropic-version": "2023-06-01" },
    body: JSON.stringify({ model: MODEL, max_tokens: 5000, ...body }),
  });
  const j = await r.json();
  if (!r.ok) throw new Error(j.error?.message || "API 오류 " + r.status);
  return j;
}
const textOf = (m) => m.content.filter((b) => b.type === "text").map((b) => b.text).join("");
const parseJson = (t) => { const a = t.indexOf("{"), b = t.lastIndexOf("}"); if (a < 0 || b < a) throw new Error("결과를 해석하지 못했습니다."); return JSON.parse(t.slice(a, b + 1)); };

async function research(work, view) {
  const messages = [{ role: "user", content: `작품: ${work}\n문명·시점: ${view || "작품의 중심 문명"}\n웹 검색으로 설정·세계관 자료를 조사한 뒤 판정하라. 공식 자료와 신뢰할 만한 설정 문서를 우선하고, 확인하지 못한 것은 확인하지 못했다고 쓴다.\n${SCHEMA}` }];
  let m;
  for (let i = 0; i < 4; i++) {
    m = await claude({ system: RULES, messages, tools: [{ type: "web_search_20250305", name: "web_search", max_uses: 6 }] });
    if (m.stop_reason !== "pause_turn") break;
    messages.push({ role: "assistant", content: m.content });
  }
  return parseJson(textOf(m));
}

async function verify(draft) {
  const m = await claude({
    system: RULES + "\n너는 검증자다. 초안이 위 규칙을 어긴 곳을 찾아 고친다: 결과 유사성으로 분야를 정한 곳, Anomaly/Magic/Physics 오분류, 규모·위력으로 매긴 단계, 근거 없이 높은 단계, 분야 간 중복 계상. 고친 내용은 issues에 한 줄씩 쓰고, 고칠 것이 없으면 빈 배열로 둔다. sources는 그대로 유지한다.",
    messages: [{ role: "user", content: `초안:\n${JSON.stringify(draft)}\n\n검증 후 같은 형식의 JSON만 출력하라.\n${SCHEMA}` }],
  });
  return parseJson(textOf(m));
}

function normalize(d, fallbackSources) {
  if (!Array.isArray(d.pd) || d.pd.length !== 4 || !d.pd.every((v, k) => Number.isInteger(v) && v >= 0 && v < PD_LEN[k])) throw new Error("PDO2 값이 올바르지 않습니다.");
  const str = (x, n) => String(x ?? "").slice(0, n);
  const src = (Array.isArray(d.sources) && d.sources.length ? d.sources : fallbackSources || [])
    .filter((s) => s && /^https?:\/\//.test(s.url)).slice(0, 12).map((s) => ({ title: str(s.title || s.url, 100), url: str(s.url, 500) }));
  return {
    civ: str(d.civ, 60), world: str(d.world, 60), pd: d.pd, pdWhy: str(d.pdWhy, 600),
    lv: ORDER.map((c) => Math.max(0, Math.min(6, Math.round(+d.lv?.[c]) || 0))),
    why: ORDER.map((c) => str(d.why?.[c], 500)),
    sources: src, issues: (Array.isArray(d.issues) ? d.issues : []).slice(0, 12).map((x) => str(x, 300)),
  };
}

const hits = new Map(); // 같은 인스턴스 안에서만 유지되는 간이 제한. 본격 제한은 Cloudflare 속도 제한 규칙을 쓰세요.
function limited(ip, LIMIT) {
  const now = Date.now(), a = (hits.get(ip) || []).filter((t) => now - t < 3600e3);
  if (a.length >= LIMIT) { hits.set(ip, a); return true; }
  a.push(now); hits.set(ip, a); return false;
}
const reply = (obj, code, cors) => new Response(JSON.stringify(obj), { status: code, headers: { ...cors, "content-type": "application/json; charset=utf-8" } });

export default {
  async fetch(req, env, ctx) {
    KEY = env.ANTHROPIC_API_KEY; MODEL = env.MODEL || "claude-sonnet-5-5";
    const allow = env.ALLOWED_ORIGIN || "";
    const cors = { "Access-Control-Allow-Origin": allow, "Access-Control-Allow-Methods": "POST, OPTIONS", "Access-Control-Allow-Headers": "Content-Type", Vary: "Origin" };
    if (req.method === "OPTIONS") return new Response(null, { status: 204, headers: cors });
    if (req.method !== "POST" || new URL(req.url).pathname !== "/api/generate") return new Response("not found", { status: 404, headers: cors });
    if (!KEY || !allow) return reply({ error: "서버 설정(ANTHROPIC_API_KEY, ALLOWED_ORIGIN)이 없습니다." }, 500, cors);
    if (req.headers.get("Origin") !== allow) return reply({ error: "허용되지 않은 출처입니다." }, 403, cors);
    const raw = await req.text();
    if (raw.length > 2000) return reply({ error: "요청이 너무 깁니다." }, 413, cors);
    let body; try { body = JSON.parse(raw || "{}"); } catch { return reply({ error: "요청 형식이 올바르지 않습니다." }, 400, cors); }
    const { work, view } = body;
    if (typeof work !== "string" || !work.trim() || work.length > 80 || String(view || "").length > 80) return reply({ error: "작품 이름을 80자 이내로 입력하세요." }, 400, cors);
    if (limited(req.headers.get("CF-Connecting-IP") || "", +env.HOURLY_LIMIT || 5)) return reply({ error: "요청이 많습니다. 잠시 후 다시 시도하세요." }, 429, cors);

    // 생성에 1~2분 걸리므로 연결이 끊기지 않게 공백을 보내며 기다리고, 마지막에 JSON을 보낸다.
    const { readable, writable } = new TransformStream(), w = writable.getWriter(), enc = new TextEncoder();
    ctx.waitUntil((async () => {
      const beat = setInterval(() => w.write(enc.encode(" ")).catch(() => {}), 15000);
      try {
        const draft = await research(work.trim(), String(view || "").trim());
        let final = draft;
        try { final = await verify(draft); } catch { /* 검증 실패 시 초안 사용 */ }
        await w.write(enc.encode(JSON.stringify(normalize(final, draft.sources))));
      } catch (e) { await w.write(enc.encode(JSON.stringify({ error: String(e.message || e).slice(0, 200) }))).catch(() => {}); }
      finally { clearInterval(beat); await w.close().catch(() => {}); }
    })());
    return new Response(readable, { headers: { ...cors, "content-type": "application/json; charset=utf-8" } });
  },
};
