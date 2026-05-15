    const state = {
      operation: "add",
      steps: [],
      visibleSteps: 0,
      revealed: {},
      sourceView: ""
    };

    const fields = {
      leftWhole: document.getElementById("leftWhole"),
      leftNum: document.getElementById("leftNum"),
      leftDen: document.getElementById("leftDen"),
      rightWhole: document.getElementById("rightWhole"),
      rightNum: document.getElementById("rightNum"),
      rightDen: document.getElementById("rightDen"),
      showReduction: document.getElementById("showReduction"),
      showMixed: document.getElementById("showMixed"),
      hideAnswers: document.getElementById("fractionHideAnswers"),
      randomLevel: document.getElementById("fractionRandomLevel")
    };

    const elements = {
      equation: document.getElementById("equation"),
      steps: document.getElementById("steps"),
      stepMeter: document.getElementById("stepMeter"),
      stepMeterBottom: document.getElementById("stepMeterBottom"),
      prevStep: document.getElementById("prevStep"),
      nextStep: document.getElementById("nextStep"),
      showAll: document.getElementById("showAll"),
      prevStepBottom: document.getElementById("prevStepBottom"),
      nextStepBottom: document.getElementById("nextStepBottom"),
      showAllBottom: document.getElementById("showAllBottom"),
      leftReadable: document.getElementById("leftReadable"),
      rightReadable: document.getElementById("rightReadable"),
      operationMenu: document.getElementById("fractionOperationMenu"),
      operationTrigger: document.getElementById("fractionOperationTrigger"),
      operationCurrentSymbol: document.getElementById("operationCurrentSymbol"),
      operationReadable: document.getElementById("operationReadable"),
      operationButtons: document.querySelectorAll("#fractionOperationMenu [data-operation]"),
      randomize: document.getElementById("randomFractionBtn")
    };

    const operationMeta = {
      add: { symbol: "+", text: "сложение", action: "сложить" },
      subtract: { symbol: "-", text: "вычитание", action: "вычесть" },
      multiply: { symbol: "×", text: "умножение", action: "умножить" },
      divide: { symbol: "÷", text: "деление", action: "разделить" }
    };

    function gcd(a, b) {
      let x = Math.abs(a);
      let y = Math.abs(b);
      while (y !== 0) {
        const temp = y;
        y = x % y;
        x = temp;
      }
      return x || 1;
    }

    function lcm(a, b) {
      return Math.abs(a * b) / gcd(a, b);
    }

    function normalize(frac) {
      if (frac.den < 0) {
        return { num: -frac.num, den: -frac.den };
      }
      return frac;
    }

    function reduce(frac) {
      const normalized = normalize(frac);
      const divisor = gcd(normalized.num, normalized.den);
      return {
        num: normalized.num / divisor,
        den: normalized.den / divisor,
        divisor
      };
    }

    function asInteger(value, fallback = 0) {
      if (value === "" || value === null || value === undefined) {
        return fallback;
      }
      const parsed = Number(value);
      if (!Number.isFinite(parsed)) {
        return fallback;
      }
      return Math.trunc(parsed);
    }

    function parseFraction(prefix) {
      const whole = asInteger(fields[`${prefix}Whole`].value, 0);
      const numerator = asInteger(fields[`${prefix}Num`].value, 0);
      const denominator = asInteger(fields[`${prefix}Den`].value, 1);
      if (denominator === 0) {
        throw new Error("Знаменатель не может быть равен нулю.");
      }
      const absWhole = Math.abs(whole);
      const sign = whole < 0 || numerator < 0 || denominator < 0 ? -1 : 1;
      const absNumerator = Math.abs(numerator);
      const absDenominator = Math.abs(denominator);
      const improper = sign * (absWhole * absDenominator + absNumerator);
      return normalize({
        whole,
        inputNumerator: numerator,
        inputDenominator: denominator,
        num: improper,
        den: absDenominator
      });
    }

    function htmlFraction(num, den) {
      const normalized = normalize({ num, den });
      const sign = normalized.num < 0 ? "-" : "";
      return `<span class="math-mixed">${sign}<span class="math-fraction"><span>${Math.abs(normalized.num)}</span><span class="bar"></span><span>${normalized.den}</span></span></span>`;
    }

    function htmlMixed(frac) {
      const reduced = reduce(frac);
      const sign = reduced.num < 0 ? "-" : "";
      const absNum = Math.abs(reduced.num);
      if (reduced.den === 1) {
        return `${reduced.num}`;
      }
      if (absNum < reduced.den) {
        return htmlFraction(reduced.num, reduced.den);
      }
      const whole = Math.trunc(absNum / reduced.den);
      const remainder = absNum % reduced.den;
      if (remainder === 0) {
        return `${sign}${whole}`;
      }
      return `<span class="math-mixed">${sign}${whole}${htmlFraction(remainder, reduced.den)}</span>`;
    }

    function plainFraction(frac, mixed = false) {
      const normalized = normalize(frac);
      if (mixed) {
        const reduced = reduce(normalized);
        const sign = reduced.num < 0 ? "-" : "";
        const absNum = Math.abs(reduced.num);
        if (reduced.den === 1) {
          return String(reduced.num);
        }
        if (absNum < reduced.den) {
          return `${reduced.num}/${reduced.den}`;
        }
        const whole = Math.trunc(absNum / reduced.den);
        const remainder = absNum % reduced.den;
        return remainder === 0 ? `${sign}${whole}` : `${sign}${whole} ${remainder}/${reduced.den}`;
      }
      return `${normalized.num}/${normalized.den}`;
    }

    function expression(parts) {
      return `<div class="compact-expression">${parts.join(" ")}</div>`;
    }

    function equationValue(content, tone = "ink") {
      return `<span class="equation-value equation-value--${tone}">${escapeTextMarkup(content)}</span>`;
    }

    function equationSymbol(symbol, variant = "main") {
      return `<span class="equation-symbol equation-symbol--${variant}">${escapeTextMarkup(symbol)}</span>`;
    }

    function equationBadge(text, position = "top") {
      return `<span class="equation-frac-note equation-frac-note--${position}">${escapeTextMarkup(text)}</span>`;
    }

    function equationFraction(numeratorHtml, denominatorHtml, options = {}) {
      const sign = options.sign ? `<span class="equation-sign">${escapeTextMarkup(options.sign)}</span>` : "";
      const numNote = options.numNote ? equationBadge(options.numNote, "top") : "";
      const denNote = options.denNote ? equationBadge(options.denNote, "bottom") : "";
      return `
        <span class="equation-fraction-wrap">
          ${sign}
          <span class="equation-fraction">
            <span class="equation-frac-top">${numeratorHtml}${numNote}</span>
            <span class="equation-frac-line"></span>
            <span class="equation-frac-bottom">${denominatorHtml}${denNote}</span>
          </span>
        </span>
      `;
    }

    function equationImproperFraction(frac, options = {}) {
      const normalized = normalize(frac);
      return equationFraction(
        equationValue(Math.abs(normalized.num), options.numTone || "ink"),
        equationValue(normalized.den, options.denTone || "ink"),
        {
          sign: normalized.num < 0 ? "-" : "",
          numNote: options.numNote,
          denNote: options.denNote
        }
      );
    }

    function equationInputFraction(input, options = {}) {
      const sign = input.num < 0 ? "-" : "";
      const whole = Math.abs(input.whole);
      const numerator = Math.abs(input.inputNumerator);
      const denominator = Math.abs(input.inputDenominator);
      const wholeTone = options.wholeTone || "accent";
      const numTone = options.numTone || "ink";
      const denTone = options.denTone || "ink";

      if (whole !== 0 && numerator !== 0) {
        return `
          <span class="equation-mixed-number">
            ${sign ? `<span class="equation-sign">${escapeTextMarkup(sign)}</span>` : ""}
            ${equationValue(whole, wholeTone)}
            ${equationFraction(
              equationValue(numerator, numTone),
              equationValue(denominator, denTone)
            )}
          </span>
        `;
      }

      if (whole !== 0) {
        return `
          <span class="equation-mixed-number">
            ${sign ? `<span class="equation-sign">${escapeTextMarkup(sign)}</span>` : ""}
            ${equationValue(whole, wholeTone)}
          </span>
        `;
      }

      return equationFraction(
        equationValue(numerator, numTone),
        equationValue(denominator, denTone),
        { sign }
      );
    }

    function equationMixedResult(frac, options = {}) {
      const reduced = reduce(frac);
      const sign = reduced.num < 0 ? "-" : "";
      const absNum = Math.abs(reduced.num);
      const wholeTone = options.wholeTone || "accent";
      const numTone = options.numTone || "success";
      const denTone = options.denTone || "danger";

      if (reduced.den === 1) {
        return `
          <span class="equation-mixed-number">
            ${sign ? `<span class="equation-sign">${escapeTextMarkup(sign)}</span>` : ""}
            ${equationValue(absNum, wholeTone)}
          </span>
        `;
      }

      if (absNum < reduced.den) {
        return equationImproperFraction(reduced, { numTone, denTone });
      }

      const whole = Math.trunc(absNum / reduced.den);
      const remainder = absNum % reduced.den;
      if (remainder === 0) {
        return `
          <span class="equation-mixed-number">
            ${sign ? `<span class="equation-sign">${escapeTextMarkup(sign)}</span>` : ""}
            ${equationValue(whole, wholeTone)}
          </span>
        `;
      }

      return `
        <span class="equation-mixed-number">
          ${sign ? `<span class="equation-sign">${escapeTextMarkup(sign)}</span>` : ""}
          ${equationValue(whole, wholeTone)}
          ${equationFraction(
            equationValue(remainder, numTone),
            equationValue(reduced.den, denTone)
          )}
        </span>
      `;
    }

    function equationFormulaFromMixed(input) {
      return equationFraction(
        [
          equationValue(Math.abs(input.whole), "accent"),
          equationSymbol("×", "minor"),
          equationValue(Math.abs(input.inputDenominator), "danger"),
          equationSymbol("+", "minor"),
          equationValue(Math.abs(input.inputNumerator), "ink")
        ].join(""),
        equationValue(Math.abs(input.inputDenominator), "danger"),
        { sign: input.num < 0 ? "-" : "" }
      );
    }

    function equationScaledFraction(frac, factor, options = {}) {
      return equationFraction(
        [
          equationValue(Math.abs(frac.num), options.baseNumTone || "ink"),
          equationSymbol("×", "minor"),
          equationValue(factor, "accent")
        ].join(""),
        [
          equationValue(frac.den, options.baseDenTone || "danger"),
          equationSymbol("×", "minor"),
          equationValue(factor, "accent")
        ].join(""),
        {
          sign: frac.num < 0 ? "-" : "",
          numNote: options.numNote,
          denNote: options.denNote
        }
      );
    }

    function equationCombinedNumerators(leftNum, rightNum, den, symbol) {
      return equationFraction(
        [
          equationValue(leftNum, "success"),
          equationSymbol(symbol, "minor"),
          equationValue(rightNum, "success")
        ].join(""),
        equationValue(den, "danger")
      );
    }

    function equationProductFraction(left, right) {
      const sign = left.num * right.num < 0 ? "-" : "";
      return equationFraction(
        [
          equationValue(Math.abs(left.num), "success"),
          equationSymbol("×", "minor"),
          equationValue(Math.abs(right.num), "success")
        ].join(""),
        [
          equationValue(left.den, "danger"),
          equationSymbol("×", "minor"),
          equationValue(right.den, "danger")
        ].join(""),
        { sign }
      );
    }

    function equationShowcase(parts) {
      return `<div class="equation-showcase"><div class="equation-flow">${parts.join("")}</div></div>`;
    }

    function equationOperationView(leftMarkup, symbol, rightMarkup, resultMarkup = "") {
      const parts = [leftMarkup, equationSymbol(symbol, "main"), rightMarkup];
      if (resultMarkup) {
        parts.push(equationSymbol("=", "main"), resultMarkup);
      }
      return equationShowcase(parts);
    }

    function primeFactors(value) {
      let rest = Math.abs(value);
      if (rest < 2) {
        return [rest];
      }

      const factors = [];
      let divisor = 2;
      while (divisor * divisor <= rest) {
        while (rest % divisor === 0) {
          factors.push(divisor);
          rest /= divisor;
        }
        divisor = divisor === 2 ? 3 : divisor + 2;
      }

      if (rest > 1) {
        factors.push(rest);
      }
      return factors;
    }

    function factorText(value) {
      const factors = primeFactors(value);
      return factors.join(" × ");
    }

    function buildCommonDenominatorMath(leftDen, rightDen, commonDen) {
      return `
        <div class="denominator-analysis">
          <div class="denominator-analysis-row">
            <span class="denominator-analysis-label">${leftDen}</span>
            <span class="denominator-analysis-equals">=</span>
            <span class="denominator-analysis-value">${escapeTextMarkup(factorText(leftDen))}</span>
          </div>
          <div class="denominator-analysis-row">
            <span class="denominator-analysis-label">${rightDen}</span>
            <span class="denominator-analysis-equals">=</span>
            <span class="denominator-analysis-value">${escapeTextMarkup(factorText(rightDen))}</span>
          </div>
          <div class="denominator-analysis-row denominator-analysis-row--result">
            <span class="denominator-analysis-label">НОК(${leftDen}, ${rightDen})</span>
            <span class="denominator-analysis-equals">=</span>
            <span class="denominator-analysis-value">${commonDen}</span>
          </div>
          <p class="denominator-analysis-note">
            Берем все множители из обоих разложений так, чтобы число делилось и на ${leftDen}, и на ${rightDen}. Поэтому общий знаменатель здесь равен ${commonDen}.
          </p>
        </div>
      `;
    }

    function escapeAttribute(value) {
      return String(value)
        .replaceAll("&", "&amp;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#39;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;");
    }

    function buildSpoilerMarkup(key, content, label, variant = "block", isHiddenByDefault = false, revealed = {}) {
      const wrapperTag = variant === "inline" ? "span" : "div";
      const bodyTag = variant === "inline" ? "span" : "div";
      if (!isHiddenByDefault) {
        return content;
      }
      if (revealed[key]) {
        return `<${wrapperTag} class="spoiler spoiler--${variant}"><${bodyTag} class="spoiler-body">${content}</${bodyTag}></${wrapperTag}>`;
      }
      return `
        <${wrapperTag} class="spoiler spoiler--${variant}">
          <button class="spoiler-mask" type="button" data-spoiler-button="true" data-spoiler-key="${escapeAttribute(key)}" aria-label="${escapeAttribute(label)}">
            <span class="spoiler-mask-text">${escapeTextMarkup(label)}</span>
          </button>
        </${wrapperTag}>
      `;
    }

    function makeStep(title, explain, math, headline = math, currentView = headline) {
      return { title, explain, math, headline, currentView };
    }

    function getConversionStep(label, input, currentView) {
      const absWhole = Math.abs(input.whole);
      const absNum = Math.abs(input.inputNumerator);
      const absDen = Math.abs(input.inputDenominator);
      if (input.whole === 0) {
        return makeStep(
          `${label}: дробь уже обыкновенная`,
          "Целой части нет, поэтому можно сразу работать с числителем и знаменателем.",
          expression([htmlFraction(input.num, input.den)]),
          equationShowcase([
            equationInputFraction(input, { numTone: "success", denTone: "danger" })
          ]),
          currentView
        );
      }
      const signText = input.num < 0 ? "С учетом минуса: " : "";
      return makeStep(
        `${label}: переводим смешанное число`,
        "Целую часть умножаем на знаменатель и прибавляем числитель. Так смешанное число становится неправильной дробью.",
        expression([
          `${signText}(${absWhole} × ${absDen} + ${absNum}) / ${absDen}`,
          "=",
          htmlFraction(input.num, input.den)
        ]),
        equationShowcase([
          equationInputFraction(input, { wholeTone: "accent", numTone: "ink", denTone: "danger" }),
          equationSymbol("=", "main"),
          equationFormulaFromMixed(input),
          equationSymbol("=", "main"),
          equationImproperFraction(input, { numTone: "success", denTone: "danger" })
        ]),
        currentView
      );
    }

    function buildCommonDenominatorStep(label, frac, factor, commonDen, currentView) {
      const adjustedNum = frac.num * factor;
      const adjustedFraction = normalize({ num: adjustedNum, den: commonDen });
      const stepTitle = factor === 1
        ? `${label}: знаменатель уже ${commonDen}`
        : `${label}: приводим к знаменателю ${commonDen}`;
      const explain = factor === 1
        ? `У дроби ${plainFraction(frac)} знаменатель уже равен ${commonDen}, поэтому домножаем числитель и знаменатель на 1. Значение дроби не меняется.`
        : `У дроби ${plainFraction(frac)} знаменатель ${frac.den}. Чтобы получить ${commonDen}, домножаем числитель и знаменатель на ${factor}.`;

      return makeStep(
        stepTitle,
        explain,
        expression([
          htmlFraction(frac.num, frac.den),
          "=",
          `(${frac.num} × ${factor}) / (${frac.den} × ${factor})`,
          "=",
          htmlFraction(adjustedNum, commonDen)
        ]),
        equationShowcase([
          equationImproperFraction(frac, { numTone: "ink", denTone: "danger" }),
          equationSymbol("=", "main"),
          equationScaledFraction(frac, factor, { baseNumTone: "ink", baseDenTone: "danger" }),
          equationSymbol("=", "main"),
          equationImproperFraction(adjustedFraction, { numTone: "success", denTone: "danger" })
        ]),
        currentView
      );
    }

    function buildAddSubtractSteps(left, right, operation) {
      const symbol = operationMeta[operation].symbol;
      const leftInputView = equationInputFraction(left, { wholeTone: "accent", numTone: "ink", denTone: "danger" });
      const rightInputView = equationInputFraction(right, { wholeTone: "accent", numTone: "ink", denTone: "danger" });
      const leftImproperView = equationImproperFraction(left, { numTone: "success", denTone: "danger" });
      const rightImproperView = equationImproperFraction(right, { numTone: "success", denTone: "danger" });
      const steps = [
        getConversionStep(
          "Первая дробь",
          left,
          equationOperationView(leftImproperView, symbol, rightInputView)
        ),
        getConversionStep(
          "Вторая дробь",
          right,
          equationOperationView(leftImproperView, symbol, rightImproperView)
        )
      ];
      const commonDen = lcm(left.den, right.den);
      const leftFactor = commonDen / left.den;
      const rightFactor = commonDen / right.den;
      const leftNum = left.num * leftFactor;
      const rightNum = right.num * rightFactor;
      const leftAdjusted = normalize({ num: leftNum, den: commonDen });
      const rightAdjusted = normalize({ num: rightNum, den: commonDen });
      const isSameDen = left.den === right.den;

      if (isSameDen) {
        steps.push(makeStep(
          "Знаменатели уже одинаковые",
          `У первой дроби знаменатель ${left.den}, у второй дроби тоже ${right.den}. Приводить ничего не нужно.`,
          expression([htmlFraction(left.num, left.den), operationMeta[operation].symbol, htmlFraction(right.num, right.den)]),
          equationShowcase([
            equationImproperFraction(left, { numTone: "success", denTone: "danger" }),
            equationSymbol(operationMeta[operation].symbol, "main"),
            equationImproperFraction(right, { numTone: "success", denTone: "danger" })
          ]),
          equationOperationView(leftImproperView, symbol, rightImproperView)
        ));
      } else {
        steps.push(makeStep(
          "Ищем общий знаменатель",
          `Для сложения и вычитания нужен общий знаменатель. Берем НОК знаменателей ${left.den} и ${right.den}. Это наименьшее число, которое делится на оба знаменателя, значит обе дроби можно привести именно к нему.`,
          buildCommonDenominatorMath(left.den, right.den, commonDen),
          equationShowcase([
            equationValue(`НОК(${left.den}, ${right.den})`, "ink"),
            equationSymbol("=", "main"),
            equationValue(commonDen, "accent")
          ]),
          equationOperationView(leftImproperView, symbol, rightImproperView)
        ));
        steps.push(buildCommonDenominatorStep(
          "Первая дробь",
          left,
          leftFactor,
          commonDen,
          equationOperationView(
            equationImproperFraction(leftAdjusted, { numTone: "success", denTone: "danger" }),
            symbol,
            rightImproperView
          )
        ));
        steps.push(buildCommonDenominatorStep(
          "Вторая дробь",
          right,
          rightFactor,
          commonDen,
          equationOperationView(
            equationImproperFraction(leftAdjusted, { numTone: "success", denTone: "danger" }),
            symbol,
            equationImproperFraction(rightAdjusted, { numTone: "success", denTone: "danger" })
          )
        ));
      }

      const resultNum = operation === "add" ? leftNum + rightNum : leftNum - rightNum;
      const rawResult = normalize({ num: resultNum, den: commonDen });
      const opText = operation === "add" ? "складываем" : "вычитаем";

      steps.push(makeStep(
        `${operation === "add" ? "Складываем" : "Вычитаем"} числители`,
        `Когда знаменатели одинаковые, ${opText} числители, а знаменатель оставляем без изменения.`,
        expression([
          htmlFraction(leftNum, commonDen),
          `<span class="math-op">${operationMeta[operation].symbol}</span>`,
          htmlFraction(rightNum, commonDen),
          "=",
          htmlFraction(rawResult.num, rawResult.den)
        ]),
        equationShowcase([
          equationImproperFraction({ num: leftNum, den: commonDen }, { numTone: "success", denTone: "danger" }),
          equationSymbol(operationMeta[operation].symbol, "main"),
          equationImproperFraction({ num: rightNum, den: commonDen }, { numTone: "success", denTone: "danger" }),
          equationSymbol("=", "main"),
          equationCombinedNumerators(leftNum, rightNum, commonDen, operationMeta[operation].symbol),
          equationSymbol("=", "main"),
          equationImproperFraction(rawResult, { numTone: "success", denTone: "danger" })
        ]),
        equationOperationView(
          equationImproperFraction(leftAdjusted, { numTone: "success", denTone: "danger" }),
          symbol,
          equationImproperFraction(rightAdjusted, { numTone: "success", denTone: "danger" }),
          equationImproperFraction(rawResult, { numTone: "success", denTone: "danger" })
        )
      ));

      appendFinishSteps(steps, rawResult);
      return steps;
    }

    function crossCancel(left, right) {
      let a = Math.abs(left.num);
      let b = left.den;
      let c = Math.abs(right.num);
      let d = right.den;
      const sign = Math.sign(left.num || 1) * Math.sign(right.num || 1);

      const first = gcd(a, d);
      if (first > 1) {
        a /= first;
        d /= first;
      }

      const second = gcd(c, b);
      if (second > 1) {
        c /= second;
        b /= second;
      }

      return {
        left: { num: sign < 0 ? -a : a, den: b },
        right: { num: c, den: d },
        first,
        second,
        factors: [first, second].filter((item) => item > 1)
      };
    }

    function buildMultiplySteps(left, right, options = {}) {
      const leftInputView = equationInputFraction(left, { wholeTone: "accent", numTone: "ink", denTone: "danger" });
      const rightInputView = equationInputFraction(right, { wholeTone: "accent", numTone: "ink", denTone: "danger" });
      const leftImproperView = equationImproperFraction(left, { numTone: "success", denTone: "danger" });
      const rightImproperView = equationImproperFraction(right, { numTone: "success", denTone: "danger" });
      const steps = [
        getConversionStep(
          "Первая дробь",
          left,
          equationOperationView(leftImproperView, "×", rightInputView)
        ),
        getConversionStep(
          "Вторая дробь",
          right,
          equationOperationView(leftImproperView, "×", rightImproperView)
        )
      ];
      const useCancel = options.showReduction !== false;
      const canceled = crossCancel(left, right);
      const hasCancellation = useCancel && canceled.factors.length > 0;
      const multLeft = hasCancellation ? canceled.left : left;
      const multRight = hasCancellation ? canceled.right : right;
      const multLeftView = equationImproperFraction(multLeft, { numTone: "success", denTone: "danger" });
      const multRightView = equationImproperFraction(multRight, { numTone: "success", denTone: "danger" });

      if (hasCancellation) {
        steps.push(makeStep(
          "Сокращаем крест-накрест",
          `Перед умножением можно сократить числитель одной дроби со знаменателем другой. Здесь использованы общие делители: ${canceled.factors.join(", ")}.`,
          expression([
            htmlFraction(left.num, left.den),
            "×",
            htmlFraction(right.num, right.den),
            "=",
            htmlFraction(multLeft.num, multLeft.den),
            "×",
            htmlFraction(multRight.num, multRight.den)
          ]),
          equationShowcase([
            equationImproperFraction(left, { numTone: "ink", denTone: "danger" }),
            equationSymbol("×", "main"),
            equationImproperFraction(right, { numTone: "ink", denTone: "danger" }),
            equationSymbol("=", "main"),
            equationImproperFraction(multLeft, {
              numTone: "success",
              denTone: "danger",
              numNote: canceled.first > 1 ? `÷${canceled.first}` : "",
              denNote: canceled.second > 1 ? `÷${canceled.second}` : ""
            }),
            equationSymbol("×", "main"),
            equationImproperFraction(multRight, {
              numTone: "success",
              denTone: "danger",
              numNote: canceled.second > 1 ? `÷${canceled.second}` : "",
              denNote: canceled.first > 1 ? `÷${canceled.first}` : ""
            })
          ]),
          equationOperationView(multLeftView, "×", multRightView)
        ));
      } else {
        steps.push(makeStep(
          "Проверяем возможность сокращения",
          "Подходящих общих делителей для сокращения крест-накрест нет, поэтому умножаем дроби как есть.",
          expression([htmlFraction(left.num, left.den), "×", htmlFraction(right.num, right.den)]),
          equationShowcase([
            equationImproperFraction(left, { numTone: "success", denTone: "danger" }),
            equationSymbol("×", "main"),
            equationImproperFraction(right, { numTone: "success", denTone: "danger" })
          ]),
          equationOperationView(leftImproperView, "×", rightImproperView)
        ));
      }

      const rawResult = normalize({
        num: multLeft.num * multRight.num,
        den: multLeft.den * multRight.den
      });

      steps.push(makeStep(
        "Умножаем числители и знаменатели",
        "Числитель умножаем на числитель, знаменатель на знаменатель.",
        expression([
          htmlFraction(multLeft.num, multLeft.den),
          "×",
          htmlFraction(multRight.num, multRight.den),
          "=",
          htmlFraction(rawResult.num, rawResult.den)
        ]),
        equationShowcase([
          equationImproperFraction(multLeft, { numTone: "success", denTone: "danger" }),
          equationSymbol("×", "main"),
          equationImproperFraction(multRight, { numTone: "success", denTone: "danger" }),
          equationSymbol("=", "main"),
          equationProductFraction(multLeft, multRight),
          equationSymbol("=", "main"),
          equationImproperFraction(rawResult, { numTone: "success", denTone: "danger" })
        ]),
        equationOperationView(
          multLeftView,
          "×",
          multRightView,
          equationImproperFraction(rawResult, { numTone: "success", denTone: "danger" })
        )
      ));

      appendFinishSteps(steps, rawResult);
      return steps;
    }

    function buildDivideSteps(left, right) {
      if (right.num === 0) {
        throw new Error("На ноль делить нельзя: вторая дробь равна нулю.");
      }
      const leftInputView = equationInputFraction(left, { wholeTone: "accent", numTone: "ink", denTone: "danger" });
      const rightInputView = equationInputFraction(right, { wholeTone: "accent", numTone: "ink", denTone: "danger" });
      const leftImproperView = equationImproperFraction(left, { numTone: "success", denTone: "danger" });
      const rightImproperView = equationImproperFraction(right, { numTone: "success", denTone: "danger" });
      const steps = [
        getConversionStep(
          "Первая дробь",
          left,
          equationOperationView(leftImproperView, "÷", rightInputView)
        ),
        getConversionStep(
          "Вторая дробь",
          right,
          equationOperationView(leftImproperView, "÷", rightImproperView)
        )
      ];
      const reciprocal = normalize({ num: right.den, den: right.num });
      const reciprocalView = equationImproperFraction(reciprocal, { numTone: "success", denTone: "danger" });

      steps.push(makeStep(
        "Заменяем деление умножением",
        "Чтобы разделить на дробь, умножаем на обратную дробь: числитель и знаменатель второй дроби меняются местами.",
        expression([
          htmlFraction(left.num, left.den),
          "÷",
          htmlFraction(right.num, right.den),
          "=",
          htmlFraction(left.num, left.den),
          "×",
          htmlFraction(reciprocal.num, reciprocal.den)
        ]),
        equationShowcase([
          equationImproperFraction(left, { numTone: "ink", denTone: "danger" }),
          equationSymbol("÷", "main"),
          equationImproperFraction(right, { numTone: "ink", denTone: "danger" }),
          equationSymbol("=", "main"),
          equationImproperFraction(left, { numTone: "ink", denTone: "danger" }),
          equationSymbol("×", "main"),
          equationImproperFraction(reciprocal, { numTone: "success", denTone: "danger" })
        ]),
        equationOperationView(leftImproperView, "×", reciprocalView)
      ));

      const multiplySteps = buildMultiplySteps(left, reciprocal, {
        showReduction: fields.showReduction.checked
      }).slice(2);
      steps.push(...multiplySteps);
      return steps;
    }

    function appendFinishSteps(steps, rawResult) {
      const reduced = reduce(rawResult);
      const canReduce = reduced.divisor > 1;
      const showReduction = fields.showReduction.checked;
      if (showReduction && canReduce) {
        steps.push(makeStep(
          "Сокращаем результат",
          `Числитель и знаменатель делятся на ${reduced.divisor}, поэтому дробь можно упростить.`,
        expression([
          htmlFraction(rawResult.num, rawResult.den),
          "=",
          htmlFraction(reduced.num, reduced.den)
        ]),
        equationShowcase([
          equationImproperFraction(rawResult, { numTone: "ink", denTone: "danger" }),
          equationSymbol("=", "main"),
          equationImproperFraction(reduced, {
            numTone: "success",
            denTone: "danger",
            numNote: `÷${reduced.divisor}`,
            denNote: `÷${reduced.divisor}`
          })
        ]),
        equationShowcase([
          equationImproperFraction(rawResult, { numTone: "ink", denTone: "danger" }),
          equationSymbol("=", "main"),
          equationImproperFraction(reduced, { numTone: "success", denTone: "danger" })
        ])
      ));
    } else if (showReduction) {
      steps.push(makeStep(
        "Проверяем сокращение",
        "У числителя и знаменателя нет общего делителя больше 1, дробь уже несократимая.",
        expression([htmlFraction(reduced.num, reduced.den)]),
        equationShowcase([
          equationImproperFraction(reduced, { numTone: "success", denTone: "danger" })
        ]),
        equationShowcase([
          equationImproperFraction(reduced, { numTone: "success", denTone: "danger" })
        ])
      ));
    }

      if (fields.showMixed.checked && Math.abs(reduced.num) >= reduced.den && reduced.den !== 1) {
        const sign = reduced.num < 0 ? "-" : "";
        const absNum = Math.abs(reduced.num);
        const whole = Math.trunc(absNum / reduced.den);
        const remainder = absNum % reduced.den;
        steps.push(makeStep(
          "Выделяем целую часть",
          "Делим числитель на знаменатель: частное становится целой частью, остаток остается числителем.",
        expression([
          htmlFraction(reduced.num, reduced.den),
          "=",
          remainder === 0 ? `${sign}${whole}` : `${sign}${whole} ${htmlFraction(remainder, reduced.den)}`
        ]),
        equationShowcase([
          equationImproperFraction(reduced, { numTone: "success", denTone: "danger" }),
          equationSymbol("=", "main"),
          equationMixedResult(reduced, { wholeTone: "accent", numTone: "success", denTone: "danger" })
        ]),
        equationShowcase([
          equationImproperFraction(reduced, { numTone: "success", denTone: "danger" }),
          equationSymbol("=", "main"),
          equationMixedResult(reduced, { wholeTone: "accent", numTone: "success", denTone: "danger" })
        ])
      ));
    }

      const finalResult = reduce(rawResult);
      const finalHeadline = fields.showMixed.checked
        ? equationMixedResult(finalResult, { wholeTone: "accent", numTone: "success", denTone: "danger" })
        : equationImproperFraction(finalResult, { numTone: "success", denTone: "danger" });
      steps.push(makeStep(
        "Ответ",
        "Финальный результат записан в удобном виде.",
        expression([fields.showMixed.checked ? htmlMixed(finalResult) : htmlFraction(finalResult.num, finalResult.den)]),
        equationShowcase([finalHeadline])
      ));
    }

    function solve() {
      const left = parseFraction("left");
      const right = parseFraction("right");
      const operation = state.operation;
      if (operation === "add" || operation === "subtract") {
        return { left, right, steps: buildAddSubtractSteps(left, right, operation) };
      }
      if (operation === "multiply") {
        return {
          left,
          right,
          steps: buildMultiplySteps(left, right, { showReduction: fields.showReduction.checked })
        };
      }
      return { left, right, steps: buildDivideSteps(left, right) };
    }

    function renderEquation() {
      if (state.steps.length === 0 || state.visibleSteps === 0) {
        elements.equation.innerHTML = `<div class="empty-state compact-empty-state"><p>Текущий вид примера появится после решения.</p></div>`;
        return;
      }

      const stepIndex = Math.min(state.visibleSteps, state.steps.length) - 1;
      const step = state.steps[stepIndex];
      const headline = step.headline || step.math;
      const currentView = step.currentView || headline;
      const detailMarkup = buildSpoilerMarkup(
        `fraction-step-${stepIndex}`,
        headline,
        step.title === "Ответ"
          ? "Нажмите, чтобы открыть подробную запись ответа"
          : "Нажмите, чтобы открыть подробную запись шага",
        "equation",
        fields.hideAnswers.checked,
        state.revealed
      );

      elements.equation.innerHTML = `
        <div class="equation-dashboard">
          <div class="equation-summary-grid">
            <section class="equation-summary-card">
              <span class="equation-summary-label">Исходный пример</span>
              <div class="equation-summary-value">${state.sourceView}</div>
            </section>
            <section class="equation-summary-card equation-summary-card--current">
              <span class="equation-summary-label">Текущий вид</span>
              <div class="equation-summary-value">${currentView}</div>
            </section>
          </div>
          <div class="equation-step-preview">
            <span class="equation-summary-label">Подробно для этого шага</span>
            ${detailMarkup}
          </div>
        </div>
      `;
    }

    function renderSteps() {
      if (state.steps.length === 0) {
        renderEquation();
        elements.steps.innerHTML = `<div class="empty-state"><p>Введите две дроби и нажмите «Решить пример».</p></div>`;
        elements.stepMeter.textContent = "Шаги появятся после решения";
        elements.stepMeterBottom.textContent = "Шаги появятся после решения";
        elements.prevStep.disabled = true;
        elements.nextStep.disabled = true;
        elements.showAll.disabled = true;
        elements.prevStepBottom.disabled = true;
        elements.nextStepBottom.disabled = true;
        elements.showAllBottom.disabled = true;
        return;
      }

      const visible = state.steps.slice(0, state.visibleSteps);
      renderEquation();
      elements.steps.innerHTML = visible.map((step, index) => `
        <article class="step-card">
          <div class="step-index">${index + 1}</div>
          <div class="step-content">
            <h3 class="step-title">${step.title}</h3>
            <p class="step-explain">${step.explain}</p>
            ${buildSpoilerMarkup(
              `fraction-step-${index}`,
              `<div class="step-math">${step.math}</div>`,
              step.title === "Ответ" ? "Нажмите, чтобы открыть ответ" : "Нажмите, чтобы открыть вычисления",
              "block",
              fields.hideAnswers.checked,
              state.revealed
            )}
          </div>
        </article>
      `).join("");

      elements.stepMeter.textContent = `Показано ${state.visibleSteps} из ${state.steps.length}`;
      elements.stepMeterBottom.textContent = `Показано ${state.visibleSteps} из ${state.steps.length}`;
      const prevDisabled = state.visibleSteps <= 1;
      const nextDisabled = state.visibleSteps >= state.steps.length;
      elements.prevStep.disabled = prevDisabled;
      elements.nextStep.disabled = nextDisabled;
      elements.showAll.disabled = nextDisabled;
      elements.prevStepBottom.disabled = prevDisabled;
      elements.nextStepBottom.disabled = nextDisabled;
      elements.showAllBottom.disabled = nextDisabled;
    }

    function renderError(message) {
      state.steps = [];
      state.visibleSteps = 0;
      state.revealed = {};
      state.sourceView = "";
      renderEquation();
      elements.steps.innerHTML = `<p class="error">${message}</p>`;
      elements.stepMeter.textContent = "Исправьте данные в примере";
      elements.stepMeterBottom.textContent = "Исправьте данные в примере";
      elements.prevStep.disabled = true;
      elements.nextStep.disabled = true;
      elements.showAll.disabled = true;
      elements.prevStepBottom.disabled = true;
      elements.nextStepBottom.disabled = true;
      elements.showAllBottom.disabled = true;
    }

    function handleSolve(event) {
      event.preventDefault();
      try {
        const result = solve();
        state.steps = result.steps;
        state.visibleSteps = Math.min(1, state.steps.length);
        state.revealed = {};
        state.sourceView = equationOperationView(
          equationInputFraction(result.left, { wholeTone: "accent", numTone: "ink", denTone: "danger" }),
          operationMeta[state.operation].symbol,
          equationInputFraction(result.right, { wholeTone: "accent", numTone: "ink", denTone: "danger" })
        );
        renderSteps();
      } catch (error) {
        renderError(error.message);
      }
    }

    function setOperation(operation) {
      state.operation = operation;
      elements.operationButtons.forEach((button) => {
        button.classList.toggle("active", button.dataset.operation === operation);
      });
      elements.operationCurrentSymbol.textContent = operationMeta[operation].symbol;
      elements.operationReadable.textContent = operationMeta[operation].text;
      elements.operationTrigger.setAttribute("aria-label", `Выбрано действие: ${operationMeta[operation].text}`);
      elements.operationMenu.classList.remove("is-open");
      elements.operationTrigger.setAttribute("aria-expanded", "false");
    }

    function updatePreview(prefix) {
      try {
        const frac = parseFraction(prefix);
        const readableTarget = prefix === "left" ? elements.leftReadable : elements.rightReadable;
        const reduced = reduce(frac);
        readableTarget.textContent = plainFraction(reduced, true);
      } catch (error) {
        const readableTarget = prefix === "left" ? elements.leftReadable : elements.rightReadable;
        readableTarget.textContent = "ошибка";
      }
    }

    function randomInt(min, max) {
      return Math.floor(Math.random() * (max - min + 1)) + min;
    }

    function pickRandom(items) {
      return items[randomInt(0, items.length - 1)];
    }

    function getRandomFractionConfig(level) {
      const numericLevel = asInteger(level, 1);
      if (numericLevel === 2) {
        return {
          maxValue: 50,
          mixed: false,
          addBases: [12, 15, 18, 20, 24, 30, 36, 40, 45, 48],
          reductionMax: 9,
          wholeMax: 0
        };
      }
      if (numericLevel === 3) {
        return {
          maxValue: 100,
          mixed: true,
          addBases: [18, 20, 24, 30, 36, 40, 48, 60, 72, 84, 90],
          reductionMax: 12,
          wholeMax: 7
        };
      }
      return {
        maxValue: 10,
        mixed: false,
        addBases: [2, 3, 4, 5, 6, 8, 10],
        reductionMax: 5,
        wholeMax: 0
      };
    }

    function getDivisors(base, maxValue) {
      const divisors = [];
      for (let value = 2; value <= Math.min(base, maxValue); value += 1) {
        if (base % value === 0) {
          divisors.push(value);
        }
      }
      return divisors.length > 0 ? divisors : [base];
    }

    function buildGeneratedFraction(config, numerator, denominator, whole = 0) {
      return {
        whole: config.mixed ? whole : 0,
        num: numerator,
        den: denominator
      };
    }

    function compareGeneratedFractions(left, right) {
      const leftImproper = left.whole * left.den + left.num;
      const rightImproper = right.whole * right.den + right.num;
      return leftImproper * right.den - rightImproper * left.den;
    }

    function withRandomWhole(config, fraction) {
      if (!config.mixed) {
        return buildGeneratedFraction(config, fraction.num, fraction.den, 0);
      }
      const wholeShift = Math.trunc(fraction.num / fraction.den);
      const remainder = fraction.num % fraction.den;
      return buildGeneratedFraction(
        config,
        remainder,
        fraction.den,
        randomInt(1, config.wholeMax) + wholeShift
      );
    }

    function generateAddSubtractPair(level, operation) {
      const config = getRandomFractionConfig(level);
      const commonBase = pickRandom(config.addBases);
      const divisors = getDivisors(commonBase, config.maxValue);
      let left = null;
      let right = null;

      for (let attempt = 0; attempt < 80; attempt += 1) {
        const leftDen = pickRandom(divisors);
        const rightDen = Math.random() < 0.45 ? leftDen : pickRandom(divisors);
        const leftNum = randomInt(1, Math.max(1, leftDen - 1));
        const rightNum = randomInt(1, Math.max(1, rightDen - 1));
        left = withRandomWhole(config, { num: leftNum, den: leftDen });
        right = withRandomWhole(config, { num: rightNum, den: rightDen });
        if (operation === "subtract") {
          if (compareGeneratedFractions(left, right) === 0) {
            continue;
          }
          if (compareGeneratedFractions(left, right) < 0) {
            [left, right] = [right, left];
          }
        }
        break;
      }

      return { left, right };
    }

    function generateCrossFriendlyPair(level, operation) {
      const config = getRandomFractionConfig(level);
      const factorLimit = config.reductionMax;

      for (let attempt = 0; attempt < 120; attempt += 1) {
        const factorA = randomInt(2, factorLimit);
        const factorB = randomInt(2, factorLimit);
        const leftBaseNum = randomInt(1, Math.max(1, Math.floor(config.maxValue / factorA)));
        const rightBaseDen = randomInt(2, Math.max(2, Math.floor(config.maxValue / factorA)));
        const leftBaseDen = randomInt(2, Math.max(2, Math.floor(config.maxValue / factorB)));
        const rightBaseNum = randomInt(1, Math.max(1, Math.floor(config.maxValue / factorB)));

        const leftFraction = {
          num: leftBaseNum * factorA,
          den: leftBaseDen * factorB
        };
        const rightFraction = operation === "divide"
          ? {
              num: rightBaseNum * factorA,
              den: rightBaseDen * factorB
            }
          : {
              num: rightBaseNum * factorB,
              den: rightBaseDen * factorA
            };

        if (
          leftFraction.num > config.maxValue ||
          leftFraction.den > config.maxValue ||
          rightFraction.num > config.maxValue ||
          rightFraction.den > config.maxValue
        ) {
          continue;
        }

        if (
          !config.mixed &&
          (leftFraction.num >= leftFraction.den || rightFraction.num >= rightFraction.den)
        ) {
          continue;
        }

        if (rightFraction.num === 0 || rightFraction.den === 0) {
          continue;
        }

        return {
          left: withRandomWhole(config, leftFraction),
          right: withRandomWhole(config, rightFraction)
        };
      }

      return generateAddSubtractPair(level, "add");
    }

    function applyGeneratedFraction(prefix, fraction) {
      fields[`${prefix}Whole`].value = String(fraction.whole);
      fields[`${prefix}Num`].value = String(fraction.num);
      fields[`${prefix}Den`].value = String(fraction.den);
    }

    function generateRandomFractions() {
      const level = fields.randomLevel.value;
      const pair = state.operation === "add" || state.operation === "subtract"
        ? generateAddSubtractPair(level, state.operation)
        : generateCrossFriendlyPair(level, state.operation);

      applyGeneratedFraction("left", pair.left);
      applyGeneratedFraction("right", pair.right);
      updateAllPreviews();
      handleSolve(new Event("submit"));
    }

    function swapFractions() {
      const leftValues = [fields.leftWhole.value, fields.leftNum.value, fields.leftDen.value];
      fields.leftWhole.value = fields.rightWhole.value;
      fields.leftNum.value = fields.rightNum.value;
      fields.leftDen.value = fields.rightDen.value;
      fields.rightWhole.value = leftValues[0];
      fields.rightNum.value = leftValues[1];
      fields.rightDen.value = leftValues[2];
      updateAllPreviews();
    }

    function updateAllPreviews() {
      updatePreview("left");
      updatePreview("right");
    }

    document.getElementById("fractionForm").addEventListener("submit", handleSolve);
    document.getElementById("swapBtn").addEventListener("click", swapFractions);
    elements.randomize.addEventListener("click", generateRandomFractions);

    elements.operationButtons.forEach((button) => {
      button.addEventListener("click", () => setOperation(button.dataset.operation));
    });

    elements.operationTrigger.addEventListener("click", () => {
      const isOpen = elements.operationMenu.classList.toggle("is-open");
      elements.operationTrigger.setAttribute("aria-expanded", isOpen ? "true" : "false");
    });

    elements.operationMenu.addEventListener("mouseenter", () => {
      elements.operationTrigger.setAttribute("aria-expanded", "true");
    });

    elements.operationMenu.addEventListener("mouseleave", () => {
      elements.operationMenu.classList.remove("is-open");
      elements.operationTrigger.setAttribute("aria-expanded", "false");
    });

    elements.operationMenu.addEventListener("keydown", (event) => {
      if (event.key === "Escape") {
        elements.operationMenu.classList.remove("is-open");
        elements.operationTrigger.setAttribute("aria-expanded", "false");
        elements.operationTrigger.focus();
      }
    });

    document.addEventListener("click", (event) => {
      if (!elements.operationMenu.contains(event.target)) {
        elements.operationMenu.classList.remove("is-open");
        elements.operationTrigger.setAttribute("aria-expanded", "false");
      }
    });

    Object.values(fields).forEach((field) => {
      field.addEventListener("input", updateAllPreviews);
      field.addEventListener("change", updateAllPreviews);
    });

    elements.prevStep.addEventListener("click", () => {
      state.visibleSteps = Math.max(1, state.visibleSteps - 1);
      renderSteps();
    });

    elements.prevStepBottom.addEventListener("click", () => {
      state.visibleSteps = Math.max(1, state.visibleSteps - 1);
      renderSteps();
    });

    elements.nextStep.addEventListener("click", () => {
      state.visibleSteps = Math.min(state.steps.length, state.visibleSteps + 1);
      renderSteps();
    });

    elements.nextStepBottom.addEventListener("click", () => {
      state.visibleSteps = Math.min(state.steps.length, state.visibleSteps + 1);
      renderSteps();
    });

    elements.showAll.addEventListener("click", () => {
      state.visibleSteps = state.steps.length;
      renderSteps();
    });

    elements.showAllBottom.addEventListener("click", () => {
      state.visibleSteps = state.steps.length;
      renderSteps();
    });

    function handleFractionSpoilerClick(event) {
      const button = event.target.closest("[data-spoiler-button]");
      if (!button) {
        return;
      }
      state.revealed[button.dataset.spoilerKey] = true;
      renderSteps();
    }

    elements.steps.addEventListener("click", handleFractionSpoilerClick);
    elements.equation.addEventListener("click", handleFractionSpoilerClick);

    fields.hideAnswers.addEventListener("change", () => {
      renderSteps();
    });

    setOperation(state.operation);
    updateAllPreviews();
    handleSolve(new Event("submit"));

    const divisionState = {
      operation: "divide",
      steps: [],
      visibleSteps: 0,
      equation: "",
      quotient: "0",
      remainder: "0",
      revealed: {}
    };

    const divisionElements = {
      form: document.getElementById("longDivisionForm"),
      builderNote: document.getElementById("columnBuilderNote"),
      operationReadable: document.getElementById("columnOperationReadable"),
      operationButtons: document.querySelectorAll("[data-column-operation]"),
      leftLabel: document.getElementById("columnLeftLabel"),
      rightLabel: document.getElementById("columnRightLabel"),
      dividend: document.getElementById("divisionDividend"),
      divisor: document.getElementById("divisionDivisor"),
      options: document.getElementById("divisionOptions"),
      hideAnswers: document.getElementById("columnHideAnswers"),
      continueDecimals: document.getElementById("divisionContinueDecimals"),
      precision: document.getElementById("divisionPrecision"),
      primaryLabel: document.getElementById("divisionPrimaryLabel"),
      quotientPreview: document.getElementById("divisionQuotientPreview"),
      secondaryRow: document.getElementById("divisionSecondaryRow"),
      secondaryLabel: document.getElementById("divisionSecondaryLabel"),
      remainderPreview: document.getElementById("divisionRemainderPreview"),
      summaryCard: document.getElementById("divisionSummaryCard"),
      solveLabel: document.getElementById("columnSolveLabel"),
      resultTitle: document.getElementById("columnResultTitle"),
      resultNote: document.getElementById("columnResultNote"),
      noteTitle1: document.getElementById("columnNoteTitle1"),
      noteText1: document.getElementById("columnNoteText1"),
      noteTitle2: document.getElementById("columnNoteTitle2"),
      noteText2: document.getElementById("columnNoteText2"),
      noteTitle3: document.getElementById("columnNoteTitle3"),
      noteText3: document.getElementById("columnNoteText3"),
      equation: document.getElementById("divisionEquation"),
      board: document.getElementById("divisionBoard"),
      steps: document.getElementById("divisionSteps"),
      stepMeter: document.getElementById("divisionStepMeter"),
      stepMeterBottom: document.getElementById("divisionStepMeterBottom"),
      prevStep: document.getElementById("divisionPrevStep"),
      nextStep: document.getElementById("divisionNextStep"),
      showAll: document.getElementById("divisionShowAll"),
      prevStepBottom: document.getElementById("divisionPrevStepBottom"),
      nextStepBottom: document.getElementById("divisionNextStepBottom"),
      showAllBottom: document.getElementById("divisionShowAllBottom")
    };

    const columnOperationMeta = {
      add: {
        symbol: "+",
        readable: "сложение",
        leftLabel: "Первое число",
        rightLabel: "Второе число",
        builderNote: "Только целые неотрицательные числа. Складываем по разрядам справа налево и при необходимости переносим десяток влево.",
        solveLabel: "Разобрать сложение",
        resultTitle: "Пошаговое сложение",
        resultNote: "Показывайте каждый разряд: сумму цифр, перенос и запись новой цифры результата.",
        primaryLabel: "Сумма",
        showSecondary: false,
        notes: [
          ["Начинаем справа", "Сначала складываем единицы, затем десятки, сотни и остальные старшие разряды."],
          ["Перенос", "Если сумма в разряде 10 или больше, записываем последнюю цифру, а десяток переносим левее."],
          ["Ответ", "После старшего разряда дописываем оставшийся перенос, если он есть."]
        ]
      },
      subtract: {
        symbol: "-",
        readable: "вычитание",
        leftLabel: "Уменьшаемое",
        rightLabel: "Вычитаемое",
        builderNote: "Только целые неотрицательные числа. В этой версии уменьшаемое должно быть не меньше вычитаемого.",
        solveLabel: "Разобрать вычитание",
        resultTitle: "Пошаговое вычитание",
        resultNote: "Показывайте разряды справа налево: когда хватает цифры и когда нужно занимать единицу у старшего разряда.",
        primaryLabel: "Разность",
        showSecondary: false,
        notes: [
          ["Начинаем справа", "Вычитаем по разрядам, начиная с единиц и двигаясь влево."],
          ["Заем", "Если верхняя цифра меньше нижней, занимаем единицу из следующего старшего разряда."],
          ["Цепочка нулей", "Если слева идут нули, заем передается дальше, а промежуточные нули превращаются в 9."]
        ]
      },
      multiply: {
        symbol: "×",
        readable: "умножение",
        leftLabel: "Первый множитель",
        rightLabel: "Второй множитель",
        builderNote: "Только целые неотрицательные числа. Для каждой цифры второго множителя строим отдельную строку частичного произведения.",
        solveLabel: "Разобрать умножение",
        resultTitle: "Пошаговое умножение",
        resultNote: "Показывайте частичные произведения по строкам, а затем итоговую сумму всех строк.",
        primaryLabel: "Произведение",
        showSecondary: false,
        notes: [
          ["Частичные произведения", "Каждую цифру второго множителя умножаем на первый множитель и записываем отдельной строкой."],
          ["Сдвиг строки", "Для десятков, сотен и других старших разрядов новая строка сдвигается влево."],
          ["Итог", "Если строк несколько, складываем их и получаем окончательное произведение."]
        ]
      },
      divide: {
        symbol: ":",
        readable: "деление",
        leftLabel: "Делимое",
        rightLabel: "Делитель",
        builderNote: "Только целые неотрицательные числа. Можно остановиться на остатке или продолжить деление после запятой.",
        solveLabel: "Разобрать деление",
        resultTitle: "Пошаговое деление",
        resultNote: "Показывайте каждый этап: неполное делимое, цифру частного, вычитание и снос следующей цифры.",
        primaryLabel: "Частное",
        secondaryLabel: "Остаток",
        showSecondary: true,
        notes: [
          ["Неполное делимое", "Берите слева минимальное число, которое уже можно делить на делитель."],
          ["Цифра частного", "На каждом шаге подбираем максимальную цифру, чтобы произведение не превысило текущий фрагмент."],
          ["Остаток или десятичная дробь", "Если число не делится нацело, можно остановиться на остатке или дописать нули после запятой."]
        ]
      }
    };

    function escapeTextMarkup(value) {
      return String(value)
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;");
    }

    function parseWholeNumberText(value, label) {
      const cleaned = String(value).replace(/\s+/g, "");
      if (!/^\d+$/.test(cleaned)) {
        throw new Error(`${label}: используйте только цифры без знака и дробной части.`);
      }
      return cleaned.replace(/^0+(?=\d)/, "") || "0";
    }

    function rankNameFromRight(position) {
      const rankNames = [
        "единиц",
        "десятков",
        "сотен",
        "тысяч",
        "десятков тысяч",
        "сотен тысяч",
        "миллионов",
        "десятков миллионов",
        "сотен миллионов",
        "миллиардов"
      ];
      return rankNames[position] || `разряда ${position + 1}`;
    }

    function makeDivisionStep(title, explain, math, board) {
      return { title, explain, math, board };
    }

    function divisionMathBlock(lines) {
      return `<div class="division-math">${lines.map((line) => `<div>${escapeTextMarkup(line)}</div>`).join("")}</div>`;
    }

    function createDivisionBoardRow(value, endPos, kind) {
      return {
        value: String(value || "0"),
        endPos,
        kind
      };
    }

    function buildDivisionBoardText(displayDividend, divisorText, quotientText, rows) {
      const safeDividend = String(displayDividend || "0");
      const safeQuotient = String(quotientText || "0");
      const totalColumns = Math.max(
        safeDividend.length,
        ...rows.map((row) => row.endPos + 1)
      );
      const rowsMarkup = rows.map((row) => {
        const start = Math.max(row.endPos - row.value.length + 1, 0);
        return `<div class="division-russian-row division-russian-row--${row.kind}" style="margin-left:${start}ch">${escapeTextMarkup(row.value)}</div>`;
      }).join("");

      return `
        <div class="division-russian-board" style="--division-columns:${totalColumns};">
          <div class="division-russian-caption">Делимое</div>
          <div class="division-russian-grid">
            <div class="division-russian-left">${rowsMarkup}</div>
            <div class="division-russian-divider" aria-hidden="true"></div>
            <div class="division-russian-right">
              <div class="division-russian-side">
                <span class="division-russian-number">${escapeTextMarkup(divisorText)}</span>
                <span class="division-russian-label">Делитель</span>
              </div>
              <div class="division-russian-side">
                <span class="division-russian-number">${escapeTextMarkup(safeQuotient)}</span>
                <span class="division-russian-label">Частное</span>
              </div>
            </div>
          </div>
        </div>
      `;
    }

    function buildColumnArithmeticBoard({ width, carryRow = "", topRow, bottomRow, interimRows = [], finalRow = null, showSecondaryLine = false }) {
      const normalize = (text) => String(text || "").padStart(width, " ");
      const row = (text, kind = "") => `
        <div class="column-arithmetic-row${kind ? ` column-arithmetic-row--${kind}` : ""}">${escapeTextMarkup(normalize(text))}</div>
      `;

      return `
        <div class="column-arithmetic-board">
          ${carryRow && carryRow.trim() ? row(carryRow, "carry") : ""}
          ${row(topRow, "operand")}
          ${row(bottomRow, "operand")}
          <div class="column-arithmetic-line"></div>
          ${interimRows.map((item) => row(item.text, item.kind || "partial")).join("")}
          ${finalRow && showSecondaryLine ? '<div class="column-arithmetic-line column-arithmetic-line--secondary"></div>' : ""}
          ${finalRow ? row(finalRow.text, finalRow.kind || "result") : ""}
        </div>
      `;
    }

    function emptyColumnMessages() {
      const meta = columnOperationMeta[divisionState.operation];
      return {
        board: divisionState.operation === "divide"
          ? "Введите делимое и делитель, чтобы показать деление в столбик."
          : `Введите два числа, чтобы показать ${meta.readable} столбиком.`,
        steps: `Введите числа и нажмите «${meta.solveLabel}».`
      };
    }

    function updateColumnOperationUi() {
      const meta = columnOperationMeta[divisionState.operation];
      divisionElements.operationReadable.textContent = meta.readable;
      divisionElements.leftLabel.textContent = meta.leftLabel;
      divisionElements.rightLabel.textContent = meta.rightLabel;
      divisionElements.dividend.setAttribute("aria-label", meta.leftLabel);
      divisionElements.divisor.setAttribute("aria-label", meta.rightLabel);
      divisionElements.builderNote.textContent = meta.builderNote;
      divisionElements.solveLabel.textContent = meta.solveLabel;
      divisionElements.resultTitle.textContent = meta.resultTitle;
      divisionElements.resultNote.textContent = meta.resultNote;
      divisionElements.primaryLabel.textContent = meta.primaryLabel;
      divisionElements.secondaryLabel.textContent = meta.secondaryLabel || "Остаток";
      divisionElements.secondaryRow.hidden = !meta.showSecondary;
      divisionElements.options.hidden = divisionState.operation !== "divide";
      [
        [divisionElements.noteTitle1, divisionElements.noteText1],
        [divisionElements.noteTitle2, divisionElements.noteText2],
        [divisionElements.noteTitle3, divisionElements.noteText3]
      ].forEach(([titleElement, textElement], index) => {
        const note = meta.notes[index];
        titleElement.textContent = note ? note[0] : "";
        textElement.textContent = note ? note[1] : "";
      });
      divisionElements.operationButtons.forEach((button) => {
        button.classList.toggle("active", button.dataset.columnOperation === divisionState.operation);
      });
      toggleDivisionPrecision();
    }

    function setColumnOperation(operation, rerender = true) {
      divisionState.operation = operation;
      updateColumnOperationUi();
      if (rerender) {
        handleDivisionSolve(new Event("submit"));
      }
    }

    function buildLongAddition() {
      const leftText = parseWholeNumberText(divisionElements.dividend.value, columnOperationMeta.add.leftLabel);
      const rightText = parseWholeNumberText(divisionElements.divisor.value, columnOperationMeta.add.rightLabel);
      const resultText = (BigInt(leftText) + BigInt(rightText)).toString();
      const width = Math.max(leftText.length + 1, rightText.length + 1, resultText.length);
      const maxDigits = Math.max(leftText.length, rightText.length);
      const resultRow = Array(width).fill(" ");
      const carries = Array(width).fill(" ");
      const steps = [];
      let carry = 0;

      for (let offset = 0; offset < maxDigits; offset += 1) {
        const leftDigit = leftText.length - 1 - offset >= 0 ? Number(leftText[leftText.length - 1 - offset]) : 0;
        const rightDigit = rightText.length - 1 - offset >= 0 ? Number(rightText[rightText.length - 1 - offset]) : 0;
        const incomingCarry = carry;
        const total = leftDigit + rightDigit + incomingCarry;
        const digit = total % 10;
        carry = Math.trunc(total / 10);
        const columnIndex = width - 1 - offset;
        carries[columnIndex] = " ";
        resultRow[columnIndex] = String(digit);
        if (carry > 0 && columnIndex - 1 >= 0) {
          carries[columnIndex - 1] = String(carry);
        }

        steps.push(makeDivisionStep(
          `Шаг ${steps.length + 1}. Складываем разряд ${rankNameFromRight(offset)}`,
          incomingCarry > 0
            ? `В разряде ${rankNameFromRight(offset)} складываем ${leftDigit}, ${rightDigit} и перенос ${incomingCarry}.`
            : `В разряде ${rankNameFromRight(offset)} складываем ${leftDigit} и ${rightDigit}.`,
          divisionMathBlock([
            `${leftDigit} + ${rightDigit}${incomingCarry ? ` + ${incomingCarry}` : ""} = ${total}`,
            carry > 0
              ? `Пишем ${digit}, ${carry} переносим в следующий разряд.`
              : `Пишем ${digit}, переноса нет.`
          ]),
          buildColumnArithmeticBoard({
            width,
            carryRow: carries.join(""),
            topRow: leftText,
            bottomRow: `+${rightText}`,
            finalRow: { text: resultRow.join(""), kind: "result" }
          })
        ));
      }

      if (carry > 0 && resultRow[0] === " ") {
        resultRow[0] = String(carry);
        carries[0] = " ";
        steps.push(makeDivisionStep(
          `Шаг ${steps.length + 1}. Записываем перенос в новый разряд`,
          `После сложения старшего разряда остался перенос ${carry}, поэтому записываем его слева.`,
          divisionMathBlock([
            `Перенос = ${carry}`,
            `Получаем ${resultText}`
          ]),
          buildColumnArithmeticBoard({
            width,
            topRow: leftText,
            bottomRow: `+${rightText}`,
            finalRow: { text: resultRow.join(""), kind: "result" }
          })
        ));
      }

      steps.push(makeDivisionStep(
        "Ответ",
        "Итоговое число составлено из всех полученных цифр суммы.",
        divisionMathBlock([`${leftText} + ${rightText} = ${resultText}`]),
        buildColumnArithmeticBoard({
          width,
          topRow: leftText,
          bottomRow: `+${rightText}`,
          finalRow: { text: resultText, kind: "result" }
        })
      ));

      return {
        equation: `${leftText} + ${rightText} = ${resultText}`,
        quotient: resultText,
        remainder: "",
        steps
      };
    }

    function buildLongSubtraction() {
      const leftText = parseWholeNumberText(divisionElements.dividend.value, columnOperationMeta.subtract.leftLabel);
      const rightText = parseWholeNumberText(divisionElements.divisor.value, columnOperationMeta.subtract.rightLabel);
      if (BigInt(leftText) < BigInt(rightText)) {
        throw new Error("Для вычитания столбиком в этой версии уменьшаемое должно быть не меньше вычитаемого.");
      }

      const resultText = (BigInt(leftText) - BigInt(rightText)).toString();
      const width = Math.max(leftText.length + 1, rightText.length + 1, resultText.length + 1);
      const maxDigits = Math.max(leftText.length, rightText.length);
      const workingDigits = leftText.split("").map((digit) => Number(digit));
      const resultRow = Array(width).fill(" ");
      const steps = [];

      for (let offset = 0; offset < maxDigits; offset += 1) {
        const topIndex = workingDigits.length - 1 - offset;
        const bottomIndex = rightText.length - 1 - offset;
        let topDigit = topIndex >= 0 ? workingDigits[topIndex] : 0;
        const originalTopDigit = topDigit;
        const bottomDigit = bottomIndex >= 0 ? Number(rightText[bottomIndex]) : 0;
        let explain = `В разряде ${rankNameFromRight(offset)} вычитаем ${bottomDigit} из ${originalTopDigit}.`;
        const lines = [];

        if (topDigit < bottomDigit) {
          let borrowFrom = topIndex - 1;
          while (borrowFrom >= 0 && workingDigits[borrowFrom] === 0) {
            borrowFrom -= 1;
          }
          if (borrowFrom < 0) {
            throw new Error("Не удалось выполнить заем в более старшем разряде.");
          }
          workingDigits[borrowFrom] -= 1;
          for (let index = borrowFrom + 1; index < topIndex; index += 1) {
            workingDigits[index] = 9;
          }
          topDigit += 10;
          explain = borrowFrom < topIndex - 1
            ? `В разряде ${rankNameFromRight(offset)} ${originalTopDigit} меньше ${bottomDigit}, поэтому занимаем единицу через цепочку нулей. После займа в текущем разряде получается ${topDigit}.`
            : `В разряде ${rankNameFromRight(offset)} ${originalTopDigit} меньше ${bottomDigit}, поэтому занимаем единицу у следующего старшего разряда и получаем ${topDigit}.`;
          lines.push(`${originalTopDigit} < ${bottomDigit}, выполняем заем.`);
        }

        const difference = topDigit - bottomDigit;
        if (topIndex >= 0) {
          workingDigits[topIndex] = difference;
        }
        resultRow[width - 1 - offset] = String(difference);
        lines.push(`${topDigit} - ${bottomDigit} = ${difference}`);

        steps.push(makeDivisionStep(
          `Шаг ${steps.length + 1}. Вычитаем разряд ${rankNameFromRight(offset)}`,
          explain,
          divisionMathBlock(lines),
          buildColumnArithmeticBoard({
            width,
            topRow: leftText,
            bottomRow: `-${rightText}`,
            finalRow: { text: resultRow.join(""), kind: "result" }
          })
        ));
      }

      steps.push(makeDivisionStep(
        "Ответ",
        "Итоговая разность собрана из цифр, полученных в каждом разряде.",
        divisionMathBlock([`${leftText} - ${rightText} = ${resultText}`]),
        buildColumnArithmeticBoard({
          width,
          topRow: leftText,
          bottomRow: `-${rightText}`,
          finalRow: { text: resultText, kind: "result" }
        })
      ));

      return {
        equation: `${leftText} - ${rightText} = ${resultText}`,
        quotient: resultText,
        remainder: "",
        steps
      };
    }

    function buildLongMultiplication() {
      const leftText = parseWholeNumberText(divisionElements.dividend.value, columnOperationMeta.multiply.leftLabel);
      const rightText = parseWholeNumberText(divisionElements.divisor.value, columnOperationMeta.multiply.rightLabel);
      const resultText = (BigInt(leftText) * BigInt(rightText)).toString();
      const multiplierDigits = rightText.split("").map((digit) => Number(digit));
      const partialProducts = multiplierDigits
        .slice()
        .reverse()
        .map((digit, offset) => {
          const basePartial = (BigInt(leftText) * BigInt(digit)).toString();
          const text = basePartial === "0"
            ? "0".repeat(offset + 1)
            : `${basePartial}${"0".repeat(offset)}`;
          return { digit, offset, basePartial, text };
        });
      const width = Math.max(
        leftText.length + 1,
        rightText.length + 1,
        resultText.length,
        ...partialProducts.map((item) => item.text.length)
      );
      const steps = [];

      partialProducts.forEach((item, index) => {
        const rank = rankNameFromRight(item.offset);
        const explain = item.offset === 0
          ? `Умножаем первый множитель на цифру ${item.digit} из разряда единиц и записываем первую строку частичного произведения.`
          : `Умножаем первый множитель на цифру ${item.digit} из разряда ${rank}. Поэтому строка сдвигается на ${item.offset} разряд${item.offset === 1 ? "" : item.offset < 5 ? "а" : "ов"} влево.`;
        const lines = [
          `${leftText} × ${item.digit} = ${item.basePartial}`,
          item.offset === 0
            ? `Сдвиг не нужен: ${item.text}`
            : `Добавляем ${item.offset} нул${item.offset === 1 ? "ь" : item.offset < 5 ? "я" : "ей"} справа: ${item.text}`
        ];

        steps.push(makeDivisionStep(
          `Шаг ${steps.length + 1}. Строим строку для разряда ${rank}`,
          explain,
          divisionMathBlock(lines),
          buildColumnArithmeticBoard({
            width,
            topRow: leftText,
            bottomRow: `×${rightText}`,
            interimRows: partialProducts.slice(0, index + 1).map((partial) => ({
              text: partial.text,
              kind: "partial"
            }))
          })
        ));
      });

      if (partialProducts.length > 1) {
        steps.push(makeDivisionStep(
          `Шаг ${steps.length + 1}. Складываем частичные произведения`,
          "Когда все строки частичного произведения готовы, складываем их и получаем окончательный ответ.",
          divisionMathBlock([
            ...partialProducts.map((item) => item.text),
            `${resultText}`
          ]),
          buildColumnArithmeticBoard({
            width,
            topRow: leftText,
            bottomRow: `×${rightText}`,
            interimRows: partialProducts.map((partial) => ({
              text: partial.text,
              kind: "partial"
            })),
            finalRow: { text: resultText, kind: "result" },
            showSecondaryLine: true
          })
        ));
      }

      steps.push(makeDivisionStep(
        "Ответ",
        partialProducts.length > 1
          ? "Итоговое произведение получилось после сложения всех частичных строк."
          : "При умножении на одну цифру ответ совпадает с единственной строкой частичного произведения.",
        divisionMathBlock([`${leftText} × ${rightText} = ${resultText}`]),
        buildColumnArithmeticBoard({
          width,
          topRow: leftText,
          bottomRow: `×${rightText}`,
          interimRows: partialProducts.length > 1
            ? partialProducts.map((partial) => ({ text: partial.text, kind: "partial" }))
            : [],
          finalRow: { text: resultText, kind: "result" },
          showSecondaryLine: partialProducts.length > 1
        })
      ));

      return {
        equation: `${leftText} × ${rightText} = ${resultText}`,
        quotient: resultText,
        remainder: "",
        steps
      };
    }

    function buildLongDivision() {
      const dividendText = parseWholeNumberText(divisionElements.dividend.value, columnOperationMeta.divide.leftLabel);
      const divisorText = parseWholeNumberText(divisionElements.divisor.value, columnOperationMeta.divide.rightLabel);
      const divisor = BigInt(divisorText);
      if (divisor === 0n) {
        throw new Error("Делитель не может быть равен нулю.");
      }

      const useDecimalContinuation = divisionElements.continueDecimals.checked && Number(divisionElements.precision.value) > 0;
      const precision = Math.max(0, Math.min(8, asInteger(divisionElements.precision.value, 0)));
      const steps = [];
      const historicalRows = [];
      const quotientParts = [];
      let displayDividend = dividendText;
      let current = 0n;
      let remainder = 0n;
      let quotientStarted = false;
      let stepNumber = 0;
      const dividendRow = () => createDivisionBoardRow(displayDividend, displayDividend.length - 1, "dividend");

      for (let index = 0; index < dividendText.length; index += 1) {
        current = current * 10n + BigInt(dividendText[index]);
        const isLastDigit = index === dividendText.length - 1;
        const shouldDivideNow = quotientStarted || current >= divisor || isLastDigit;
        if (!shouldDivideNow) {
          continue;
        }

        quotientStarted = true;
        const quotientDigit = current / divisor;
        const product = quotientDigit * divisor;
        remainder = current - product;
        quotientParts.push(quotientDigit.toString());
        stepNumber += 1;

        const partialText = current.toString();
        const productText = product.toString();
        const remainderText = remainder.toString();
        const lines = [
          `${partialText} : ${divisorText} = ${quotientDigit}`,
          `${quotientDigit} × ${divisorText} = ${productText}`,
          `${partialText} - ${productText} = ${remainderText}`
        ];

        let explain = `Берем ${partialText}. ${partialText} : ${divisorText} = ${quotientDigit}, записываем ${quotientDigit} в частное. ${quotientDigit} × ${divisorText} = ${productText}, вычитаем и получаем ${remainderText}.`;
        const productRow = createDivisionBoardRow(productText, index, "product");
        const snapshotRows = [dividendRow(), ...historicalRows, productRow];
        let carryRow;

        if (index + 1 < dividendText.length) {
          const nextPartial = `${remainderText}${dividendText[index + 1]}`.replace(/^0+(?=\d)/, "") || "0";
          carryRow = createDivisionBoardRow(nextPartial, index + 1, "partial");
          snapshotRows.push(carryRow);
          lines.push(`${remainderText}, сносим ${dividendText[index + 1]} -> ${nextPartial}`);
          explain += ` Сносим ${dividendText[index + 1]}, получаем ${nextPartial}.`;
        } else {
          carryRow = createDivisionBoardRow(remainderText, index, remainder === 0n ? "remainder" : "partial");
          snapshotRows.push(carryRow);
          explain += remainder === 0n
            ? " Остаток стал равен 0."
            : ` Пока остаток равен ${remainderText}.`;
        }

        steps.push(makeDivisionStep(
          `Шаг ${stepNumber}. Делим ${partialText} на ${divisorText}`,
          explain,
          divisionMathBlock(lines),
          buildDivisionBoardText(displayDividend, divisorText, quotientParts.join(""), snapshotRows)
        ));

        historicalRows.push(productRow, carryRow);
        current = remainder;
      }

      if (useDecimalContinuation && remainder !== 0n) {
        quotientParts.push(",");
        for (let decimalIndex = 0; decimalIndex < precision && remainder !== 0n; decimalIndex += 1) {
          displayDividend = `${displayDividend}${decimalIndex === 0 ? "," : ""}0`;
          current = remainder * 10n;
          const quotientDigit = current / divisor;
          const product = quotientDigit * divisor;
          remainder = current - product;
          quotientParts.push(quotientDigit.toString());
          stepNumber += 1;

          const partialText = current.toString();
          const productText = product.toString();
          const remainderText = remainder.toString();
          const lastEndPos = dividendText.length + 1 + decimalIndex;
          const lines = [
            `${partialText} : ${divisorText} = ${quotientDigit}`,
            `${quotientDigit} × ${divisorText} = ${productText}`,
            `${partialText} - ${productText} = ${remainderText}`
          ];

          let explain = `Если остаток не равен нулю, после запятой дописываем 0 и продолжаем деление. ${partialText} : ${divisorText} = ${quotientDigit}, записываем ${quotientDigit} после запятой.`;
          const productRow = createDivisionBoardRow(productText, lastEndPos, "product");
          const snapshotRows = [dividendRow(), ...historicalRows, productRow];
          let carryRow;

          if (remainder !== 0n && decimalIndex + 1 < precision) {
            const nextPartial = `${remainderText}0`;
            carryRow = createDivisionBoardRow(nextPartial, lastEndPos + 1, "partial");
            snapshotRows.push(carryRow);
            lines.push(`${remainderText}, сносим 0 -> ${nextPartial}`);
            explain += ` Остаток ${remainderText}, поэтому при необходимости можно дописать еще один 0 и продолжить.`;
          } else {
            carryRow = createDivisionBoardRow(remainderText, lastEndPos, remainder === 0n ? "remainder" : "partial");
            snapshotRows.push(carryRow);
            explain += remainder === 0n
              ? " Остаток стал равен 0."
              : ` После этого остается ${remainderText}.`;
          }

          steps.push(makeDivisionStep(
            `Шаг ${stepNumber}. Продолжаем после запятой`,
            explain,
            divisionMathBlock(lines),
            buildDivisionBoardText(displayDividend, divisorText, quotientParts.join(""), snapshotRows)
          ));

          historicalRows.push(productRow, carryRow);
          current = remainder;
        }
      }

      const quotientText = quotientParts.join("") || "0";
      const hasApproximation = useDecimalContinuation && remainder !== 0n;
      const answerText = !useDecimalContinuation && remainder !== 0n
        ? `${quotientText} (ост. ${remainder})`
        : quotientText;
      const equationText = `${dividendText} : ${divisorText} ${hasApproximation ? "≈" : "="} ${answerText}`;
      const finalBoard = buildDivisionBoardText(
        displayDividend,
        divisorText,
        quotientText,
        [dividendRow(), ...historicalRows]
      );
      const finalLines = [equationText];
      let finalExplain = remainder === 0n
        ? "Деление завершено без остатка."
        : "Остаток не равен нулю.";

      if (!useDecimalContinuation && remainder !== 0n) {
        finalLines.push(`Остаток = ${remainder}`);
        finalExplain += " Останавливаемся на остатке.";
      } else if (hasApproximation) {
        finalLines.push(`Текущее приближение после ${precision} знаков: ${quotientText}`);
        finalLines.push(`Остаток после остановки: ${remainder}`);
        finalExplain += ` После ${precision} знаков после запятой получили приближение ${quotientText}.`;
      } else if (useDecimalContinuation && precision === 0 && remainder !== 0n) {
        finalLines.push(`Остаток = ${remainder}`);
      }

      steps.push(makeDivisionStep(
        "Ответ",
        finalExplain,
        divisionMathBlock(finalLines),
        finalBoard
      ));

      return {
        equation: equationText,
        quotient: quotientText,
        remainder: remainder.toString(),
        steps
      };
    }

    function buildColumnOperation() {
      if (divisionState.operation === "add") {
        return buildLongAddition();
      }
      if (divisionState.operation === "subtract") {
        return buildLongSubtraction();
      }
      if (divisionState.operation === "multiply") {
        return buildLongMultiplication();
      }
      return buildLongDivision();
    }

    function renderDivisionSolution() {
      if (divisionState.steps.length === 0) {
        const empty = emptyColumnMessages();
        divisionElements.equation.innerHTML = "";
        divisionElements.board.innerHTML = `<div class="empty-state"><p>${escapeTextMarkup(empty.board)}</p></div>`;
        divisionElements.steps.innerHTML = `<div class="empty-state"><p>${escapeTextMarkup(empty.steps)}</p></div>`;
        divisionElements.quotientPreview.textContent = "—";
        divisionElements.remainderPreview.textContent = "—";
        divisionElements.stepMeter.textContent = "Шаги появятся после решения";
        divisionElements.stepMeterBottom.textContent = "Шаги появятся после решения";
        divisionElements.prevStep.disabled = true;
        divisionElements.nextStep.disabled = true;
        divisionElements.showAll.disabled = true;
        divisionElements.prevStepBottom.disabled = true;
        divisionElements.nextStepBottom.disabled = true;
        divisionElements.showAllBottom.disabled = true;
        return;
      }

      const visibleSteps = divisionState.steps.slice(0, divisionState.visibleSteps);
      const currentStep = visibleSteps[visibleSteps.length - 1];
      const hideAnswers = divisionElements.hideAnswers.checked;
      divisionElements.equation.innerHTML = buildSpoilerMarkup(
        "column-equation",
        `<span class="division-equation-answer">${escapeTextMarkup(divisionState.equation)}</span>`,
        "Нажмите, чтобы открыть итоговое равенство",
        "equation",
        hideAnswers,
        divisionState.revealed
      );
      divisionElements.quotientPreview.innerHTML = buildSpoilerMarkup(
        "column-quotient",
        `<span>${escapeTextMarkup(divisionState.quotient)}</span>`,
        `Нажмите, чтобы открыть: ${divisionElements.primaryLabel.textContent.toLowerCase()}`,
        "inline",
        hideAnswers,
        divisionState.revealed
      );
      divisionElements.remainderPreview.innerHTML = buildSpoilerMarkup(
        "column-remainder",
        `<span>${escapeTextMarkup(divisionState.remainder || "—")}</span>`,
        `Нажмите, чтобы открыть: ${divisionElements.secondaryLabel.textContent.toLowerCase()}`,
        "inline",
        hideAnswers,
        divisionState.revealed
      );
      divisionElements.board.innerHTML = buildSpoilerMarkup(
        `column-board-${divisionState.visibleSteps - 1}`,
        currentStep.board,
        "Нажмите, чтобы открыть запись столбиком",
        "board",
        hideAnswers,
        divisionState.revealed
      );
      divisionElements.steps.innerHTML = visibleSteps.map((step, index) => `
        <article class="step-card">
          <div class="step-index">${index + 1}</div>
          <div class="step-content">
            <h3 class="step-title">${step.title}</h3>
            <p class="step-explain">${step.explain}</p>
            ${buildSpoilerMarkup(
              `column-step-${index}`,
              `<div class="step-math">${step.math}</div>`,
              step.title === "Ответ" ? "Нажмите, чтобы открыть ответ" : "Нажмите, чтобы открыть вычисления",
              "block",
              hideAnswers,
              divisionState.revealed
            )}
          </div>
        </article>
      `).join("");

      const meterText = `Показано ${divisionState.visibleSteps} из ${divisionState.steps.length}`;
      const prevDisabled = divisionState.visibleSteps <= 1;
      const nextDisabled = divisionState.visibleSteps >= divisionState.steps.length;
      divisionElements.stepMeter.textContent = meterText;
      divisionElements.stepMeterBottom.textContent = meterText;
      divisionElements.prevStep.disabled = prevDisabled;
      divisionElements.nextStep.disabled = nextDisabled;
      divisionElements.showAll.disabled = nextDisabled;
      divisionElements.prevStepBottom.disabled = prevDisabled;
      divisionElements.nextStepBottom.disabled = nextDisabled;
      divisionElements.showAllBottom.disabled = nextDisabled;
    }

    function renderDivisionError(message) {
      divisionState.steps = [];
      divisionState.visibleSteps = 0;
      divisionState.equation = "";
      divisionElements.equation.innerHTML = "";
      divisionElements.board.innerHTML = `<div class="empty-state"><p>${escapeTextMarkup(message)}</p></div>`;
      divisionElements.steps.innerHTML = `<p class="error">${escapeTextMarkup(message)}</p>`;
      divisionElements.quotientPreview.textContent = "—";
      divisionElements.remainderPreview.textContent = "—";
      divisionElements.stepMeter.textContent = "Исправьте данные в примере";
      divisionElements.stepMeterBottom.textContent = "Исправьте данные в примере";
      divisionElements.prevStep.disabled = true;
      divisionElements.nextStep.disabled = true;
      divisionElements.showAll.disabled = true;
      divisionElements.prevStepBottom.disabled = true;
      divisionElements.nextStepBottom.disabled = true;
      divisionElements.showAllBottom.disabled = true;
    }

    function handleDivisionSolve(event) {
      event.preventDefault();
      try {
        const result = buildColumnOperation();
        divisionState.steps = result.steps;
        divisionState.visibleSteps = Math.min(1, result.steps.length);
        divisionState.equation = result.equation;
        divisionState.quotient = result.quotient;
        divisionState.remainder = result.remainder;
        divisionState.revealed = {};
        renderDivisionSolution();
      } catch (error) {
        renderDivisionError(error.message);
      }
    }

    function toggleDivisionPrecision() {
      divisionElements.precision.disabled = divisionState.operation !== "divide" || !divisionElements.continueDecimals.checked;
    }

    divisionElements.form.addEventListener("submit", handleDivisionSolve);
    divisionElements.continueDecimals.addEventListener("change", toggleDivisionPrecision);
    divisionElements.hideAnswers.addEventListener("change", renderDivisionSolution);
    divisionElements.operationButtons.forEach((button) => {
      button.addEventListener("click", () => {
        setColumnOperation(button.dataset.columnOperation);
      });
    });

    [
      divisionElements.prevStep,
      divisionElements.prevStepBottom
    ].forEach((button) => {
      button.addEventListener("click", () => {
        divisionState.visibleSteps = Math.max(1, divisionState.visibleSteps - 1);
        renderDivisionSolution();
      });
    });

    [
      divisionElements.nextStep,
      divisionElements.nextStepBottom
    ].forEach((button) => {
      button.addEventListener("click", () => {
        divisionState.visibleSteps = Math.min(divisionState.steps.length, divisionState.visibleSteps + 1);
        renderDivisionSolution();
      });
    });

    [
      divisionElements.showAll,
      divisionElements.showAllBottom
    ].forEach((button) => {
      button.addEventListener("click", () => {
        divisionState.visibleSteps = divisionState.steps.length;
        renderDivisionSolution();
      });
    });

    [
      divisionElements.steps,
      divisionElements.equation,
      divisionElements.board,
      divisionElements.summaryCard
    ].forEach((container) => {
      container.addEventListener("click", (event) => {
        const button = event.target.closest("[data-spoiler-button]");
        if (!button) {
          return;
        }
        divisionState.revealed[button.dataset.spoilerKey] = true;
        renderDivisionSolution();
      });
    });

    setColumnOperation("divide", false);
    handleDivisionSolve(new Event("submit"));

    const percentState = {
      mode: "percentOfNumber",
      steps: [],
      visibleSteps: 0,
      equation: "",
      answer: "—",
      revealed: {}
    };

    const percentElements = {
      form: document.getElementById("percentForm"),
      builderNote: document.getElementById("percentBuilderNote"),
      modeReadable: document.getElementById("percentModeReadable"),
      modeButtons: document.querySelectorAll("[data-percent-mode]"),
      leftLabel: document.getElementById("percentLeftLabel"),
      rightLabel: document.getElementById("percentRightLabel"),
      value: document.getElementById("percentValue"),
      rate: document.getElementById("percentRate"),
      hintTitle: document.getElementById("percentHintTitle"),
      hintText: document.getElementById("percentHintText"),
      hideAnswers: document.getElementById("percentHideAnswers"),
      answerLabel: document.getElementById("percentAnswerLabel"),
      answerPreview: document.getElementById("percentAnswerPreview"),
      summaryCard: document.getElementById("percentSummaryCard"),
      solveLabel: document.getElementById("percentSolveLabel"),
      resultTitle: document.getElementById("percentResultTitle"),
      resultNote: document.getElementById("percentResultNote"),
      noteTitle1: document.getElementById("percentNoteTitle1"),
      noteText1: document.getElementById("percentNoteText1"),
      noteTitle2: document.getElementById("percentNoteTitle2"),
      noteText2: document.getElementById("percentNoteText2"),
      noteTitle3: document.getElementById("percentNoteTitle3"),
      noteText3: document.getElementById("percentNoteText3"),
      equation: document.getElementById("percentEquation"),
      steps: document.getElementById("percentSteps"),
      stepMeter: document.getElementById("percentStepMeter"),
      stepMeterBottom: document.getElementById("percentStepMeterBottom"),
      prevStep: document.getElementById("percentPrevStep"),
      nextStep: document.getElementById("percentNextStep"),
      showAll: document.getElementById("percentShowAll"),
      prevStepBottom: document.getElementById("percentPrevStepBottom"),
      nextStepBottom: document.getElementById("percentNextStepBottom"),
      showAllBottom: document.getElementById("percentShowAllBottom")
    };

    const percentModeMeta = {
      percentOfNumber: {
        readable: "процент от числа",
        leftLabel: "Число",
        rightLabel: "Процент",
        builderNote: "Этот режим нужен, когда известно число и нужно найти, какую часть от него составляет заданный процент.",
        hintTitle: "Как выбрать этот режим",
        hintText: "Подходит для задач вроде «найдите 15% от 240» или «сколько будет 7,5% от 80».",
        solveLabel: "Разобрать процент от числа",
        resultTitle: "Пошаговый разбор: процент от числа",
        resultNote: "Сначала переводим проценты в долю от 100, затем умножаем число на найденную долю.",
        answerLabel: "Процент от числа",
        notes: [
          ["Процент — это сотая доля", "Любой процент удобно сначала представить как дробь со знаменателем 100 или как десятичную дробь."],
          ["Находим часть", "Чтобы найти процент от числа, нужно умножить число на долю, которую задает этот процент."],
          ["Проверка", "Если процент меньше 100, ответ меньше исходного числа. Если процент больше 100, ответ будет больше числа."]
        ]
      },
      numberByPercent: {
        readable: "число по проценту",
        leftLabel: "Известная часть",
        rightLabel: "Процент этой части",
        builderNote: "Этот режим нужен, когда часть уже известна и известно, сколько процентов она составляет от целого числа.",
        hintTitle: "Как выбрать этот режим",
        hintText: "Подходит для задач вроде «36 — это 15% от какого числа?» или «12,5 составляет 25% от какого числа?».",
        solveLabel: "Разобрать число по проценту",
        resultTitle: "Пошаговый разбор: число по проценту",
        resultNote: "Сначала переводим проценты в долю, затем делим известную часть на эту долю и получаем целое число.",
        answerLabel: "Искомое число",
        notes: [
          ["Процент — это сотая доля", "Сначала превращаем процент в долю от единицы: например, 15% = 0,15."],
          ["Составляем равенство", "Если часть составляет p% от целого, то часть равна целому, умноженному на p/100."],
          ["Делим на долю", "Чтобы восстановить целое, нужно разделить известную часть на долю, которую она составляет."]
        ]
      }
    };

    function absBigInt(value) {
      return value < 0n ? -value : value;
    }

    function gcdBigInt(a, b) {
      let x = absBigInt(a);
      let y = absBigInt(b);
      while (y !== 0n) {
        const temp = y;
        y = x % y;
        x = temp;
      }
      return x || 1n;
    }

    function normalizeBigFraction(frac) {
      if (frac.den < 0n) {
        return { num: -frac.num, den: -frac.den };
      }
      return frac;
    }

    function reduceBigFraction(frac) {
      const normalized = normalizeBigFraction(frac);
      const divisor = gcdBigInt(normalized.num, normalized.den);
      return {
        num: normalized.num / divisor,
        den: normalized.den / divisor
      };
    }

    function multiplyBigFractions(left, right) {
      return reduceBigFraction({
        num: left.num * right.num,
        den: left.den * right.den
      });
    }

    function divideBigFractions(left, right) {
      if (right.num === 0n) {
        throw new Error("Нельзя делить на нулевую долю.");
      }
      return reduceBigFraction({
        num: left.num * right.den,
        den: left.den * right.num
      });
    }

    function toRussianDecimalText(value) {
      return String(value).replace(".", ",");
    }

    function parsePositiveDecimalText(value, label) {
      const cleaned = String(value).trim().replace(/\s+/g, "").replace(",", ".");
      if (!/^\d+(?:\.\d+)?$/.test(cleaned)) {
        throw new Error(`${label}: используйте только неотрицательные числа без знака процента.`);
      }
      const [rawInteger, rawFraction = ""] = cleaned.split(".");
      const integerPart = rawInteger.replace(/^0+(?=\d)/, "") || "0";
      const fractionPart = rawFraction.replace(/0+$/, "");
      const normalizedText = fractionPart ? `${integerPart}.${fractionPart}` : integerPart;
      const numeratorText = `${integerPart}${fractionPart}` || "0";
      const fraction = reduceBigFraction({
        num: BigInt(numeratorText),
        den: fractionPart ? 10n ** BigInt(fractionPart.length) : 1n
      });
      return {
        text: normalizedText,
        display: toRussianDecimalText(normalizedText),
        frac: fraction
      };
    }

    function bigFractionToText(frac) {
      const normalized = reduceBigFraction(frac);
      if (normalized.den === 1n) {
        return normalized.num.toString();
      }
      return `${normalized.num}/${normalized.den}`;
    }

    function bigFractionToFiniteDecimalText(frac) {
      const normalized = reduceBigFraction(frac);
      let denominator = normalized.den;
      let twos = 0;
      let fives = 0;
      while (denominator % 2n === 0n) {
        denominator /= 2n;
        twos += 1;
      }
      while (denominator % 5n === 0n) {
        denominator /= 5n;
        fives += 1;
      }
      if (denominator !== 1n) {
        return null;
      }
      const scale = Math.max(twos, fives);
      let numerator = normalized.num;
      if (twos < scale) {
        numerator *= 5n ** BigInt(scale - twos);
      }
      if (fives < scale) {
        numerator *= 2n ** BigInt(scale - fives);
      }
      const sign = numerator < 0n ? "-" : "";
      const digits = absBigInt(numerator).toString().padStart(scale + 1, "0");
      const integerPart = scale === 0 ? digits : digits.slice(0, -scale) || "0";
      const fractionPart = scale === 0 ? "" : digits.slice(-scale).replace(/0+$/, "");
      return fractionPart ? `${sign}${integerPart}.${fractionPart}` : `${sign}${integerPart}`;
    }

    function bigFractionToApproxDecimalText(frac, precision = 6) {
      const normalized = reduceBigFraction(frac);
      const sign = normalized.num < 0n ? "-" : "";
      let numerator = absBigInt(normalized.num);
      const integerPart = numerator / normalized.den;
      let remainder = numerator % normalized.den;
      if (remainder === 0n) {
        return `${sign}${integerPart.toString()}`;
      }
      let digits = "";
      for (let index = 0; index < precision; index += 1) {
        remainder *= 10n;
        digits += (remainder / normalized.den).toString();
        remainder %= normalized.den;
      }
      return `${sign}${integerPart.toString()}.${digits}${remainder !== 0n ? "…" : ""}`;
    }

    function describePercentResult(frac) {
      const normalized = reduceBigFraction(frac);
      const finite = bigFractionToFiniteDecimalText(normalized);
      if (finite !== null) {
        return {
          primary: toRussianDecimalText(finite),
          equationValue: toRussianDecimalText(finite),
          exactLine: normalized.den === 1n ? null : `${bigFractionToText(normalized)} = ${toRussianDecimalText(finite)}`,
          approximationLine: null
        };
      }
      const exactFraction = bigFractionToText(normalized);
      const approximate = toRussianDecimalText(bigFractionToApproxDecimalText(normalized, 6));
      return {
        primary: `≈ ${approximate}`,
        equationValue: `${exactFraction} ≈ ${approximate}`,
        exactLine: `Точное значение: ${exactFraction}`,
        approximationLine: `Приближенно: ${approximate}`
      };
    }

    function percentMathBlock(lines) {
      return divisionMathBlock(lines);
    }

    function buildPercentOfNumberSolution(valueInput, rateInput) {
      const share = divideBigFractions(rateInput.frac, { num: 100n, den: 1n });
      const shareText = toRussianDecimalText(bigFractionToFiniteDecimalText(share) || bigFractionToApproxDecimalText(share, 8));
      const result = multiplyBigFractions(valueInput.frac, share);
      const resultInfo = describePercentResult(result);
      const steps = [
        makeDivisionStep(
          "Шаг 1. Определяем тип задачи",
          `Нужно найти ${rateInput.display}% от числа ${valueInput.display}. Это значит, что мы ищем часть числа, соответствующую заданному проценту.`,
          percentMathBlock([`Найти ${rateInput.display}% от ${valueInput.display}`]),
          ""
        ),
        makeDivisionStep(
          "Шаг 2. Переводим проценты в долю",
          "Процент — это сотая доля. Поэтому делим число процентов на 100 и получаем долю от единицы.",
          percentMathBlock([
            `${rateInput.display}% = ${rateInput.display} / 100`,
            `${rateInput.display} / 100 = ${shareText}`
          ]),
          ""
        ),
        makeDivisionStep(
          "Шаг 3. Умножаем число на найденную долю",
          "Чтобы найти нужную часть, умножаем исходное число на долю, которую задает процент.",
          percentMathBlock([
            `${valueInput.display} × ${shareText} = ${resultInfo.equationValue}`,
            ...(resultInfo.exactLine ? [resultInfo.exactLine] : [])
          ]),
          ""
        ),
        makeDivisionStep(
          "Ответ",
          "Мы нашли нужную часть от числа.",
          percentMathBlock([
            `${rateInput.display}% от ${valueInput.display} = ${resultInfo.equationValue}`
          ]),
          ""
        )
      ];

      return {
        equation: `${rateInput.display}% от ${valueInput.display} = ${resultInfo.equationValue}`,
        answer: resultInfo.primary,
        steps
      };
    }

    function buildNumberByPercentSolution(valueInput, rateInput) {
      if (rateInput.frac.num === 0n) {
        throw new Error("Процент этой части не может быть равен 0, иначе восстановить целое число нельзя.");
      }
      const share = divideBigFractions(rateInput.frac, { num: 100n, den: 1n });
      const shareText = toRussianDecimalText(bigFractionToFiniteDecimalText(share) || bigFractionToApproxDecimalText(share, 8));
      const result = divideBigFractions(valueInput.frac, share);
      const resultInfo = describePercentResult(result);
      const steps = [
        makeDivisionStep(
          "Шаг 1. Определяем тип задачи",
          `Известно, что число ${valueInput.display} составляет ${rateInput.display}% от целого. Значит, нужно восстановить все число по его части.`,
          percentMathBlock([`${valueInput.display} — это ${rateInput.display}% от неизвестного числа`]),
          ""
        ),
        makeDivisionStep(
          "Шаг 2. Переводим проценты в долю",
          "Процент переводим в долю от единицы: для этого делим количество процентов на 100.",
          percentMathBlock([
            `${rateInput.display}% = ${rateInput.display} / 100`,
            `${rateInput.display} / 100 = ${shareText}`
          ]),
          ""
        ),
        makeDivisionStep(
          "Шаг 3. Составляем равенство",
          "Если часть составляет указанную долю от целого, то часть равна целому числу, умноженному на эту долю.",
          percentMathBlock([
            `${valueInput.display} = x × ${shareText}`
          ]),
          ""
        ),
        makeDivisionStep(
          "Шаг 4. Выражаем целое число",
          "Чтобы найти целое, делим известную часть на долю, которую она составляет.",
          percentMathBlock([
            `x = ${valueInput.display} / ${shareText}`
          ]),
          ""
        ),
        makeDivisionStep(
          "Шаг 5. Выполняем вычисление",
          resultInfo.approximationLine
            ? "Сначала записываем точное значение, а затем показываем десятичное приближение."
            : "Выполняем деление и получаем искомое число.",
          percentMathBlock([
            `x = ${resultInfo.equationValue}`,
            ...(resultInfo.exactLine ? [resultInfo.exactLine] : []),
            ...(resultInfo.approximationLine ? [resultInfo.approximationLine] : [])
          ]),
          ""
        ),
        makeDivisionStep(
          "Ответ",
          "Мы восстановили целое число по известной части и ее проценту.",
          percentMathBlock([
            `${valueInput.display} — это ${rateInput.display}% от ${resultInfo.equationValue}`
          ]),
          ""
        )
      ];

      return {
        equation: `${valueInput.display} — это ${rateInput.display}% от ${resultInfo.equationValue}`,
        answer: resultInfo.primary,
        steps
      };
    }

    function buildPercentOperation() {
      const valueInput = parsePositiveDecimalText(percentElements.value.value, percentModeMeta[percentState.mode].leftLabel);
      const rateInput = parsePositiveDecimalText(percentElements.rate.value, percentModeMeta[percentState.mode].rightLabel);
      if (percentState.mode === "numberByPercent") {
        return buildNumberByPercentSolution(valueInput, rateInput);
      }
      return buildPercentOfNumberSolution(valueInput, rateInput);
    }

    function updatePercentModeUi() {
      const meta = percentModeMeta[percentState.mode];
      percentElements.builderNote.textContent = meta.builderNote;
      percentElements.modeReadable.textContent = meta.readable;
      percentElements.leftLabel.textContent = meta.leftLabel;
      percentElements.rightLabel.textContent = meta.rightLabel;
      percentElements.value.setAttribute("aria-label", meta.leftLabel);
      percentElements.rate.setAttribute("aria-label", meta.rightLabel);
      percentElements.hintTitle.textContent = meta.hintTitle;
      percentElements.hintText.textContent = meta.hintText;
      percentElements.answerLabel.textContent = meta.answerLabel;
      percentElements.solveLabel.textContent = meta.solveLabel;
      percentElements.resultTitle.textContent = meta.resultTitle;
      percentElements.resultNote.textContent = meta.resultNote;
      [
        [percentElements.noteTitle1, percentElements.noteText1],
        [percentElements.noteTitle2, percentElements.noteText2],
        [percentElements.noteTitle3, percentElements.noteText3]
      ].forEach(([titleElement, textElement], index) => {
        const note = meta.notes[index];
        titleElement.textContent = note ? note[0] : "";
        textElement.textContent = note ? note[1] : "";
      });
      percentElements.modeButtons.forEach((button) => {
        button.classList.toggle("active", button.dataset.percentMode === percentState.mode);
      });
    }

    function setPercentMode(mode, rerender = true) {
      percentState.mode = mode;
      updatePercentModeUi();
      if (rerender) {
        handlePercentSolve(new Event("submit"));
      }
    }

    function renderPercentSolution() {
      if (percentState.steps.length === 0) {
        percentElements.equation.innerHTML = "";
        percentElements.steps.innerHTML = `<div class="empty-state"><p>Выберите тип задачи с процентами, введите значения и нажмите «${percentModeMeta[percentState.mode].solveLabel}».</p></div>`;
        percentElements.answerPreview.textContent = "—";
        percentElements.stepMeter.textContent = "Шаги появятся после решения";
        percentElements.stepMeterBottom.textContent = "Шаги появятся после решения";
        percentElements.prevStep.disabled = true;
        percentElements.nextStep.disabled = true;
        percentElements.showAll.disabled = true;
        percentElements.prevStepBottom.disabled = true;
        percentElements.nextStepBottom.disabled = true;
        percentElements.showAllBottom.disabled = true;
        return;
      }

      const visibleSteps = percentState.steps.slice(0, percentState.visibleSteps);
      const hideAnswers = percentElements.hideAnswers.checked;
      percentElements.equation.innerHTML = buildSpoilerMarkup(
        "percent-equation",
        `<span class="division-equation-answer">${escapeTextMarkup(percentState.equation)}</span>`,
        "Нажмите, чтобы открыть итоговое равенство",
        "equation",
        hideAnswers,
        percentState.revealed
      );
      percentElements.answerPreview.innerHTML = buildSpoilerMarkup(
        "percent-answer",
        `<span>${escapeTextMarkup(percentState.answer)}</span>`,
        "Нажмите, чтобы открыть ответ",
        "inline",
        hideAnswers,
        percentState.revealed
      );
      percentElements.steps.innerHTML = visibleSteps.map((step, index) => `
        <article class="step-card">
          <div class="step-index">${index + 1}</div>
          <div class="step-content">
            <h3 class="step-title">${step.title}</h3>
            <p class="step-explain">${step.explain}</p>
            ${buildSpoilerMarkup(
              `percent-step-${index}`,
              `<div class="step-math">${step.math}</div>`,
              step.title === "Ответ" ? "Нажмите, чтобы открыть ответ" : "Нажмите, чтобы открыть вычисления",
              "block",
              hideAnswers,
              percentState.revealed
            )}
          </div>
        </article>
      `).join("");

      const meterText = `Показано ${percentState.visibleSteps} из ${percentState.steps.length}`;
      const prevDisabled = percentState.visibleSteps <= 1;
      const nextDisabled = percentState.visibleSteps >= percentState.steps.length;
      percentElements.stepMeter.textContent = meterText;
      percentElements.stepMeterBottom.textContent = meterText;
      percentElements.prevStep.disabled = prevDisabled;
      percentElements.nextStep.disabled = nextDisabled;
      percentElements.showAll.disabled = nextDisabled;
      percentElements.prevStepBottom.disabled = prevDisabled;
      percentElements.nextStepBottom.disabled = nextDisabled;
      percentElements.showAllBottom.disabled = nextDisabled;
    }

    function renderPercentError(message) {
      percentState.steps = [];
      percentState.visibleSteps = 0;
      percentState.equation = "";
      percentElements.equation.innerHTML = "";
      percentElements.steps.innerHTML = `<p class="error">${escapeTextMarkup(message)}</p>`;
      percentElements.answerPreview.textContent = "—";
      percentElements.stepMeter.textContent = "Исправьте данные в примере";
      percentElements.stepMeterBottom.textContent = "Исправьте данные в примере";
      percentElements.prevStep.disabled = true;
      percentElements.nextStep.disabled = true;
      percentElements.showAll.disabled = true;
      percentElements.prevStepBottom.disabled = true;
      percentElements.nextStepBottom.disabled = true;
      percentElements.showAllBottom.disabled = true;
    }

    function handlePercentSolve(event) {
      event.preventDefault();
      try {
        const result = buildPercentOperation();
        percentState.steps = result.steps;
        percentState.visibleSteps = Math.min(1, result.steps.length);
        percentState.equation = result.equation;
        percentState.answer = result.answer;
        percentState.revealed = {};
        renderPercentSolution();
      } catch (error) {
        renderPercentError(error.message);
      }
    }

    percentElements.form.addEventListener("submit", handlePercentSolve);
    percentElements.hideAnswers.addEventListener("change", renderPercentSolution);
    percentElements.modeButtons.forEach((button) => {
      button.addEventListener("click", () => {
        setPercentMode(button.dataset.percentMode);
      });
    });

    [
      percentElements.prevStep,
      percentElements.prevStepBottom
    ].forEach((button) => {
      button.addEventListener("click", () => {
        percentState.visibleSteps = Math.max(1, percentState.visibleSteps - 1);
        renderPercentSolution();
      });
    });

    [
      percentElements.nextStep,
      percentElements.nextStepBottom
    ].forEach((button) => {
      button.addEventListener("click", () => {
        percentState.visibleSteps = Math.min(percentState.steps.length, percentState.visibleSteps + 1);
        renderPercentSolution();
      });
    });

    [
      percentElements.showAll,
      percentElements.showAllBottom
    ].forEach((button) => {
      button.addEventListener("click", () => {
        percentState.visibleSteps = percentState.steps.length;
        renderPercentSolution();
      });
    });

    [
      percentElements.steps,
      percentElements.equation,
      percentElements.summaryCard
    ].forEach((container) => {
      container.addEventListener("click", (event) => {
        const button = event.target.closest("[data-spoiler-button]");
        if (!button) {
          return;
        }
        percentState.revealed[button.dataset.spoilerKey] = true;
        renderPercentSolution();
      });
    });

    setPercentMode("percentOfNumber", false);
    handlePercentSolve(new Event("submit"));

    const viewButtons = document.querySelectorAll("[data-view]");
    const viewSections = document.querySelectorAll("[data-view-section]");
    const subtitle = document.querySelector(".subtitle");
    const subtitles = {
      fractions: "Дроби: сложение, вычитание, умножение и деление.",
      percents: "Проценты: процент от числа и число по известному проценту.",
      longDivision: "Столбик: сложение, вычитание, умножение и деление по школьной записи.",
      problems: "Задачи: условие, рисунок и пошаговые пояснения."
    };

    function setView(view) {
      if (view !== "problems" && typeof setProblemFocusMode === "function" && typeof problemState !== "undefined" && problemState.fullscreen) {
        setProblemFocusMode(false);
      }
      viewButtons.forEach((button) => {
        button.classList.toggle("active", button.dataset.view === view);
      });
      viewSections.forEach((section) => {
        const isActive = section.dataset.viewSection === view;
        section.hidden = !isActive;
        section.classList.toggle("active", isActive);
      });
      subtitle.textContent = subtitles[view] || subtitles.fractions;
      if (view === "problems") {
        window.requestAnimationFrame(() => {
          resizeProblemCanvasDisplay();
          drawProblemCanvas();
        });
      }
    }

    viewButtons.forEach((button) => {
      button.addEventListener("click", () => setView(button.dataset.view));
    });

    const problemElements = {
      workspace: document.getElementById("problemWorkspace"),
      sidebar: document.getElementById("problemSidebar"),
      sidebarToggle: document.getElementById("toggleProblemSidebar"),
      sidebarBody: document.getElementById("problemSidebarBody"),
      condition: document.getElementById("problemCondition"),
      uploadPanel: document.getElementById("problemUploadPanel"),
      uploadToggle: document.getElementById("toggleProblemUpload"),
      uploadBody: document.getElementById("problemUploadBody"),
      imageUpload: document.getElementById("imageUpload"),
      imageName: document.getElementById("imageName"),
      stageTabs: document.getElementById("stageTabs"),
      addStage: document.getElementById("addStage"),
      stageTitle: document.getElementById("stageTitle"),
      stageSolution: document.getElementById("stageSolution"),
      saveStage: document.getElementById("saveStage"),
      transferPrevious: document.getElementById("transferPreviousAnnotations"),
      substepText: document.getElementById("substepText"),
      addSubstep: document.getElementById("addSubstep"),
      substepsList: document.getElementById("substepsList"),
      drawingPanel: document.getElementById("problemDrawingPanel"),
      toolsToggle: document.getElementById("toggleDrawingTools"),
      drawingToolbarWrap: document.getElementById("drawingToolbarWrap"),
      toggleCanvasFocus: document.getElementById("toggleCanvasFocus"),
      toggleCanvasFocusLabel: document.getElementById("toggleCanvasFocusLabel"),
      canvasShell: document.getElementById("canvasShell"),
      canvas: document.getElementById("problemCanvas"),
      canvasTextEditor: document.getElementById("canvasTextEditor"),
      strokeColor: document.getElementById("strokeColor"),
      strokeWidth: document.getElementById("strokeWidth"),
      fontSize: document.getElementById("fontSize"),
      annotationText: document.getElementById("annotationText"),
      undo: document.getElementById("undoAnnotation"),
      deleteSelected: document.getElementById("deleteSelected"),
      clear: document.getElementById("clearAnnotations"),
      download: document.getElementById("downloadCanvas")
    };

    function createStage(number) {
      return {
        title: `Этап ${number}`,
        solution: "",
        substeps: [],
        annotations: [],
        history: {
          undoStack: [[]],
          redoStack: []
        }
      };
    }

    const annotationHistoryLimit = 80;

    const problemState = {
      tool: "pen",
      stages: [createStage(1)],
      activeStageIndex: 0,
      annotations: [],
      selectedAnnotationIndex: null,
      selectedAnnotationIndexes: [],
      selectedTextIndex: null,
      editingTextIndex: null,
      draggingText: false,
      movingAnnotation: false,
      resizingAnnotation: false,
      selectingBox: false,
      selectionBox: null,
      selectionBoxAdditive: false,
      resizeHandle: null,
      lastPoint: null,
      lastCanvasPoint: null,
      mouseInCanvas: false,
      originalAnnotation: null,
      dragOffset: { x: 0, y: 0 },
      clipboard: null,
      croppingAnnotation: false,
      cropHandle: null,
      image: null,
      imageBounds: null,
      isDrawing: false,
      currentPath: [],
      startPoint: null,
      draft: null,
      fullscreen: false,
      collapsedPanels: {
        sidebar: false,
        upload: false,
        tools: false
      }
    };

    const problemCtx = problemElements.canvas.getContext("2d");
    const annotationImageCache = new Map();
    const problemCanvasAspect = problemElements.canvas.width / problemElements.canvas.height;
    const problemPanelConfig = {
      sidebar: {
        panel: problemElements.sidebar,
        body: problemElements.sidebarBody,
        toggle: problemElements.sidebarToggle,
        collapseTitle: "Свернуть боковую панель",
        expandTitle: "Развернуть боковую панель"
      },
      upload: {
        panel: problemElements.uploadPanel,
        body: problemElements.uploadBody,
        toggle: problemElements.uploadToggle,
        collapseTitle: "Свернуть загрузку файла",
        expandTitle: "Развернуть загрузку файла"
      },
      tools: {
        panel: problemElements.drawingPanel,
        body: problemElements.drawingToolbarWrap,
        toggle: problemElements.toolsToggle,
        collapseTitle: "Свернуть редактор рисунка",
        expandTitle: "Развернуть редактор рисунка"
      }
    };

    function escapeHtml(value) {
      return value
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;");
    }

    function clamp(value, min, max) {
      return Math.min(Math.max(value, min), max);
    }

    function focusProblemEditorSurface() {
      if (typeof problemElements.canvasShell.focus === "function") {
        problemElements.canvasShell.focus({ preventScroll: true });
      }
    }

    function isCanvasFocusTarget(target = document.activeElement) {
      return target === problemElements.canvasShell
        || target === problemElements.canvas
        || target === problemElements.canvasTextEditor;
    }

    function loadAnnotationImage(source, onReady = null) {
      if (!source) {
        return null;
      }

      let entry = annotationImageCache.get(source);
      if (!entry) {
        const image = new Image();
        entry = {
          image,
          loaded: false,
          listeners: []
        };
        image.addEventListener("load", () => {
          entry.loaded = true;
          const listeners = [...entry.listeners];
          entry.listeners.length = 0;
          listeners.forEach((listener) => listener(image));
          drawProblemCanvas();
        });
        image.src = source;
        annotationImageCache.set(source, entry);
      }

      if (onReady) {
        if (entry.loaded) {
          onReady(entry.image);
        } else {
          entry.listeners.push(onReady);
        }
      }

      return entry.loaded ? entry.image : null;
    }

    function getAnnotationImage(annotation, onReady = null) {
      return loadAnnotationImage(annotation?.source, onReady);
    }

    function normalizeImageCrop(annotation) {
      const image = annotation ? getAnnotationImage(annotation) : null;
      const naturalWidth = Math.max(1, annotation?.naturalWidth || image?.naturalWidth || image?.width || 1);
      const naturalHeight = Math.max(1, annotation?.naturalHeight || image?.naturalHeight || image?.height || 1);
      const cropX = clamp(Number.isFinite(annotation?.cropX) ? annotation.cropX : 0, 0, naturalWidth - 1);
      const cropY = clamp(Number.isFinite(annotation?.cropY) ? annotation.cropY : 0, 0, naturalHeight - 1);
      const cropWidth = clamp(
        Number.isFinite(annotation?.cropWidth) ? annotation.cropWidth : naturalWidth - cropX,
        1,
        naturalWidth - cropX
      );
      const cropHeight = clamp(
        Number.isFinite(annotation?.cropHeight) ? annotation.cropHeight : naturalHeight - cropY,
        1,
        naturalHeight - cropY
      );

      if (annotation) {
        annotation.naturalWidth = naturalWidth;
        annotation.naturalHeight = naturalHeight;
        annotation.cropX = cropX;
        annotation.cropY = cropY;
        annotation.cropWidth = cropWidth;
        annotation.cropHeight = cropHeight;
      }

      return {
        naturalWidth,
        naturalHeight,
        cropX,
        cropY,
        cropWidth,
        cropHeight
      };
    }

    function fitImageAnnotationToCanvas(image, targetCenter = null) {
      const canvas = problemElements.canvas;
      const margin = 56;
      const maxWidth = Math.max(160, canvas.width - margin * 2);
      const maxHeight = Math.max(120, canvas.height - margin * 2);
      const scale = Math.min(maxWidth / image.width, maxHeight / image.height);
      const width = Math.max(48, image.width * scale);
      const height = Math.max(48, image.height * scale);
      const centerX = targetCenter?.x ?? canvas.width / 2;
      const centerY = targetCenter?.y ?? canvas.height / 2;
      const x = clamp(centerX - width / 2, margin / 2, canvas.width - width - margin / 2);
      const y = clamp(centerY - height / 2, margin / 2, canvas.height - height - margin / 2);
      return { x, y, width, height };
    }

    function resizeProblemCanvasDisplay() {
      const shell = problemElements.canvasShell;
      if (!shell || shell.clientWidth === 0) {
        return;
      }

      const shellStyles = window.getComputedStyle(shell);
      const paddingX = parseFloat(shellStyles.paddingLeft) + parseFloat(shellStyles.paddingRight);
      const paddingY = parseFloat(shellStyles.paddingTop) + parseFloat(shellStyles.paddingBottom);
      const availableWidth = Math.max(240, shell.clientWidth - paddingX);
      let availableHeight = shell.clientHeight - paddingY;

      if (!Number.isFinite(availableHeight) || availableHeight <= 0) {
        availableHeight = problemState.fullscreen
          ? window.innerHeight - 240
          : Math.min(availableWidth / problemCanvasAspect, 620);
      }

      const widthFromHeight = availableHeight * problemCanvasAspect;
      const displayWidth = Math.max(240, Math.min(availableWidth, widthFromHeight));
      const displayHeight = displayWidth / problemCanvasAspect;

      problemElements.canvas.style.width = `${Math.round(displayWidth)}px`;
      problemElements.canvas.style.height = `${Math.round(displayHeight)}px`;
    }

    function updateProblemPanelToggle(toggle, collapsed, collapseTitle, expandTitle) {
      const title = collapsed ? expandTitle : collapseTitle;
      toggle.setAttribute("title", title);
      toggle.setAttribute("aria-label", title);
      toggle.setAttribute("aria-expanded", String(!collapsed));
    }

    function applyProblemPanelState(name) {
      const config = problemPanelConfig[name];
      if (!config) {
        return;
      }
      const collapsed = problemState.collapsedPanels[name];
      config.panel.classList.toggle("panel-collapsed", collapsed);
      if (config.body) {
        config.body.hidden = collapsed;
      }
      updateProblemPanelToggle(config.toggle, collapsed, config.collapseTitle, config.expandTitle);
      if (name === "sidebar") {
        problemElements.workspace.classList.toggle("problem-sidebar-collapsed", collapsed);
      }
    }

    function setProblemPanelCollapsed(name, collapsed) {
      if (!(name in problemState.collapsedPanels)) {
        return;
      }
      closeCanvasTextEditor(true);
      problemState.collapsedPanels[name] = collapsed;
      applyProblemPanelState(name);
      window.requestAnimationFrame(() => {
        resizeProblemCanvasDisplay();
        drawProblemCanvas();
      });
    }

    function toggleProblemPanel(name) {
      setProblemPanelCollapsed(name, !problemState.collapsedPanels[name]);
    }

    function setProblemFocusMode(enabled) {
      if (problemState.fullscreen === enabled) {
        return;
      }
      closeCanvasTextEditor(true);
      if (enabled && problemState.collapsedPanels.tools) {
        problemState.collapsedPanels.tools = false;
        applyProblemPanelState("tools");
      }
      problemState.fullscreen = enabled;
      problemElements.workspace.classList.toggle("problem-focus-mode", enabled);
      document.body.classList.toggle("problem-focus-active", enabled);
      problemElements.toggleCanvasFocus.setAttribute("aria-pressed", String(enabled));
      problemElements.toggleCanvasFocus.classList.toggle("active", enabled);
      const label = enabled ? "Обычный режим" : "На весь экран";
      const title = enabled ? "Вернуться к обычному режиму" : "Открыть рисунок на весь экран";
      problemElements.toggleCanvasFocusLabel.textContent = label;
      problemElements.toggleCanvasFocus.setAttribute("title", title);
      problemElements.toggleCanvasFocus.setAttribute("aria-label", title);
      window.requestAnimationFrame(() => {
        resizeProblemCanvasDisplay();
        drawProblemCanvas();
      });
    }

    function toggleProblemFocusMode() {
      setProblemFocusMode(!problemState.fullscreen);
    }

    function cloneAnnotations(source = problemState.annotations) {
      return JSON.parse(JSON.stringify(source));
    }

    function activeStage() {
      return problemState.stages[problemState.activeStageIndex];
    }

    function snapshotAnnotations(source = problemState.annotations) {
      return cloneAnnotations(source);
    }

    function snapshotsEqual(first, second) {
      return JSON.stringify(first) === JSON.stringify(second);
    }

    function ensureStageHistory(stage) {
      if (!stage) {
        return;
      }
      if (!stage.history || !Array.isArray(stage.history.undoStack) || !Array.isArray(stage.history.redoStack)) {
        stage.history = {
          undoStack: [snapshotAnnotations(stage.annotations || [])],
          redoStack: []
        };
        return;
      }
      if (stage.history.undoStack.length === 0) {
        stage.history.undoStack = [snapshotAnnotations(stage.annotations || [])];
      }
    }

    function currentStageHistory() {
      const stage = activeStage();
      ensureStageHistory(stage);
      return stage.history;
    }

    function rememberAnnotationState(force = false) {
      const history = currentStageHistory();
      const snapshot = snapshotAnnotations();
      const lastSnapshot = history.undoStack[history.undoStack.length - 1];
      if (!force && lastSnapshot && snapshotsEqual(lastSnapshot, snapshot)) {
        return false;
      }
      history.undoStack.push(snapshot);
      if (history.undoStack.length > annotationHistoryLimit) {
        history.undoStack.shift();
      }
      history.redoStack = [];
      return true;
    }

    function restoreAnnotationSnapshot(snapshot) {
      problemState.annotations = snapshotAnnotations(snapshot);
      clearAnnotationSelection();
      persistVisuals();
      drawProblemCanvas();
    }

    function undoAnnotations() {
      closeCanvasTextEditor(true);
      const history = currentStageHistory();
      const currentSnapshot = snapshotAnnotations();
      const lastSnapshot = history.undoStack[history.undoStack.length - 1];

      if (lastSnapshot && !snapshotsEqual(lastSnapshot, currentSnapshot)) {
        history.redoStack.push(currentSnapshot);
        restoreAnnotationSnapshot(lastSnapshot);
        return;
      }

      if (history.undoStack.length <= 1) {
        return;
      }

      history.redoStack.push(currentSnapshot);
      history.undoStack.pop();
      restoreAnnotationSnapshot(history.undoStack[history.undoStack.length - 1]);
    }

    function redoAnnotations() {
      closeCanvasTextEditor(true);
      const history = currentStageHistory();
      if (history.redoStack.length === 0) {
        return;
      }

      const nextSnapshot = history.redoStack.pop();
      history.undoStack.push(snapshotAnnotations(nextSnapshot));
      if (history.undoStack.length > annotationHistoryLimit) {
        history.undoStack.shift();
      }
      restoreAnnotationSnapshot(nextSnapshot);
    }

    function selectAllAnnotations() {
      closeCanvasTextEditor(true);
      if (problemState.annotations.length === 0) {
        return;
      }
      problemState.selectedAnnotationIndexes = problemState.annotations.map((_, index) => index);
      problemState.selectedAnnotationIndex = problemState.selectedAnnotationIndexes[problemState.selectedAnnotationIndexes.length - 1];
      syncSelectedTextControls();
      setTool("select", true);
    }

    function persistActiveStage() {
      const stage = activeStage();
      if (!stage) {
        return;
      }
      stage.title = problemElements.stageTitle.value.trim() || `Этап ${problemState.activeStageIndex + 1}`;
      stage.solution = problemElements.stageSolution.value;
      ensureStageHistory(stage);
      stage.annotations = cloneAnnotations();
    }

    function renderStageTabs() {
      problemElements.stageTabs.innerHTML = problemState.stages.map((stage, index) => `
        <button class="stage-tab ${index === problemState.activeStageIndex ? "active" : ""}" type="button" data-stage-index="${index}" role="tab" aria-selected="${index === problemState.activeStageIndex}">
          <span class="stage-tab-index">${index + 1}</span>
          <span class="stage-tab-title">${escapeHtml(stage.title || `Этап ${index + 1}`)}</span>
        </button>
      `).join("");
    }

    function renderSubsteps() {
      const stage = activeStage();
      if (!stage || stage.substeps.length === 0) {
        problemElements.substepsList.innerHTML = `<p class="muted">Подэтапы появятся здесь после сохранения.</p>`;
        return;
      }

      problemElements.substepsList.innerHTML = stage.substeps.map((substep, index) => `
        <div class="substep-item">
          <div class="substep-index">${index + 1}</div>
          <div class="substep-text">${escapeHtml(substep)}</div>
        </div>
      `).join("");
    }

    function loadActiveStageIntoForm() {
      const stage = activeStage();
      problemElements.stageTitle.value = stage.title;
      problemElements.stageSolution.value = stage.solution;
      ensureStageHistory(stage);
      problemState.annotations = cloneAnnotations(stage.annotations);
      problemState.selectedAnnotationIndex = null;
      problemState.selectedAnnotationIndexes = [];
      problemState.selectedTextIndex = null;
      problemElements.substepText.value = "";
      renderStageTabs();
      renderSubsteps();
      problemElements.transferPrevious.disabled = problemState.activeStageIndex === 0;
      resizeProblemCanvasDisplay();
      drawProblemCanvas();
    }

    function switchStage(index) {
      if (index < 0 || index >= problemState.stages.length) {
        return;
      }
      closeCanvasTextEditor(true);
      persistActiveStage();
      problemState.activeStageIndex = index;
      loadActiveStageIntoForm();
    }

    function addStage() {
      closeCanvasTextEditor(true);
      persistActiveStage();
      problemState.stages.push(createStage(problemState.stages.length + 1));
      problemState.activeStageIndex = problemState.stages.length - 1;
      loadActiveStageIntoForm();
    }

    function saveStage() {
      closeCanvasTextEditor(true);
      persistActiveStage();
      renderStageTabs();
      renderSubsteps();
    }

    function setTool(tool, keepSelection = false) {
      problemState.tool = tool;
      if (tool !== "text" && tool !== "crop" && !keepSelection) {
        problemState.selectedAnnotationIndex = null;
        problemState.selectedAnnotationIndexes = [];
        problemState.selectedTextIndex = null;
      }
      document.querySelectorAll("[data-tool]").forEach((button) => {
        button.classList.toggle("active", button.dataset.tool === tool);
      });
      setBaseCanvasCursor();
      drawProblemCanvas();
    }

    function canvasPoint(event) {
      const rect = problemElements.canvas.getBoundingClientRect();
      return {
        x: (event.clientX - rect.left) * (problemElements.canvas.width / rect.width),
        y: (event.clientY - rect.top) * (problemElements.canvas.height / rect.height)
      };
    }

    function canvasRectMetrics() {
      const canvasRect = problemElements.canvas.getBoundingClientRect();
      const shellRect = problemElements.canvasShell.getBoundingClientRect();
      return {
        left: canvasRect.left - shellRect.left + problemElements.canvasShell.scrollLeft,
        top: canvasRect.top - shellRect.top + problemElements.canvasShell.scrollTop,
        scaleX: canvasRect.width / problemElements.canvas.width,
        scaleY: canvasRect.height / problemElements.canvas.height
      };
    }

    function isTypingTarget(target) {
      if (!target) {
        return false;
      }
      const tag = target.tagName;
      if (tag === "TEXTAREA" || target.isContentEditable) {
        return true;
      }
      if (tag !== "INPUT") {
        return false;
      }
      const type = (target.type || "text").toLowerCase();
      return !["button", "submit", "range", "color", "file", "checkbox", "radio"].includes(type);
    }

    function currentDrawingStyle() {
      return {
        color: problemElements.strokeColor.value,
        width: Number(problemElements.strokeWidth.value),
        fontSize: Number(problemElements.fontSize.value)
      };
    }

    function drawFittedImage() {
      const canvas = problemElements.canvas;
      const image = problemState.image;
      if (!image) {
        const hasCanvasContent = problemState.annotations.length > 0 || Boolean(problemState.draft);
        problemCtx.save();
        problemCtx.setLineDash([12, 10]);
        problemCtx.strokeStyle = "rgba(23, 33, 43, 0.22)";
        problemCtx.lineWidth = 2;
        problemCtx.strokeRect(36, 36, canvas.width - 72, canvas.height - 72);
        problemCtx.setLineDash([]);
        if (!hasCanvasContent) {
          problemCtx.fillStyle = "#607080";
          problemCtx.font = "700 28px Segoe UI, Arial, sans-serif";
          problemCtx.textAlign = "center";
          problemCtx.fillText("Загрузите изображение задачи", canvas.width / 2, canvas.height / 2 - 10);
          problemCtx.font = "18px Segoe UI, Arial, sans-serif";
          problemCtx.fillText("После этого можно рисовать поверх него", canvas.width / 2, canvas.height / 2 + 26);
        }
        problemCtx.restore();
        return;
      }

      const padding = 28;
      const scale = Math.min(
        (canvas.width - padding * 2) / image.width,
        (canvas.height - padding * 2) / image.height
      );
      const width = image.width * scale;
      const height = image.height * scale;
      const x = (canvas.width - width) / 2;
      const y = (canvas.height - height) / 2;
      problemState.imageBounds = { x, y, width, height };
      problemCtx.drawImage(image, x, y, width, height);
    }

    function normalizeRect(shape) {
      const x = Math.min(shape.x, shape.x + shape.width);
      const y = Math.min(shape.y, shape.y + shape.height);
      return {
        x,
        y,
        width: Math.abs(shape.width),
        height: Math.abs(shape.height)
      };
    }

    function textBounds(annotation) {
      problemCtx.save();
      problemCtx.font = `700 ${annotation.fontSize}px Segoe UI, Arial, sans-serif`;
      const measured = problemCtx.measureText
        ? problemCtx.measureText(annotation.text).width
        : annotation.text.length * annotation.fontSize * 0.58;
      problemCtx.restore();
      return {
        x: annotation.x - 6,
        y: annotation.y - annotation.fontSize - 8,
        width: measured + 12,
        height: annotation.fontSize + 14
      };
    }

    function pathBounds(annotation) {
      const xs = annotation.points.map((point) => point.x);
      const ys = annotation.points.map((point) => point.y);
      const minX = Math.min(...xs);
      const minY = Math.min(...ys);
      const maxX = Math.max(...xs);
      const maxY = Math.max(...ys);
      return {
        x: minX,
        y: minY,
        width: maxX - minX,
        height: maxY - minY
      };
    }

    function annotationBounds(annotation) {
      if (annotation.type === "text") {
        return textBounds(annotation);
      }
      if (annotation.type === "path") {
        return pathBounds(annotation);
      }
      return normalizeRect(annotation);
    }

    function boundsFromPoints(start, end) {
      return {
        x: Math.min(start.x, end.x),
        y: Math.min(start.y, end.y),
        width: Math.abs(end.x - start.x),
        height: Math.abs(end.y - start.y)
      };
    }

    function boundsIntersect(first, second) {
      return first.x <= second.x + second.width
        && first.x + first.width >= second.x
        && first.y <= second.y + second.height
        && first.y + first.height >= second.y;
    }

    function groupBounds(annotations) {
      if (annotations.length === 0) {
        return { x: 0, y: 0, width: 0, height: 0 };
      }
      const bounds = annotations.map(annotationBounds);
      const minX = Math.min(...bounds.map((item) => item.x));
      const minY = Math.min(...bounds.map((item) => item.y));
      const maxX = Math.max(...bounds.map((item) => item.x + item.width));
      const maxY = Math.max(...bounds.map((item) => item.y + item.height));
      return {
        x: minX,
        y: minY,
        width: maxX - minX,
        height: maxY - minY
      };
    }

    function resizeHandles(bounds) {
      return [
        { name: "nw", x: bounds.x, y: bounds.y },
        { name: "ne", x: bounds.x + bounds.width, y: bounds.y },
        { name: "sw", x: bounds.x, y: bounds.y + bounds.height },
        { name: "se", x: bounds.x + bounds.width, y: bounds.y + bounds.height }
      ];
    }

    function cropHandles(bounds) {
      return [
        { name: "nw", x: bounds.x, y: bounds.y },
        { name: "n", x: bounds.x + bounds.width / 2, y: bounds.y },
        { name: "ne", x: bounds.x + bounds.width, y: bounds.y },
        { name: "e", x: bounds.x + bounds.width, y: bounds.y + bounds.height / 2 },
        { name: "se", x: bounds.x + bounds.width, y: bounds.y + bounds.height },
        { name: "s", x: bounds.x + bounds.width / 2, y: bounds.y + bounds.height },
        { name: "sw", x: bounds.x, y: bounds.y + bounds.height },
        { name: "w", x: bounds.x, y: bounds.y + bounds.height / 2 }
      ];
    }

    function pointInBounds(point, bounds) {
      return point.x >= bounds.x
        && point.x <= bounds.x + bounds.width
        && point.y >= bounds.y
        && point.y <= bounds.y + bounds.height;
    }

    function findResizeHandleAt(point) {
      if (problemState.selectedAnnotationIndexes.length !== 1) {
        return null;
      }
      const annotation = problemState.annotations[problemState.selectedAnnotationIndex];
      if (!annotation || (annotation.type !== "rectangle" && annotation.type !== "oval" && annotation.type !== "image")) {
        return null;
      }
      const handleSize = 10;
      const bounds = annotationBounds(annotation);
      return resizeHandles(bounds).find((handle) => (
        Math.abs(point.x - handle.x) <= handleSize
        && Math.abs(point.y - handle.y) <= handleSize
      ))?.name || null;
    }

    function findCropHandleAt(point) {
      if (problemState.selectedAnnotationIndexes.length !== 1) {
        return null;
      }
      const annotation = problemState.annotations[problemState.selectedAnnotationIndex];
      if (!annotation || annotation.type !== "image") {
        return null;
      }
      const handleSize = 12;
      const bounds = annotationBounds(annotation);
      return cropHandles(bounds).find((handle) => (
        Math.abs(point.x - handle.x) <= handleSize
        && Math.abs(point.y - handle.y) <= handleSize
      ))?.name || null;
    }

    function findAnnotationAt(point) {
      for (let index = problemState.annotations.length - 1; index >= 0; index -= 1) {
        const annotation = problemState.annotations[index];
        const bounds = annotationBounds(annotation);
        if (pointInBounds(point, bounds)) {
          return index;
        }
      }
      return -1;
    }

    function resizeCursor(handle) {
      if (handle === "nw" || handle === "se") {
        return "nwse-resize";
      }
      if (handle === "ne" || handle === "sw") {
        return "nesw-resize";
      }
      if (handle === "n" || handle === "s") {
        return "ns-resize";
      }
      if (handle === "e" || handle === "w") {
        return "ew-resize";
      }
      return "default";
    }

    function setBaseCanvasCursor() {
      if (problemState.tool === "text") {
        problemElements.canvas.style.cursor = "text";
        return;
      }
      if (problemState.tool === "crop") {
        problemElements.canvas.style.cursor = "default";
        return;
      }
      if (problemState.tool === "pen" || problemState.tool === "rectangle" || problemState.tool === "oval") {
        problemElements.canvas.style.cursor = "crosshair";
        return;
      }
      problemElements.canvas.style.cursor = "default";
    }

    function updateCanvasCursor(event) {
      if (problemState.draggingText || problemState.movingAnnotation || problemState.resizingAnnotation || problemState.isDrawing) {
        return;
      }
      if (problemState.tool === "select") {
        const point = canvasPoint(event);
        const handle = findResizeHandleAt(point);
        if (handle) {
          problemElements.canvas.style.cursor = resizeCursor(handle);
          return;
        }
        problemElements.canvas.style.cursor = findAnnotationAt(point) >= 0 ? "move" : "default";
        return;
      }
      if (problemState.tool === "text") {
        const point = canvasPoint(event);
        problemElements.canvas.style.cursor = findTextAt(point) >= 0 ? "move" : "text";
        return;
      }
      if (problemState.tool === "crop") {
        const point = canvasPoint(event);
        const handle = findCropHandleAt(point);
        if (handle) {
          problemElements.canvas.style.cursor = resizeCursor(handle);
          return;
        }
        const hitIndex = findAnnotationAt(point);
        const hitAnnotation = hitIndex >= 0 ? problemState.annotations[hitIndex] : null;
        problemElements.canvas.style.cursor = hitAnnotation?.type === "image" ? "crosshair" : "default";
        return;
      }
      problemElements.canvas.style.cursor = "crosshair";
    }

    function findTextAt(point) {
      for (let index = problemState.annotations.length - 1; index >= 0; index -= 1) {
        const annotation = problemState.annotations[index];
        if (annotation.type !== "text") {
          continue;
        }
        const bounds = textBounds(annotation);
        const insideX = point.x >= bounds.x && point.x <= bounds.x + bounds.width;
        const insideY = point.y >= bounds.y && point.y <= bounds.y + bounds.height;
        if (insideX && insideY) {
          return index;
        }
      }
      return -1;
    }

    function drawSelection(annotation) {
      const bounds = annotationBounds(annotation);
      problemCtx.save();
      problemCtx.setLineDash([7, 6]);
      problemCtx.strokeStyle = "#176b87";
      problemCtx.lineWidth = 2;
      problemCtx.strokeRect(bounds.x, bounds.y, bounds.width, bounds.height);
      problemCtx.setLineDash([]);
      if (annotation.type === "image" && problemState.tool === "crop" && problemState.selectedAnnotationIndexes.length === 1) {
        problemCtx.fillStyle = "rgba(23, 107, 135, 0.14)";
        problemCtx.strokeStyle = "#176b87";
        cropHandles(bounds).forEach((handle) => {
          problemCtx.fillRect(handle.x - 5, handle.y - 5, 10, 10);
          problemCtx.strokeRect(handle.x - 5, handle.y - 5, 10, 10);
        });
      } else if (annotation.type === "rectangle" || annotation.type === "oval" || annotation.type === "image") {
        problemCtx.fillStyle = "#ffffff";
        problemCtx.strokeStyle = "#176b87";
        resizeHandles(bounds).forEach((handle) => {
          problemCtx.fillRect(handle.x - 5, handle.y - 5, 10, 10);
          problemCtx.strokeRect(handle.x - 5, handle.y - 5, 10, 10);
        });
      }
      problemCtx.restore();
    }

    function drawSelectionBox() {
      if (!problemState.selectionBox) {
        return;
      }
      const box = problemState.selectionBox;
      problemCtx.save();
      problemCtx.fillStyle = "rgba(23, 107, 135, 0.1)";
      problemCtx.strokeStyle = "#176b87";
      problemCtx.lineWidth = 2;
      problemCtx.setLineDash([7, 5]);
      problemCtx.fillRect(box.x, box.y, box.width, box.height);
      problemCtx.strokeRect(box.x, box.y, box.width, box.height);
      problemCtx.restore();
    }

    function drawAnnotation(annotation, index) {
      problemCtx.save();
      problemCtx.strokeStyle = annotation.color;
      problemCtx.fillStyle = annotation.color;
      problemCtx.lineWidth = annotation.strokeWidth || annotation.width || 4;
      problemCtx.lineCap = "round";
      problemCtx.lineJoin = "round";

      if (annotation.type === "path") {
        problemCtx.beginPath();
        annotation.points.forEach((point, pointIndex) => {
          if (pointIndex === 0) {
            problemCtx.moveTo(point.x, point.y);
          } else {
            problemCtx.lineTo(point.x, point.y);
          }
        });
        problemCtx.stroke();
      }

      if (annotation.type === "rectangle") {
        const rect = normalizeRect(annotation);
        problemCtx.strokeRect(rect.x, rect.y, rect.width, rect.height);
      }

      if (annotation.type === "oval") {
        const rect = normalizeRect(annotation);
        problemCtx.beginPath();
        problemCtx.ellipse(
          rect.x + rect.width / 2,
          rect.y + rect.height / 2,
          Math.max(rect.width / 2, 1),
          Math.max(rect.height / 2, 1),
          0,
          0,
          Math.PI * 2
        );
        problemCtx.stroke();
      }

      if (annotation.type === "image") {
        const rect = normalizeRect(annotation);
        const crop = normalizeImageCrop(annotation);
        const image = getAnnotationImage(annotation);
        if (image) {
          problemCtx.drawImage(
            image,
            crop.cropX,
            crop.cropY,
            crop.cropWidth,
            crop.cropHeight,
            rect.x,
            rect.y,
            rect.width,
            rect.height
          );
        } else {
          problemCtx.fillStyle = "#edf3f6";
          problemCtx.strokeStyle = "rgba(23, 33, 43, 0.18)";
          problemCtx.lineWidth = 2;
          problemCtx.setLineDash([10, 8]);
          problemCtx.fillRect(rect.x, rect.y, rect.width, rect.height);
          problemCtx.strokeRect(rect.x, rect.y, rect.width, rect.height);
          problemCtx.setLineDash([]);
          problemCtx.fillStyle = "#607080";
          problemCtx.font = "700 20px Segoe UI, Arial, sans-serif";
          problemCtx.textAlign = "center";
          problemCtx.fillText("Загрузка изображения", rect.x + rect.width / 2, rect.y + rect.height / 2);
          getAnnotationImage(annotation, () => {
            drawProblemCanvas();
          });
        }
      }

      if (annotation.type === "text") {
        problemCtx.font = `700 ${annotation.fontSize}px Segoe UI, Arial, sans-serif`;
        if (annotation.isPlaceholder) {
          problemCtx.globalAlpha = 0.45;
        }
        problemCtx.lineWidth = 5;
        problemCtx.strokeStyle = "rgba(255, 255, 255, 0.88)";
        problemCtx.strokeText(annotation.text, annotation.x, annotation.y);
        problemCtx.fillStyle = annotation.color;
        problemCtx.fillText(annotation.text, annotation.x, annotation.y);
      }

      problemCtx.restore();

      if (problemState.selectedAnnotationIndexes.includes(index)) {
        drawSelection(annotation);
      }
    }

    function drawProblemCanvas() {
      const canvas = problemElements.canvas;
      problemCtx.clearRect(0, 0, canvas.width, canvas.height);
      problemCtx.fillStyle = "#ffffff";
      problemCtx.fillRect(0, 0, canvas.width, canvas.height);
      drawFittedImage();
      problemState.annotations.forEach((annotation, index) => drawAnnotation(annotation, index));
      if (problemState.draft) {
        drawAnnotation(problemState.draft, -1);
      }
      drawSelectionBox();
    }

    function closeCanvasTextEditor(commit = true) {
      const editor = problemElements.canvasTextEditor;
      if (problemState.editingTextIndex === null) {
        editor.hidden = true;
        return;
      }
      const annotation = problemState.annotations[problemState.editingTextIndex];
      if (commit && annotation) {
        const value = editor.value;
        annotation.text = value.trim() === "" ? "Текст" : value;
        annotation.isPlaceholder = value.trim() === "";
        problemElements.annotationText.value = value;
        persistVisuals();
        rememberAnnotationState();
      }
      problemState.editingTextIndex = null;
      editor.hidden = true;
      drawProblemCanvas();
    }

    function openCanvasTextEditor(index, point = null, selectAll = false) {
      const annotation = problemState.annotations[index];
      if (!annotation || annotation.type !== "text") {
        return;
      }
      closeCanvasTextEditor(true);
      selectAnnotation(index, problemState.tool === "select" ? "select" : "text");

      const editor = problemElements.canvasTextEditor;
      const bounds = textBounds(annotation);
      const metrics = canvasRectMetrics();
      editor.hidden = false;
      editor.value = annotation.isPlaceholder ? "" : annotation.text;
      editor.placeholder = "Текст";
      editor.style.left = `${metrics.left + bounds.x * metrics.scaleX}px`;
      editor.style.top = `${metrics.top + bounds.y * metrics.scaleY}px`;
      editor.style.width = `${Math.max(bounds.width * metrics.scaleX, 96)}px`;
      editor.style.height = `${Math.max(bounds.height * metrics.scaleY, 34)}px`;
      editor.style.fontSize = `${Math.max(annotation.fontSize * metrics.scaleY, 16)}px`;
      editor.style.color = annotation.color;
      problemState.editingTextIndex = index;

      if (typeof editor.focus === "function") {
        editor.focus();
      }

      const valueLength = editor.value.length;
      let caretPosition = valueLength;
      if (point && valueLength > 0) {
        const relativeX = Math.max(0, point.x - bounds.x);
        caretPosition = Math.min(valueLength, Math.round((relativeX / Math.max(bounds.width, 1)) * valueLength));
      }
      if (typeof editor.setSelectionRange === "function") {
        if (selectAll && valueLength > 0) {
          editor.setSelectionRange(0, valueLength);
        } else {
          editor.setSelectionRange(caretPosition, caretPosition);
        }
      }
    }

    function selectedAnnotations() {
      return problemState.selectedAnnotationIndexes
        .map((index) => problemState.annotations[index])
        .filter(Boolean);
    }

    function syncSelectedTextControls() {
      const isSingleText = problemState.selectedAnnotationIndexes.length === 1
        && problemState.annotations[problemState.selectedAnnotationIndex]?.type === "text";
      if (!isSingleText) {
        problemState.selectedTextIndex = null;
        return;
      }
      const annotation = problemState.annotations[problemState.selectedAnnotationIndex];
      problemState.selectedTextIndex = problemState.selectedAnnotationIndex;
      problemElements.annotationText.value = annotation.text;
      problemElements.strokeColor.value = annotation.color;
      problemElements.fontSize.value = annotation.fontSize;
    }

    function selectAnnotation(index, tool = "select", additive = false) {
      if (additive) {
        const selected = new Set(problemState.selectedAnnotationIndexes);
        if (selected.has(index)) {
          selected.delete(index);
        } else {
          selected.add(index);
        }
        problemState.selectedAnnotationIndexes = [...selected].sort((a, b) => a - b);
        problemState.selectedAnnotationIndex = problemState.selectedAnnotationIndexes.length > 0
          ? problemState.selectedAnnotationIndexes[problemState.selectedAnnotationIndexes.length - 1]
          : null;
        syncSelectedTextControls();
        setTool(tool, true);
        return;
      }

      problemState.selectedAnnotationIndex = index;
      problemState.selectedAnnotationIndexes = [index];
      const annotation = problemState.annotations[index];
      if (annotation) {
        if (annotation.type === "text") {
          problemState.selectedTextIndex = index;
          problemElements.annotationText.value = annotation.text;
          problemElements.strokeColor.value = annotation.color;
          problemElements.fontSize.value = annotation.fontSize;
        } else {
          problemState.selectedTextIndex = null;
          problemElements.strokeColor.value = annotation.color;
          if (annotation.strokeWidth) {
            problemElements.strokeWidth.value = annotation.strokeWidth;
          }
        }
      }
      setTool(tool, true);
    }

    function selectTextAnnotation(index) {
      selectAnnotation(index, "text");
    }

    function clearAnnotationSelection() {
      problemState.selectedAnnotationIndex = null;
      problemState.selectedAnnotationIndexes = [];
      problemState.selectedTextIndex = null;
      problemState.editingTextIndex = null;
      problemElements.canvasTextEditor.hidden = true;
      problemState.movingAnnotation = false;
      problemState.resizingAnnotation = false;
      problemState.croppingAnnotation = false;
      problemState.selectingBox = false;
      problemState.selectionBox = null;
      problemState.resizeHandle = null;
      problemState.cropHandle = null;
      problemState.lastPoint = null;
      problemState.originalAnnotation = null;
    }

    function persistVisuals() {
      activeStage().annotations = cloneAnnotations();
    }

    function moveAnnotation(annotation, dx, dy) {
      if (annotation.type === "path") {
        annotation.points = annotation.points.map((point) => ({
          x: point.x + dx,
          y: point.y + dy
        }));
        return;
      }
      annotation.x += dx;
      annotation.y += dy;
    }

    function resizeAnnotation(annotation, handle, point, original) {
      if (annotation.type !== "rectangle" && annotation.type !== "oval" && annotation.type !== "image") {
        return;
      }
      const rect = normalizeRect(original);
      let left = rect.x;
      let top = rect.y;
      let right = rect.x + rect.width;
      let bottom = rect.y + rect.height;

      if (handle.includes("w")) {
        left = point.x;
      }
      if (handle.includes("e")) {
        right = point.x;
      }
      if (handle.includes("n")) {
        top = point.y;
      }
      if (handle.includes("s")) {
        bottom = point.y;
      }

      const minSize = 12;
      if (Math.abs(right - left) < minSize || Math.abs(bottom - top) < minSize) {
        return;
      }

      annotation.x = left;
      annotation.y = top;
      annotation.width = right - left;
      annotation.height = bottom - top;
    }

    function cropImageAnnotation(annotation, handle, point, original) {
      if (annotation.type !== "image") {
        return;
      }

      const rect = normalizeRect(original);
      const crop = normalizeImageCrop(original);
      const scaleX = rect.width / crop.cropWidth;
      const scaleY = rect.height / crop.cropHeight;
      const minDisplay = 24;
      const minCropPixels = 12;

      let left = rect.x;
      let top = rect.y;
      let right = rect.x + rect.width;
      let bottom = rect.y + rect.height;

      if (handle.includes("w")) {
        left = clamp(point.x, rect.x, right - minDisplay);
      }
      if (handle.includes("e")) {
        right = clamp(point.x, left + minDisplay, rect.x + rect.width);
      }
      if (handle.includes("n")) {
        top = clamp(point.y, rect.y, bottom - minDisplay);
      }
      if (handle.includes("s")) {
        bottom = clamp(point.y, top + minDisplay, rect.y + rect.height);
      }

      const nextWidth = right - left;
      const nextHeight = bottom - top;
      if (nextWidth < minDisplay || nextHeight < minDisplay) {
        return;
      }

      const nextCropX = crop.cropX + (left - rect.x) / scaleX;
      const nextCropY = crop.cropY + (top - rect.y) / scaleY;
      const nextCropWidth = nextWidth / scaleX;
      const nextCropHeight = nextHeight / scaleY;

      if (nextCropWidth < minCropPixels || nextCropHeight < minCropPixels) {
        return;
      }

      annotation.x = left;
      annotation.y = top;
      annotation.width = nextWidth;
      annotation.height = nextHeight;
      annotation.cropX = clamp(nextCropX, 0, crop.naturalWidth - minCropPixels);
      annotation.cropY = clamp(nextCropY, 0, crop.naturalHeight - minCropPixels);
      annotation.cropWidth = clamp(nextCropWidth, minCropPixels, crop.naturalWidth - annotation.cropX);
      annotation.cropHeight = clamp(nextCropHeight, minCropPixels, crop.naturalHeight - annotation.cropY);
      annotation.naturalWidth = crop.naturalWidth;
      annotation.naturalHeight = crop.naturalHeight;
    }

    function addTextAnnotation(point) {
      const style = currentDrawingStyle();
      const fieldText = problemElements.annotationText.value;
      const isPlaceholder = fieldText.trim() === "";
      problemState.annotations.push({
        type: "text",
        x: point.x,
        y: point.y,
        text: isPlaceholder ? "Текст" : fieldText,
        isPlaceholder,
        color: style.color,
        fontSize: style.fontSize,
        strokeWidth: style.width
      });
      const index = problemState.annotations.length - 1;
      selectTextAnnotation(index);
      persistVisuals();
      drawProblemCanvas();
      openCanvasTextEditor(index, point, true);
    }

    function addImageAnnotationFromSource(source, image, targetPoint = null) {
      const style = currentDrawingStyle();
      const frame = fitImageAnnotationToCanvas(image, targetPoint);
      problemState.annotations.push({
        type: "image",
        x: frame.x,
        y: frame.y,
        width: frame.width,
        height: frame.height,
        source,
        naturalWidth: image.naturalWidth || image.width,
        naturalHeight: image.naturalHeight || image.height,
        cropX: 0,
        cropY: 0,
        cropWidth: image.naturalWidth || image.width,
        cropHeight: image.naturalHeight || image.height,
        color: style.color,
        strokeWidth: style.width
      });
      const index = problemState.annotations.length - 1;
      selectAnnotation(index, "select");
      persistVisuals();
      rememberAnnotationState();
      drawProblemCanvas();
    }

    function addImageAnnotationFromBlob(blob) {
      if (!blob) {
        return;
      }

      const reader = new FileReader();
      reader.addEventListener("load", () => {
        const source = String(reader.result || "");
        const image = new Image();
        image.addEventListener("load", () => {
          annotationImageCache.set(source, {
            image,
            loaded: true,
            listeners: []
          });
          const targetPoint = problemState.mouseInCanvas ? problemState.lastCanvasPoint : null;
          addImageAnnotationFromSource(source, image, targetPoint);
        });
        image.src = source;
      });
      reader.readAsDataURL(blob);
    }

    function handleCanvasPaste(event) {
      if (!isCanvasFocusTarget(event.target) && !isCanvasFocusTarget(document.activeElement)) {
        return;
      }
      if (event.target === problemElements.canvasTextEditor || document.activeElement === problemElements.canvasTextEditor) {
        return;
      }

      const items = Array.from(event.clipboardData?.items || []);
      const imageItem = items.find((item) => item.type.startsWith("image/"));
      if (imageItem) {
        event.preventDefault();
        focusProblemEditorSurface();
        closeCanvasTextEditor(true);
        addImageAnnotationFromBlob(imageItem.getAsFile());
        return;
      }

      if (problemState.clipboard?.annotations?.length) {
        event.preventDefault();
        pasteClipboard("paste");
      }
    }

    function updateSelectedText() {
      const index = problemState.selectedTextIndex;
      const annotation = problemState.annotations[index];
      if (!annotation || annotation.type !== "text") {
        return;
      }
      const value = problemElements.annotationText.value;
      annotation.text = value.trim() === "" ? "Текст" : value;
      annotation.isPlaceholder = value.trim() === "";
      annotation.color = problemElements.strokeColor.value;
      annotation.fontSize = Number(problemElements.fontSize.value);
      persistVisuals();
      drawProblemCanvas();
    }

    function startDrawing(event) {
      event.preventDefault();
      focusProblemEditorSurface();
      const point = canvasPoint(event);
      problemState.lastCanvasPoint = point;
      problemState.mouseInCanvas = true;
      if (problemState.editingTextIndex !== null) {
        closeCanvasTextEditor(true);
      }
      if (problemState.tool === "crop") {
        const handle = findCropHandleAt(point);
        if (handle) {
          problemState.croppingAnnotation = true;
          problemState.cropHandle = handle;
          problemState.originalAnnotation = cloneAnnotations([problemState.annotations[problemState.selectedAnnotationIndex]])[0];
          problemElements.canvas.setPointerCapture(event.pointerId);
          return;
        }

        const hitIndex = findAnnotationAt(point);
        const hitAnnotation = hitIndex >= 0 ? problemState.annotations[hitIndex] : null;
        if (hitAnnotation?.type === "image") {
          selectAnnotation(hitIndex, "crop");
        } else {
          clearAnnotationSelection();
        }
        drawProblemCanvas();
        return;
      }
      if (problemState.tool === "select") {
        const additiveSelection = event.shiftKey || event.ctrlKey || event.metaKey;
        const handle = findResizeHandleAt(point);
        if (handle && !additiveSelection) {
          problemState.resizingAnnotation = true;
          problemState.resizeHandle = handle;
          problemState.originalAnnotation = cloneAnnotations([problemState.annotations[problemState.selectedAnnotationIndex]])[0];
          problemElements.canvas.setPointerCapture(event.pointerId);
          return;
        }

        const hitIndex = findAnnotationAt(point);
        if (hitIndex >= 0) {
          if (additiveSelection) {
            selectAnnotation(hitIndex, "select", true);
            drawProblemCanvas();
            return;
          }
          if (!problemState.selectedAnnotationIndexes.includes(hitIndex)) {
            selectAnnotation(hitIndex, "select");
          }
          problemState.movingAnnotation = true;
          problemState.lastPoint = point;
          problemElements.canvas.setPointerCapture(event.pointerId);
          return;
        }

        if (!additiveSelection) {
          clearAnnotationSelection();
        }
        problemState.selectingBox = true;
        problemState.selectionBoxAdditive = additiveSelection;
        problemState.startPoint = point;
        problemState.selectionBox = { x: point.x, y: point.y, width: 0, height: 0 };
        problemElements.canvas.setPointerCapture(event.pointerId);
        drawProblemCanvas();
        return;
      }

      if (problemState.tool === "text") {
        const hitIndex = findTextAt(point);
        if (hitIndex >= 0) {
          openCanvasTextEditor(hitIndex, point);
          return;
        }
        addTextAnnotation(point);
        return;
      }

      clearAnnotationSelection();
      problemState.isDrawing = true;
      problemState.startPoint = point;
      problemState.currentPath = [point];
      const style = currentDrawingStyle();
      if (problemState.tool === "pen") {
        problemState.draft = {
          type: "path",
          points: [...problemState.currentPath],
          color: style.color,
          strokeWidth: style.width
        };
      } else {
        problemState.draft = {
          type: problemState.tool,
          x: point.x,
          y: point.y,
          width: 0,
          height: 0,
          color: style.color,
          strokeWidth: style.width
        };
      }
      problemElements.canvas.setPointerCapture(event.pointerId);
    }

    function continueDrawing(event) {
      const currentPoint = canvasPoint(event);
      problemState.lastCanvasPoint = currentPoint;
      problemState.mouseInCanvas = true;
      if (!problemState.draggingText && !problemState.movingAnnotation && !problemState.resizingAnnotation && !problemState.croppingAnnotation && !problemState.isDrawing) {
        updateCanvasCursor(event);
      }

      if (problemState.draggingText) {
        event.preventDefault();
        const point = canvasPoint(event);
        const annotation = problemState.annotations[problemState.selectedTextIndex];
        if (annotation) {
          annotation.x = point.x - problemState.dragOffset.x;
          annotation.y = point.y - problemState.dragOffset.y;
          drawProblemCanvas();
        }
        return;
      }

      if (problemState.movingAnnotation) {
        event.preventDefault();
        const point = canvasPoint(event);
        if (problemState.lastPoint) {
          const dx = point.x - problemState.lastPoint.x;
          const dy = point.y - problemState.lastPoint.y;
          selectedAnnotations().forEach((annotation) => moveAnnotation(annotation, dx, dy));
          problemState.lastPoint = point;
          drawProblemCanvas();
        }
        return;
      }

      if (problemState.resizingAnnotation) {
        event.preventDefault();
        const point = canvasPoint(event);
        const annotation = problemState.annotations[problemState.selectedAnnotationIndex];
        if (annotation && problemState.originalAnnotation) {
          resizeAnnotation(annotation, problemState.resizeHandle, point, problemState.originalAnnotation);
          drawProblemCanvas();
        }
        return;
      }

      if (problemState.croppingAnnotation) {
        event.preventDefault();
        const point = canvasPoint(event);
        const annotation = problemState.annotations[problemState.selectedAnnotationIndex];
        if (annotation && problemState.originalAnnotation) {
          cropImageAnnotation(annotation, problemState.cropHandle, point, problemState.originalAnnotation);
          drawProblemCanvas();
        }
        return;
      }

      if (problemState.selectingBox) {
        event.preventDefault();
        problemState.selectionBox = boundsFromPoints(problemState.startPoint, currentPoint);
        drawProblemCanvas();
        return;
      }

      if (!problemState.isDrawing) {
        return;
      }
      event.preventDefault();
      const point = currentPoint;
      const style = currentDrawingStyle();
      if (problemState.tool === "pen") {
        problemState.currentPath.push(point);
        problemState.draft = {
          type: "path",
          points: [...problemState.currentPath],
          color: style.color,
          strokeWidth: style.width
        };
      } else {
        problemState.draft = {
          type: problemState.tool,
          x: problemState.startPoint.x,
          y: problemState.startPoint.y,
          width: point.x - problemState.startPoint.x,
          height: point.y - problemState.startPoint.y,
          color: style.color,
          strokeWidth: style.width
        };
      }
      drawProblemCanvas();
    }

    function finishDrawing(event) {
      if (problemState.draggingText) {
        event.preventDefault();
        problemState.draggingText = false;
        persistVisuals();
        drawProblemCanvas();
        return;
      }

      if (problemState.selectingBox) {
        event.preventDefault();
        const box = problemState.selectionBox;
        const selected = box && box.width > 4 && box.height > 4
          ? problemState.annotations
              .map((annotation, index) => ({ annotation, index }))
              .filter(({ annotation }) => boundsIntersect(annotationBounds(annotation), box))
              .map(({ index }) => index)
          : [];
        const nextSelection = new Set(problemState.selectionBoxAdditive ? problemState.selectedAnnotationIndexes : []);
        selected.forEach((index) => nextSelection.add(index));
        problemState.selectedAnnotationIndexes = [...nextSelection].sort((a, b) => a - b);
        problemState.selectedAnnotationIndex = problemState.selectedAnnotationIndexes.length > 0
          ? problemState.selectedAnnotationIndexes[problemState.selectedAnnotationIndexes.length - 1]
          : null;
        syncSelectedTextControls();
        problemState.selectingBox = false;
        problemState.selectionBox = null;
        problemState.selectionBoxAdditive = false;
        drawProblemCanvas();
        return;
      }

      if (problemState.movingAnnotation || problemState.resizingAnnotation) {
        event.preventDefault();
        problemState.movingAnnotation = false;
        problemState.resizingAnnotation = false;
        problemState.resizeHandle = null;
        problemState.lastPoint = null;
        problemState.originalAnnotation = null;
        persistVisuals();
        rememberAnnotationState();
        drawProblemCanvas();
        return;
      }

      if (problemState.croppingAnnotation) {
        event.preventDefault();
        problemState.croppingAnnotation = false;
        problemState.cropHandle = null;
        problemState.originalAnnotation = null;
        persistVisuals();
        rememberAnnotationState();
        drawProblemCanvas();
        return;
      }

      if (!problemState.isDrawing) {
        return;
      }
      event.preventDefault();
      const draft = problemState.draft;
      problemState.isDrawing = false;
      problemState.currentPath = [];
      problemState.startPoint = null;
      problemState.draft = null;

      if (draft && draft.type === "path" && draft.points.length > 1) {
        problemState.annotations.push(draft);
      }
      if (draft && draft.type !== "path" && Math.abs(draft.width) > 4 && Math.abs(draft.height) > 4) {
        problemState.annotations.push(draft);
      }
      persistVisuals();
      rememberAnnotationState();
      drawProblemCanvas();
    }

    function copySelectedAnnotations() {
      const selected = selectedAnnotations();
      if (selected.length === 0) {
        return;
      }
      problemState.clipboard = {
        annotations: cloneAnnotations(selected),
        bounds: groupBounds(selected)
      };
    }

    function offsetAnnotation(annotation, dx, dy) {
      const cloned = cloneAnnotations([annotation])[0];
      moveAnnotation(cloned, dx, dy);
      return cloned;
    }

    function pasteClipboard(mode = "paste") {
      if (!problemState.clipboard || problemState.clipboard.annotations.length === 0) {
        return;
      }

      const copied = cloneAnnotations(problemState.clipboard.annotations);
      const copiedBounds = problemState.clipboard.bounds;
      let target = null;
      const selected = selectedAnnotations();
      if (selected.length > 0) {
        const selectedBounds = groupBounds(selected);
        target = { x: selectedBounds.x + 24, y: selectedBounds.y + 24 };
      } else if (problemState.mouseInCanvas && problemState.lastCanvasPoint) {
        target = { x: problemState.lastCanvasPoint.x, y: problemState.lastCanvasPoint.y };
      } else {
        target = {
          x: (problemElements.canvas.width - copiedBounds.width) / 2,
          y: (problemElements.canvas.height - copiedBounds.height) / 2
        };
      }

      const dx = mode === "duplicate" ? 24 : target.x - copiedBounds.x;
      const dy = mode === "duplicate" ? 24 : target.y - copiedBounds.y;
      const firstNewIndex = problemState.annotations.length;
      copied.forEach((annotation) => {
        problemState.annotations.push(offsetAnnotation(annotation, dx, dy));
      });
      problemState.selectedAnnotationIndexes = copied.map((_, index) => firstNewIndex + index);
      problemState.selectedAnnotationIndex = problemState.selectedAnnotationIndexes.length > 0
        ? problemState.selectedAnnotationIndexes[problemState.selectedAnnotationIndexes.length - 1]
        : null;
      syncSelectedTextControls();
      persistVisuals();
      rememberAnnotationState();
      setTool("select", true);
      drawProblemCanvas();
    }

    function duplicateSelectedAnnotations() {
      copySelectedAnnotations();
      pasteClipboard("duplicate");
    }

    function deleteSelectedAnnotation() {
      const indexes = [...problemState.selectedAnnotationIndexes].sort((a, b) => b - a);
      if (indexes.length === 0) {
        return;
      }
      indexes.forEach((index) => {
        problemState.annotations.splice(index, 1);
      });
      clearAnnotationSelection();
      persistVisuals();
      rememberAnnotationState();
      drawProblemCanvas();
    }

    function transferPreviousAnnotations() {
      if (problemState.activeStageIndex === 0) {
        return;
      }
      persistActiveStage();
      const previousStage = problemState.stages[problemState.activeStageIndex - 1];
      if (problemState.annotations.length > 0 && !confirm("Заменить текущие рисунки рисунками предыдущего этапа?")) {
        return;
      }
      problemState.annotations = cloneAnnotations(previousStage.annotations);
      clearAnnotationSelection();
      persistVisuals();
      rememberAnnotationState();
      drawProblemCanvas();
    }

    document.querySelectorAll("[data-tool]").forEach((button) => {
      button.addEventListener("click", () => setTool(button.dataset.tool));
    });

    problemElements.canvas.addEventListener("pointerdown", startDrawing);
    problemElements.canvas.addEventListener("pointermove", continueDrawing);
    problemElements.canvas.addEventListener("pointerup", finishDrawing);
    problemElements.canvas.addEventListener("pointercancel", finishDrawing);
    problemElements.canvasShell.addEventListener("pointerdown", (event) => {
      if (event.target !== problemElements.canvasTextEditor) {
        focusProblemEditorSurface();
      }
    });
    problemElements.canvas.addEventListener("dblclick", (event) => {
      if (problemState.tool !== "select") {
        return;
      }
      const point = canvasPoint(event);
      const textIndex = findTextAt(point);
      if (textIndex < 0) {
        return;
      }
      event.preventDefault();
      openCanvasTextEditor(textIndex, point);
    });
    problemElements.canvas.addEventListener("pointerleave", finishDrawing);
    problemElements.canvas.addEventListener("pointerenter", () => {
      problemState.mouseInCanvas = true;
    });
    problemElements.canvas.addEventListener("pointerleave", () => {
      problemState.mouseInCanvas = false;
      setBaseCanvasCursor();
    });
    document.addEventListener("paste", handleCanvasPaste);

    problemElements.imageUpload.addEventListener("change", () => {
      const file = problemElements.imageUpload.files[0];
      if (!file) {
        return;
      }
      const reader = new FileReader();
      reader.addEventListener("load", () => {
        const image = new Image();
        image.addEventListener("load", () => {
          problemState.image = image;
          problemElements.imageName.textContent = file.name;
          resizeProblemCanvasDisplay();
          drawProblemCanvas();
        });
        image.src = reader.result;
      });
      reader.readAsDataURL(file);
    });

    problemElements.stageTabs.addEventListener("click", (event) => {
      const tab = event.target.closest("[data-stage-index]");
      if (tab) {
        switchStage(Number(tab.dataset.stageIndex));
      }
    });

    problemElements.addStage.addEventListener("click", addStage);
    problemElements.saveStage.addEventListener("click", saveStage);
    problemElements.transferPrevious.addEventListener("click", transferPreviousAnnotations);
    problemElements.sidebarToggle.addEventListener("click", () => {
      toggleProblemPanel("sidebar");
    });
    problemElements.uploadToggle.addEventListener("click", () => {
      toggleProblemPanel("upload");
    });
    problemElements.toolsToggle.addEventListener("click", () => {
      toggleProblemPanel("tools");
    });
    problemElements.toggleCanvasFocus.addEventListener("click", () => {
      toggleProblemFocusMode();
    });

    problemElements.stageTitle.addEventListener("input", () => {
      activeStage().title = problemElements.stageTitle.value.trim() || `Этап ${problemState.activeStageIndex + 1}`;
      renderStageTabs();
    });

    problemElements.stageSolution.addEventListener("input", () => {
      activeStage().solution = problemElements.stageSolution.value;
    });

    problemElements.addSubstep.addEventListener("click", () => {
      const text = problemElements.substepText.value.trim();
      if (!text) {
        return;
      }
      activeStage().substeps.push(text);
      problemElements.substepText.value = "";
      renderSubsteps();
    });

    problemElements.substepText.addEventListener("keydown", (event) => {
      if (event.key === "Enter") {
        event.preventDefault();
        problemElements.addSubstep.click();
      }
    });

    document.addEventListener("keydown", (event) => {
      if (problemState.fullscreen && event.key === "Escape" && event.target !== problemElements.canvasTextEditor) {
        event.preventDefault();
        setProblemFocusMode(false);
        return;
      }

      if (isTypingTarget(event.target) && event.target !== problemElements.canvasTextEditor) {
        return;
      }

      if (event.target === problemElements.canvasTextEditor) {
        if (event.key === "Enter") {
          event.preventDefault();
          closeCanvasTextEditor(true);
        }
        if (event.key === "Escape") {
          event.preventDefault();
          closeCanvasTextEditor(true);
        }
        return;
      }

      if (event.key === "Delete" || event.key === "Backspace") {
        event.preventDefault();
        deleteSelectedAnnotation();
        return;
      }
      const modifierPressed = event.ctrlKey || event.metaKey;
      if (modifierPressed && event.code === "KeyA") {
        event.preventDefault();
        selectAllAnnotations();
        return;
      }
      if (modifierPressed && event.code === "KeyC") {
        event.preventDefault();
        copySelectedAnnotations();
        return;
      }
      if (modifierPressed && event.code === "KeyV") {
        if (isCanvasFocusTarget(event.target) || isCanvasFocusTarget(document.activeElement)) {
          return;
        }
        event.preventDefault();
        pasteClipboard("paste");
        return;
      }
      if (modifierPressed && event.code === "KeyD") {
        event.preventDefault();
        duplicateSelectedAnnotations();
        return;
      }
      if (modifierPressed && event.code === "KeyZ" && !event.shiftKey) {
        event.preventDefault();
        undoAnnotations();
        return;
      }
      if (modifierPressed && (event.code === "KeyY" || (event.code === "KeyZ" && event.shiftKey))) {
        event.preventDefault();
        redoAnnotations();
      }
    });

    problemElements.undo.addEventListener("click", () => {
      undoAnnotations();
    });

    problemElements.deleteSelected.addEventListener("click", () => {
      deleteSelectedAnnotation();
    });

    problemElements.clear.addEventListener("click", () => {
      if (problemState.annotations.length === 0 || confirm("Очистить все пометки на текущем рисунке?")) {
        problemState.annotations = [];
        clearAnnotationSelection();
        persistVisuals();
        rememberAnnotationState();
        drawProblemCanvas();
      }
    });

    problemElements.download.addEventListener("click", () => {
      const link = document.createElement("a");
      link.download = "annotated-task.png";
      link.href = problemElements.canvas.toDataURL("image/png");
      link.click();
    });

    problemElements.canvasTextEditor.addEventListener("input", () => {
      const annotation = problemState.annotations[problemState.editingTextIndex];
      if (!annotation) {
        return;
      }
      const value = problemElements.canvasTextEditor.value;
      annotation.text = value.trim() === "" ? "Текст" : value;
      annotation.isPlaceholder = value.trim() === "";
      problemElements.annotationText.value = value;
      persistVisuals();
      drawProblemCanvas();
    });

    problemElements.canvasTextEditor.addEventListener("blur", () => {
      closeCanvasTextEditor(true);
    });

    problemElements.annotationText.addEventListener("input", updateSelectedText);
    problemElements.annotationText.addEventListener("change", () => {
      if (problemState.selectedTextIndex !== null) {
        rememberAnnotationState();
      }
    });
    problemElements.strokeColor.addEventListener("input", () => {
      const selected = selectedAnnotations();
      if (selected.length > 0) {
        selected.forEach((annotation) => {
          annotation.color = problemElements.strokeColor.value;
        });
        persistVisuals();
        drawProblemCanvas();
        return;
      }
      drawProblemCanvas();
    });
    problemElements.strokeColor.addEventListener("change", () => {
      if (selectedAnnotations().length > 0) {
        rememberAnnotationState();
      }
    });
    problemElements.strokeWidth.addEventListener("input", () => {
      const selected = selectedAnnotations().filter((annotation) => annotation.type !== "text");
      if (selected.length > 0) {
        selected.forEach((annotation) => {
          annotation.strokeWidth = Number(problemElements.strokeWidth.value);
        });
        persistVisuals();
      }
      drawProblemCanvas();
    });
    problemElements.strokeWidth.addEventListener("change", () => {
      if (selectedAnnotations().some((annotation) => annotation.type !== "text")) {
        rememberAnnotationState();
      }
    });
    problemElements.fontSize.addEventListener("input", () => {
      if (problemState.selectedTextIndex !== null) {
        updateSelectedText();
        return;
      }
      drawProblemCanvas();
    });
    problemElements.fontSize.addEventListener("change", () => {
      if (problemState.selectedTextIndex !== null) {
        rememberAnnotationState();
      }
    });

    window.addEventListener("resize", () => {
      resizeProblemCanvasDisplay();
      drawProblemCanvas();
    });

    Object.keys(problemPanelConfig).forEach((name) => {
      applyProblemPanelState(name);
    });

    setBaseCanvasCursor();
    resizeProblemCanvasDisplay();
    loadActiveStageIntoForm();
