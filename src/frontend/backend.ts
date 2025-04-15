import { backend as _backend, createActor as _createActor, canisterId as _canisterId } from "../declarations/backend";
import { type ActorSubclass } from "@dfinity/agent";
import { _SERVICE } from "../declarations/backend/backend.did.js"; // Adjusted to .js (check actual file)
import type { Principal } from "@dfinity/principal";

// Option type utilities
type Some<T> = { _tag: "Some"; value: T };
type None = { _tag: "None" };
type Option<T> = Some<T> | None;

function some<T>(value: T): Some<T> {
  return { _tag: "Some", value };
}

function none(): None {
  return { _tag: "None" };
}

function isNone<T>(option: Option<T>): option is None {
  return option._tag === "None";
}

function isSome<T>(option: Option<T>): option is Some<T> {
  return option._tag === "Some";
}

function unwrap<T>(option: Option<T>): T {
  if (isNone(option)) {
    throw new Error("unwrap: none");
  }
  return option.value;
}

function candid_some<T>(value: T): [T] {
  return [value];
}

function candid_none<T>(): [] {
  return [];
}

function record_opt_to_undefined<T>(arg: T | null): T | undefined {
  return arg == null ? undefined : arg;
}

// Exported types
export type AddTransactionResponse =
  | { paymentMethodEmpty: null }
  | { success: null }
  | { categoryEmpty: null };

export interface Budget {
  updatedAt: Time;
  category: Category;
  amount: bigint;
}

export type Category = string;

export type DeleteBudgetResponse =
  | { success: null }
  | { invalidCategory: null };

export type DeleteTransactionResponse =
  | { invalidTxn: null }
  | { success: null };

export type GenerateInviteLinkResponse =
  | { success: null }
  | { failed: null };

export type InvitationResponse =
  | { shortUsername: null }
  | { alreadyUsedToken: null }
  | { expiredToken: null }
  | { success: null }
  | { invalidToken: null }
  | { alreadyRegistered: null };

export type InviteToken = string;

export type PaymentMethod = string;

export type RevokeAccessResponse =
  | { unauthorizedActivity: null }
  | { invalidUser: null }
  | { success: null };

export type Role =
  | { Editor: null }
  | { Admin: null };

export type SetBudgetResponse =
  | { success: null }
  | { categoryEmpty: null };

export type Time = bigint;

export interface Transaction {
  id: TransactionId;
  paymentMethod: PaymentMethod;
  owner: Principal;
  date: Time;
  createdAt: Time;
  updatedAt: Time;
  notes?: string;
  category: Category;
  amount: bigint;
}

export type TransactionId = bigint;

export type UpdateTransactionResponse =
  | { paymentMethodEmpty: null }
  | { invalidTxn: null }
  | { success: null }
  | { categoryEmpty: null };

export interface User {
  principal: Principal;
  username: string;
  joinedAt: Time;
  role: Role;
}

import { type HttpAgentOptions, type ActorConfig, type Agent } from "@dfinity/agent";

export interface CreateActorOptions {
  agent?: Agent;
  agentOptions?: HttpAgentOptions;
  actorOptions?: ActorConfig;
}

export function createActor(
  canisterId: string | Principal,
  options?: CreateActorOptions
): backend {
  const actor = _createActor(canisterId, options);
  return new Backend(actor);
}

export const canisterId = _canisterId;

export interface backend {
  acceptInvite(arg0: InviteToken, arg1: string): Promise<InvitationResponse>;
  addTransaction(
    arg0: Time,
    arg1: bigint,
    arg2: Category,
    arg3: PaymentMethod,
    arg4: string | null
  ): Promise<AddTransactionResponse>;
  assertAdmin(): Promise<void>;
  deleteBudget(arg0: Category): Promise<DeleteBudgetResponse>;
  deleteTransaction(arg0: TransactionId): Promise<DeleteTransactionResponse>;
  generateInviteLink(): Promise<GenerateInviteLinkResponse>;
  getAllTransactions(): Promise<Array<[TransactionId, Transaction]>>;
  getBudgetSummary(): Promise<Array<[Category, bigint, bigint, bigint]>>;
  getBudgets(): Promise<Array<[Category, Budget]>>;
  getFilteredTransactions(
    arg0: Time | null,
    arg1: Time | null,
    arg2: bigint | null,
    arg3: bigint | null,
    arg4: Category | null,
    arg5: PaymentMethod | null
  ): Promise<Array<[TransactionId, Transaction]>>;
  getTransaction(arg0: TransactionId): Promise<Transaction | null>;
  getUsers(): Promise<Array<User>>;
  revokeAccess(arg0: Principal): Promise<RevokeAccessResponse>;
  setBudget(arg0: Category, arg1: bigint): Promise<SetBudgetResponse>;
  updateTransaction(
    arg0: TransactionId,
    arg1: Time,
    arg2: bigint,
    arg3: Category,
    arg4: PaymentMethod,
    arg5: string | null
  ): Promise<UpdateTransactionResponse>;
}

import type {
  Category as _Category,
  TransactionId as _TransactionId,
  Time as _Time,
  Transaction as _Transaction,
  PaymentMethod as _PaymentMethod,
} from "../declarations/backend/backend.did"; // Adjusted to .did (check actual file)

class Backend implements backend {
  #actor: ActorSubclass<_SERVICE>;

  constructor(actor?: ActorSubclass<_SERVICE>) {
    this.#actor = actor ?? _backend;
  }

