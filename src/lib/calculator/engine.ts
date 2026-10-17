export type BasicOp = "+" | "-" | "*" | "/";
export type AngleMode = "deg" | "rad";
export type WordSize = 8 | 16 | 32 | 64;
export type Base = 8 | 10 | 16;

export type BasicState = {
  display: string;
  acc: number | null;
  op: BasicOp | null;
  overwrite: boolean;
  typing: boolean;
  operandReady: boolean;
  lastOp: BasicOp | null;
  lastArg: number | null;
  lastPercent: boolean;
  percentRate: number | null;
  error: boolean;
};

export type SciFn =
  | "sin"
  | "cos"
  | "tan"
  | "asin"
  | "acos"
  | "atan"
  | "sinh"
  | "cosh"
  | "tanh"
  | "asinh"
  | "acosh"
  | "atanh"
  | "ln"
  | "log"
  | "exp"
  | "exp10"
  | "sq"
  | "cube"
  | "sqrt"
  | "cbrt"
  | "inv"
  | "fact";

export type SciOp = "+" | "-" | "*" | "/" | "^" | "root";

export type SciToken =
  | { k: "n"; v: number }
  | { k: "op"; op: SciOp }
  | { k: "fn"; fn: SciFn }
  | { k: "lp" }
  | { k: "rp" };

export type SciState = {
  tokens: SciToken[];
  entry: string | null;
  shown: string;
  angle: AngleMode;
  memory: number;
  error: boolean;
  evaluated: boolean;
  exp: boolean;
};

export type ProgOp =
  | "+"
  | "-"
  | "*"
  | "/"
  | "mod"
  | "and"
  | "or"
  | "xor"
  | "nand"
  | "nor"
  | "shl"
  | "shr"
  | "rol"
  | "ror";

export type ProgState = {
  value: bigint;
  entry: string | null;
  overwrite: boolean;
  typing: boolean;
  op: ProgOp | null;
  acc: bigint | null;
  operandReady: boolean;
  lastOp: ProgOp | null;
  lastArg: bigint | null;
  bits: WordSize;
  base: Base;
  error: boolean;
  rpn: boolean;
  stack: bigint[];
};

export type Recorded = { expr: string; result: string };
export type Step<T> = { state: T; record?: Recorded };

const OPS: Record<BasicOp, string> = { "+": "+", "-": "−", "*": "×", "/": "÷" };

export function round(n: number): number {
  if (!Number.isFinite(n)) return n;
  return parseFloat(n.toPrecision(12));
}

export function canon(n: number): string {
  if (!Number.isFinite(n)) return "Error";
  if (Object.is(n, -0) || n === 0) return "0";
  const abs = Math.abs(n);
  if (abs >= 1e12 || abs < 1e-9) {
    return n
      .toExponential(6)
      .replace(/\.?0+e/, "e")
      .replace("e+", "e");
  }
  return parseFloat(n.toPrecision(12)).toString();
}

export function formatDisplay(raw: string): string {
  if (raw === "Error") return "Error";
  if (/e/i.test(raw)) return raw.replace(/-/g, "−");
  const neg = raw.startsWith("-");
  let body = neg ? raw.slice(1) : raw;
  if (body.startsWith(".")) body = `0${body}`;
  const [intRaw, frac] = body.split(".");
  const int = intRaw.replace(/^0+(?=\d)/, "") || "0";
  const grouped = int.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  return `${neg ? "−" : ""}${grouped}${frac !== undefined ? `.${frac}` : ""}`;
}

function applyBasic(op: BasicOp, a: number, b: number): number {
  switch (op) {
    case "+":
      return round(a + b);
    case "-":
      return round(a - b);
    case "*":
      return round(a * b);
    case "/":
      return b === 0 ? Number.NaN : round(a / b);
  }
}

export function initialBasic(): BasicState {
  return {
    display: "0",
    acc: null,
    op: null,
    overwrite: true,
    typing: false,
    operandReady: false,
    lastOp: null,
    lastArg: null,
    lastPercent: false,
    percentRate: null,
    error: false,
  };
}

export function basicClearLabel(s: BasicState): "AC" | "C" {
  return !s.error && s.typing ? "C" : "AC";
}

function basicError(): BasicState {
  return { ...initialBasic(), display: "Error", error: true };
}

export function basicPress(state: BasicState, key: string): Step<BasicState> {
  if (key === "C") return { state: onBasicClear(state) };
  if (state.error && key !== "C") return basicPress(initialBasic(), key);
  if (/^[0-9]$/.test(key)) return { state: onBasicDigit(state, key) };
  if (key === ".") return { state: onBasicDot(state) };
  if (key === "±") return { state: onBasicSign(state) };
  if (key === "%") return { state: onBasicPct(state) };
  if (key === "⌫") return { state: onBasicBack(state) };
  if (key === "+" || key === "-" || key === "*" || key === "/") return { state: onBasicOp(state, key) };
  if (key === "=") return onBasicEq(state);
  return { state };
}

function onBasicClear(s: BasicState): BasicState {
  if (s.error || !s.typing) return initialBasic();
  return { ...s, display: "0", typing: false, overwrite: true, operandReady: false };
}

function onBasicDigit(s: BasicState, d: string): BasicState {
  if (s.overwrite) {
    return { ...s, display: d, overwrite: false, typing: true, operandReady: true, error: false };
  }
  const digits = s.display.replace("-", "").replace(".", "");
  if (digits.length >= 12) return s;
  if (s.display === "0") return { ...s, display: d, typing: true, operandReady: true };
  if (s.display === "-0") return { ...s, display: `-${d}`, typing: true, operandReady: true };
  return { ...s, display: s.display + d, typing: true, operandReady: true };
}

