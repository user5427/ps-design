// StockChangeType enum - copied from backend as source of truth
export enum StockChangeType {
  SUPPLY = "SUPPLY",
  USAGE = "USAGE",
  ADJUSTMENT = "ADJUSTMENT",
  WASTE = "WASTE",
}

export type StockChangeTypeValue = keyof typeof StockChangeType;
