import { sql } from "drizzle-orm";
import { pgTable, text, varchar, doublePrecision, bigint, integer, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

export const simulatedTransactions = pgTable("simulated_transactions", {
  id: text("id").primaryKey(),
  txHash: text("tx_hash").notNull().unique(),
  chain: text("chain").notNull(),
  senderAddress: text("sender_address").notNull(),
  receiverAddress: text("receiver_address").notNull(),
  amount: doublePrecision("amount").notNull(),
  fee: text("fee").notNull(),
  sizeBytes: integer("size_bytes"),
  createdAt: bigint("created_at", { mode: "number" }).notNull(),
  blockHeight: bigint("block_height", { mode: "number" }).notNull(),
  nonce: integer("nonce"),
  gasPrice: text("gas_price"),
  gasUsed: integer("gas_used"),
  txType: text("tx_type").default("standard"),
  expiresAt: bigint("expires_at", { mode: "number" }),
  usdtAmount: doublePrecision("usdt_amount"),
  flashExpired: boolean("flash_expired").default(false),
  signedTx: text("signed_tx"),
});

export type SimulatedTransaction = typeof simulatedTransactions.$inferSelect & {
  chain: "bitcoin" | "ethereum";
  txType?: "standard" | "usdt_flash" | null;
};

export interface TxInput {
  address: string;
  value: number;
  valueUsd: number;
}

export interface TxOutput {
  address: string;
  value: number;
  valueUsd: number;
  isSimulated?: boolean;
}

export interface UnifiedTransaction {
  hash: string;
  chain: "bitcoin" | "ethereum";
  status: "pending" | "confirming" | "confirmed" | "failed";
  confirmations: number;
  blockHeight: number | null;
  timestamp: number;
  fromAddress: string;
  toAddress: string;
  amount: number;
  amountUsd: number;
  fee: number;
  feeUsd: number;
  isSimulated: boolean;
  gasPrice?: string;
  gasUsed?: number;
  nonce?: number;
  sizeBytes?: number;
  weight?: number;
  inputCount?: number;
  outputCount?: number;
  inputs?: TxInput[];
  outputs?: TxOutput[];
  txType?: "standard" | "usdt_flash";
  usdtAmount?: number;
  expiresAt?: number;
}

export interface CryptoPrice {
  id: string;
  symbol: string;
  name: string;
  priceUsd: number;
  change24h: number;
  marketCap: number;
  volume24h: number;
  image: string;
}

export interface PriceHistoryPoint {
  timestamp: number;
  price: number;
}

export interface NewsItem {
  id: string;
  title: string;
  url: string;
  source: string;
  publishedAt: number;
  imageUrl: string;
  body: string;
}