function onBasicDot(s: BasicState): BasicState {
  if (s.overwrite) {
    return { ...s, display: "0.", overwrite: false, typing: true, operandReady: true };
  }
  if (s.display.includes(".")) return s;
  return { ...s, display: `${s.display}.`, typing: true, operandReady: true };
}

function onBasicSign(s: BasicState): BasicState {
  if (s.display === "0") return { ...s, display: "-0", overwrite: false, typing: true };
  if (s.display === "-0") return { ...s, display: "0" };
  if (s.display.startsWith("-")) return { ...s, display: s.display.slice(1) };
  return { ...s, display: `-${s.display}` };
}

function onBasicBack(s: BasicState): BasicState {
  if (s.overwrite || !s.typing) return s;
  if (s.display.length <= 1 || (s.display.startsWith("-") && s.display.length <= 2)) {
    return { ...s, display: "0", typing: false, overwrite: true, operandReady: false };
  }
  return { ...s, display: s.display.slice(0, -1) };
}

function onBasicPct(s: BasicState): BasicState {
  const current = Number(s.display);
  if (s.op && s.acc !== null && (s.op === "+" || s.op === "-")) {
    return {
      ...s,
      display: canon(round((s.acc * current) / 100)),
      overwrite: true,
      typing: false,
      operandReady: true,
      lastPercent: true,
      percentRate: current,
    };
  }
  if (s.op && (s.op === "*" || s.op === "/")) {
    return {
      ...s,
      display: canon(round(current / 100)),
      overwrite: true,
      typing: false,
      operandReady: true,
      lastPercent: true,
      percentRate: current,
    };
  }
  return {
    ...s,
    display: canon(round(current / 100)),
    overwrite: true,
    typing: false,
    operandReady: false,
    lastPercent: false,
  };
}

function onBasicOp(s: BasicState, op: BasicOp): BasicState {
  const current = Number(s.display);
  if (s.op && s.acc !== null && (s.typing || s.operandReady)) {
    const result = applyBasic(s.op, s.acc, current);
    if (!Number.isFinite(result)) return basicError();
    return {
      ...s,
      display: canon(result),
      acc: result,
      op,
      overwrite: true,
      typing: false,
      operandReady: false,
      lastOp: null,
      lastArg: null,
      lastPercent: false,
      percentRate: null,
      error: false,
    };
  }
  return {
    ...s,
    acc: current,
    op,
    overwrite: true,
    typing: false,
    operandReady: false,
    lastOp: null,
    lastArg: null,
    lastPercent: false,
    percentRate: null,
  };
}

function finishBasic(
  s: BasicState,
  result: number,
  expr: string,
  lastOp: BasicOp,
  lastArg: number,
  lastPercent: boolean,
  percentRate: number | null,
): Step<BasicState> {
  if (!Number.isFinite(result)) return { state: basicError() };
  const shown = canon(result);
  return {
    state: {
      ...initialBasic(),
      display: shown,
      lastOp,
      lastArg,
      lastPercent,
      percentRate,
    },
    record: { expr, result: formatDisplay(shown) },
  };
}

function onBasicEq(s: BasicState): Step<BasicState> {
  const current = Number(s.display);
  if (s.op && s.acc !== null) {
    const expr = s.lastPercent
      ? `${formatDisplay(canon(s.acc))} ${OPS[s.op]} ${s.percentRate}%`
      : `${formatDisplay(canon(s.acc))} ${OPS[s.op]} ${formatDisplay(canon(current))}`;
    return finishBasic(s, applyBasic(s.op, s.acc, current), expr, s.op, current, s.lastPercent, s.percentRate);
  }
  if (s.lastOp && s.lastArg !== null) {
    if (s.lastPercent && (s.lastOp === "+" || s.lastOp === "-")) {
      const rate = s.percentRate ?? 0;
      const expr = `${formatDisplay(canon(current))} ${OPS[s.lastOp]} ${rate}%`;
      return finishBasic(
        s,
        applyBasic(s.lastOp, current, round((current * rate) / 100)),
        expr,
        s.lastOp,
        s.lastArg,
        true,
        s.percentRate,
      );
    }
    if (s.lastPercent && (s.lastOp === "*" || s.lastOp === "/")) {
      const rate = s.percentRate ?? 0;
      const expr = `${formatDisplay(canon(current))} ${OPS[s.lastOp]} ${rate}%`;
      return finishBasic(s, applyBasic(s.lastOp, current, round(rate / 100)), expr, s.lastOp, s.lastArg, true, s.percentRate);
    }
    const expr = `${formatDisplay(canon(current))} ${OPS[s.lastOp]} ${formatDisplay(canon(s.lastArg))}`;
    return finishBasic(s, applyBasic(s.lastOp, current, s.lastArg), expr, s.lastOp, s.lastArg, false, null);
  }
  return { state: s };
}

const FN_LABEL: Record<SciFn, string> = {
  sin: "sin",
  cos: "cos",
  tan: "tan",
  asin: "sin⁻¹",
  acos: "cos⁻¹",
  atan: "tan⁻¹",
  sinh: "sinh",
  cosh: "cosh",
  tanh: "tanh",
  asinh: "sinh⁻¹",
  acosh: "cosh⁻¹",
  atanh: "tanh⁻¹",
  ln: "ln",
  log: "log",
  exp: "e^",
  exp10: "10^",
  sq: "sqr",
  cube: "cube",
  sqrt: "√",
  cbrt: "∛",
  inv: "1/",
  fact: "fact",
};

