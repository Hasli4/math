    const state = {
      operation: "add",
      steps: [],
      visibleSteps: 0
    };

    const fields = {
      leftWhole: document.getElementById("leftWhole"),
      leftNum: document.getElementById("leftNum"),
      leftDen: document.getElementById("leftDen"),
      rightWhole: document.getElementById("rightWhole"),
      rightNum: document.getElementById("rightNum"),
      rightDen: document.getElementById("rightDen"),
      showReduction: document.getElementById("showReduction"),
      showMixed: document.getElementById("showMixed")
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
      operationReadable: document.getElementById("operationReadable"),
      leftPie: document.getElementById("leftPie"),
      rightPie: document.getElementById("rightPie")
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

    function makeStep(title, explain, math) {
      return { title, explain, math };
    }

    function getConversionStep(label, input) {
      const absWhole = Math.abs(input.whole);
      const absNum = Math.abs(input.inputNumerator);
      const absDen = Math.abs(input.inputDenominator);
      if (input.whole === 0) {
        return makeStep(
          `${label}: дробь уже обыкновенная`,
          "Целой части нет, поэтому можно сразу работать с числителем и знаменателем.",
          expression([htmlFraction(input.num, input.den)])
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
        ])
      );
    }

    function buildAddSubtractSteps(left, right, operation) {
      const steps = [
        getConversionStep("Первая дробь", left),
        getConversionStep("Вторая дробь", right)
      ];
      const commonDen = lcm(left.den, right.den);
      const leftFactor = commonDen / left.den;
      const rightFactor = commonDen / right.den;
      const leftNum = left.num * leftFactor;
      const rightNum = right.num * rightFactor;
      const isSameDen = left.den === right.den;

      steps.push(makeStep(
        isSameDen ? "Знаменатели уже одинаковые" : "Приводим к общему знаменателю",
        isSameDen
          ? "У обеих дробей один знаменатель, поэтому меняем только числители на следующем шаге."
          : `НОК знаменателей ${left.den} и ${right.den} равен ${commonDen}. Домножаем каждую дробь на свой дополнительный множитель.`,
        isSameDen
          ? expression([htmlFraction(left.num, left.den), operationMeta[operation].symbol, htmlFraction(right.num, right.den)])
          : expression([
              htmlFraction(left.num, left.den),
              "=",
              htmlFraction(leftNum, commonDen),
              `<span class="math-op">${operationMeta[operation].symbol}</span>`,
              htmlFraction(right.num, right.den),
              "=",
              htmlFraction(rightNum, commonDen)
            ])
      ));

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
        ])
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
        factors: [first, second].filter((item) => item > 1)
      };
    }

    function buildMultiplySteps(left, right, options = {}) {
      const steps = [
        getConversionStep("Первая дробь", left),
        getConversionStep("Вторая дробь", right)
      ];
      const useCancel = options.showReduction !== false;
      const canceled = crossCancel(left, right);
      const hasCancellation = useCancel && canceled.factors.length > 0;
      const multLeft = hasCancellation ? canceled.left : left;
      const multRight = hasCancellation ? canceled.right : right;

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
          ])
        ));
      } else {
        steps.push(makeStep(
          "Проверяем возможность сокращения",
          "Подходящих общих делителей для сокращения крест-накрест нет, поэтому умножаем дроби как есть.",
          expression([htmlFraction(left.num, left.den), "×", htmlFraction(right.num, right.den)])
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
        ])
      ));

      appendFinishSteps(steps, rawResult);
      return steps;
    }

    function buildDivideSteps(left, right) {
      if (right.num === 0) {
        throw new Error("На ноль делить нельзя: вторая дробь равна нулю.");
      }
      const steps = [
        getConversionStep("Первая дробь", left),
        getConversionStep("Вторая дробь", right)
      ];
      const reciprocal = normalize({ num: right.den, den: right.num });

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
        ])
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
          ])
        ));
      } else if (showReduction) {
        steps.push(makeStep(
          "Проверяем сокращение",
          "У числителя и знаменателя нет общего делителя больше 1, дробь уже несократимая.",
          expression([htmlFraction(reduced.num, reduced.den)])
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
          ])
        ));
      }

      const finalResult = reduce(rawResult);
      steps.push(makeStep(
        "Ответ",
        "Финальный результат записан в удобном виде.",
        expression([fields.showMixed.checked ? htmlMixed(finalResult) : htmlFraction(finalResult.num, finalResult.den)])
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

    function renderEquation(left, right) {
      elements.equation.innerHTML = expression([
        htmlMixed(left),
        `<span class="math-op">${operationMeta[state.operation].symbol}</span>`,
        htmlMixed(right)
      ]);
    }

    function renderSteps() {
      if (state.steps.length === 0) {
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
      elements.steps.innerHTML = visible.map((step, index) => `
        <article class="step-card">
          <div class="step-index">${index + 1}</div>
          <div class="step-content">
            <h3 class="step-title">${step.title}</h3>
            <p class="step-explain">${step.explain}</p>
            <div class="step-math">${step.math}</div>
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
        renderEquation(result.left, result.right);
        renderSteps();
      } catch (error) {
        renderError(error.message);
      }
    }

    function setOperation(operation) {
      state.operation = operation;
      document.querySelectorAll("[data-operation]").forEach((button) => {
        button.classList.toggle("active", button.dataset.operation === operation);
      });
      elements.operationReadable.textContent = operationMeta[operation].text;
    }

    function updatePreview(prefix) {
      try {
        const frac = parseFraction(prefix);
        const readableTarget = prefix === "left" ? elements.leftReadable : elements.rightReadable;
        const pieTarget = prefix === "left" ? elements.leftPie : elements.rightPie;
        const reduced = reduce(frac);
        readableTarget.textContent = plainFraction(reduced, true);
        const ratio = Math.abs(reduced.num / reduced.den);
        const fill = Math.min(100, Math.round((ratio % 1 || (ratio > 0 ? 1 : 0)) * 100));
        pieTarget.style.setProperty("--fill", `${fill}%`);
      } catch (error) {
        const readableTarget = prefix === "left" ? elements.leftReadable : elements.rightReadable;
        readableTarget.textContent = "ошибка";
      }
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

    document.querySelectorAll("[data-operation]").forEach((button) => {
      button.addEventListener("click", () => setOperation(button.dataset.operation));
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

    updateAllPreviews();
    handleSolve(new Event("submit"));

    const viewButtons = document.querySelectorAll("[data-view]");
    const viewSections = document.querySelectorAll("[data-view-section]");
    const subtitle = document.querySelector(".subtitle");
    const subtitles = {
      fractions: "Дроби: сложение, вычитание, умножение и деление.",
      problems: "Задачи: условие, рисунок и пошаговые пояснения."
    };

    function setView(view) {
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
        drawProblemCanvas();
      }
    }

    viewButtons.forEach((button) => {
      button.addEventListener("click", () => setView(button.dataset.view));
    });

    const problemElements = {
      condition: document.getElementById("problemCondition"),
      imageUpload: document.getElementById("imageUpload"),
      imageName: document.getElementById("imageName"),
      stageTabs: document.getElementById("stageTabs"),
      addStage: document.getElementById("addStage"),
      stageTitle: document.getElementById("stageTitle"),
      stageSolution: document.getElementById("stageSolution"),
      saveStage: document.getElementById("saveStage"),
      substepText: document.getElementById("substepText"),
      addSubstep: document.getElementById("addSubstep"),
      substepsList: document.getElementById("substepsList"),
      canvas: document.getElementById("problemCanvas"),
      strokeColor: document.getElementById("strokeColor"),
      strokeWidth: document.getElementById("strokeWidth"),
      fontSize: document.getElementById("fontSize"),
      annotationText: document.getElementById("annotationText"),
      undo: document.getElementById("undoAnnotation"),
      clear: document.getElementById("clearAnnotations"),
      download: document.getElementById("downloadCanvas")
    };

    function createStage(number) {
      return {
        title: `Этап ${number}`,
        solution: "",
        substeps: [],
        annotations: []
      };
    }

    const problemState = {
      tool: "pen",
      stages: [createStage(1)],
      activeStageIndex: 0,
      annotations: [],
      selectedTextIndex: null,
      draggingText: false,
      dragOffset: { x: 0, y: 0 },
      image: null,
      imageBounds: null,
      isDrawing: false,
      currentPath: [],
      startPoint: null,
      draft: null
    };

    const problemCtx = problemElements.canvas.getContext("2d");

    function escapeHtml(value) {
      return value
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;");
    }

    function cloneAnnotations(source = problemState.annotations) {
      return JSON.parse(JSON.stringify(source));
    }

    function activeStage() {
      return problemState.stages[problemState.activeStageIndex];
    }

    function persistActiveStage() {
      const stage = activeStage();
      if (!stage) {
        return;
      }
      stage.title = problemElements.stageTitle.value.trim() || `Этап ${problemState.activeStageIndex + 1}`;
      stage.solution = problemElements.stageSolution.value;
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
      problemState.annotations = cloneAnnotations(stage.annotations);
      problemState.selectedTextIndex = null;
      problemElements.substepText.value = "";
      renderStageTabs();
      renderSubsteps();
      drawProblemCanvas();
    }

    function switchStage(index) {
      if (index < 0 || index >= problemState.stages.length) {
        return;
      }
      persistActiveStage();
      problemState.activeStageIndex = index;
      loadActiveStageIntoForm();
    }

    function addStage() {
      persistActiveStage();
      problemState.stages.push(createStage(problemState.stages.length + 1));
      problemState.activeStageIndex = problemState.stages.length - 1;
      loadActiveStageIntoForm();
    }

    function saveStage() {
      persistActiveStage();
      renderStageTabs();
      renderSubsteps();
    }

    function setTool(tool, keepSelection = false) {
      problemState.tool = tool;
      if (tool !== "text" && !keepSelection) {
        problemState.selectedTextIndex = null;
      }
      document.querySelectorAll("[data-tool]").forEach((button) => {
        button.classList.toggle("active", button.dataset.tool === tool);
      });
      drawProblemCanvas();
    }

    function canvasPoint(event) {
      const rect = problemElements.canvas.getBoundingClientRect();
      return {
        x: (event.clientX - rect.left) * (problemElements.canvas.width / rect.width),
        y: (event.clientY - rect.top) * (problemElements.canvas.height / rect.height)
      };
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
        problemCtx.save();
        problemCtx.setLineDash([12, 10]);
        problemCtx.strokeStyle = "rgba(23, 33, 43, 0.22)";
        problemCtx.lineWidth = 2;
        problemCtx.strokeRect(36, 36, canvas.width - 72, canvas.height - 72);
        problemCtx.setLineDash([]);
        problemCtx.fillStyle = "#607080";
        problemCtx.font = "700 28px Segoe UI, Arial, sans-serif";
        problemCtx.textAlign = "center";
        problemCtx.fillText("Загрузите изображение задачи", canvas.width / 2, canvas.height / 2 - 10);
        problemCtx.font = "18px Segoe UI, Arial, sans-serif";
        problemCtx.fillText("После этого можно рисовать поверх него", canvas.width / 2, canvas.height / 2 + 26);
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
      const bounds = textBounds(annotation);
      problemCtx.save();
      problemCtx.setLineDash([7, 6]);
      problemCtx.strokeStyle = "#176b87";
      problemCtx.lineWidth = 2;
      problemCtx.strokeRect(bounds.x, bounds.y, bounds.width, bounds.height);
      problemCtx.setLineDash([]);
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

      if (annotation.type === "text") {
        problemCtx.font = `700 ${annotation.fontSize}px Segoe UI, Arial, sans-serif`;
        problemCtx.lineWidth = 5;
        problemCtx.strokeStyle = "rgba(255, 255, 255, 0.88)";
        problemCtx.strokeText(annotation.text, annotation.x, annotation.y);
        problemCtx.fillStyle = annotation.color;
        problemCtx.fillText(annotation.text, annotation.x, annotation.y);
      }

      problemCtx.restore();

      if (annotation.type === "text" && index === problemState.selectedTextIndex) {
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
    }

    function selectTextAnnotation(index) {
      problemState.selectedTextIndex = index;
      const annotation = problemState.annotations[index];
      if (annotation) {
        problemElements.annotationText.value = annotation.text;
        problemElements.strokeColor.value = annotation.color;
        problemElements.fontSize.value = annotation.fontSize;
      }
      setTool("text", true);
    }

    function persistVisuals() {
      activeStage().annotations = cloneAnnotations();
    }

    function addTextAnnotation(point) {
      const style = currentDrawingStyle();
      const text = problemElements.annotationText.value.trim() || "Текст";
      problemState.annotations.push({
        type: "text",
        x: point.x,
        y: point.y,
        text,
        color: style.color,
        fontSize: style.fontSize,
        strokeWidth: style.width
      });
      selectTextAnnotation(problemState.annotations.length - 1);
      persistVisuals();
      drawProblemCanvas();
    }

    function updateSelectedText() {
      const index = problemState.selectedTextIndex;
      const annotation = problemState.annotations[index];
      if (!annotation || annotation.type !== "text") {
        return;
      }
      annotation.text = problemElements.annotationText.value.trim() || "Текст";
      annotation.color = problemElements.strokeColor.value;
      annotation.fontSize = Number(problemElements.fontSize.value);
      persistVisuals();
      drawProblemCanvas();
    }

    function startDrawing(event) {
      event.preventDefault();
      const point = canvasPoint(event);
      if (problemState.tool === "text") {
        const hitIndex = findTextAt(point);
        if (hitIndex >= 0) {
          const annotation = problemState.annotations[hitIndex];
          selectTextAnnotation(hitIndex);
          problemState.draggingText = true;
          problemState.dragOffset = {
            x: point.x - annotation.x,
            y: point.y - annotation.y
          };
          problemElements.canvas.setPointerCapture(event.pointerId);
          return;
        }
        addTextAnnotation(point);
        return;
      }

      problemState.selectedTextIndex = null;
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

      if (!problemState.isDrawing) {
        return;
      }
      event.preventDefault();
      const point = canvasPoint(event);
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
      drawProblemCanvas();
    }

    document.querySelectorAll("[data-tool]").forEach((button) => {
      button.addEventListener("click", () => setTool(button.dataset.tool));
    });

    problemElements.canvas.addEventListener("pointerdown", startDrawing);
    problemElements.canvas.addEventListener("pointermove", continueDrawing);
    problemElements.canvas.addEventListener("pointerup", finishDrawing);
    problemElements.canvas.addEventListener("pointercancel", finishDrawing);
    problemElements.canvas.addEventListener("pointerleave", finishDrawing);

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

    problemElements.undo.addEventListener("click", () => {
      problemState.annotations.pop();
      problemState.selectedTextIndex = null;
      persistVisuals();
      drawProblemCanvas();
    });

    problemElements.clear.addEventListener("click", () => {
      if (problemState.annotations.length === 0 || confirm("Очистить все пометки на текущем рисунке?")) {
        problemState.annotations = [];
        problemState.selectedTextIndex = null;
        persistVisuals();
        drawProblemCanvas();
      }
    });

    problemElements.download.addEventListener("click", () => {
      const link = document.createElement("a");
      link.download = "annotated-task.png";
      link.href = problemElements.canvas.toDataURL("image/png");
      link.click();
    });

    problemElements.annotationText.addEventListener("input", updateSelectedText);
    problemElements.strokeColor.addEventListener("input", () => {
      if (problemState.selectedTextIndex !== null) {
        updateSelectedText();
        return;
      }
      drawProblemCanvas();
    });
    problemElements.strokeWidth.addEventListener("input", drawProblemCanvas);
    problemElements.fontSize.addEventListener("input", () => {
      if (problemState.selectedTextIndex !== null) {
        updateSelectedText();
        return;
      }
      drawProblemCanvas();
    });

    loadActiveStageIntoForm();
