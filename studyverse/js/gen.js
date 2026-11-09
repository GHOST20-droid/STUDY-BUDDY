/* Practice engine: numerical generators with verified answers, conceptual MCQs, flashcards. */
(function (SV) {
  const { inr, uid } = SV;
  const R = a => a[Math.floor(Math.random() * a.length)];
  const x4 = v => v.toFixed(4);
  const shuf = a => { const b = a.slice(); for (let i = b.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [b[i], b[j]] = [b[j], b[i]]; } return b; };
  const MN = { 2: 'half-yearly', 4: 'quarterly', 12: 'monthly' };
  const lk = n => '₹' + n.toLocaleString('en-IN');
  function fmtAns(q, v) { return q.unit === '₹' ? inr(v) : q.unit === '%' ? v.toFixed(2) + '%' : q.unit === 'days' ? Math.round(v) + ' days' : v.toFixed(2) + '×'; }
  function N(topicId, prompt, given, ans, unit, correct, wrong, steps, traps) {
    const opts = shuf([correct].concat(wrong)); const q = { id: uid(), topicId, kind: 'num', source: 'generated', prompt, given, answer: ans, unit, formulas: opts, fi: opts.indexOf(correct), steps: steps.slice(), traps: traps || [] };
    q.tol = unit === '%' ? 0.05 : unit === '₹' ? Math.max(1, Math.abs(ans) * .002) : 0.5; q.steps.push('Answer: ' + fmtAns(q, ans)); return q;
  }
  const GEN = {
    fv() { const P = R([10000, 25000, 50000, 100000]), r = R([6, 8, 9, 10, 12]), n = R([3, 4, 5, 6]), g = (1 + r / 100) ** n, a = P * g;
      return N('fv', `${lk(P)} is invested at ${r}% per annum, compounded annually, for ${n} years. Find the future value.`, [['Principal (PV)', lk(P)], ['Rate (r)', r + '%'], ['Years (n)', n]], a, '₹', 'FV = PV × (1 + r)^n', ['FV = PV × (1 + r × n)', 'FV = PV ÷ (1 + r)^n', 'FV = PV × r × n'],
        ['Identify: money moves forward in time at a compound rate, so this is the future value of a lump sum.', 'Formula: FV = PV × (1 + r)^n. PV is today\'s amount, r the yearly rate, n the number of years.', `Substitute: FV = ${P} × (1 + ${r / 100})^${n}`, `Calculate: (1 + ${r / 100})^${n} = ${x4(g)}, then ${P} × ${x4(g)} = ${Math.round(a)}`],
        [{ v: P * (1 + r / 100 * n), l: 'Used simple interest instead of compounding' }]); },
    pv() { const F = R([13310, 20000, 50000, 100000]), r = R([8, 10, 12, 15]), n = R([2, 3, 4, 5]), g = (1 + r / 100) ** n, a = F / g;
      return N('pv', `${lk(F)} will be received after ${n} years. The discount rate is ${r}% per annum. Find the present value.`, [['Future amount (FV)', lk(F)], ['Discount rate (r)', r + '%'], ['Years (n)', n]], a, '₹', 'PV = FV ÷ (1 + r)^n', ['PV = FV × (1 + r)^n', 'PV = FV × (1 − r × n)', 'PV = FV ÷ (r × n)'],
        ['Identify: a future amount must be brought back to today, so we discount. PV is smaller than FV.', 'Formula: PV = FV ÷ (1 + r)^n.', `Substitute: PV = ${F} ÷ (1 + ${r / 100})^${n}`, `Calculate: (1 + ${r / 100})^${n} = ${x4(g)}, then ${F} ÷ ${x4(g)} = ${Math.round(a)}`, `Verify: ${Math.round(a)} × ${x4(g)} = ${Math.round(a * g)}, which returns the original FV.`],
        [{ v: F * g, l: 'Compounded forward instead of discounting (PV/FV confusion)' }]); },
    annuity() { const p = R([5000, 10000, 20000]), r = R([8, 10, 12]), n = R([3, 4, 5]), f = (1 - (1 + r / 100) ** -n) / (r / 100), a = p * f;
      return N('annuity', `An ordinary annuity pays ${lk(p)} at the end of each year for ${n} years. The discount rate is ${r}%. Find the present value.`, [['Payment (P)', lk(p)], ['Rate (r)', r + '%'], ['Years (n)', n], ['Timing', 'End of each year']], a, '₹', 'PVA = P × [1 − (1 + r)^−n] ÷ r', ['FVA = P × [(1 + r)^n − 1] ÷ r', 'PVA = P × n ÷ r', 'PVA = P ÷ r'],
        ['Identify: equal payments at equal intervals, paid at year end, and we want today\'s value. That is an ordinary annuity present value.', 'Formula: PVA = P × [1 − (1 + r)^−n] ÷ r.', `Substitute: ${p} × [1 − (1 + ${r / 100})^−${n}] ÷ ${r / 100}`, `Calculate: the bracket gives ${f.toFixed(4)}, then ${p} × ${f.toFixed(4)} = ${Math.round(a)}`],
        [{ v: p * n, l: 'Multiplied the payment by the number of years (ignored time value)' }, { v: p * ((1 + r / 100) ** n - 1) / (r / 100), l: 'Used the future value annuity formula instead of present value' }]); },
    perp() { const c = R([1000, 2000, 5000, 12000]), r = R([5, 8, 10, 12]), a = c / (r / 100);
      return N('perp', `A perpetuity pays ${lk(c)} every year forever. The discount rate is ${r}%. Find its present value.`, [['Payment (C)', lk(c)], ['Rate (r)', r + '%']], a, '₹', 'PV = C ÷ r', ['PV = C × r', 'PV = C × (1 + r)', 'PV = C ÷ (1 + r)'],
        ['Identify: equal payments with no end date, so a perpetuity.', 'Formula: PV = C ÷ r.', `Substitute: PV = ${c} ÷ ${r / 100}`, `Calculate: ${c} ÷ ${r / 100} = ${Math.round(a)}`], [{ v: c * r / 100, l: 'Multiplied the payment by the rate instead of dividing' }]); },
    ear() { const i = R([8, 10, 12, 14, 16, 18]), m = R([2, 4, 12]), g = (1 + i / 100 / m) ** m, a = (g - 1) * 100;
      return N('ear', `A bank offers a deposit at ${i}% per annum compounded ${MN[m]}. Find the effective annual rate (EAR).`, [['Stated rate (i)', i + '%'], ['Compounding periods per year (m)', m]], a, '%', 'EAR = (1 + i/m)^m − 1', ['EAR = i × m', 'EAR = (1 + i)^m − 1', 'EAR = (i/m)^m'],
        ['Identify: a stated rate that compounds more than once a year. The question asks for the true yearly growth, so EAR applies.', 'Formula: EAR = (1 + i/m)^m − 1. i is the stated annual rate as a decimal, m the compounding periods per year.', `Substitute: (1 + ${i / 100}/${m})^${m} − 1 = (${x4(1 + i / 100 / m)})^${m} − 1`, `Calculate: ${x4(1 + i / 100 / m)}^${m} = ${x4(g)}, minus 1 = ${x4(g - 1)}`],
        [{ v: i, l: 'Used the stated rate as if it were the effective rate' }, { v: g * 100, l: 'Forgot to subtract 1 from (1 + i/m)^m' }]); },
    npv() { const I = R([100000, 150000, 200000]), k = R([8, 10, 12]), cf = [1, 2, 3].map(() => Math.round(I * R([.3, .35, .4, .45, .5]) / 1000) * 1000), pvs = cf.map((c, t) => c / (1 + k / 100) ** (t + 1)), pvSum = pvs.reduce((a, b) => a + b, 0), a = pvSum - I;
      return N('npv', `A project needs an initial investment of ${lk(I)} and returns ${lk(cf[0])}, ${lk(cf[1])} and ${lk(cf[2])} at the end of years 1, 2 and 3. The cost of capital is ${k}%. Find the NPV.`, [['Initial investment', lk(I)], ['Cash inflows (yr 1, 2, 3)', cf.map(lk).join(', ')], ['Cost of capital (k)', k + '%']], a, '₹', 'NPV = Σ CFt ÷ (1 + k)^t − Initial investment', ['NPV = Σ CFt − Initial investment', 'NPV = Σ CFt × (1 + k)^t − Initial investment', 'NPV = Σ CFt ÷ (1 + k)^t'],
        ['Identify: compare today\'s value of all inflows with today\'s cost, so this is an NPV question.', 'Formula: NPV = Σ CFt ÷ (1 + k)^t − Initial investment.', `Discount each inflow: ${pvs.map((p, t) => `${cf[t]} ÷ ${x4((1 + k / 100) ** (t + 1))} = ${Math.round(p)}`).join('; ')}`, `Sum of present values = ${Math.round(pvSum)}`, `Subtract the investment: ${Math.round(pvSum)} − ${I} = ${Math.round(a)}`],
        [{ v: pvSum, l: 'Forgot to subtract the initial investment' }]); },
    irr() { const I = R([1000, 5000, 10000]), r = R([8, 10, 12, 15, 20]), n = R([1, 2, 3]), cf = Math.round(I * (1 + r / 100) ** n), a = ((cf / I) ** (1 / n) - 1) * 100;
      return N('irr', `An investment of ${lk(I)} returns a single amount of ${lk(cf)} after ${n} year${n > 1 ? 's' : ''}. Find the IRR.`, [['Investment', lk(I)], ['Inflow', lk(cf)], ['Years (n)', n]], a, '%', 'IRR = (Inflow ÷ Investment)^(1/n) − 1', ['IRR = Inflow ÷ Investment', 'IRR = (Inflow − Investment) ÷ n', 'IRR = (Inflow ÷ Investment)^n − 1'],
        ['Identify: IRR is the rate that makes NPV zero. With a single inflow it has a direct formula.', 'Formula: IRR = (Inflow ÷ Investment)^(1/n) − 1.', `Substitute: (${cf} ÷ ${I})^(1/${n}) − 1 = ${x4(cf / I)}^(${(1 / n).toFixed(3)}) − 1`, `Calculate: ${x4((cf / I) ** (1 / n))} − 1 = ${x4((cf / I) ** (1 / n) - 1)}`, `Verify: ${I} × (1 + ${a.toFixed(2)}%)^${n} = ${Math.round(I * (1 + a / 100) ** n)}, which matches the inflow.`],
        [{ v: (cf / I - 1) * 100, l: 'Ignored the number of years (total return instead of annual rate)' }]); },
    coc() { const wd = R([30, 40, 50]), kd = R([8, 9, 10, 12]), T = R([25, 30, 35]), ke = R([14, 15, 16, 18]), a = wd * kd * (1 - T / 100) / 100 + (100 - wd) * ke / 100;
      return N('coc', `A firm has ${wd}% debt at a pre-tax cost of ${kd}% and ${100 - wd}% equity at a cost of ${ke}%. The tax rate is ${T}%. Find the WACC.`, [['Debt weight (Wd)', wd + '%'], ['Pre-tax cost of debt (Kd)', kd + '%'], ['Tax rate (T)', T + '%'], ['Equity weight (We)', (100 - wd) + '%'], ['Cost of equity (Ke)', ke + '%']], a, '%', 'WACC = Wd × Kd × (1 − T) + We × Ke', ['WACC = Wd × Kd + We × Ke', 'WACC = Wd × Kd × (1 − T) + We × Ke × (1 − T)', 'WACC = (Kd + Ke) ÷ 2'],
        ['Identify: a weighted average of financing costs, so WACC.', 'Formula: WACC = Wd × Kd × (1 − T) + We × Ke. Only debt gets the tax adjustment, because interest is tax deductible.', `After-tax cost of debt = ${kd} × (1 − ${T / 100}) = ${(kd * (1 - T / 100)).toFixed(2)}%`, `Debt part = ${wd / 100} × ${(kd * (1 - T / 100)).toFixed(2)} = ${(wd * kd * (1 - T / 100) / 100).toFixed(2)}%; equity part = ${(100 - wd) / 100} × ${ke} = ${((100 - wd) * ke / 100).toFixed(2)}%`],
        [{ v: wd * kd / 100 + (100 - wd) * ke / 100, l: 'Forgot the tax shield on debt' }]); },
    lev() { if (Math.random() < .5) { const e = R([100000, 150000, 200000]), c = e * R([1.5, 2, 2.5, 3]), a = c / e;
        return N('lev', `A firm has contribution of ${lk(c)} and EBIT of ${lk(e)}. Find its degree of operating leverage (DOL).`, [['Contribution', lk(c)], ['EBIT', lk(e)]], a, 'x', 'DOL = Contribution ÷ EBIT', ['DOL = EBIT ÷ Contribution', 'DOL = EBIT ÷ (EBIT − Interest)', 'DOL = Contribution × EBIT'], ['Identify: sensitivity of EBIT to sales caused by fixed operating costs, so DOL.', 'Formula: DOL = Contribution ÷ EBIT.', `Calculate: ${c} ÷ ${e} = ${a.toFixed(2)}`], [{ v: e / c, l: 'Inverted the ratio (EBIT ÷ Contribution)' }]); }
      const e = R([100000, 200000, 300000]), i = e * R([.2, .25, .4, .5]), a = e / (e - i);
      return N('lev', `A firm has EBIT of ${lk(e)} and interest expense of ${lk(i)}. Find its degree of financial leverage (DFL).`, [['EBIT', lk(e)], ['Interest', lk(i)]], a, 'x', 'DFL = EBIT ÷ (EBIT − Interest)', ['DFL = Contribution ÷ EBIT', 'DFL = (EBIT − Interest) ÷ EBIT', 'DFL = EBIT ÷ Interest'], ['Identify: sensitivity of earnings after interest to EBIT, so DFL.', 'Formula: DFL = EBIT ÷ (EBIT − Interest).', `Calculate: ${e} ÷ (${e} − ${i}) = ${e} ÷ ${e - i} = ${a.toFixed(2)}`], [{ v: e / i, l: 'Divided EBIT by interest instead of by EBIT − Interest' }]); },
    wc() { const a1 = R([30, 45, 60]), a2 = R([20, 30, 40]), a3 = R([15, 25, 35]), a = a1 + a2 - a3;
      return N('wc', `A firm holds inventory for ${a1} days, collects receivables in ${a2} days and pays suppliers after ${a3} days. Find the cash conversion cycle.`, [['Inventory period', a1 + ' days'], ['Receivables period', a2 + ' days'], ['Payables period', a3 + ' days']], a, 'days', 'CCC = Inventory + Receivables − Payables', ['CCC = Inventory + Receivables + Payables', 'CCC = Inventory − Receivables + Payables', 'CCC = Receivables − Payables'], ['Identify: how long cash is tied up, so the cash conversion cycle.', 'Formula: CCC = operating cycle − payables period = (inventory + receivables) − payables.', `Calculate: ${a1} + ${a2} − ${a3} = ${a}`], [{ v: a1 + a2 + a3, l: 'Added the payables period instead of subtracting it' }]); }
  };

  const MCQ = [
    ['fv', 'c', 'notes', 'p.1', '₹10,000 grows at 10% a year for 3 years. Which expression gives the future value?', ['10,000 × (1.10)^3', '10,000 × (1 + 0.10 × 3)', '10,000 ÷ (1.10)^3', '10,000 × 0.10 × 3'], 0, 'Compounding multiplies by (1 + r) each year, so the factor is (1 + r)^n.'],
    ['pv', 'c', 'gen', '', 'What happens to the present value of a fixed future sum when the discount rate rises?', ['It falls', 'It rises', 'It stays the same', 'It doubles'], 0, 'A higher rate divides by a bigger number, so PV falls.'],
    ['annuity', 'f', 'gen', '', 'An annuity due differs from an ordinary annuity because payments are made...', ['at the start of each period', 'at the end of each period', 'only once', 'forever'], 0, 'Annuity due payments start immediately, so each one earns one extra period of interest.'],
    ['annuity', 'f', 'gen', '', 'The value of an annuity due equals the ordinary annuity value multiplied by...', ['(1 + r)', '(1 − r)', 'r', 'n'], 0, 'Every payment moves one period earlier, so the total is multiplied by (1 + r).'],
    ['perp', 'n', 'notes', 'p.6', 'A perpetuity pays ₹2,000 a year and the discount rate is 8%. What is its present value?', ['₹25,000', '₹16,000', '₹160', '₹2,160'], 0, 'PV = C ÷ r = 2,000 ÷ 0.08 = 25,000.'],
    ['perp', 'f', 'gen', '', 'The growing perpetuity formula PV = C1 ÷ (r − g) is valid only when...', ['r is greater than g', 'g is greater than r', 'g equals zero', 'r equals zero'], 0, 'If g ≥ r the denominator is zero or negative and the value is meaningless.'],
    ['ear', 'c', 'notes', 'p.3', '12% per annum compounded quarterly gives an effective annual rate closest to...', ['12.55%', '12.00%', '12.36%', '12.68%'], 0, '(1.03)^4 − 1 = 12.55%.'],
    ['ear', 'c', 'notes', 'p.4', 'As compounding becomes more frequent for a fixed stated rate, the EAR...', ['rises, with smaller gains each time', 'falls', 'stays the same', 'rises by the same amount each time'], 0, 'More frequent compounding raises EAR, but the increments shrink.'],
    ['npv', 'c', 'gen', '', 'According to the NPV decision rule, a project should be accepted when...', ['NPV is greater than zero', 'NPV is less than zero', 'IRR is below the cost of capital', 'payback is longest'], 0, 'Positive NPV means the project adds value in today\'s money.'],
    ['irr', 'c', 'gen', '', 'IRR is the discount rate at which...', ['NPV equals zero', 'NPV is maximum', 'cash inflows equal zero', 'payback equals one year'], 0, 'By definition IRR makes the present value of inflows equal to the investment.'],
    ['coc', 'c', 'gen', '', 'In WACC, why is debt cheaper than equity after tax?', ['Interest is tax deductible', 'Debt holders take more risk', 'Equity has no cost', 'Debt has no interest'], 0, 'The tax shield reduces the effective cost of debt to Kd × (1 − T).'],
    ['lev', 'n', 'notes', 'Slide 15', 'A firm has a DOL of 2. A 10% rise in sales raises EBIT by about...', ['20%', '10%', '5%', '2%'], 0, 'EBIT change = DOL × sales change = 2 × 10%.'],
    ['wc', 'f', 'gen', '', 'Cash conversion cycle equals...', ['operating cycle − payables deferral period', 'operating cycle + payables deferral period', 'inventory period only', 'receivables period − inventory period'], 0, 'Supplier credit shortens the time cash is tied up.']
  ];
  function mcqFor(topicIds, n) {
    const hasSample = SV.S.docs.some(d => d.id === SV.SAMPLE_DOC_ID);
    const pool = MCQ.filter(m => !topicIds || topicIds.includes(m[0]));
    return shuf(pool).slice(0, n).map(m => { const opts = shuf(m[7].map((t, i) => ({ t, ok: i === m[8] }))); return { id: 'mcq-' + m[0] + '-' + m[4].slice(0, 12), topicId: m[0], kind: 'mcq', dim: m[1], source: m[2] === 'notes' && hasSample ? 'notes' : 'generated', ref: m[3], prompt: m[4], opts: opts.map(o => o.t), ai: opts.findIndex(o => o.ok), why: m[9] }; });
  }
  const CARDS = [
    ['fv', 'Future value of a lump sum?', 'FV = PV × (1 + r)^n. Use it to move money forward in time.'], ['pv', 'Present value of a future amount?', 'PV = FV ÷ (1 + r)^n. Use it to bring money back to today. PV is always smaller than FV for a positive rate.'],
    ['ear', 'Effective annual rate?', 'EAR = (1 + i/m)^m − 1. Use it to compare rates that compound at different frequencies.'], ['annuity', 'PV of an ordinary annuity?', 'PVA = P × [1 − (1 + r)^−n] ÷ r. Annuity due: multiply by (1 + r).'],
    ['perp', 'PV of a perpetuity?', 'PV = C ÷ r. Growing perpetuity: C1 ÷ (r − g), with r > g.'], ['npv', 'NPV decision rule?', 'NPV = Σ CFt ÷ (1 + k)^t − I0. Accept if NPV > 0.'],
    ['irr', 'What is IRR?', 'The rate at which NPV = 0. Accept if IRR > cost of capital.'], ['coc', 'WACC formula?', 'WACC = Wd × Kd × (1 − T) + We × Ke.'],
    ['coc', 'CAPM cost of equity?', 'Ke = Rf + β × (Rm − Rf).'], ['lev', 'DOL, DFL, DCL?', 'DOL = Contribution ÷ EBIT. DFL = EBIT ÷ (EBIT − Interest). DCL = DOL × DFL.'], ['wc', 'Cash conversion cycle?', 'CCC = inventory period + receivables period − payables period.']
  ].map((c, i) => ({ id: 'card' + i, topicId: c[0], front: c[1], back: c[2] }));

  function numFor(topicIds, n) { const keys = (topicIds && topicIds.length ? topicIds : Object.keys(GEN)).filter(k => GEN[k]); const out = []; for (let i = 0; i < n; i++) out.push(GEN[keys[i % keys.length]]()); return shuf(out); }
  Object.assign(SV, { GEN, MCQ, CARDS, mcqFor, numFor, fmtAns, shuf });
})(window.SV);