const SCI_OP: Record<SciOp, string> = {
  "+": "+",
  "-": "−",
  "*": "×",
  "/": "÷",
  "^": "^",
  root: "ʸ√",
};

export function initialSci(): SciState {
  return {
    tokens: [],
    entry: null,
    shown: "0",
    angle: "deg",
    memory: 0,
    error: false,
    evaluated: false,
    exp: false,
  };
}

export function sciClearLabel(s: SciState): "AC" | "C" {
  return !s.error && s.entry !== null ? "C" : "AC";
}

export function sciVisible(s: SciState): string {
  if (s.error) return "Error";
  return s.entry ?? s.shown;
}

export function formatTokens(tokens: SciToken[]): string {
  let out = "";
  for (const token of tokens) {
    if (token.k === "n") out += formatDisplay(canon(token.v));
    else if (token.k === "op") out += ` ${SCI_OP[token.op]} `;
    else if (token.k === "fn") out += FN_LABEL[token.fn];
    else if (token.k === "lp") out += "(";
    else out += ")";
  }
  return out.replace(/\s+/g, " ").trim();
}

function expectsNumber(tokens: SciToken[]): boolean {
  if (tokens.length === 0) return true;
  const last = tokens[tokens.length - 1];
  return last.k === "op" || last.k === "lp" || last.k === "fn";
}

function entryValue(entry: string): number | null {
  const cleaned =
    entry.endsWith("e") || entry.endsWith("e-") || entry.endsWith("e+") ? entry.slice(0, entry.indexOf("e")) : entry;
  if (cleaned === "" || cleaned === "-" || cleaned === "." || cleaned === "-.") return null;
  const n = Number(cleaned);
  return Number.isFinite(n) ? round(n) : null;
}

function toRad(n: number, angle: AngleMode): number {
  return angle === "deg" ? (n * Math.PI) / 180 : n;
}

function fromRad(n: number, angle: AngleMode): number {
  return angle === "deg" ? (n * 180) / Math.PI : n;
}

function factorial(n: number): number {
  if (!Number.isFinite(n) || n < 0 || Math.floor(n) !== n || n > 170) throw new Error("domain");
  let r = 1;
  for (let i = 2; i <= n; i += 1) r *= i;
  return round(r);
}

function power(a: number, b: number): number {
  if (a < 0 && Math.floor(b) !== b) throw new Error("domain");
  const r = a ** b;
  if (!Number.isFinite(r)) throw new Error("domain");
  return round(r);
}

function applyFn(fn: SciFn, x: number, angle: AngleMode): number {
  switch (fn) {
    case "sin":
      return round(Math.sin(toRad(x, angle)));
    case "cos":
      return round(Math.cos(toRad(x, angle)));
    case "tan":
      return round(Math.tan(toRad(x, angle)));
    case "asin":
      return round(fromRad(Math.asin(x), angle));
    case "acos":
      return round(fromRad(Math.acos(x), angle));
    case "atan":
      return round(fromRad(Math.atan(x), angle));
    case "sinh":
      return round(Math.sinh(x));
    case "cosh":
      return round(Math.cosh(x));
    case "tanh":
      return round(Math.tanh(x));
    case "asinh":
      return round(Math.asinh(x));
    case "acosh":
      return round(Math.acosh(x));
    case "atanh":
      return round(Math.atanh(x));
    case "ln":
      if (x <= 0) throw new Error("domain");
      return round(Math.log(x));
    case "log":
      if (x <= 0) throw new Error("domain");
      return round(Math.log10(x));
    case "exp":
      return round(Math.exp(x));
    case "exp10":
      return power(10, x);
    case "sq":
      return round(x * x);
    case "cube":
      return round(x * x * x);
    case "sqrt":
      if (x < 0) throw new Error("domain");
      return round(Math.sqrt(x));
    case "cbrt":
      return round(Math.cbrt(x));
    case "inv":
      if (x === 0) throw new Error("div0");
      return round(1 / x);
    case "fact":
      return factorial(x);
  }
}

function balance(tokens: SciToken[]): SciToken[] {
  let open = 0;
  for (const token of tokens) {
    if (token.k === "lp") open += 1;
    else if (token.k === "rp") open = Math.max(0, open - 1);
  }
  const out = tokens.slice();
  while (open > 0) {
    out.push({ k: "rp" });
    open -= 1;
  }
  return out;
}

export function evaluate(tokens: SciToken[], angle: AngleMode): number {
  const src = balance(tokens);
  let i = 0;
  const peek = () => src[i];
  const eat = () => src[i++];

  function parseExpr(): number {
    let left = parseTerm();
    while (true) {
      const p = peek();
      if (p?.k === "op" && (p.op === "+" || p.op === "-")) {
        eat();
        const right = parseTerm();
        left = p.op === "+" ? round(left + right) : round(left - right);
      } else break;
    }
    return left;
  }

  function parseTerm(): number {
    let left = parsePow();
    while (true) {
      const p = peek();
      if (p?.k === "op" && (p.op === "*" || p.op === "/")) {
        eat();
        const right = parsePow();
        if (p.op === "/" && right === 0) throw new Error("div0");
        left = p.op === "*" ? round(left * right) : round(left / right);
      } else break;
    }
    return left;
  }

  function parsePow(): number {
    const left = parseUnary();
    const p = peek();
    if (p?.k === "op" && (p.op === "^" || p.op === "root")) {
      eat();
      const right = parsePow();
      if (p.op === "^") return power(left, right);
      if (right === 0) throw new Error("div0");
      return power(left, 1 / right);
    }
    return left;
  }

  function parseUnary(): number {
    const p = peek();
    if (!p) throw new Error("empty");
    if (p.k === "fn") {
      eat();
      let arg: number;
      if (peek()?.k === "lp") {
        eat();
        arg = parseExpr();
        if (peek()?.k !== "rp") throw new Error("paren");
        eat();
      } else {
        arg = parseUnary();
      }
      return applyFn(p.fn, arg, angle);
    }
    if (p.k === "lp") {
      eat();
      const value = parseExpr();
      if (peek()?.k !== "rp") throw new Error("paren");
      eat();
      return value;
    }
    if (p.k === "n") {
      eat();
      return p.v;
    }
    throw new Error("token");
  }

  const value = parseExpr();
  if (i !== src.length) throw new Error("trailing");
  return value;
}

