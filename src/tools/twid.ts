const LETTER_CODE: Record<string, number> = {
  A:10,B:11,C:12,D:13,E:14,F:15,G:16,H:17,J:18,K:19,L:20,M:21,N:22,
  P:23,Q:24,R:25,S:26,T:27,U:28,V:29,X:30,Y:31,W:32,Z:33,I:34,O:35
};
const WEIGHTS = [1,9,8,7,6,5,4,3,2,1,1];

export function validateTWID(id: string): boolean {
  if(!/^[A-Z][12]\d{8}$/.test(id)) return false;
  const code = LETTER_CODE[id[0]]; if(!code) return false;
  const digits = [Math.floor(code/10), code%10, ...id.slice(1).split("").map(n => +n)];
  const sum = digits.reduce((acc, d, i) => acc + d*WEIGHTS[i], 0);
  return sum % 10 === 0;
}
export function generateTWID(opts?: {gender?: 1|2; letter?: keyof typeof LETTER_CODE}) {
  const letters = Object.keys(LETTER_CODE) as (keyof typeof LETTER_CODE)[];
  const letter = opts?.letter ?? letters[Math.floor(Math.random()*letters.length)];
  const gender = (opts?.gender ?? (Math.random()<0.5?1:2)).toString();
  let base = letter + gender + Array.from({length:7}, () => Math.floor(Math.random()*10)).join("");
  for(let d=0; d<=9; d++){ const c = base + d; if (validateTWID(c)) return c; }
  return base + "0";
}