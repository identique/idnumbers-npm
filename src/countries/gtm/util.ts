/**
 * Guatemala DPI/CUI municipality reference data.
 *
 * Municipality codes are assigned sequentially (01..N) *within* each
 * department, so validating a municipality code requires checking it
 * against its own department's count -- not a single global maximum.
 *
 * ⚠️ Municipality counts are mutable by legislation: Guatemala's Congress
 * periodically creates new municipalities by decree. Commonly-copied tables
 * found online are stale -- 334 (pre-2014) or 338 (pre-October-2015) total
 * municipalities -- and cause false negatives for citizens registered in
 * municipalities created since then, e.g. Sipacate (Escuintla, department
 * 05, municipality 14, Decree 04-2015) and Petatán (Huehuetenango,
 * department 13, municipality 33, Decree 06-2015).
 *
 * This table reflects the current total of 340 municipalities and MUST be
 * re-verified whenever new municipality decrees pass.
 *
 * Index 0 = department 01 (Guatemala) ... index 21 = department 22 (Jutiapa).
 */
export const MUNICIPALITIES_PER_DEPARTMENT: readonly number[] = [
  17, // 01 Guatemala
  8, // 02 El Progreso
  16, // 03 Sacatepéquez
  16, // 04 Chimaltenango
  14, // 05 Escuintla
  14, // 06 Santa Rosa
  19, // 07 Sololá
  8, // 08 Totonicapán
  24, // 09 Quetzaltenango
  21, // 10 Suchitepéquez
  9, // 11 Retalhuleu
  30, // 12 San Marcos
  33, // 13 Huehuetenango
  21, // 14 Quiché
  8, // 15 Baja Verapaz
  17, // 16 Alta Verapaz
  14, // 17 Petén
  5, // 18 Izabal
  11, // 19 Zacapa
  11, // 20 Chiquimula
  7, // 21 Jalapa
  17, // 22 Jutiapa
];

export const MIN_DEPARTMENT = 1;
export const MAX_DEPARTMENT = MUNICIPALITIES_PER_DEPARTMENT.length;

/**
 * Check whether `department` and `municipality` form a valid combination.
 *
 * Guatemalans born abroad, and naturalized citizens, are still assigned a
 * department/municipality code from this same 01-22 range (wherever the
 * birth or naturalization was registered) -- there is no separate
 * out-of-range "foreign-born" code, so 01-22 is genuinely exhaustive.
 */
export function isValidDepartmentMunicipality(department: number, municipality: number): boolean {
  if (department < MIN_DEPARTMENT || department > MAX_DEPARTMENT) {
    return false;
  }

  const municipalityCount = MUNICIPALITIES_PER_DEPARTMENT[department - 1];
  return municipality >= 1 && municipality <= municipalityCount;
}
