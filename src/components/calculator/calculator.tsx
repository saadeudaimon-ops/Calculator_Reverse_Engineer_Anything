import { useEffect, useRef, useState } from "react";
import { ArrowLeftRight, Calculator as CalcIcon, Check, Delete, History } from "lucide-react";
import { clsx } from "clsx";
import {
  UNIT_CATEGORIES,
  basicClearLabel,
  basicPress,
  canon,
  charReadout,
  convertUnits,
  formatDisplay,
  formatProg,
  formatTokens,
  initialBasic,
  initialProg,
  initialSci,
  mask,
  progClearLabel,
  progLive,
  progPress,
  progVisible,
  round,
  sciClearLabel,
  sciPress,
  sciVisible,
  toSigned,
  type AngleMode,
  type Base,
  type BasicState,
  type ProgState,
  type Recorded,
  type SciFn,
  type SciOp,
  type SciState,
  type UnitCategory,
  type WordSize,
} from "@/lib/calculator/engine";

type Mode = "basic" | "scientific" | "programmer" | "convert";
type HistoryItem = { id: number; expr: string; result: string };

const STORE = "calculator-desk-v1";
const MODES: { id: Mode; label: string }[] = [
  { id: "basic", label: "Basic" },
  { id: "scientific", label: "Scientific" },
  { id: "programmer", label: "Programmer" },
  { id: "convert", label: "Convert" },
];

const SECOND: Partial<Record<SciFn, SciFn>> = {
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
  cbrt: "cube",
};

function KeyButton({
  label,
  tone = "num",
  wide,
  pressed,
  disabled,
  onClick,
}: {
  label: string;
  tone?: "num" | "fn" | "op";
  wide?: boolean;
  pressed?: boolean;
  disabled?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      className={clsx("key", tone === "fn" && "key-fn", tone === "op" && "key-op", pressed && "key-on", wide && "key-wide")}
      disabled={disabled}
      onClick={onClick}
    >
      {label}
    </button>
  );
}

function lenKind(value: string): "short" | "mid" | "long" | undefined {
  if (value.length > 16) return "long";
  if (value.length > 10) return "mid";
  return undefined;
}

