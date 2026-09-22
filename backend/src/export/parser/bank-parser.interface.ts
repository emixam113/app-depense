export interface BankParser {
  parse(text: string, userId: number): Promise<any[]>;
}
