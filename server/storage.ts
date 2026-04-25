import { eq, and, lt, isNotNull, ne } from "drizzle-orm";
import { db } from "./db";
import { type User, type InsertUser, type SimulatedTransaction, users, simulatedTransactions } from "@shared/schema";
import { randomUUID } from "crypto";

export interface IStorage {
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  storeSimulatedTransaction(tx: SimulatedTransaction): Promise<void>;
  getSimulatedTransaction(txHash: string): Promise<SimulatedTransaction | undefined>;
  getAllSimulatedTransactions(): Promise<SimulatedTransaction[]>;
  getExpiredFlashTransactions(now: number): Promise<SimulatedTransaction[]>;
  getActiveFlashTransactions(now: number): Promise<SimulatedTransaction[]>;
  markFlashExpired(txHash: string): Promise<void>;
}

export class DatabaseStorage implements IStorage {
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = randomUUID();
    const [user] = await db.insert(users).values({ ...insertUser, id }).returning();
    return user;
  }

  async storeSimulatedTransaction(tx: SimulatedTransaction): Promise<void> {
    await db.insert(simulatedTransactions).values(tx).onConflictDoNothing();
  }

  async getSimulatedTransaction(txHash: string): Promise<SimulatedTransaction | undefined> {
    const [tx] = await db
      .select()
      .from(simulatedTransactions)
      .where(eq(simulatedTransactions.txHash, txHash));
    return tx as SimulatedTransaction | undefined;
  }

  async getAllSimulatedTransactions(): Promise<SimulatedTransaction[]> {
    const rows = await db
      .select()
      .from(simulatedTransactions)
      .orderBy(simulatedTransactions.createdAt);
    return rows as SimulatedTransaction[];
  }

  async getExpiredFlashTransactions(now: number): Promise<SimulatedTransaction[]> {
    const rows = await db
      .select()
      .from(simulatedTransactions)
      .where(
        and(
          eq(simulatedTransactions.txType, "usdt_flash"),
          isNotNull(simulatedTransactions.expiresAt),
          lt(simulatedTransactions.expiresAt, now),
          ne(simulatedTransactions.flashExpired, true),
        )
      );
    return rows as SimulatedTransaction[];
  }

  async getActiveFlashTransactions(now: number): Promise<SimulatedTransaction[]> {
    const rows = await db
      .select()
      .from(simulatedTransactions)
      .where(
        and(
          eq(simulatedTransactions.txType, "usdt_flash"),
          ne(simulatedTransactions.flashExpired, true),
          isNotNull(simulatedTransactions.signedTx),
        )
      );
    return rows as SimulatedTransaction[];
  }

  async markFlashExpired(txHash: string): Promise<void> {
    await db
      .update(simulatedTransactions)
      .set({ flashExpired: true })
      .where(eq(simulatedTransactions.txHash, txHash));
  }
}

export const storage = new DatabaseStorage();