function sciError(s: SciState): SciState {
  return { ...s, error: true, entry: null, shown: "Error", exp: false };
}

function keepSci(s: SciState): SciState {
  return { ...initialSci(), angle: s.angle, memory: s.memory };
}

function currentSci(s: SciState): number {
  if (s.entry !== null) {
    const v = entryValue(s.entry);
    if (v !== null) return v;
  }
  const n = Number(s.shown);
  return Number.isFinite(n) ? n : 0;
}

export type SciAction =
  | { t: "digit"; d: string }
  | { t: "dot" }
  | { t: "op"; op: SciOp }
  | { t: "fn"; fn: SciFn }
  | { t: "eq" }
  | { t: "clear" }
  | { t: "sign" }
  | { t: "lp" }
  | { t: "rp" }
  | { t: "back" }
  | { t: "const"; v: number }
  | { t: "ee" }
  | { t: "pct" }
  | { t: "mem"; m: "c" | "+" | "-" | "r" }
  | { t: "angle" };

export function sciPress(state: SciState, action: SciAction): Step<SciState> {
  if (action.t === "clear") return { state: onSciClear(state) };
  if (action.t === "angle") {
    return { state: { ...state, angle: state.angle === "deg" ? "rad" : "deg" } };
  }
  if (state.error) return sciPress(keepSci(state), action);
  switch (action.t) {
    case "digit":
      return { state: onSciDigit(state, action.d) };
    case "dot":
      return { state: onSciDot(state) };
    case "back":
      return { state: onSciBack(state) };
    case "sign":
      return { state: onSciSign(state) };
    case "ee":
      return { state: onSciEe(state) };
    case "op":
      return { state: onSciOp(state, action.op) };
    case "fn":
      return { state: onSciFn(state, action.fn) };
    case "lp":
      return { state: onSciLp(state) };
    case "rp":
      return { state: onSciRp(state) };
    case "const":
      return { state: insertSciNumber(state, action.v) };
    case "pct":
      return { state: onSciPct(state) };
    case "mem":
      return { state: onSciMem(state, action.m) };
    case "eq":
      return onSciEq(state);
    default:
      return { state };
  }
}

function onSciClear(s: SciState): SciState {
  if (!s.error && s.entry !== null) {
    return { ...s, entry: null, exp: false, shown: s.tokens.length === 0 ? "0" : s.shown };
  }
  return keepSci(s);
}

function onSciDigit(s: SciState, d: string): SciState {
  if (s.exp && s.entry !== null) {
    if ((s.entry.split("e")[1] ?? "").replace("-", "").length >= 3) return s;
    return { ...s, entry: s.entry + d };
  }
  if (s.entry === null) {
    if (!s.evaluated && expectsNumber(s.tokens) && s.tokens.length > 0) {
      return { ...s, entry: d, exp: false, error: false };
    }
    return { ...s, tokens: [], entry: d, shown: "0", evaluated: false, exp: false, error: false };
  }
  const digits = s.entry.replace("-", "").replace(".", "").replace(/e.*/, "");
  if (digits.length >= 12) return s;
  if (s.entry === "0") return { ...s, entry: d };
  if (s.entry === "-0") return { ...s, entry: `-${d}` };
  return { ...s, entry: s.entry + d };
}

function onSciDot(s: SciState): SciState {
  if (s.exp) return s;
  if (s.entry === null) {
    if (!s.evaluated && expectsNumber(s.tokens) && s.tokens.length > 0) return { ...s, entry: "0." };
    return { ...s, tokens: [], entry: "0.", shown: "0", evaluated: false };
  }
  if (s.entry.includes(".")) return s;
  return { ...s, entry: `${s.entry}.` };
}

function onSciBack(s: SciState): SciState {
  if (s.entry === null) return s;
  if (s.entry.length <= 1 || (s.entry.startsWith("-") && s.entry.length <= 2)) {
    return { ...s, entry: null, exp: false };
  }
  const next = s.entry.slice(0, -1);
  return { ...s, entry: next, exp: next.includes("e") };
}

function onSciSign(s: SciState): SciState {
  if (s.exp && s.entry?.includes("e")) {
    const [mantissa, exp] = s.entry.split("e");
    const nextExp = exp.startsWith("-") ? exp.slice(1) : `-${exp}`;
    return { ...s, entry: `${mantissa}e${nextExp}` };
  }
  if (s.entry !== null) {
    if (s.entry.startsWith("-")) return { ...s, entry: s.entry.slice(1) };
    return { ...s, entry: `-${s.entry}` };
  }
  const n = Number(s.shown);
  if (!Number.isFinite(n)) return s;
  const flipped = round(-n);
  return { ...s, shown: canon(flipped), tokens: [{ k: "n", v: flipped }], evaluated: false };
}

