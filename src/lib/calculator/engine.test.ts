import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  basicPress,
  convertUnits,
  evaluate,
  formatDisplay,
  initialBasic,
  initialProg,
  initialSci,
  progPress,
  sciPress,
  type BasicState,
  type ProgState,
  type SciState,
} from "./engine.ts";

function basic(keys: string): BasicState {
  return [...keys.replace(/\s/g, "")].reduce((state, key) => {
    const token = key === "x" ? "*" : key === ":" ? "/" : key === "p" ? "%" : key === "s" ? "±" : key === "c" ? "C" : key === "e" ? "=" : key;
    return basicPress(state, token).state;
  }, initialBasic());
}

function basicRun(keys: string[]) {
  return keys.reduce((state, key) => basicPress(state, key).state, initialBasic());
}

describe("basic calculator", () => {
  it("adds and repeats equals", () => {
    assert.equal(basicRun(["1", "+", "2", "="]).display, "3");
    assert.equal(basicRun(["1", "*", "2", "=", "="]).display, "4");
    assert.equal(basicRun(["5", "+", "3", "=", "1", "0", "="]).display, "13");
  });

  it("chains immediately, left to right", () => {
    assert.equal(basicRun(["2", "+", "3", "*", "4", "="]).display, "20");
  });

  it("cleans binary floating point", () => {
    assert.equal(basicRun(["0", ".", "1", "+", "0", ".", "2", "="]).display, "0.3");
  });

  it("follows the percent examples", () => {
    const first = basicRun(["1", "0", "0", "+", "1", "5", "%", "="]);
    assert.equal(first.display, "115");
    assert.equal(basicPress(first, "1").state.display, "1");
    const again = ["1", "5", "0", "="].reduce((state, key) => basicPress(state, key).state, first);
    assert.equal(again.display, "172.5");
    assert.equal(basicRun(["2", "0", "0", "*", "1", "0", "%", "="]).display, "20");
    assert.equal(basicRun(["5", "0", "%"]).display, "0.5");
  });

  it("uses C for the entry and AC for the whole sum", () => {
    const typed = basicRun(["1", "2"]);
    assert.equal(basicPress(typed, "C").state.display, "0");
    const pending = basicRun(["8", "+", "2"]);
    const cleared = basicPress(pending, "C").state;
    assert.equal(cleared.display, "0");
    assert.equal(basicPress(cleared, "3").state && basicRun(["8", "+", "3", "="]).display, "11");
  });

  it("divides by zero as an error", () => {
    assert.equal(basic("1:0e").display, "Error");
  });

  it("formats thousands", () => {
    assert.equal(formatDisplay("1234.5"), "1,234.5");
    assert.equal(formatDisplay("-0"), "−0");
  });
});

describe("scientific calculator", () => {
  it("honors precedence and parentheses", () => {
    let s: SciState = initialSci();
    for (const d of "2+3*4") {
      s = sciPress(s, d === "+" ? { t: "op", op: "+" } : d === "*" ? { t: "op", op: "*" } : { t: "digit", d }).state;
    }
    assert.equal(sciPress(s, { t: "eq" }).state.shown, "14");

    s = initialSci();
    const keys: Array<"(" | ")" | "+" | "*" | string> = ["(", "2", "+", "3", ")", "*", "4"];
    for (const key of keys) {
      if (key === "(") s = sciPress(s, { t: "lp" }).state;
      else if (key === ")") s = sciPress(s, { t: "rp" }).state;
      else if (key === "+") s = sciPress(s, { t: "op", op: "+" }).state;
      else if (key === "*") s = sciPress(s, { t: "op", op: "*" }).state;
      else s = sciPress(s, { t: "digit", d: key }).state;
    }
    assert.equal(sciPress(s, { t: "eq" }).state.shown, "20");
  });

  it("evaluates degree sine, factorial, and powers", () => {
    let s = sciPress(initialSci(), { t: "digit", d: "3" }).state;
    s = sciPress(s, { t: "digit", d: "0" }).state;
    s = sciPress(s, { t: "fn", fn: "sin" }).state;
    assert.equal(s.shown, "0.5");
    s = sciPress(initialSci(), { t: "digit", d: "5" }).state;
    assert.equal(sciPress(s, { t: "fn", fn: "fact" }).state.shown, "120");
    s = sciPress(initialSci(), { t: "digit", d: "2" }).state;
    s = sciPress(s, { t: "op", op: "^" }).state;
    s = sciPress(s, { t: "digit", d: "1" }).state;
    s = sciPress(s, { t: "digit", d: "0" }).state;
    assert.equal(sciPress(s, { t: "eq" }).state.shown, "1024");
    assert.equal(evaluate([{ k: "n", v: 8 }, { k: "op", op: "root" }, { k: "n", v: 3 }], "deg"), 2);
  });
});

describe("programmer calculator", () => {
  it("masks, shifts, and byte-swaps", () => {
    let s: ProgState = { ...initialProg(), bits: 32, base: 16 };
    for (const d of "ABCD1234") s = progPress(s, { t: "digit", d }).state;
    s = progPress(s, { t: "unary", u: "flip16" }).state;
    assert.equal(s.value, 0x1234abcdn);

    s = { ...initialProg(), bits: 8, base: 10 };
    for (const d of "255") s = progPress(s, { t: "digit", d }).state;
    s = progPress(s, { t: "op", op: "+" }).state;
    s = progPress(s, { t: "digit", d: "1" }).state;
    assert.equal(progPress(s, { t: "eq" }).state.value, 0n);

    s = initialProg();
    s = progPress(s, { t: "digit", d: "1" }).state;
    s = progPress(s, { t: "op", op: "shl" }).state;
    s = progPress(s, { t: "digit", d: "4" }).state;
    assert.equal(progPress(s, { t: "eq" }).state.value, 16n);
  });

  it("adds in RPN", () => {
    let s = progPress(initialProg(), { t: "rpn" }).state;
    s = progPress(s, { t: "digit", d: "2" }).state;
    s = progPress(s, { t: "enter" }).state;
    s = progPress(s, { t: "digit", d: "3" }).state;
    assert.equal(progPress(s, { t: "op", op: "+" }).state.value, 5n);
  });
});

describe("conversions", () => {
  it("converts length and temperature", () => {
    assert.equal(convertUnits("length", "km", "m", 1.5), 1500);
    assert.equal(convertUnits("temperature", "c", "f", 0), 32);
    assert.equal(convertUnits("temperature", "f", "c", 212), 100);
    assert.equal(convertUnits("data", "kb", "b", 1), 1024);
  });
});
