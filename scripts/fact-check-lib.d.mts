export interface Fact {
  id: string;
  claim: string;
  disputed: boolean;
  inferred: boolean;
  offScreen: boolean;
  source: string;
}
export function parseFacts(markdown: string): Map<string, Fact>;
export function checkStrings(strings: unknown, facts: Map<string, Fact>): string[];