function onSciEe(s: SciState): SciState {
  if (s.entry === null) {
    const base = s.tokens.length && !expectsNumber(s.tokens) ? [] : s.tokens;
    const seed = s.shown === "Error" ? "1" : s.shown;
    return { ...s, tokens: s.evaluated ? [] : base, entry: `${seed}e`, exp: true, evaluated: false };
  }
  if (s.entry.includes("e")) return s;
  return { ...s, entry: `${s.entry}e`, exp: true };
}

function onSciOp(s: SciState, op: SciOp): SciState {
  let tokens = s.tokens.slice();
  let shown = s.shown;
  if (s.evaluated) {
    tokens = [{ k: "n", v: Number(s.shown) }];
  } else if (s.entry !== null) {
    const v = entryValue(s.entry);
    if (v === null) return s;
    tokens = [...tokens, { k: "n", v }];
    shown = canon(v);
  } else if (tokens.length === 0) {
    tokens = [{ k: "n", v: Number(s.shown) }];
  } else if (expectsNumber(tokens)) {
    const last = tokens[tokens.length - 1];
    if (last?.k === "op") tokens[tokens.length - 1] = { k: "op", op };
    else return s;
    return { ...s, tokens, entry: null, shown, evaluated: false, exp: false };
  }
  const last = tokens[tokens.length - 1];
  if (last?.k === "op") tokens[tokens.length - 1] = { k: "op", op };
  else tokens.push({ k: "op", op });
  return { ...s, tokens, entry: null, shown, evaluated: false, exp: false, error: false };
}

function onSciFn(s: SciState, fn: SciFn): SciState {
  try {
    if (s.entry !== null || (expectsNumber(s.tokens) && s.tokens.length > 0)) {
      const arg = s.entry !== null ? entryValue(s.entry) : Number(s.shown);
      if (arg === null || !Number.isFinite(arg)) return sciError(s);
      const result = applyFn(fn, arg, s.angle);
      return {
        ...s,
        tokens: [...s.tokens, { k: "fn", fn }, { k: "lp" }, { k: "n", v: arg }, { k: "rp" }],
        entry: null,
        shown: canon(result),
        evaluated: false,
        exp: false,
        error: false,
      };
    }
    const arg = Number(s.shown);
    const result = applyFn(fn, arg, s.angle);
    const inner: SciToken[] = s.evaluated || s.tokens.length === 0 ? [{ k: "n", v: arg }] : s.tokens;
    return {
      ...s,
      tokens: [{ k: "fn", fn }, { k: "lp" }, ...inner, { k: "rp" }],
      entry: null,
      shown: canon(result),
      evaluated: false,
      exp: false,
      error: false,
    };
  } catch {
    return sciError(s);
  }
}

function onSciLp(s: SciState): SciState {
  let tokens = s.evaluated ? [] : s.tokens.slice();
  if (!s.evaluated && s.entry !== null) {
    const v = entryValue(s.entry);
    if (v !== null) tokens = [...tokens, { k: "n", v }, { k: "op", op: "*" }];
  } else if (!s.evaluated && tokens.length > 0 && !expectsNumber(tokens)) {
    tokens = [...tokens, { k: "op", op: "*" }];
  }
  tokens.push({ k: "lp" });
  return { ...s, tokens, entry: null, evaluated: false, exp: false };
}

function onSciRp(s: SciState): SciState {
  let tokens = s.tokens.slice();
  let shown = s.shown;
  if (s.entry !== null) {
    const v = entryValue(s.entry);
    if (v === null) return s;
    tokens.push({ k: "n", v });
    shown = canon(v);
  }
  const opens = tokens.filter((token) => token.k === "lp").length;
  const closes = tokens.filter((token) => token.k === "rp").length;
  if (opens <= closes) return s;
  tokens.push({ k: "rp" });
  return { ...s, tokens, entry: null, shown, evaluated: false, exp: false };
}

function insertSciNumber(s: SciState, v: number): SciState {
  const value = round(v);
  if (!s.evaluated && expectsNumber(s.tokens) && s.tokens.length > 0) {
    return {
      ...s,
      tokens: [...s.tokens, { k: "n", v: value }],
      entry: null,
      shown: canon(value),
      exp: false,
      error: false,
    };
  }
  return {
    ...s,
    tokens: [{ k: "n", v: value }],
    entry: null,
    shown: canon(value),
    evaluated: false,
    exp: false,
    error: false,
  };
}

function onSciPct(s: SciState): SciState {
  const rate = currentSci(s);
  const opToken = s.tokens[s.tokens.length - 1];
  const left = s.tokens[s.tokens.length - 2];
  if (s.entry !== null && opToken?.k === "op" && (opToken.op === "+" || opToken.op === "-") && left?.k === "n") {
    return { ...s, entry: canon(round((left.v * rate) / 100)), exp: false };
  }
  if (s.entry !== null && opToken?.k === "op" && (opToken.op === "*" || opToken.op === "/")) {
    return { ...s, entry: canon(round(rate / 100)), exp: false };
  }
  return insertSciNumber({ ...s, tokens: s.entry ? s.tokens : [] }, round(rate / 100));
}

function onSciMem(s: SciState, m: "c" | "+" | "-" | "r"): SciState {
  if (m === "c") return { ...s, memory: 0 };
  if (m === "r") return insertSciNumber(s, s.memory);
  const current = currentSci(s);
  const memory = m === "+" ? round(s.memory + current) : round(s.memory - current);
  return { ...s, memory };
}

