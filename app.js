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
      transferPrevious: document.getElementById("transferPreviousAnnotations"),
      substepText: document.getElementById("substepText"),
      addSubstep: document.getElementById("addSubstep"),
      substepsList: document.getElementById("substepsList"),
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
      if (tool !== "text" && !keepSelection) {
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
      if (!annotation || (annotation.type !== "rectangle" && annotation.type !== "oval")) {
        return null;
      }
      const handleSize = 10;
      const bounds = annotationBounds(annotation);
      return resizeHandles(bounds).find((handle) => (
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
      return "default";
    }

    function setBaseCanvasCursor() {
      if (problemState.tool === "text") {
        problemElements.canvas.style.cursor = "text";
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
      if (annotation.type === "rectangle" || annotation.type === "oval") {
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
      problemState.selectingBox = false;
      problemState.selectionBox = null;
      problemState.resizeHandle = null;
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
      if (annotation.type !== "rectangle" && annotation.type !== "oval") {
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
      const point = canvasPoint(event);
      problemState.lastCanvasPoint = point;
      problemState.mouseInCanvas = true;
      if (problemState.editingTextIndex !== null) {
        closeCanvasTextEditor(true);
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
      if (!problemState.draggingText && !problemState.movingAnnotation && !problemState.resizingAnnotation && !problemState.isDrawing) {
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
    problemElements.transferPrevious.addEventListener("click", transferPreviousAnnotations);

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

    setBaseCanvasCursor();
    loadActiveStageIntoForm();
