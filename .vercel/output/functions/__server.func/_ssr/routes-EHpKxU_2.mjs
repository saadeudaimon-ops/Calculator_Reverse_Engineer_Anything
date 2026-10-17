import { i as __toESM } from "../_runtime.mjs";
import { K as require_react, b as require_jsx_runtime } from "../_libs/@tanstack/react-router+[...].mjs";
import { a as Calculator, i as Check, n as History, o as ArrowLeftRight, r as Delete } from "../_libs/lucide-react.mjs";
import { t as clsx } from "../_libs/clsx.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/routes-EHpKxU_2.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
var OPS = {
	"+": "+",
	"-": "−",
	"*": "×",
	"/": "÷"
};
function round(n) {
	if (!Number.isFinite(n)) return n;
	return parseFloat(n.toPrecision(12));
}
function canon(n) {
	if (!Number.isFinite(n)) return "Error";
	if (Object.is(n, -0) || n === 0) return "0";
	const abs = Math.abs(n);
	if (abs >= 0xe8d4a51000 || abs < 1e-9) return n.toExponential(6).replace(/\.?0+e/, "e").replace("e+", "e");
	return parseFloat(n.toPrecision(12)).toString();
}
function formatDisplay(raw) {
	if (raw === "Error") return "Error";
	if (/e/i.test(raw)) return raw.replace(/-/g, "−");
	const neg = raw.startsWith("-");
	let body = neg ? raw.slice(1) : raw;
	if (body.startsWith(".")) body = `0${body}`;
	const [intRaw, frac] = body.split(".");
	const grouped = (intRaw.replace(/^0+(?=\d)/, "") || "0").replace(/\B(?=(\d{3})+(?!\d))/g, ",");
	return `${neg ? "−" : ""}${grouped}${frac !== void 0 ? `.${frac}` : ""}`;
}
function applyBasic(op, a, b) {
	switch (op) {
		case "+": return round(a + b);
		case "-": return round(a - b);
		case "*": return round(a * b);
		case "/": return b === 0 ? NaN : round(a / b);
	}
}
function initialBasic() {
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
		error: false
	};
}
function basicClearLabel(s) {
	return !s.error && s.typing ? "C" : "AC";
}
function basicError() {
	return {
		...initialBasic(),
		display: "Error",
		error: true
	};
}
function basicPress(state, key) {
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
function onBasicClear(s) {
	if (s.error || !s.typing) return initialBasic();
	return {
		...s,
		display: "0",
		typing: false,
		overwrite: true,
		operandReady: false
	};
}
function onBasicDigit(s, d) {
	if (s.overwrite) return {
		...s,
		display: d,
		overwrite: false,
		typing: true,
		operandReady: true,
		error: false
	};
	if (s.display.replace("-", "").replace(".", "").length >= 12) return s;
	if (s.display === "0") return {
		...s,
		display: d,
		typing: true,
		operandReady: true
	};
	if (s.display === "-0") return {
		...s,
		display: `-${d}`,
		typing: true,
		operandReady: true
	};
	return {
		...s,
		display: s.display + d,
		typing: true,
		operandReady: true
	};
}
function onBasicDot(s) {
	if (s.overwrite) return {
		...s,
		display: "0.",
		overwrite: false,
		typing: true,
		operandReady: true
	};
	if (s.display.includes(".")) return s;
	return {
		...s,
		display: `${s.display}.`,
		typing: true,
		operandReady: true
	};
}
function onBasicSign(s) {
	if (s.display === "0") return {
		...s,
		display: "-0",
		overwrite: false,
		typing: true
	};
	if (s.display === "-0") return {
		...s,
		display: "0"
	};
	if (s.display.startsWith("-")) return {
		...s,
		display: s.display.slice(1)
	};
	return {
		...s,
		display: `-${s.display}`
	};
}
function onBasicBack(s) {
	if (s.overwrite || !s.typing) return s;
	if (s.display.length <= 1 || s.display.startsWith("-") && s.display.length <= 2) return {
		...s,
		display: "0",
		typing: false,
		overwrite: true,
		operandReady: false
	};
	return {
		...s,
		display: s.display.slice(0, -1)
	};
}
function onBasicPct(s) {
	const current = Number(s.display);
	if (s.op && s.acc !== null && (s.op === "+" || s.op === "-")) return {
		...s,
		display: canon(round(s.acc * current / 100)),
		overwrite: true,
		typing: false,
		operandReady: true,
		lastPercent: true,
		percentRate: current
	};
	if (s.op && (s.op === "*" || s.op === "/")) return {
		...s,
		display: canon(round(current / 100)),
		overwrite: true,
		typing: false,
		operandReady: true,
		lastPercent: true,
		percentRate: current
	};
	return {
		...s,
		display: canon(round(current / 100)),
		overwrite: true,
		typing: false,
		operandReady: false,
		lastPercent: false
	};
}
function onBasicOp(s, op) {
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
			error: false
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
		percentRate: null
	};
}
function finishBasic(s, result, expr, lastOp, lastArg, lastPercent, percentRate) {
	if (!Number.isFinite(result)) return { state: basicError() };
	const shown = canon(result);
	return {
		state: {
			...initialBasic(),
			display: shown,
			lastOp,
			lastArg,
			lastPercent,
			percentRate
		},
		record: {
			expr,
			result: formatDisplay(shown)
		}
	};
}
function onBasicEq(s) {
	const current = Number(s.display);
	if (s.op && s.acc !== null) {
		const expr = s.lastPercent ? `${formatDisplay(canon(s.acc))} ${OPS[s.op]} ${s.percentRate}%` : `${formatDisplay(canon(s.acc))} ${OPS[s.op]} ${formatDisplay(canon(current))}`;
		return finishBasic(s, applyBasic(s.op, s.acc, current), expr, s.op, current, s.lastPercent, s.percentRate);
	}
	if (s.lastOp && s.lastArg !== null) {
		if (s.lastPercent && (s.lastOp === "+" || s.lastOp === "-")) {
			const rate = s.percentRate ?? 0;
			const expr = `${formatDisplay(canon(current))} ${OPS[s.lastOp]} ${rate}%`;
			return finishBasic(s, applyBasic(s.lastOp, current, round(current * rate / 100)), expr, s.lastOp, s.lastArg, true, s.percentRate);
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
var FN_LABEL = {
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
	fact: "fact"
};
var SCI_OP = {
	"+": "+",
	"-": "−",
	"*": "×",
	"/": "÷",
	"^": "^",
	root: "ʸ√"
};
function initialSci() {
	return {
		tokens: [],
		entry: null,
		shown: "0",
		angle: "deg",
		memory: 0,
		error: false,
		evaluated: false,
		exp: false
	};
}
function sciClearLabel(s) {
	return !s.error && s.entry !== null ? "C" : "AC";
}
function sciVisible(s) {
	if (s.error) return "Error";
	return s.entry ?? s.shown;
}
function formatTokens(tokens) {
	let out = "";
	for (const token of tokens) if (token.k === "n") out += formatDisplay(canon(token.v));
	else if (token.k === "op") out += ` ${SCI_OP[token.op]} `;
	else if (token.k === "fn") out += FN_LABEL[token.fn];
	else if (token.k === "lp") out += "(";
	else out += ")";
	return out.replace(/\s+/g, " ").trim();
}
function expectsNumber(tokens) {
	if (tokens.length === 0) return true;
	const last = tokens[tokens.length - 1];
	return last.k === "op" || last.k === "lp" || last.k === "fn";
}
function entryValue(entry) {
	const cleaned = entry.endsWith("e") || entry.endsWith("e-") || entry.endsWith("e+") ? entry.slice(0, entry.indexOf("e")) : entry;
	if (cleaned === "" || cleaned === "-" || cleaned === "." || cleaned === "-.") return null;
	const n = Number(cleaned);
	return Number.isFinite(n) ? round(n) : null;
}
function toRad(n, angle) {
	return angle === "deg" ? n * Math.PI / 180 : n;
}
function fromRad(n, angle) {
	return angle === "deg" ? n * 180 / Math.PI : n;
}
function factorial(n) {
	if (!Number.isFinite(n) || n < 0 || Math.floor(n) !== n || n > 170) throw new Error("domain");
	let r = 1;
	for (let i = 2; i <= n; i += 1) r *= i;
	return round(r);
}
function power(a, b) {
	if (a < 0 && Math.floor(b) !== b) throw new Error("domain");
	const r = a ** b;
	if (!Number.isFinite(r)) throw new Error("domain");
	return round(r);
}
function applyFn(fn, x, angle) {
	switch (fn) {
		case "sin": return round(Math.sin(toRad(x, angle)));
		case "cos": return round(Math.cos(toRad(x, angle)));
		case "tan": return round(Math.tan(toRad(x, angle)));
		case "asin": return round(fromRad(Math.asin(x), angle));
		case "acos": return round(fromRad(Math.acos(x), angle));
		case "atan": return round(fromRad(Math.atan(x), angle));
		case "sinh": return round(Math.sinh(x));
		case "cosh": return round(Math.cosh(x));
		case "tanh": return round(Math.tanh(x));
		case "asinh": return round(Math.asinh(x));
		case "acosh": return round(Math.acosh(x));
		case "atanh": return round(Math.atanh(x));
		case "ln":
			if (x <= 0) throw new Error("domain");
			return round(Math.log(x));
		case "log":
			if (x <= 0) throw new Error("domain");
			return round(Math.log10(x));
		case "exp": return round(Math.exp(x));
		case "exp10": return power(10, x);
		case "sq": return round(x * x);
		case "cube": return round(x * x * x);
		case "sqrt":
			if (x < 0) throw new Error("domain");
			return round(Math.sqrt(x));
		case "cbrt": return round(Math.cbrt(x));
		case "inv":
			if (x === 0) throw new Error("div0");
			return round(1 / x);
		case "fact": return factorial(x);
	}
}
function balance(tokens) {
	let open = 0;
	for (const token of tokens) if (token.k === "lp") open += 1;
	else if (token.k === "rp") open = Math.max(0, open - 1);
	const out = tokens.slice();
	while (open > 0) {
		out.push({ k: "rp" });
		open -= 1;
	}
	return out;
}
function evaluate(tokens, angle) {
	const src = balance(tokens);
	let i = 0;
	const peek = () => src[i];
	const eat = () => src[i++];
	function parseExpr() {
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
	function parseTerm() {
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
	function parsePow() {
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
	function parseUnary() {
		const p = peek();
		if (!p) throw new Error("empty");
		if (p.k === "fn") {
			eat();
			let arg;
			if (peek()?.k === "lp") {
				eat();
				arg = parseExpr();
				if (peek()?.k !== "rp") throw new Error("paren");
				eat();
			} else arg = parseUnary();
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
function sciError(s) {
	return {
		...s,
		error: true,
		entry: null,
		shown: "Error",
		exp: false
	};
}
function keepSci(s) {
	return {
		...initialSci(),
		angle: s.angle,
		memory: s.memory
	};
}
function currentSci(s) {
	if (s.entry !== null) {
		const v = entryValue(s.entry);
		if (v !== null) return v;
	}
	const n = Number(s.shown);
	return Number.isFinite(n) ? n : 0;
}
function sciPress(state, action) {
	if (action.t === "clear") return { state: onSciClear(state) };
	if (action.t === "angle") return { state: {
		...state,
		angle: state.angle === "deg" ? "rad" : "deg"
	} };
	if (state.error) return sciPress(keepSci(state), action);
	switch (action.t) {
		case "digit": return { state: onSciDigit(state, action.d) };
		case "dot": return { state: onSciDot(state) };
		case "back": return { state: onSciBack(state) };
		case "sign": return { state: onSciSign(state) };
		case "ee": return { state: onSciEe(state) };
		case "op": return { state: onSciOp(state, action.op) };
		case "fn": return { state: onSciFn(state, action.fn) };
		case "lp": return { state: onSciLp(state) };
		case "rp": return { state: onSciRp(state) };
		case "const": return { state: insertSciNumber(state, action.v) };
		case "pct": return { state: onSciPct(state) };
		case "mem": return { state: onSciMem(state, action.m) };
		case "eq": return onSciEq(state);
		default: return { state };
	}
}
function onSciClear(s) {
	if (!s.error && s.entry !== null) return {
		...s,
		entry: null,
		exp: false,
		shown: s.tokens.length === 0 ? "0" : s.shown
	};
	return keepSci(s);
}
function onSciDigit(s, d) {
	if (s.exp && s.entry !== null) {
		if ((s.entry.split("e")[1] ?? "").replace("-", "").length >= 3) return s;
		return {
			...s,
			entry: s.entry + d
		};
	}
	if (s.entry === null) {
		if (!s.evaluated && expectsNumber(s.tokens) && s.tokens.length > 0) return {
			...s,
			entry: d,
			exp: false,
			error: false
		};
		return {
			...s,
			tokens: [],
			entry: d,
			shown: "0",
			evaluated: false,
			exp: false,
			error: false
		};
	}
	if (s.entry.replace("-", "").replace(".", "").replace(/e.*/, "").length >= 12) return s;
	if (s.entry === "0") return {
		...s,
		entry: d
	};
	if (s.entry === "-0") return {
		...s,
		entry: `-${d}`
	};
	return {
		...s,
		entry: s.entry + d
	};
}
function onSciDot(s) {
	if (s.exp) return s;
	if (s.entry === null) {
		if (!s.evaluated && expectsNumber(s.tokens) && s.tokens.length > 0) return {
			...s,
			entry: "0."
		};
		return {
			...s,
			tokens: [],
			entry: "0.",
			shown: "0",
			evaluated: false
		};
	}
	if (s.entry.includes(".")) return s;
	return {
		...s,
		entry: `${s.entry}.`
	};
}
function onSciBack(s) {
	if (s.entry === null) return s;
	if (s.entry.length <= 1 || s.entry.startsWith("-") && s.entry.length <= 2) return {
		...s,
		entry: null,
		exp: false
	};
	const next = s.entry.slice(0, -1);
	return {
		...s,
		entry: next,
		exp: next.includes("e")
	};
}
function onSciSign(s) {
	if (s.exp && s.entry?.includes("e")) {
		const [mantissa, exp] = s.entry.split("e");
		const nextExp = exp.startsWith("-") ? exp.slice(1) : `-${exp}`;
		return {
			...s,
			entry: `${mantissa}e${nextExp}`
		};
	}
	if (s.entry !== null) {
		if (s.entry.startsWith("-")) return {
			...s,
			entry: s.entry.slice(1)
		};
		return {
			...s,
			entry: `-${s.entry}`
		};
	}
	const n = Number(s.shown);
	if (!Number.isFinite(n)) return s;
	const flipped = round(-n);
	return {
		...s,
		shown: canon(flipped),
		tokens: [{
			k: "n",
			v: flipped
		}],
		evaluated: false
	};
}
function onSciEe(s) {
	if (s.entry === null) {
		const base = s.tokens.length && !expectsNumber(s.tokens) ? [] : s.tokens;
		const seed = s.shown === "Error" ? "1" : s.shown;
		return {
			...s,
			tokens: s.evaluated ? [] : base,
			entry: `${seed}e`,
			exp: true,
			evaluated: false
		};
	}
	if (s.entry.includes("e")) return s;
	return {
		...s,
		entry: `${s.entry}e`,
		exp: true
	};
}
function onSciOp(s, op) {
	let tokens = s.tokens.slice();
	let shown = s.shown;
	if (s.evaluated) tokens = [{
		k: "n",
		v: Number(s.shown)
	}];
	else if (s.entry !== null) {
		const v = entryValue(s.entry);
		if (v === null) return s;
		tokens = [...tokens, {
			k: "n",
			v
		}];
		shown = canon(v);
	} else if (tokens.length === 0) tokens = [{
		k: "n",
		v: Number(s.shown)
	}];
	else if (expectsNumber(tokens)) {
		if (tokens[tokens.length - 1]?.k === "op") tokens[tokens.length - 1] = {
			k: "op",
			op
		};
		else return s;
		return {
			...s,
			tokens,
			entry: null,
			shown,
			evaluated: false,
			exp: false
		};
	}
	if (tokens[tokens.length - 1]?.k === "op") tokens[tokens.length - 1] = {
		k: "op",
		op
	};
	else tokens.push({
		k: "op",
		op
	});
	return {
		...s,
		tokens,
		entry: null,
		shown,
		evaluated: false,
		exp: false,
		error: false
	};
}
function onSciFn(s, fn) {
	try {
		if (s.entry !== null || expectsNumber(s.tokens) && s.tokens.length > 0) {
			const arg = s.entry !== null ? entryValue(s.entry) : Number(s.shown);
			if (arg === null || !Number.isFinite(arg)) return sciError(s);
			const result = applyFn(fn, arg, s.angle);
			return {
				...s,
				tokens: [
					...s.tokens,
					{
						k: "fn",
						fn
					},
					{ k: "lp" },
					{
						k: "n",
						v: arg
					},
					{ k: "rp" }
				],
				entry: null,
				shown: canon(result),
				evaluated: false,
				exp: false,
				error: false
			};
		}
		const arg = Number(s.shown);
		const result = applyFn(fn, arg, s.angle);
		const inner = s.evaluated || s.tokens.length === 0 ? [{
			k: "n",
			v: arg
		}] : s.tokens;
		return {
			...s,
			tokens: [
				{
					k: "fn",
					fn
				},
				{ k: "lp" },
				...inner,
				{ k: "rp" }
			],
			entry: null,
			shown: canon(result),
			evaluated: false,
			exp: false,
			error: false
		};
	} catch {
		return sciError(s);
	}
}
function onSciLp(s) {
	let tokens = s.evaluated ? [] : s.tokens.slice();
	if (!s.evaluated && s.entry !== null) {
		const v = entryValue(s.entry);
		if (v !== null) tokens = [
			...tokens,
			{
				k: "n",
				v
			},
			{
				k: "op",
				op: "*"
			}
		];
	} else if (!s.evaluated && tokens.length > 0 && !expectsNumber(tokens)) tokens = [...tokens, {
		k: "op",
		op: "*"
	}];
	tokens.push({ k: "lp" });
	return {
		...s,
		tokens,
		entry: null,
		evaluated: false,
		exp: false
	};
}
function onSciRp(s) {
	let tokens = s.tokens.slice();
	let shown = s.shown;
	if (s.entry !== null) {
		const v = entryValue(s.entry);
		if (v === null) return s;
		tokens.push({
			k: "n",
			v
		});
		shown = canon(v);
	}
	if (tokens.filter((token) => token.k === "lp").length <= tokens.filter((token) => token.k === "rp").length) return s;
	tokens.push({ k: "rp" });
	return {
		...s,
		tokens,
		entry: null,
		shown,
		evaluated: false,
		exp: false
	};
}
function insertSciNumber(s, v) {
	const value = round(v);
	if (!s.evaluated && expectsNumber(s.tokens) && s.tokens.length > 0) return {
		...s,
		tokens: [...s.tokens, {
			k: "n",
			v: value
		}],
		entry: null,
		shown: canon(value),
		exp: false,
		error: false
	};
	return {
		...s,
		tokens: [{
			k: "n",
			v: value
		}],
		entry: null,
		shown: canon(value),
		evaluated: false,
		exp: false,
		error: false
	};
}
function onSciPct(s) {
	const rate = currentSci(s);
	const opToken = s.tokens[s.tokens.length - 1];
	const left = s.tokens[s.tokens.length - 2];
	if (s.entry !== null && opToken?.k === "op" && (opToken.op === "+" || opToken.op === "-") && left?.k === "n") return {
		...s,
		entry: canon(round(left.v * rate / 100)),
		exp: false
	};
	if (s.entry !== null && opToken?.k === "op" && (opToken.op === "*" || opToken.op === "/")) return {
		...s,
		entry: canon(round(rate / 100)),
		exp: false
	};
	return insertSciNumber({
		...s,
		tokens: s.entry ? s.tokens : []
	}, round(rate / 100));
}
function onSciMem(s, m) {
	if (m === "c") return {
		...s,
		memory: 0
	};
	if (m === "r") return insertSciNumber(s, s.memory);
	const current = currentSci(s);
	const memory = m === "+" ? round(s.memory + current) : round(s.memory - current);
	return {
		...s,
		memory
	};
}
function onSciEq(s) {
	let tokens = s.tokens.slice();
	if (s.entry !== null) {
		const v = entryValue(s.entry);
		if (v === null) return { state: s };
		tokens.push({
			k: "n",
			v
		});
	} else if (tokens.length === 0) return { state: {
		...s,
		evaluated: true
	} };
	if (tokens[tokens.length - 1]?.k === "op") {
		const prev = [...tokens].reverse().find((token) => token.k === "n");
		if (!prev || prev.k !== "n") return { state: s };
		tokens.push({
			k: "n",
			v: prev.v
		});
	}
	try {
		const shown = canon(evaluate(tokens, s.angle));
		return {
			state: {
				...s,
				tokens: [],
				entry: null,
				shown,
				evaluated: true,
				exp: false,
				error: false
			},
			record: {
				expr: formatTokens(tokens),
				result: formatDisplay(shown)
			}
		};
	} catch {
		return { state: sciError(s) };
	}
}
function mask(value, bits) {
	return value & (1n << BigInt(bits)) - 1n;
}
function toSigned(value, bits) {
	const u = mask(value, bits);
	return u >= 1n << BigInt(bits - 1) ? u - (1n << BigInt(bits)) : u;
}
function wordBits(bits) {
	return bits;
}
function initialProg() {
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
		stack: []
	};
}
function progClearLabel(s) {
	return !s.error && s.entry !== null ? "C" : "AC";
}
function progLive(s) {
	if (s.entry) return parseProgDigits(s.entry, s.base, s.bits);
	return s.value;
}
function formatProg(value, base, bits) {
	if (base === 10) {
		const signed = toSigned(value, bits);
		const neg = signed < 0n;
		const digits = (neg ? -signed : signed).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
		return neg ? `−${digits}` : digits;
	}
	return mask(value, bits).toString(base).toUpperCase();
}
function parseProgDigits(entry, base, bits) {
	if (!entry) return 0n;
	try {
		const prefixed = base === 16 ? `0x${entry}` : base === 8 ? `0o${entry}` : entry;
		return mask(BigInt(prefixed), wordBits(bits));
	} catch {
		return 0n;
	}
}
function commitProg(s) {
	if (s.entry === null) return s;
	return {
		...s,
		value: parseProgDigits(s.entry, s.base, s.bits),
		entry: null,
		typing: false
	};
}
function progBin(op, a, b, bits) {
	const width = BigInt(bits);
	const m = (1n << width) - 1n;
	const ua = a & m;
	const ub = b & m;
	switch (op) {
		case "+": return ua + ub & m;
		case "-": return ua - ub & m;
		case "*": return ua * ub & m;
		case "/":
			if (toSigned(ub, bits) === 0n) throw new Error("div0");
			return mask(toSigned(ua, bits) / toSigned(ub, bits), bits);
		case "mod":
			if (toSigned(ub, bits) === 0n) throw new Error("div0");
			return mask(toSigned(ua, bits) % toSigned(ub, bits), bits);
		case "and": return ua & ub;
		case "or": return ua | ub;
		case "xor": return ua ^ ub;
		case "nand": return ~(ua & ub) & m;
		case "nor": return ~(ua | ub) & m;
		case "shl": return ub >= width ? 0n : ua << ub & m;
		case "shr": return ub >= width ? 0n : ua >> ub;
		case "rol":
		case "ror": {
			const by = Number(ub % width);
			if (by === 0) return ua;
			return op === "rol" ? (ua << BigInt(by) | ua >> width - BigInt(by)) & m : (ua >> BigInt(by) | ua << width - BigInt(by)) & m;
		}
	}
}
var PROG_SYM = {
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
	ror: "ROR"
};
function progError(s) {
	return {
		...s,
		error: true,
		entry: null,
		op: null,
		acc: null
	};
}
function progPress(state, action) {
	if (action.t === "clear") {
		if (!state.error && state.entry !== null) return { state: {
			...state,
			entry: null,
			typing: false,
			overwrite: true
		} };
		return { state: {
			...initialProg(),
			bits: state.bits,
			base: state.base,
			rpn: state.rpn
		} };
	}
	if (action.t === "rpn") return { state: {
		...commitProg(state),
		rpn: !state.rpn,
		op: null,
		acc: null,
		stack: [],
		overwrite: true
	} };
	if (action.t === "base") return { state: {
		...commitProg(state.error ? {
			...initialProg(),
			bits: state.bits,
			rpn: state.rpn
		} : state),
		base: action.base,
		overwrite: true,
		error: false
	} };
	if (action.t === "bits") {
		const committed = commitProg(state);
		return { state: {
			...committed,
			bits: action.bits,
			value: mask(committed.value, action.bits),
			stack: committed.stack.map((item) => mask(item, action.bits)),
			overwrite: true
		} };
	}
	if (state.error) return progPress({
		...initialProg(),
		bits: state.bits,
		base: state.base,
		rpn: state.rpn
	}, action);
	switch (action.t) {
		case "digit": return { state: onProgDigit(state, action.d) };
		case "back": return { state: onProgBack(state) };
		case "unary": return { state: onProgUnary(state, action.u) };
		case "bit": return { state: onProgBit(state, action.index) };
		case "enter": return { state: onProgEnter(state) };
		case "op": return onProgOp(state, action.op);
		case "eq": return onProgEq(state);
		default: return { state };
	}
}
function digitAllowed(d, base) {
	const n = "0123456789ABCDEF".indexOf(d.toUpperCase());
	return n >= 0 && n < base;
}
function onProgDigit(s, d) {
	const digit = d.toUpperCase();
	if (!digitAllowed(digit, s.base)) return s;
	if (s.overwrite || s.entry === null) return {
		...s,
		entry: digit,
		overwrite: false,
		typing: true,
		operandReady: true
	};
	if (s.entry.length >= 16) return s;
	if (s.entry === "0") return {
		...s,
		entry: digit,
		typing: true,
		operandReady: true
	};
	return {
		...s,
		entry: s.entry + digit,
		typing: true,
		operandReady: true
	};
}
function onProgBack(s) {
	if (s.entry === null) return s;
	if (s.entry.length <= 1) return {
		...s,
		entry: null,
		overwrite: true,
		typing: false,
		operandReady: false
	};
	return {
		...s,
		entry: s.entry.slice(0, -1)
	};
}
function onProgUnary(s, u) {
	const cur = commitProg(s);
	const bits = cur.bits;
	const m = (1n << BigInt(bits)) - 1n;
	let value = cur.value;
	if (u === "not") value = ~value & m;
	else if (u === "neg") value = mask(-toSigned(value, bits), bits);
	else if (u === "flip8") value = flipBytes(value, bits, 8);
	else value = flipBytes(value, bits, 16);
	return {
		...cur,
		value,
		overwrite: true,
		operandReady: false,
		op: cur.rpn ? null : cur.op
	};
}
function flipBytes(value, bits, group) {
	const groups = bits / group;
	let x = mask(value, bits);
	const maskG = (1n << BigInt(group)) - 1n;
	let out = 0n;
	for (let i = 0; i < groups; i += 1) {
		out = out << BigInt(group) | x & maskG;
		x >>= BigInt(group);
	}
	return out;
}
function onProgBit(s, index) {
	const cur = commitProg(s);
	if (index < 0 || index >= cur.bits) return cur;
	const bit = 1n << BigInt(index);
	return {
		...cur,
		value: cur.value ^ bit,
		overwrite: true
	};
}
function onProgEnter(s) {
	const cur = commitProg(s);
	if (!cur.rpn) return {
		...cur,
		overwrite: true
	};
	return {
		...cur,
		stack: [...cur.stack, cur.value].slice(-8),
		overwrite: true,
		op: null,
		acc: null
	};
}
function onProgOp(s, op) {
	const cur = commitProg(s);
	if (cur.rpn) {
		const y = cur.stack.length ? cur.stack[cur.stack.length - 1] : 0n;
		const stack = cur.stack.slice(0, -1);
		try {
			const value = progBin(op, y, cur.value, cur.bits);
			const expr = `${formatProg(y, cur.base, cur.bits)} ${PROG_SYM[op]} ${formatProg(cur.value, cur.base, cur.bits)}`;
			return {
				state: {
					...cur,
					value,
					stack,
					overwrite: true,
					op: null,
					acc: null
				},
				record: {
					expr,
					result: formatProg(value, cur.base, cur.bits)
				}
			};
		} catch {
			return { state: progError(cur) };
		}
	}
	if (cur.op && cur.acc !== null && cur.operandReady) try {
		const value = progBin(cur.op, cur.acc, cur.value, cur.bits);
		return { state: {
			...cur,
			value,
			acc: value,
			op,
			overwrite: true,
			operandReady: false,
			typing: false
		} };
	} catch {
		return { state: progError(cur) };
	}
	return { state: {
		...cur,
		acc: cur.value,
		op,
		overwrite: true,
		operandReady: false,
		typing: false
	} };
}
function onProgEq(s) {
	const cur = commitProg(s);
	if (cur.rpn) return { state: {
		...cur,
		overwrite: true
	} };
	try {
		if (cur.op && cur.acc !== null) {
			const value = progBin(cur.op, cur.acc, cur.value, cur.bits);
			const expr = `${formatProg(cur.acc, cur.base, cur.bits)} ${PROG_SYM[cur.op]} ${formatProg(cur.value, cur.base, cur.bits)}`;
			return {
				state: {
					...cur,
					value,
					op: null,
					acc: null,
					lastOp: cur.op,
					lastArg: cur.value,
					overwrite: true,
					operandReady: false
				},
				record: {
					expr,
					result: formatProg(value, cur.base, cur.bits)
				}
			};
		}
		if (cur.lastOp && cur.lastArg !== null) {
			const value = progBin(cur.lastOp, cur.value, cur.lastArg, cur.bits);
			const expr = `${formatProg(cur.value, cur.base, cur.bits)} ${PROG_SYM[cur.lastOp]} ${formatProg(cur.lastArg, cur.base, cur.bits)}`;
			return {
				state: {
					...cur,
					value,
					overwrite: true
				},
				record: {
					expr,
					result: formatProg(value, cur.base, cur.bits)
				}
			};
		}
	} catch {
		return { state: progError(cur) };
	}
	return { state: cur };
}
var UNIT_CATEGORIES = [
	{
		id: "length",
		label: "Length",
		units: [
			{
				id: "mm",
				label: "Millimeters",
				toBase: .001
			},
			{
				id: "cm",
				label: "Centimeters",
				toBase: .01
			},
			{
				id: "m",
				label: "Meters",
				toBase: 1
			},
			{
				id: "km",
				label: "Kilometers",
				toBase: 1e3
			},
			{
				id: "in",
				label: "Inches",
				toBase: .0254
			},
			{
				id: "ft",
				label: "Feet",
				toBase: .3048
			},
			{
				id: "yd",
				label: "Yards",
				toBase: .9144
			},
			{
				id: "mi",
				label: "Miles",
				toBase: 1609.344
			}
		]
	},
	{
		id: "mass",
		label: "Mass",
		units: [
			{
				id: "mg",
				label: "Milligrams",
				toBase: 1e-6
			},
			{
				id: "g",
				label: "Grams",
				toBase: .001
			},
			{
				id: "kg",
				label: "Kilograms",
				toBase: 1
			},
			{
				id: "oz",
				label: "Ounces",
				toBase: .028349523125
			},
			{
				id: "lb",
				label: "Pounds",
				toBase: .45359237
			},
			{
				id: "t",
				label: "Tonnes",
				toBase: 1e3
			}
		]
	},
	{
		id: "temperature",
		label: "Temperature",
		units: [
			{
				id: "c",
				label: "Celsius",
				toBase: 1
			},
			{
				id: "f",
				label: "Fahrenheit",
				toBase: 1
			},
			{
				id: "k",
				label: "Kelvin",
				toBase: 1
			}
		]
	},
	{
		id: "area",
		label: "Area",
		units: [
			{
				id: "cm2",
				label: "Square centimeters",
				toBase: 1e-4
			},
			{
				id: "m2",
				label: "Square meters",
				toBase: 1
			},
			{
				id: "ha",
				label: "Hectares",
				toBase: 1e4
			},
			{
				id: "ft2",
				label: "Square feet",
				toBase: .09290304
			},
			{
				id: "ac",
				label: "Acres",
				toBase: 4046.8564224
			}
		]
	},
	{
		id: "volume",
		label: "Volume",
		units: [
			{
				id: "ml",
				label: "Milliliters",
				toBase: .001
			},
			{
				id: "l",
				label: "Liters",
				toBase: 1
			},
			{
				id: "tsp",
				label: "Teaspoons",
				toBase: .00492892159375
			},
			{
				id: "tbsp",
				label: "Tablespoons",
				toBase: .01478676478125
			},
			{
				id: "cup",
				label: "Cups",
				toBase: .2365882365
			},
			{
				id: "gal",
				label: "Gallons",
				toBase: 3.785411784
			}
		]
	},
	{
		id: "speed",
		label: "Speed",
		units: [
			{
				id: "mps",
				label: "Meters per second",
				toBase: 1
			},
			{
				id: "kmh",
				label: "Kilometers per hour",
				toBase: 1 / 3.6
			},
			{
				id: "mph",
				label: "Miles per hour",
				toBase: .44704
			},
			{
				id: "kn",
				label: "Knots",
				toBase: .514444
			}
		]
	},
	{
		id: "time",
		label: "Time",
		units: [
			{
				id: "ms",
				label: "Milliseconds",
				toBase: .001
			},
			{
				id: "s",
				label: "Seconds",
				toBase: 1
			},
			{
				id: "min",
				label: "Minutes",
				toBase: 60
			},
			{
				id: "h",
				label: "Hours",
				toBase: 3600
			},
			{
				id: "d",
				label: "Days",
				toBase: 86400
			}
		]
	},
	{
		id: "data",
		label: "Data",
		units: [
			{
				id: "b",
				label: "Bytes",
				toBase: 1
			},
			{
				id: "kb",
				label: "Kilobytes",
				toBase: 1024
			},
			{
				id: "mb",
				label: "Megabytes",
				toBase: 1024 ** 2
			},
			{
				id: "gb",
				label: "Gigabytes",
				toBase: 1024 ** 3
			},
			{
				id: "tb",
				label: "Terabytes",
				toBase: 1024 ** 4
			}
		]
	}
];
function tempToC(unit, value) {
	if (unit === "f") return (value - 32) * 5 / 9;
	if (unit === "k") return value - 273.15;
	return value;
}
function tempFromC(unit, celsius) {
	if (unit === "f") return celsius * 9 / 5 + 32;
	if (unit === "k") return celsius + 273.15;
	return celsius;
}
function convertUnits(category, fromId, toId, value) {
	const group = UNIT_CATEGORIES.find((item) => item.id === category);
	if (!group) return value;
	if (category === "temperature") return round(tempFromC(toId, tempToC(fromId, value)));
	const from = group.units.find((unit) => unit.id === fromId);
	const to = group.units.find((unit) => unit.id === toId);
	if (!from || !to || to.toBase === 0) return value;
	return round(value * from.toBase / to.toBase);
}
function charReadout(value) {
	const n = Number(mask(value, 21));
	return {
		ascii: n >= 32 && n <= 126 ? String.fromCharCode(n) : "—",
		unicode: n >= 32 && n <= 1114111 && !(n >= 55296 && n <= 57343) ? String.fromCodePoint(n) : "—"
	};
}
var STORE = "calculator-desk-v1";
var MODES = [
	{
		id: "basic",
		label: "Basic"
	},
	{
		id: "scientific",
		label: "Scientific"
	},
	{
		id: "programmer",
		label: "Programmer"
	},
	{
		id: "convert",
		label: "Convert"
	}
];
var SECOND = {
	sin: "asin",
	cos: "acos",
	tan: "atan",
	sinh: "asinh",
	cosh: "acosh",
	tanh: "atanh",
	ln: "exp",
	log: "exp10",
	exp: "ln",
	exp10: "log",
	sq: "sqrt",
	cube: "cbrt",
	sqrt: "sq",
	cbrt: "cube"
};
function KeyButton({ label, tone = "num", wide, pressed, disabled, onClick }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
		type: "button",
		className: clsx("key", tone === "fn" && "key-fn", tone === "op" && "key-op", pressed && "key-on", wide && "key-wide"),
		disabled,
		onClick,
		children: label
	});
}
function lenKind(value) {
	if (value.length > 16) return "long";
	if (value.length > 10) return "mid";
}
function Calculator$1() {
	const [mode, setMode] = (0, import_react.useState)("basic");
	const [basic, setBasic] = (0, import_react.useState)(initialBasic);
	const [sci, setSci] = (0, import_react.useState)(initialSci);
	const [prog, setProg] = (0, import_react.useState)(initialProg);
	const [category, setCategory] = (0, import_react.useState)("length");
	const [fromId, setFromId] = (0, import_react.useState)("m");
	const [toId, setToId] = (0, import_react.useState)("ft");
	const [convEntry, setConvEntry] = (0, import_react.useState)("1");
	const [convTyping, setConvTyping] = (0, import_react.useState)(false);
	const [history, setHistory] = (0, import_react.useState)([]);
	const [historyOpen, setHistoryOpen] = (0, import_react.useState)(false);
	const [menu, setMenu] = (0, import_react.useState)(false);
	const [second, setSecond] = (0, import_react.useState)(false);
	const [hydrated, setHydrated] = (0, import_react.useState)(false);
	const idRef = (0, import_react.useRef)(1);
	const menuRef = (0, import_react.useRef)(null);
	(0, import_react.useEffect)(() => {
		try {
			const raw = localStorage.getItem(STORE);
			if (raw) {
				const data = JSON.parse(raw);
				if (data.mode && MODES.some((item) => item.id === data.mode)) setMode(data.mode);
				if (Array.isArray(data.history)) setHistory(data.history.slice(0, 30));
				if (data.angle === "deg" || data.angle === "rad") setSci((state) => ({
					...state,
					angle: data.angle
				}));
			}
		} catch {}
		setHydrated(true);
	}, []);
	(0, import_react.useEffect)(() => {
		if (!hydrated) return;
		localStorage.setItem(STORE, JSON.stringify({
			mode,
			history,
			angle: sci.angle
		}));
	}, [
		hydrated,
		mode,
		history,
		sci.angle
	]);
	(0, import_react.useEffect)(() => {
		if (!menu) return;
		function onPointer(event) {
			if (!menuRef.current?.contains(event.target)) setMenu(false);
		}
		window.addEventListener("pointerdown", onPointer);
		return () => window.removeEventListener("pointerdown", onPointer);
	}, [menu]);
	function addHistory(record) {
		const id = idRef.current++;
		setHistory((items) => [{
			id,
			...record
		}, ...items].slice(0, 30));
	}
	function currentValue() {
		if (mode === "basic") {
			const n = Number(basic.display);
			return Number.isFinite(n) ? n : 0;
		}
		if (mode === "scientific") {
			const n = Number(sci.entry ?? sci.shown);
			return Number.isFinite(n) ? n : 0;
		}
		if (mode === "programmer") return Number(toSigned(progLive(prog), prog.bits));
		const n = Number(convEntry);
		return Number.isFinite(n) ? n : 0;
	}
	function goMode(next) {
		const value = currentValue();
		if (next === "basic") setBasic({
			...initialBasic(),
			display: canon(value)
		});
		if (next === "scientific") setSci((state) => ({
			...initialSci(),
			angle: state.angle,
			memory: state.memory,
			shown: canon(value),
			evaluated: true
		}));
		if (next === "programmer") {
			const whole = Number.isFinite(value) ? Math.trunc(value) : 0;
			setProg((state) => ({
				...initialProg(),
				bits: state.bits,
				base: state.base,
				rpn: state.rpn,
				value: mask(BigInt(whole), state.bits)
			}));
		}
		if (next === "convert") {
			setConvEntry(canon(value));
			setConvTyping(false);
		}
		setMode(next);
		setMenu(false);
		setSecond(false);
	}
	function pressBasic(key) {
		setBasic((state) => {
			const step = basicPress(state, key);
			if (step.record) addHistory(step.record);
			return step.state;
		});
	}
	function pressSci(action) {
		setSci((state) => {
			const step = sciPress(state, action);
			if (step.record) addHistory(step.record);
			return step.state;
		});
	}
	function pressProg(action) {
		setProg((state) => {
			const step = progPress(state, action);
			if (step.record) addHistory(step.record);
			return step.state;
		});
	}
	function pressConvert(key) {
		if (key === "C") {
			if (convTyping && convEntry !== "0") {
				setConvEntry("0");
				setConvTyping(false);
				return;
			}
			setConvEntry("0");
			setConvTyping(false);
			return;
		}
		if (key === "⌫") {
			setConvEntry((entry) => entry.length <= 1 || entry.startsWith("-") && entry.length <= 2 ? "0" : entry.slice(0, -1));
			return;
		}
		if (key === "±") {
			setConvEntry((entry) => entry.startsWith("-") ? entry.slice(1) || "0" : entry === "0" ? "-0" : `-${entry}`);
			setConvTyping(true);
			return;
		}
		if (key === ".") {
			setConvEntry((entry) => {
				const base = convTyping ? entry : "0";
				return base.includes(".") ? base : `${base}.`;
			});
			setConvTyping(true);
			return;
		}
		if (!/^[0-9]$/.test(key)) return;
		setConvEntry((entry) => {
			const base = convTyping ? entry : "0";
			if (base.replace("-", "").replace(".", "").length >= 12) return base;
			if (base === "0") return key;
			if (base === "-0") return `-${key}`;
			return base + key;
		});
		setConvTyping(true);
	}
	function dispatchDigit(d) {
		if (mode === "basic") pressBasic(d);
		else if (mode === "scientific") pressSci({
			t: "digit",
			d
		});
		else if (mode === "programmer") pressProg({
			t: "digit",
			d
		});
		else pressConvert(d);
	}
	function dispatchClear() {
		if (mode === "basic") pressBasic("C");
		else if (mode === "scientific") pressSci({ t: "clear" });
		else if (mode === "programmer") pressProg({ t: "clear" });
		else pressConvert("C");
	}
	function dispatchOp(op) {
		if (mode === "basic") pressBasic(op);
		else if (mode === "scientific") pressSci({
			t: "op",
			op
		});
		else if (mode === "programmer") pressProg({
			t: "op",
			op
		});
	}
	(0, import_react.useEffect)(() => {
		function onKey(event) {
			const tag = event.target?.tagName;
			if (tag === "INPUT" || tag === "SELECT" || tag === "TEXTAREA") return;
			const key = event.key;
			if (key === "Escape") {
				event.preventDefault();
				if (menu) setMenu(false);
				else dispatchClear();
				return;
			}
			if (/^[0-9]$/.test(key) || mode === "programmer" && /^[a-f]$/i.test(key)) {
				event.preventDefault();
				dispatchDigit(key);
				return;
			}
			if (key === ".") {
				event.preventDefault();
				if (mode === "programmer") return;
				if (mode === "basic") pressBasic(".");
				else if (mode === "scientific") pressSci({ t: "dot" });
				else pressConvert(".");
				return;
			}
			if (key === "Enter" || key === "=") {
				event.preventDefault();
				if (mode === "basic") pressBasic("=");
				else if (mode === "scientific") pressSci({ t: "eq" });
				else if (mode === "programmer") pressProg(prog.rpn ? { t: "enter" } : { t: "eq" });
				return;
			}
			if (key === "Backspace") {
				event.preventDefault();
				if (mode === "basic") pressBasic("⌫");
				else if (mode === "scientific") pressSci({ t: "back" });
				else if (mode === "programmer") pressProg({ t: "back" });
				else pressConvert("⌫");
				return;
			}
			if (key === "%") {
				event.preventDefault();
				if (mode === "basic") pressBasic("%");
				else if (mode === "scientific") pressSci({ t: "pct" });
				return;
			}
			if (key === "(" && mode === "scientific") pressSci({ t: "lp" });
			if (key === ")" && mode === "scientific") pressSci({ t: "rp" });
			const ops = {
				"+": "+",
				"-": "-",
				"*": "*",
				"/": "/",
				x: "*",
				X: "*"
			};
			if (ops[key] && mode !== "convert") {
				event.preventDefault();
				dispatchOp(ops[key]);
			}
		}
		window.addEventListener("keydown", onKey);
		return () => window.removeEventListener("keydown", onKey);
	});
	function recall(value) {
		const numeric = Number(value.replace(/−/g, "-").replace(/,/g, ""));
		if (!Number.isFinite(numeric)) return;
		if (mode === "basic") setBasic({
			...initialBasic(),
			display: canon(numeric)
		});
		else if (mode === "scientific") setSci((state) => ({
			...state,
			tokens: [],
			entry: null,
			shown: canon(numeric),
			evaluated: true,
			error: false
		}));
		else if (mode === "programmer") setProg((state) => ({
			...state,
			value: mask(BigInt(Math.trunc(numeric)), state.bits),
			entry: null,
			overwrite: true,
			error: false
		}));
		else {
			setConvEntry(canon(numeric));
			setConvTyping(false);
		}
	}
	const basicVisible = basic.error ? "Error" : formatDisplay(basic.display);
	const sciRaw = sciVisible(sci);
	const sciShown = sci.error ? "Error" : sci.entry && /e/i.test(sci.entry) ? sci.entry.replace(/-/g, "−") : formatDisplay(sciRaw);
	const progShown = prog.error ? "Error" : prog.entry ? prog.entry.toUpperCase() : formatProg(prog.value, prog.base, prog.bits);
	const convNumber = Number(convEntry.endsWith(".") ? convEntry.slice(0, -1) || "0" : convEntry === "-" || convEntry === "-0" ? "0" : convEntry);
	const convResult = convertUnits(category, fromId, toId, Number.isFinite(convNumber) ? convNumber : 0);
	const group = UNIT_CATEGORIES.find((item) => item.id === category) ?? UNIT_CATEGORIES[0];
	const liveBits = progLive(prog);
	const glyphs = charReadout(liveBits);
	const expr = mode === "scientific" ? formatTokens(sci.tokens) : mode === "programmer" && prog.rpn && prog.stack.length ? `Y ${formatProg(prog.stack[prog.stack.length - 1] ?? 0n, prog.base, prog.bits)}` : "";
	const clearLabel = mode === "basic" ? basicClearLabel(basic) : mode === "scientific" ? sciClearLabel(sci) : mode === "programmer" ? progClearLabel(prog) : convTyping ? "C" : "AC";
	const display = mode === "basic" ? basicVisible : mode === "scientific" ? sciShown : mode === "programmer" ? progShown : formatDisplay(convEntry === "-0" ? "-0" : convEntry);
	function fn(id) {
		const next = second && SECOND[id] ? SECOND[id] : id;
		setSecond(false);
		pressSci({
			t: "fn",
			fn: next
		});
	}
	const sciKeys = [
		[
			{
				label: "(",
				onClick: () => pressSci({ t: "lp" })
			},
			{
				label: ")",
				onClick: () => pressSci({ t: "rp" })
			},
			{
				label: "mc",
				onClick: () => pressSci({
					t: "mem",
					m: "c"
				})
			},
			{
				label: "m+",
				onClick: () => pressSci({
					t: "mem",
					m: "+"
				})
			},
			{
				label: "m−",
				onClick: () => pressSci({
					t: "mem",
					m: "-"
				})
			},
			{
				label: "mr",
				onClick: () => pressSci({
					t: "mem",
					m: "r"
				})
			}
		],
		[
			{
				label: "2nd",
				active: second,
				onClick: () => setSecond((value) => !value)
			},
			{
				label: second ? "√x" : "x²",
				onClick: () => fn("sq")
			},
			{
				label: second ? "∛x" : "x³",
				onClick: () => fn("cube")
			},
			{
				label: "xʸ",
				onClick: () => pressSci({
					t: "op",
					op: "^"
				})
			},
			{
				label: second ? "ln" : "eˣ",
				onClick: () => fn("exp")
			},
			{
				label: second ? "log" : "10ˣ",
				onClick: () => fn("exp10")
			}
		],
		[
			{
				label: "1/x",
				onClick: () => fn("inv")
			},
			{
				label: second ? "x²" : "√x",
				onClick: () => fn("sqrt")
			},
			{
				label: second ? "x³" : "∛x",
				onClick: () => fn("cbrt")
			},
			{
				label: "ʸ√x",
				onClick: () => pressSci({
					t: "op",
					op: "root"
				})
			},
			{
				label: second ? "eˣ" : "ln",
				onClick: () => fn("ln")
			},
			{
				label: second ? "10ˣ" : "log",
				onClick: () => fn("log")
			}
		],
		[
			{
				label: "x!",
				onClick: () => fn("fact")
			},
			{
				label: second ? "sin⁻¹" : "sin",
				onClick: () => fn("sin")
			},
			{
				label: second ? "cos⁻¹" : "cos",
				onClick: () => fn("cos")
			},
			{
				label: second ? "tan⁻¹" : "tan",
				onClick: () => fn("tan")
			},
			{
				label: "e",
				onClick: () => pressSci({
					t: "const",
					v: Math.E
				})
			},
			{
				label: "EE",
				onClick: () => pressSci({ t: "ee" })
			}
		],
		[
			{
				label: sci.angle === "deg" ? "Deg" : "Rad",
				onClick: () => pressSci({ t: "angle" })
			},
			{
				label: second ? "sinh⁻¹" : "sinh",
				onClick: () => fn("sinh")
			},
			{
				label: second ? "cosh⁻¹" : "cosh",
				onClick: () => fn("cosh")
			},
			{
				label: second ? "tanh⁻¹" : "tanh",
				onClick: () => fn("tanh")
			},
			{
				label: "π",
				onClick: () => pressSci({
					t: "const",
					v: Math.PI
				})
			},
			{
				label: "Rand",
				onClick: () => pressSci({
					t: "const",
					v: round(Math.random())
				})
			}
		]
	];
	const progOps = [
		{
			label: "AND",
			onClick: () => pressProg({
				t: "op",
				op: "and"
			})
		},
		{
			label: "OR",
			onClick: () => pressProg({
				t: "op",
				op: "or"
			})
		},
		{
			label: "XOR",
			onClick: () => pressProg({
				t: "op",
				op: "xor"
			})
		},
		{
			label: "NOT",
			onClick: () => pressProg({
				t: "unary",
				u: "not"
			})
		},
		{
			label: "NAND",
			onClick: () => pressProg({
				t: "op",
				op: "nand"
			})
		},
		{
			label: "NOR",
			onClick: () => pressProg({
				t: "op",
				op: "nor"
			})
		},
		{
			label: "<<",
			onClick: () => pressProg({
				t: "op",
				op: "shl"
			})
		},
		{
			label: ">>",
			onClick: () => pressProg({
				t: "op",
				op: "shr"
			})
		},
		{
			label: "ROL",
			onClick: () => pressProg({
				t: "op",
				op: "rol"
			})
		},
		{
			label: "ROR",
			onClick: () => pressProg({
				t: "op",
				op: "ror"
			})
		},
		{
			label: "MOD",
			onClick: () => pressProg({
				t: "op",
				op: "mod"
			})
		},
		{
			label: "FL16",
			onClick: () => pressProg({
				t: "unary",
				u: "flip16"
			})
		},
		..."ABCDEF".split("").map((digit) => ({
			label: digit,
			disabled: prog.base !== 16,
			onClick: () => pressProg({
				t: "digit",
				d: digit
			})
		})),
		{
			label: "FL8",
			onClick: () => pressProg({
				t: "unary",
				u: "flip8"
			})
		},
		{
			label: prog.rpn ? "ENT" : "RPN",
			onClick: () => prog.rpn ? pressProg({ t: "enter" }) : pressProg({ t: "rpn" })
		}
	];
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
		className: clsx("shell", mode !== "basic" && "shell-wide"),
		"aria-label": "Calculator",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "expr",
				"aria-hidden": expr.length === 0,
				children: expr
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "display-row",
				children: [
					mode === "scientific" && sci.memory !== 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "mem-flag",
						children: "M"
					}) : null,
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "display-value",
						"data-len": lenKind(display),
						"data-error": display === "Error",
						"aria-live": "polite",
						children: display
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						type: "button",
						className: "icon-btn",
						"aria-label": "Delete last digit",
						onClick: () => {
							if (mode === "basic") pressBasic("⌫");
							else if (mode === "scientific") pressSci({ t: "back" });
							else if (mode === "programmer") pressProg({ t: "back" });
							else pressConvert("⌫");
						},
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Delete, {
							size: 18,
							strokeWidth: 2,
							"aria-hidden": "true"
						})
					})
				]
			}),
			historyOpen ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "history",
				children: [history.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { children: "No calculations yet" }) : null, history.map((item) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
					type: "button",
					onClick: () => recall(item.result),
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("small", { children: item.expr }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("b", { children: item.result })]
				}, item.id))]
			}) : null,
			mode === "programmer" ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "stack",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "seg",
						role: "group",
						"aria-label": "Word size",
						children: [
							8,
							16,
							32,
							64
						].map((bits) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
							type: "button",
							"aria-pressed": prog.bits === bits,
							onClick: () => pressProg({
								t: "bits",
								bits
							}),
							children: bits
						}, bits))
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "seg",
						role: "group",
						"aria-label": "Base",
						children: [[
							[8, "OCT"],
							[10, "DEC"],
							[16, "HEX"]
						].map(([base, label]) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
							type: "button",
							"aria-pressed": prog.base === base,
							onClick: () => pressProg({
								t: "base",
								base
							}),
							children: label
						}, base)), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
							type: "button",
							"aria-pressed": prog.rpn,
							onClick: () => pressProg({ t: "rpn" }),
							children: "RPN"
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "meta",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { children: ["ASCII ", glyphs.ascii] }),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { children: ["Unicode ", glyphs.unicode] }),
							prog.base !== 10 ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { children: ["DEC ", formatProg(liveBits, 10, prog.bits)] }) : null,
							prog.base !== 16 ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { children: ["HEX ", formatProg(liveBits, 16, prog.bits)] }) : null,
							prog.base !== 8 ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { children: ["OCT ", formatProg(liveBits, 8, prog.bits)] }) : null
						]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "bit-scroll",
						role: "group",
						"aria-label": "Bits, most significant first",
						children: Array.from({ length: prog.bits / 8 }, (_, fromLeft) => {
							const byte = prog.bits / 8 - 1 - fromLeft;
							return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "byte",
								children: Array.from({ length: 8 }, (_, index) => {
									const bit = byte * 8 + (7 - index);
									const on = (liveBits >> BigInt(bit) & 1n) === 1n;
									return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
										type: "button",
										className: "bit",
										"aria-pressed": on,
										"aria-label": `Bit ${bit}`,
										onClick: () => pressProg({
											t: "bit",
											index: bit
										}),
										children: on ? "1" : "0"
									}, bit);
								})
							}, byte);
						})
					})
				]
			}) : null,
			mode === "convert" ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "stack",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "chips",
						role: "group",
						"aria-label": "Unit category",
						children: UNIT_CATEGORIES.map((item) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
							type: "button",
							className: "chip",
							"aria-pressed": item.id === category,
							onClick: () => {
								setCategory(item.id);
								setFromId(item.units[0]?.id ?? "");
								setToId(item.units[1]?.id ?? item.units[0]?.id ?? "");
							},
							children: item.label
						}, item.id))
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "convert-readout",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", { children: formatDisplay(canon(convResult)) }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: group.units.find((unit) => unit.id === toId)?.label })] })
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "unit-row",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
								className: "select-wrap",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "unit-label",
									children: "From"
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("select", {
									"aria-label": "From unit",
									value: fromId,
									onChange: (event) => setFromId(event.target.value),
									children: group.units.map((unit) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
										value: unit.id,
										children: unit.label
									}, unit.id))
								})]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
								type: "button",
								className: "icon-btn",
								"aria-label": "Swap units",
								onClick: () => {
									setFromId(toId);
									setToId(fromId);
								},
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ArrowLeftRight, {
									size: 18,
									"aria-hidden": "true"
								})
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
								className: "select-wrap",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "unit-label",
									children: "To"
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("select", {
									"aria-label": "To unit",
									value: toId,
									onChange: (event) => setToId(event.target.value),
									children: group.units.map((unit) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
										value: unit.id,
										children: unit.label
									}, unit.id))
								})]
							})
						]
					})
				]
			}) : null,
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: clsx(mode === "basic" || mode === "convert" ? "stack" : "split"),
				children: [
					mode === "scientific" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "fn-pad",
						children: sciKeys.flat().map((key, index) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
							type: "button",
							className: clsx("key", "key-fn", key.active && "key-on"),
							onClick: key.onClick,
							children: key.label
						}, index))
					}) : null,
					mode === "programmer" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "ops-pad",
						children: progOps.map((key) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
							type: "button",
							className: "key key-fn",
							disabled: key.disabled,
							onClick: key.onClick,
							children: key.label
						}, key.label))
					}) : null,
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "pad",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(KeyButton, {
								label: clearLabel,
								tone: "fn",
								onClick: dispatchClear
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(KeyButton, {
								label: "±",
								tone: "fn",
								onClick: () => {
									if (mode === "basic") pressBasic("±");
									else if (mode === "scientific") pressSci({ t: "sign" });
									else if (mode === "programmer") pressProg({
										t: "unary",
										u: "neg"
									});
									else pressConvert("±");
								}
							}),
							mode === "programmer" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(KeyButton, {
								label: "⌫",
								tone: "fn",
								onClick: () => pressProg({ t: "back" })
							}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(KeyButton, {
								label: "%",
								tone: "fn",
								disabled: mode === "convert",
								onClick: () => {
									if (mode === "basic") pressBasic("%");
									else if (mode === "scientific") pressSci({ t: "pct" });
								}
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(KeyButton, {
								label: "÷",
								tone: "op",
								disabled: mode === "convert",
								onClick: () => dispatchOp("/")
							}),
							[
								"7",
								"8",
								"9"
							].map((digit) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(KeyButton, {
								label: digit,
								disabled: mode === "programmer" && prog.base === 8 && digit !== "7",
								onClick: () => dispatchDigit(digit)
							}, digit)),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(KeyButton, {
								label: "×",
								tone: "op",
								disabled: mode === "convert",
								onClick: () => dispatchOp("*")
							}),
							[
								"4",
								"5",
								"6"
							].map((digit) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(KeyButton, {
								label: digit,
								onClick: () => dispatchDigit(digit)
							}, digit)),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(KeyButton, {
								label: "−",
								tone: "op",
								disabled: mode === "convert",
								onClick: () => dispatchOp("-")
							}),
							[
								"1",
								"2",
								"3"
							].map((digit) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(KeyButton, {
								label: digit,
								onClick: () => dispatchDigit(digit)
							}, digit)),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(KeyButton, {
								label: "+",
								tone: "op",
								disabled: mode === "convert",
								onClick: () => dispatchOp("+")
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(KeyButton, {
								label: "0",
								wide: true,
								onClick: () => dispatchDigit("0")
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(KeyButton, {
								label: ".",
								disabled: mode === "programmer",
								onClick: () => {
									if (mode === "basic") pressBasic(".");
									else if (mode === "scientific") pressSci({ t: "dot" });
									else pressConvert(".");
								}
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(KeyButton, {
								label: "=",
								tone: "op",
								disabled: mode === "convert",
								onClick: () => {
									if (mode === "basic") pressBasic("=");
									else if (mode === "scientific") pressSci({ t: "eq" });
									else if (mode === "programmer") pressProg(prog.rpn ? { t: "enter" } : { t: "eq" });
								}
							})
						]
					})
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "footer",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "menu-wrap",
						ref: menuRef,
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
							type: "button",
							className: "mode-btn",
							"aria-haspopup": "menu",
							"aria-expanded": menu,
							"aria-label": "Calculator mode",
							onClick: () => setMenu((open) => !open),
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Calculator, {
								size: 18,
								"aria-hidden": "true"
							})
						}), menu ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
							className: "menu",
							role: "menu",
							children: MODES.map((item) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
								type: "button",
								role: "menuitem",
								"aria-current": mode === item.id,
								onClick: () => goMode(item.id),
								children: [item.label, mode === item.id ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Check, {
									size: 16,
									"aria-hidden": "true"
								}) : null]
							}) }, item.id))
						}) : null]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						type: "button",
						className: "icon-btn",
						"aria-pressed": historyOpen,
						"aria-label": "History",
						onClick: () => setHistoryOpen((open) => !open),
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(History, {
							size: 18,
							"aria-hidden": "true"
						})
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "mode-name",
						children: MODES.find((item) => item.id === mode)?.label
					})
				]
			})
		]
	}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
		className: "note",
		children: "Basic runs left to right. Scientific keeps the expression and respects precedence."
	})] });
}
function Home() {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("main", {
		className: "desk",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Calculator$1, {})
	});
}
//#endregion
export { Home as component };
