/** Een volledig en geldig ingevuld formulier A. */
export function geldigeAntwoorden(): Record<string, unknown> {
  const a: Record<string, unknown> = {
    P2: 'Manager',
    P3: 'Ziekenhuis',
    P4: 'Ja',
    R1: 4, R2: 5, R3: 4, R4: 3, R5: 5, R6: 4,
    R8: 9,
    T1: 4, T2: 3,
    C1: 'Nee',
  };
  for (const b of ['B1', 'B2', 'B3', 'B4']) {
    a[`${b}_relevantie`] = 4;
    a[`${b}_uitwerking`] = 3;
  }
  for (let i = 1; i <= 7; i++) {
    a[`L${i}_pre`] = 2;
    a[`L${i}_post`] = 4;
  }
  return a;
}