function onSciEq(s: SciState): Step<SciState> {
  let tokens = s.tokens.slice();
  if (s.entry !== null) {
    const v = entryValue(s.entry);
    if (v === null) return { state: s };
    tokens.push({ k: "n", v });
  } else if (tokens.length === 0) {
    return { state: { ...s, evaluated: true } };
  }
  if (tokens[tokens.length - 1]?.k === "op") {
    const prev = [...tokens].reverse().find((token) => token.k === "n");
    if (!prev || prev.k !== "n") return { state: s };
    tokens.push({ k: "n", v: prev.v });
  }
  try {
    const result = evaluate(tokens, s.angle);
    const shown = canon(result);
    return {
      state: { ...s, tokens: [], entry: null, shown, evaluated: true, exp: false, error: false },
      record: { expr: formatTokens(tokens), result: formatDisplay(shown) },
    };
  } catch {
    return { state: sciError(s) };
  }
}

export function mask(value: bigint, bits: number): bigint {
  const width = BigInt(bits);
  const m = (1n << width) - 1n;
  return value & m;
}

export function toSigned(value: bigint, bits: number): bigint {
  const u = mask(value, bits);
  const sign = 1n << BigInt(bits - 1);
  return u >= sign ? u - (1n << BigInt(bits)) : u;
}

function wordBits(bits: WordSize): number {
  return bits;
}

export function initialProg(): ProgState {
  return {
    value: 0n,
    entry: null,
    overwrite: true,
    typing: false,
    op: null,
    acc: null,
    operandReady: false,
    lastOp: null,
    lastArg: null,
    bits: 64,
    base: 10,
    error: false,
    rpn: false,
    stack: [],
  };
}

export function progClearLabel(s: ProgState): "AC" | "C" {
  return !s.error && s.entry !== null ? "C" : "AC";
}

export function progLive(s: ProgState): bigint {
  if (s.entry) return parseProgDigits(s.entry, s.base, s.bits);
  return s.value;
}

export function formatProg(value: bigint, base: Base, bits: WordSize): string {
  if (base === 10) {
    const signed = toSigned(value, bits);
    const neg = signed < 0n;
    const digits = (neg ? -signed : signed).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    return neg ? `−${digits}` : digits;
  }
  return mask(value, bits).toString(base).toUpperCase();
}

export function progVisible(s: ProgState): string {
  if (s.error) return "Error";
  if (s.entry !== null) return s.entry.toUpperCase();
  return formatProg(s.value, s.base, s.bits);
}

function parseProgDigits(entry: string, base: Base, bits: WordSize): bigint {
  if (!entry) return 0n;
  try {
    const prefixed = base === 16 ? `0x${entry}` : base === 8 ? `0o${entry}` : entry;
    return mask(BigInt(prefixed), wordBits(bits));
  } catch {
    return 0n;
  }
}

function commitProg(s: ProgState): ProgState {
  if (s.entry === null) return s;
  return { ...s, value: parseProgDigits(s.entry, s.base, s.bits), entry: null, typing: false };
}

function progBin(op: ProgOp, a: bigint, b: bigint, bits: WordSize): bigint {
  const width = BigInt(bits);
  const m = (1n << width) - 1n;
  const ua = a & m;
  const ub = b & m;
  switch (op) {
    case "+":
      return (ua + ub) & m;
    case "-":
      return (ua - ub) & m;
    case "*":
      return (ua * ub) & m;
    case "/":
      if (toSigned(ub, bits) === 0n) throw new Error("div0");
      return mask(toSigned(ua, bits) / toSigned(ub, bits), bits);
    case "mod":
      if (toSigned(ub, bits) === 0n) throw new Error("div0");
      return mask(toSigned(ua, bits) % toSigned(ub, bits), bits);
    case "and":
      return ua & ub;
    case "or":
      return ua | ub;
    case "xor":
      return ua ^ ub;
    case "nand":
      return ~(ua & ub) & m;
    case "nor":
      return ~(ua | ub) & m;
    case "shl":
      return ub >= width ? 0n : (ua << ub) & m;
    case "shr":
      return ub >= width ? 0n : ua >> ub;
    case "rol":
    case "ror": {
      const by = Number(ub % width);
      if (by === 0) return ua;
      return op === "rol" ? ((ua << BigInt(by)) | (ua >> (width - BigInt(by)))) & m : ((ua >> BigInt(by)) | (ua << (width - BigInt(by)))) & m;
    }
  }
}

const PROG_SYM: Record<ProgOp, string> = {
  "+": "+",
  "-": "−",
  "*": "×",
  "/": "÷",
  mod: "mod",
  and: "AND",
  or: "OR",
  xor: "XOR",
  nand: "NAND",
  nor: "NOR",
  shl: "<<",
  shr: ">>",
  rol: "ROL",
  ror: "ROR",
};

export type ProgAction =
  | { t: "digit"; d: string }
  | { t: "op"; op: ProgOp }
  | { t: "unary"; u: "not" | "flip8" | "flip16" | "neg" }
  | { t: "eq" }
  | { t: "clear" }
  | { t: "back" }
  | { t: "base"; base: Base }
  | { t: "bits"; bits: WordSize }
  | { t: "enter" }
  | { t: "rpn" }
  | { t: "bit"; index: number };

function progError(s: ProgState): ProgState {
  return { ...s, error: true, entry: null, op: null, acc: null };
}