  async acceptInvite(arg0: InviteToken, arg1: string): Promise<InvitationResponse> {
    return this.#actor.acceptInvite(arg0, arg1);
  }

  async addTransaction(
    arg0: Time,
    arg1: bigint,
    arg2: Category,
    arg3: PaymentMethod,
    arg4: string | null
  ): Promise<AddTransactionResponse> {
    return this.#actor.addTransaction(
      arg0,
      arg1,
      arg2,
      arg3,
      to_candid_opt_n1(arg4)
    );
  }

  async assertAdmin(): Promise<void> {
    return this.#actor.assertAdmin();
  }

  async deleteBudget(arg0: Category): Promise<DeleteBudgetResponse> {
    return this.#actor.deleteBudget(arg0);
  }

  async deleteTransaction(
    arg0: TransactionId
  ): Promise<DeleteTransactionResponse> {
    return this.#actor.deleteTransaction(arg0);
  }

  async generateInviteLink(): Promise<GenerateInviteLinkResponse> {
    return this.#actor.generateInviteLink();
  }

  async getAllTransactions(): Promise<Array<[TransactionId, Transaction]>> {
    const result = await this.#actor.getAllTransactions();
    return from_candid_vec_n2(result);
  }

  async getBudgetSummary(): Promise<Array<[Category, bigint, bigint, bigint]>> {
    return this.#actor.getBudgetSummary();
  }

  async getBudgets(): Promise<Array<[Category, Budget]>> {
    return this.#actor.getBudgets();
  }

  async getFilteredTransactions(
    arg0: Time | null,
    arg1: Time | null,
    arg2: bigint | null,
    arg3: bigint | null,
    arg4: Category | null,
    arg5: PaymentMethod | null
  ): Promise<Array<[TransactionId, Transaction]>> {
    const result = await this.#actor.getFilteredTransactions(
      to_candid_opt_n7(arg0),
      to_candid_opt_n7(arg1),
      to_candid_opt_n8(arg2),
      to_candid_opt_n8(arg3),
      to_candid_opt_n9(arg4),
      to_candid_opt_n10(arg5)
    );
    return from_candid_vec_n2(result);
  }

  async getTransaction(arg0: TransactionId): Promise<Transaction | null> {
    const result = await this.#actor.getTransaction(arg0);
    return from_candid_opt_n11(result);
  }

  async getUsers(): Promise<Array<User>> {
    return this.#actor.getUsers();
  }

  async revokeAccess(arg0: Principal): Promise<RevokeAccessResponse> {
    return this.#actor.revokeAccess(arg0);
  }

  async setBudget(arg0: Category, arg1: bigint): Promise<SetBudgetResponse> {
    return this.#actor.setBudget(arg0, arg1);
  }

  async updateTransaction(
    arg0: TransactionId,
    arg1: Time,
    arg2: bigint,
    arg3: Category,
    arg4: PaymentMethod,
    arg5: string | null
  ): Promise<UpdateTransactionResponse> {
    return this.#actor.updateTransaction(
      arg0,
      arg1,
      arg2,
      arg3,
      arg4,
      to_candid_opt_n1(arg5)
    );
  }
}

export const backend = new Backend();

function from_candid_opt_n11(value: [] | [_Transaction]): Transaction | null {
  return value.length === 0 ? null : from_candid_Transaction_n4(value[0]);
}

function from_candid_record_n5(value: {
  id: _TransactionId;
  paymentMethod: _PaymentMethod;
  owner: Principal;
  date: _Time;
  createdAt: _Time;
  updatedAt: _Time;
  notes: [] | [string];
  category: _Category;
  amount: bigint;
}): {
  id: TransactionId;
  paymentMethod: PaymentMethod;
  owner: Principal;
  date: Time;
  createdAt: Time;
  updatedAt: Time;
  notes?: string;
  category: Category;
  amount: bigint;
} {
  return {
    id: value.id,
    paymentMethod: value.paymentMethod,
    owner: value.owner,
    date: value.date,
    createdAt: value.createdAt,
    updatedAt: value.updatedAt,
    notes: record_opt_to_undefined(from_candid_opt_n6(value.notes)),
    category: value.category,
    amount: value.amount,
  };
}

function to_candid_opt_n1(value: string | null): [] | [string] {
  return value === null ? candid_none() : candid_some(value);
}

function from_candid_tuple_n3(
  value: [_TransactionId, _Transaction]
): [TransactionId, Transaction] {
  return [value[0], from_candid_Transaction_n4(value[1])];
}

function to_candid_opt_n8(value: bigint | null): [] | [bigint] {
  return value === null ? candid_none() : candid_some(value);
}

function from_candid_opt_n6(value: [] | [string]): string | null {
  return value.length === 0 ? null : value[0];
}

function from_candid_vec_n2(
  value: Array<[_TransactionId, _Transaction]>
): Array<[TransactionId, Transaction]> {
  return value.map((x) => from_candid_tuple_n3(x));
}

function to_candid_opt_n9(value: Category | null): [] | [_Category] {
  return value === null ? candid_none() : candid_some(value);
}

function to_candid_opt_n7(value: Time | null): [] | [_Time] {
  return value === null ? candid_none() : candid_some(value);
}

function to_candid_opt_n10(value: PaymentMethod | null): [] | [_PaymentMethod] {
  return value === null ? candid_none() : candid_some(value);
}

function from_candid_Transaction_n4(value: _Transaction): Transaction {
  return from_candid_record_n5(value);
}