export function Calculator() {
  const [mode, setMode] = useState<Mode>("basic");
  const [basic, setBasic] = useState<BasicState>(initialBasic);
  const [sci, setSci] = useState<SciState>(initialSci);
  const [prog, setProg] = useState<ProgState>(initialProg);
  const [category, setCategory] = useState<UnitCategory>("length");
  const [fromId, setFromId] = useState("m");
  const [toId, setToId] = useState("ft");
  const [convEntry, setConvEntry] = useState("1");
  const [convTyping, setConvTyping] = useState(false);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [menu, setMenu] = useState(false);
  const [second, setSecond] = useState(false);
  const [hydrated, setHydrated] = useState(false);
  const idRef = useRef(1);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORE);
      if (raw) {
        const data = JSON.parse(raw) as {
          mode?: Mode;
          history?: HistoryItem[];
          angle?: AngleMode;
        };
        if (data.mode && MODES.some((item) => item.id === data.mode)) setMode(data.mode);
        if (Array.isArray(data.history)) setHistory(data.history.slice(0, 30));
        if (data.angle === "deg" || data.angle === "rad") {
          setSci((state) => ({ ...state, angle: data.angle as AngleMode }));
        }
      }
    } catch {
      /* keep defaults */
    }
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    localStorage.setItem(STORE, JSON.stringify({ mode, history, angle: sci.angle }));
  }, [hydrated, mode, history, sci.angle]);

  useEffect(() => {
    if (!menu) return;
    function onPointer(event: PointerEvent) {
      if (!menuRef.current?.contains(event.target as Node)) setMenu(false);
    }
    window.addEventListener("pointerdown", onPointer);
    return () => window.removeEventListener("pointerdown", onPointer);
  }, [menu]);

  function addHistory(record: Recorded) {
    const id = idRef.current++;
    setHistory((items) => [{ id, ...record }, ...items].slice(0, 30));
  }

  function currentValue(): number {
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

  function goMode(next: Mode) {
    const value = currentValue();
    if (next === "basic") setBasic({ ...initialBasic(), display: canon(value) });
    if (next === "scientific") {
      setSci((state) => ({
        ...initialSci(),
        angle: state.angle,
        memory: state.memory,
        shown: canon(value),
        evaluated: true,
      }));
    }
    if (next === "programmer") {
      const whole = Number.isFinite(value) ? Math.trunc(value) : 0;
      setProg((state) => ({
        ...initialProg(),
        bits: state.bits,
        base: state.base,
        rpn: state.rpn,
        value: mask(BigInt(whole), state.bits),
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

  function pressBasic(key: string) {
    setBasic((state) => {
      const step = basicPress(state, key);
      if (step.record) addHistory(step.record);
      return step.state;
    });
  }

  function pressSci(action: Parameters<typeof sciPress>[1]) {
    setSci((state) => {
      const step = sciPress(state, action);
      if (step.record) addHistory(step.record);
      return step.state;
    });
  }

  function pressProg(action: Parameters<typeof progPress>[1]) {
    setProg((state) => {
      const step = progPress(state, action);
      if (step.record) addHistory(step.record);
      return step.state;
    });
  }

  function pressConvert(key: string) {
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
      setConvEntry((entry) => (entry.length <= 1 || (entry.startsWith("-") && entry.length <= 2) ? "0" : entry.slice(0, -1)));
      return;
    }
    if (key === "±") {
      setConvEntry((entry) => (entry.startsWith("-") ? entry.slice(1) || "0" : entry === "0" ? "-0" : `-${entry}`));
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

  function dispatchDigit(d: string) {
    if (mode === "basic") pressBasic(d);
    else if (mode === "scientific") pressSci({ t: "digit", d });
    else if (mode === "programmer") pressProg({ t: "digit", d });
    else pressConvert(d);
  }

  function dispatchClear() {
    if (mode === "basic") pressBasic("C");
    else if (mode === "scientific") pressSci({ t: "clear" });
    else if (mode === "programmer") pressProg({ t: "clear" });
    else pressConvert("C");
  }

  function dispatchOp(op: "+" | "-" | "*" | "/") {
    if (mode === "basic") pressBasic(op);
    else if (mode === "scientific") pressSci({ t: "op", op });
    else if (mode === "programmer") pressProg({ t: "op", op });
  }

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      const tag = (event.target as HTMLElement | null)?.tagName;
      if (tag === "INPUT" || tag === "SELECT" || tag === "TEXTAREA") return;
      const key = event.key;
      if (key === "Escape") {
        event.preventDefault();
        if (menu) setMenu(false);
        else dispatchClear();
        return;
      }
      if (/^[0-9]$/.test(key) || (mode === "programmer" && /^[a-f]$/i.test(key))) {
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
      const ops: Record<string, "+" | "-" | "*" | "/"> = { "+": "+", "-": "-", "*": "*", "/": "/", x: "*", X: "*" };
      if (ops[key] && mode !== "convert") {
        event.preventDefault();
        dispatchOp(ops[key]);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  function recall(value: string) {
    const numeric = Number(value.replace(/−/g, "-").replace(/,/g, ""));
    if (!Number.isFinite(numeric)) return;
    if (mode === "basic") setBasic({ ...initialBasic(), display: canon(numeric) });
    else if (mode === "scientific") {
      setSci((state) => ({ ...state, tokens: [], entry: null, shown: canon(numeric), evaluated: true, error: false }));
    } else if (mode === "programmer") {
      setProg((state) => ({ ...state, value: mask(BigInt(Math.trunc(numeric)), state.bits), entry: null, overwrite: true, error: false }));
    } else {
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
  const expr =
    mode === "scientific"
      ? formatTokens(sci.tokens)
      : mode === "programmer" && prog.rpn && prog.stack.length
        ? `Y ${formatProg(prog.stack[prog.stack.length - 1] ?? 0n, prog.base, prog.bits)}`
        : "";

  const clearLabel =
    mode === "basic" ? basicClearLabel(basic) : mode === "scientific" ? sciClearLabel(sci) : mode === "programmer" ? progClearLabel(prog) : convTyping ? "C" : "AC";

  const display =
    mode === "basic" ? basicVisible : mode === "scientific" ? sciShown : mode === "programmer" ? progShown : formatDisplay(convEntry === "-0" ? "-0" : convEntry);

  function fn(id: SciFn) {
    const next = second && SECOND[id] ? SECOND[id] : id;
    setSecond(false);
    pressSci({ t: "fn", fn: next });
  }

  const sciKeys: { label: string; active?: boolean; onClick: () => void }[][] = [
    [
      { label: "(", onClick: () => pressSci({ t: "lp" }) },
      { label: ")", onClick: () => pressSci({ t: "rp" }) },
      { label: "mc", onClick: () => pressSci({ t: "mem", m: "c" }) },
      { label: "m+", onClick: () => pressSci({ t: "mem", m: "+" }) },
      { label: "m−", onClick: () => pressSci({ t: "mem", m: "-" }) },
      { label: "mr", onClick: () => pressSci({ t: "mem", m: "r" }) },
    ],
    [
      { label: "2nd", active: second, onClick: () => setSecond((value) => !value) },
      { label: second ? "√x" : "x²", onClick: () => fn("sq") },
      { label: second ? "∛x" : "x³", onClick: () => fn("cube") },
      { label: "xʸ", onClick: () => pressSci({ t: "op", op: "^" }) },
      { label: second ? "ln" : "eˣ", onClick: () => fn("exp") },
      { label: second ? "log" : "10ˣ", onClick: () => fn("exp10") },
    ],
    [
      { label: "1/x", onClick: () => fn("inv") },
      { label: second ? "x²" : "√x", onClick: () => fn("sqrt") },
      { label: second ? "x³" : "∛x", onClick: () => fn("cbrt") },
      { label: "ʸ√x", onClick: () => pressSci({ t: "op", op: "root" satisfies SciOp }) },
      { label: second ? "eˣ" : "ln", onClick: () => fn("ln") },
      { label: second ? "10ˣ" : "log", onClick: () => fn("log") },
    ],
    [
      { label: "x!", onClick: () => fn("fact") },
      { label: second ? "sin⁻¹" : "sin", onClick: () => fn("sin") },
      { label: second ? "cos⁻¹" : "cos", onClick: () => fn("cos") },
      { label: second ? "tan⁻¹" : "tan", onClick: () => fn("tan") },
      { label: "e", onClick: () => pressSci({ t: "const", v: Math.E }) },
      { label: "EE", onClick: () => pressSci({ t: "ee" }) },
    ],
    [
      { label: sci.angle === "deg" ? "Deg" : "Rad", onClick: () => pressSci({ t: "angle" }) },
      { label: second ? "sinh⁻¹" : "sinh", onClick: () => fn("sinh") },
      { label: second ? "cosh⁻¹" : "cosh", onClick: () => fn("cosh") },
      { label: second ? "tanh⁻¹" : "tanh", onClick: () => fn("tanh") },
      { label: "π", onClick: () => pressSci({ t: "const", v: Math.PI }) },
      { label: "Rand", onClick: () => pressSci({ t: "const", v: round(Math.random()) }) },
    ],
  ];

  const progOps: { label: string; onClick: () => void; disabled?: boolean }[] = [
    { label: "AND", onClick: () => pressProg({ t: "op", op: "and" }) },
    { label: "OR", onClick: () => pressProg({ t: "op", op: "or" }) },
    { label: "XOR", onClick: () => pressProg({ t: "op", op: "xor" }) },
    { label: "NOT", onClick: () => pressProg({ t: "unary", u: "not" }) },
    { label: "NAND", onClick: () => pressProg({ t: "op", op: "nand" }) },
    { label: "NOR", onClick: () => pressProg({ t: "op", op: "nor" }) },
    { label: "<<", onClick: () => pressProg({ t: "op", op: "shl" }) },
    { label: ">>", onClick: () => pressProg({ t: "op", op: "shr" }) },
    { label: "ROL", onClick: () => pressProg({ t: "op", op: "rol" }) },
    { label: "ROR", onClick: () => pressProg({ t: "op", op: "ror" }) },
    { label: "MOD", onClick: () => pressProg({ t: "op", op: "mod" }) },
    { label: "FL16", onClick: () => pressProg({ t: "unary", u: "flip16" }) },
    ..."ABCDEF".split("").map((digit) => ({
      label: digit,
      disabled: prog.base !== 16,
      onClick: () => pressProg({ t: "digit", d: digit }),
    })),
    { label: "FL8", onClick: () => pressProg({ t: "unary", u: "flip8" }) },
    { label: prog.rpn ? "ENT" : "RPN", onClick: () => (prog.rpn ? pressProg({ t: "enter" }) : pressProg({ t: "rpn" })) },
  ];

  return (
    <>
      <section className={clsx("shell", mode !== "basic" && "shell-wide")} aria-label="Calculator">
        <div className="expr" aria-hidden={expr.length === 0}>
          {expr}
        </div>
        <div className="display-row">
          {mode === "scientific" && sci.memory !== 0 ? <span className="mem-flag">M</span> : null}
          <p className="display-value" data-len={lenKind(display)} data-error={display === "Error"} aria-live="polite">
            {display}
          </p>
          <button type="button" className="icon-btn" aria-label="Delete last digit" onClick={() => {
            if (mode === "basic") pressBasic("⌫");
            else if (mode === "scientific") pressSci({ t: "back" });
            else if (mode === "programmer") pressProg({ t: "back" });
            else pressConvert("⌫");
          }}>
            <Delete size={18} strokeWidth={2} aria-hidden="true" />
          </button>
        </div>

        {historyOpen ? (
          <div className="history">
            {history.length === 0 ? <p>No calculations yet</p> : null}
            {history.map((item) => (
              <button key={item.id} type="button" onClick={() => recall(item.result)}>
                <small>{item.expr}</small>
                <b>{item.result}</b>
              </button>
            ))}
          </div>
        ) : null}

        {mode === "programmer" ? (
          <div className="stack">
            <div className="seg" role="group" aria-label="Word size">
              {([8, 16, 32, 64] as WordSize[]).map((bits) => (
                <button key={bits} type="button" aria-pressed={prog.bits === bits} onClick={() => pressProg({ t: "bits", bits })}>
                  {bits}
                </button>
              ))}
            </div>
            <div className="seg" role="group" aria-label="Base">
              {([
                [8, "OCT"],
                [10, "DEC"],
                [16, "HEX"],
              ] as [Base, string][]).map(([base, label]) => (
                <button key={base} type="button" aria-pressed={prog.base === base} onClick={() => pressProg({ t: "base", base })}>
                  {label}
                </button>
              ))}
              <button type="button" aria-pressed={prog.rpn} onClick={() => pressProg({ t: "rpn" })}>
                RPN
              </button>
            </div>
            <div className="meta">
              <span>ASCII {glyphs.ascii}</span>
              <span>Unicode {glyphs.unicode}</span>
              {prog.base !== 10 ? <span>DEC {formatProg(liveBits, 10, prog.bits)}</span> : null}
              {prog.base !== 16 ? <span>HEX {formatProg(liveBits, 16, prog.bits)}</span> : null}
              {prog.base !== 8 ? <span>OCT {formatProg(liveBits, 8, prog.bits)}</span> : null}
            </div>
            <div className="bit-scroll" role="group" aria-label="Bits, most significant first">
              {Array.from({ length: prog.bits / 8 }, (_, fromLeft) => {
                const byte = prog.bits / 8 - 1 - fromLeft;
                return (
                  <div className="byte" key={byte}>
                    {Array.from({ length: 8 }, (_, index) => {
                      const bit = byte * 8 + (7 - index);
                      const on = ((liveBits >> BigInt(bit)) & 1n) === 1n;
                      return (
                        <button key={bit} type="button" className="bit" aria-pressed={on} aria-label={`Bit ${bit}`} onClick={() => pressProg({ t: "bit", index: bit })}>
                          {on ? "1" : "0"}
                        </button>
                      );
                    })}
                  </div>
                );
              })}
            </div>
          </div>
        ) : null}

        {mode === "convert" ? (
          <div className="stack">
            <div className="chips" role="group" aria-label="Unit category">
              {UNIT_CATEGORIES.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  className="chip"
                  aria-pressed={item.id === category}
                  onClick={() => {
                    setCategory(item.id);
                    setFromId(item.units[0]?.id ?? "");
                    setToId(item.units[1]?.id ?? item.units[0]?.id ?? "");
                  }}
                >
                  {item.label}
                </button>
              ))}
            </div>
            <div className="convert-readout">
              <p>
                <strong>{formatDisplay(canon(convResult))}</strong>
                <span>{group.units.find((unit) => unit.id === toId)?.label}</span>
              </p>
            </div>
            <div className="unit-row">
              <label className="select-wrap">
                <span className="unit-label">From</span>
                <select aria-label="From unit" value={fromId} onChange={(event) => setFromId(event.target.value)}>
                  {group.units.map((unit) => (
                    <option key={unit.id} value={unit.id}>
                      {unit.label}
                    </option>
                  ))}
                </select>
              </label>
              <button
                type="button"
                className="icon-btn"
                aria-label="Swap units"
                onClick={() => {
                  setFromId(toId);
                  setToId(fromId);
                }}
              >
                <ArrowLeftRight size={18} aria-hidden="true" />
              </button>
              <label className="select-wrap">
                <span className="unit-label">To</span>
                <select aria-label="To unit" value={toId} onChange={(event) => setToId(event.target.value)}>
                  {group.units.map((unit) => (
                    <option key={unit.id} value={unit.id}>
                      {unit.label}
                    </option>
                  ))}
                </select>
              </label>
            </div>
          </div>
        ) : null}

        <div className={clsx(mode === "basic" || mode === "convert" ? "stack" : "split")}>
          {mode === "scientific" ? (
            <div className="fn-pad">
              {sciKeys.flat().map((key, index) => (
                <button key={index} type="button" className={clsx("key", "key-fn", key.active && "key-on")} onClick={key.onClick}>
                  {key.label}
                </button>
              ))}
            </div>
          ) : null}
          {mode === "programmer" ? (
            <div className="ops-pad">
              {progOps.map((key) => (
                <button key={key.label} type="button" className="key key-fn" disabled={key.disabled} onClick={key.onClick}>
                  {key.label}
                </button>
              ))}
            </div>
          ) : null}
          <div className="pad">
            <KeyButton label={clearLabel} tone="fn" onClick={dispatchClear} />
            <KeyButton
              label="±"
              tone="fn"
              onClick={() => {
                if (mode === "basic") pressBasic("±");
                else if (mode === "scientific") pressSci({ t: "sign" });
                else if (mode === "programmer") pressProg({ t: "unary", u: "neg" });
                else pressConvert("±");
              }}
            />
            {mode === "programmer" ? (
              <KeyButton label="⌫" tone="fn" onClick={() => pressProg({ t: "back" })} />
            ) : (
              <KeyButton
                label="%"
                tone="fn"
                disabled={mode === "convert"}
                onClick={() => {
                  if (mode === "basic") pressBasic("%");
                  else if (mode === "scientific") pressSci({ t: "pct" });
                }}
              />
            )}
            <KeyButton label="÷" tone="op" disabled={mode === "convert"} onClick={() => dispatchOp("/")} />
            {["7", "8", "9"].map((digit) => (
              <KeyButton key={digit} label={digit} disabled={mode === "programmer" && prog.base === 8 && digit !== "7"} onClick={() => dispatchDigit(digit)} />
            ))}
            <KeyButton label="×" tone="op" disabled={mode === "convert"} onClick={() => dispatchOp("*")} />
            {["4", "5", "6"].map((digit) => (
              <KeyButton key={digit} label={digit} onClick={() => dispatchDigit(digit)} />
            ))}
            <KeyButton label="−" tone="op" disabled={mode === "convert"} onClick={() => dispatchOp("-")} />
            {["1", "2", "3"].map((digit) => (
              <KeyButton key={digit} label={digit} onClick={() => dispatchDigit(digit)} />
            ))}
            <KeyButton label="+" tone="op" disabled={mode === "convert"} onClick={() => dispatchOp("+")} />
            <KeyButton label="0" wide onClick={() => dispatchDigit("0")} />
            <KeyButton
              label="."
              disabled={mode === "programmer"}
              onClick={() => {
                if (mode === "basic") pressBasic(".");
                else if (mode === "scientific") pressSci({ t: "dot" });
                else pressConvert(".");
              }}
            />
            <KeyButton
              label="="
              tone="op"
              disabled={mode === "convert"}
              onClick={() => {
                if (mode === "basic") pressBasic("=");
                else if (mode === "scientific") pressSci({ t: "eq" });
                else if (mode === "programmer") pressProg(prog.rpn ? { t: "enter" } : { t: "eq" });
              }}
            />
          </div>
        </div>

        <div className="footer">
          <div className="menu-wrap" ref={menuRef}>
            <button type="button" className="mode-btn" aria-haspopup="menu" aria-expanded={menu} aria-label="Calculator mode" onClick={() => setMenu((open) => !open)}>
              <CalcIcon size={18} aria-hidden="true" />
            </button>
            {menu ? (
              <ul className="menu" role="menu">
                {MODES.map((item) => (
                  <li key={item.id}>
                    <button type="button" role="menuitem" aria-current={mode === item.id} onClick={() => goMode(item.id)}>
                      {item.label}
                      {mode === item.id ? <Check size={16} aria-hidden="true" /> : null}
                    </button>
                  </li>
                ))}
              </ul>
            ) : null}
          </div>
          <button type="button" className="icon-btn" aria-pressed={historyOpen} aria-label="History" onClick={() => setHistoryOpen((open) => !open)}>
            <History size={18} aria-hidden="true" />
          </button>
          <p className="mode-name">{MODES.find((item) => item.id === mode)?.label}</p>
        </div>
      </section>
      <p className="note">Basic runs left to right. Scientific keeps the expression and respects precedence.</p>
    </>
  );
}