export function progPress(state: ProgState, action: ProgAction): Step<ProgState> {
  if (action.t === "clear") {
    if (!state.error && state.entry !== null) {
      return { state: { ...state, entry: null, typing: false, overwrite: true } };
    }
    return { state: { ...initialProg(), bits: state.bits, base: state.base, rpn: state.rpn } };
  }
  if (action.t === "rpn") {
    const committed = commitProg(state);
    return { state: { ...committed, rpn: !state.rpn, op: null, acc: null, stack: [], overwrite: true } };
  }
  if (action.t === "base") {
    const committed = commitProg(state.error ? { ...initialProg(), bits: state.bits, rpn: state.rpn } : state);
    return { state: { ...committed, base: action.base, overwrite: true, error: false } };
  }
  if (action.t === "bits") {
    const committed = commitProg(state);
    return {
      state: { ...committed, bits: action.bits, value: mask(committed.value, action.bits), stack: committed.stack.map((item) => mask(item, action.bits)), overwrite: true },
    };
  }
  if (state.error) return progPress({ ...initialProg(), bits: state.bits, base: state.base, rpn: state.rpn }, action);
  switch (action.t) {
    case "digit":
      return { state: onProgDigit(state, action.d) };
    case "back":
      return { state: onProgBack(state) };
    case "unary":
      return { state: onProgUnary(state, action.u) };
    case "bit":
      return { state: onProgBit(state, action.index) };
    case "enter":
      return { state: onProgEnter(state) };
    case "op":
      return onProgOp(state, action.op);
    case "eq":
      return onProgEq(state);
    default:
      return { state };
  }
}

function digitAllowed(d: string, base: Base): boolean {
  const map = "0123456789ABCDEF";
  const n = map.indexOf(d.toUpperCase());
  return n >= 0 && n < base;
}

function onProgDigit(s: ProgState, d: string): ProgState {
  const digit = d.toUpperCase();
  if (!digitAllowed(digit, s.base)) return s;
  if (s.overwrite || s.entry === null) {
    return { ...s, entry: digit, overwrite: false, typing: true, operandReady: true };
  }
  if (s.entry.length >= 16) return s;
  if (s.entry === "0") return { ...s, entry: digit, typing: true, operandReady: true };
  return { ...s, entry: s.entry + digit, typing: true, operandReady: true };
}

function onProgBack(s: ProgState): ProgState {
  if (s.entry === null) return s;
  if (s.entry.length <= 1) return { ...s, entry: null, overwrite: true, typing: false, operandReady: false };
  return { ...s, entry: s.entry.slice(0, -1) };
}

function onProgUnary(s: ProgState, u: "not" | "flip8" | "flip16" | "neg"): ProgState {
  const cur = commitProg(s);
  const bits = cur.bits;
  const m = (1n << BigInt(bits)) - 1n;
  let value = cur.value;
  if (u === "not") value = ~value & m;
  else if (u === "neg") value = mask(-toSigned(value, bits), bits);
  else if (u === "flip8") value = flipBytes(value, bits, 8);
  else value = flipBytes(value, bits, 16);
  return { ...cur, value, overwrite: true, operandReady: false, op: cur.rpn ? null : cur.op };
}

function flipBytes(value: bigint, bits: number, group: 8 | 16): bigint {
  const groups = bits / group;
  let x = mask(value, bits);
  const maskG = (1n << BigInt(group)) - 1n;
  let out = 0n;
  for (let i = 0; i < groups; i += 1) {
    out = (out << BigInt(group)) | (x & maskG);
    x >>= BigInt(group);
  }
  return out;
}

function onProgBit(s: ProgState, index: number): ProgState {
  const cur = commitProg(s);
  if (index < 0 || index >= cur.bits) return cur;
  const bit = 1n << BigInt(index);
  return { ...cur, value: cur.value ^ bit, overwrite: true };
}

function onProgEnter(s: ProgState): ProgState {
  const cur = commitProg(s);
  if (!cur.rpn) return { ...cur, overwrite: true };
  return { ...cur, stack: [...cur.stack, cur.value].slice(-8), overwrite: true, op: null, acc: null };
}

function onProgOp(s: ProgState, op: ProgOp): Step<ProgState> {
  const cur = commitProg(s);
  if (cur.rpn) {
    const y = cur.stack.length ? cur.stack[cur.stack.length - 1] : 0n;
    const stack = cur.stack.slice(0, -1);
    try {
      const value = progBin(op, y, cur.value, cur.bits);
      const expr = `${formatProg(y, cur.base, cur.bits)} ${PROG_SYM[op]} ${formatProg(cur.value, cur.base, cur.bits)}`;
      return {
        state: { ...cur, value, stack, overwrite: true, op: null, acc: null },
        record: { expr, result: formatProg(value, cur.base, cur.bits) },
      };
    } catch {
      return { state: progError(cur) };
    }
  }
  if (cur.op && cur.acc !== null && cur.operandReady) {
    try {
      const value = progBin(cur.op, cur.acc, cur.value, cur.bits);
      return {
        state: { ...cur, value, acc: value, op, overwrite: true, operandReady: false, typing: false },
      };
    } catch {
      return { state: progError(cur) };
    }
  }
  return { state: { ...cur, acc: cur.value, op, overwrite: true, operandReady: false, typing: false } };
}

function onProgEq(s: ProgState): Step<ProgState> {
  const cur = commitProg(s);
  if (cur.rpn) return { state: { ...cur, overwrite: true } };
  try {
    if (cur.op && cur.acc !== null) {
      const value = progBin(cur.op, cur.acc, cur.value, cur.bits);
      const expr = `${formatProg(cur.acc, cur.base, cur.bits)} ${PROG_SYM[cur.op]} ${formatProg(cur.value, cur.base, cur.bits)}`;
      return {
        state: { ...cur, value, op: null, acc: null, lastOp: cur.op, lastArg: cur.value, overwrite: true, operandReady: false },
        record: { expr, result: formatProg(value, cur.base, cur.bits) },
      };
    }
    if (cur.lastOp && cur.lastArg !== null) {
      const value = progBin(cur.lastOp, cur.value, cur.lastArg, cur.bits);
      const expr = `${formatProg(cur.value, cur.base, cur.bits)} ${PROG_SYM[cur.lastOp]} ${formatProg(cur.lastArg, cur.base, cur.bits)}`;
      return {
        state: { ...cur, value, overwrite: true },
        record: { expr, result: formatProg(value, cur.base, cur.bits) },
      };
    }
  } catch {
    return { state: progError(cur) };
  }
  return { state: cur };
}

