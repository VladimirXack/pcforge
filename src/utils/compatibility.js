/**
 * Full compatibility engine.
 * Checks CPU↔MB socket, RAM↔MB type, CPU TDP↔Cooler, PSU wattage, Case↔MB form factor.
 */

const FORM_RANK = { mATX: 1, ATX: 2, 'E-ATX': 3 };

export function checkCompatibility(build) {
  const issues = [];
  const { cpu, motherboard, ram, gpu, psu, case: pcCase, cooler } = build;

  // CPU ↔ Motherboard socket
  if (cpu && motherboard && cpu.socket !== motherboard.socket) {
    issues.push({
      type: 'error',
      msg: `CPU socket (${cpu.socket}) doesn't match motherboard socket (${motherboard.socket})`,
    });
  }

  // RAM ↔ Motherboard RAM type
  if (ram && motherboard && ram.type !== motherboard.ramType) {
    issues.push({
      type: 'error',
      msg: `RAM type (${ram.type}) is incompatible with motherboard (supports ${motherboard.ramType})`,
    });
  }

  // CPU TDP ↔ Cooler capacity
  if (cpu && cooler) {
    if (cpu.tdp > cooler.tdpCapacity) {
      issues.push({
        type: 'error',
        msg: `CPU TDP (${cpu.tdp}W) exceeds cooler capacity (${cooler.tdpCapacity}W)`,
      });
    } else if (cpu.tdp > cooler.tdpCapacity * 0.85) {
      issues.push({
        type: 'warning',
        msg: `CPU TDP (${cpu.tdp}W) is close to cooler limit (${cooler.tdpCapacity}W) — consider headroom`,
      });
    }
  }

  // PSU wattage vs estimated system load
  if (psu && (cpu || gpu)) {
    const cpuTdp = cpu?.tdp ?? 0;
    const gpuTdp = gpu?.tdp ?? 0;
    const estimated = cpuTdp + gpuTdp + 75; // 75W overhead for rest of system
    if (psu.wattage < estimated) {
      issues.push({
        type: 'error',
        msg: `PSU (${psu.wattage}W) insufficient — estimated system draw ~${estimated}W`,
      });
    } else if (psu.wattage < estimated + 100) {
      issues.push({
        type: 'warning',
        msg: `PSU headroom is tight (${psu.wattage}W vs ~${estimated}W needed) — consider a higher wattage`,
      });
    }
  }

  // Case ↔ Motherboard form factor
  if (pcCase && motherboard) {
    const caseRank = FORM_RANK[pcCase.formFactor] ?? 2;
    const mbRank   = FORM_RANK[motherboard.formFactor] ?? 2;
    if (caseRank < mbRank) {
      issues.push({
        type: 'error',
        msg: `Case (${pcCase.formFactor}) is too small for motherboard (${motherboard.formFactor})`,
      });
    }
  }

  // All good
  if (issues.length === 0 && Object.values(build).some(Boolean)) {
    issues.push({ type: 'ok', msg: 'No compatibility issues detected ✓' });
  }

  return issues;
}

/**
 * Returns whether a given item would be compatible with the current build.
 * Returns: 'ok' | 'warn' | 'incompat' | 'free'
 */
export function itemCompatStatus(build, catId, item, freeMode) {
  if (freeMode) return 'free';
  const tempBuild = { ...build, [catId]: item };
  const issues = checkCompatibility(tempBuild);
  const errors   = issues.filter(i => i.type === 'error');
  const warnings = issues.filter(i => i.type === 'warning');
  if (errors.length > 0)   return 'incompat';
  if (warnings.length > 0) return 'warn';
  return 'ok';
}

/**
 * Estimated system wattage given current build.
 * Returns { cpu, gpu, system, total }
 */
export function estimateWattage(build) {
  const cpu    = build.cpu?.tdp    ?? 0;
  const gpu    = build.gpu?.tdp    ?? 0;
  const system = 75; // mobo, RAM, storage, fans
  return { cpu, gpu, system, total: cpu + gpu + system };
}