export type UnitCategory = "length" | "mass" | "temperature" | "area" | "volume" | "speed" | "time" | "data";

export type UnitDef = { id: string; label: string; toBase: number };

export const UNIT_CATEGORIES: { id: UnitCategory; label: string; units: UnitDef[] }[] = [
  {
    id: "length",
    label: "Length",
    units: [
      { id: "mm", label: "Millimeters", toBase: 0.001 },
      { id: "cm", label: "Centimeters", toBase: 0.01 },
      { id: "m", label: "Meters", toBase: 1 },
      { id: "km", label: "Kilometers", toBase: 1000 },
      { id: "in", label: "Inches", toBase: 0.0254 },
      { id: "ft", label: "Feet", toBase: 0.3048 },
      { id: "yd", label: "Yards", toBase: 0.9144 },
      { id: "mi", label: "Miles", toBase: 1609.344 },
    ],
  },
  {
    id: "mass",
    label: "Mass",
    units: [
      { id: "mg", label: "Milligrams", toBase: 0.000001 },
      { id: "g", label: "Grams", toBase: 0.001 },
      { id: "kg", label: "Kilograms", toBase: 1 },
      { id: "oz", label: "Ounces", toBase: 0.028349523125 },
      { id: "lb", label: "Pounds", toBase: 0.45359237 },
      { id: "t", label: "Tonnes", toBase: 1000 },
    ],
  },
  {
    id: "temperature",
    label: "Temperature",
    units: [
      { id: "c", label: "Celsius", toBase: 1 },
      { id: "f", label: "Fahrenheit", toBase: 1 },
      { id: "k", label: "Kelvin", toBase: 1 },
    ],
  },
  {
    id: "area",
    label: "Area",
    units: [
      { id: "cm2", label: "Square centimeters", toBase: 0.0001 },
      { id: "m2", label: "Square meters", toBase: 1 },
      { id: "ha", label: "Hectares", toBase: 10000 },
      { id: "ft2", label: "Square feet", toBase: 0.09290304 },
      { id: "ac", label: "Acres", toBase: 4046.8564224 },
    ],
  },
  {
    id: "volume",
    label: "Volume",
    units: [
      { id: "ml", label: "Milliliters", toBase: 0.001 },
      { id: "l", label: "Liters", toBase: 1 },
      { id: "tsp", label: "Teaspoons", toBase: 0.00492892159375 },
      { id: "tbsp", label: "Tablespoons", toBase: 0.01478676478125 },
      { id: "cup", label: "Cups", toBase: 0.2365882365 },
      { id: "gal", label: "Gallons", toBase: 3.785411784 },
    ],
  },
  {
    id: "speed",
    label: "Speed",
    units: [
      { id: "mps", label: "Meters per second", toBase: 1 },
      { id: "kmh", label: "Kilometers per hour", toBase: 1 / 3.6 },
      { id: "mph", label: "Miles per hour", toBase: 0.44704 },
      { id: "kn", label: "Knots", toBase: 0.514444 },
    ],
  },
  {
    id: "time",
    label: "Time",
    units: [
      { id: "ms", label: "Milliseconds", toBase: 0.001 },
      { id: "s", label: "Seconds", toBase: 1 },
      { id: "min", label: "Minutes", toBase: 60 },
      { id: "h", label: "Hours", toBase: 3600 },
      { id: "d", label: "Days", toBase: 86400 },
    ],
  },
  {
    id: "data",
    label: "Data",
    units: [
      { id: "b", label: "Bytes", toBase: 1 },
      { id: "kb", label: "Kilobytes", toBase: 1024 },
      { id: "mb", label: "Megabytes", toBase: 1024 ** 2 },
      { id: "gb", label: "Gigabytes", toBase: 1024 ** 3 },
      { id: "tb", label: "Terabytes", toBase: 1024 ** 4 },
    ],
  },
];

function tempToC(unit: string, value: number): number {
  if (unit === "f") return ((value - 32) * 5) / 9;
  if (unit === "k") return value - 273.15;
  return value;
}

function tempFromC(unit: string, celsius: number): number {
  if (unit === "f") return (celsius * 9) / 5 + 32;
  if (unit === "k") return celsius + 273.15;
  return celsius;
}

export function convertUnits(category: UnitCategory, fromId: string, toId: string, value: number): number {
  const group = UNIT_CATEGORIES.find((item) => item.id === category);
  if (!group) return value;
  if (category === "temperature") return round(tempFromC(toId, tempToC(fromId, value)));
  const from = group.units.find((unit) => unit.id === fromId);
  const to = group.units.find((unit) => unit.id === toId);
  if (!from || !to || to.toBase === 0) return value;
  return round((value * from.toBase) / to.toBase);
}

export function charReadout(value: bigint): { ascii: string; unicode: string } {
  const n = Number(mask(value, 21));
  const ascii = n >= 32 && n <= 126 ? String.fromCharCode(n) : "—";
  const unicode = n >= 32 && n <= 0x10ffff && !(n >= 0xd800 && n <= 0xdfff) ? String.fromCodePoint(n) : "—";
  return { ascii, unicode };
}
