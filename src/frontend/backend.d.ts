import type { Principal } from "@dfinity/principal";
type Some<T> = {
    _tag: "Some";
    value: T;
};
type None = {
    _tag: "None";
};
type Option<T> = Some<T> | None;
export type AddTransactionResponse = {
    paymentMethodEmpty: null;
} | {
    success: null;
} | {
    categoryEmpty: null;
};
export interface Budget {
    updatedAt: Time;
    category: Category;
    amount: bigint;
}
export type Category = string;
export type DeleteBudgetResponse = {
    success: null;
} | {
    invalidCategory: null;
};
export type DeleteTransactionResponse = {
    invalidTxn: null;
} | {
    success: null;
};
export type GenerateInviteLinkResponse = {
    success: null;
} | {
    failed: null;
};
export type InvitationResponse = {
    shortUsername: null;
} | {
    alreadyUsedToken: null;
} | {
    expiredToken: null;
} | {
    success: null;
} | {
    invalidToken: null;
} | {
    alreadyRegistered: null;
};
export type InviteToken = string;
export type PaymentMethod = string;
export type RevokeAccessResponse = {
    unauthorizedActivity: null;
} | {
    invalidUser: null;
} | {
    success: null;
};
export type Role = {
    Editor: null;
} | {
    Admin: null;
};
export type SetBudgetResponse = {
    success: null;
} | {
    categoryEmpty: null;
};
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
export type UpdateTransactionResponse = {
    paymentMethodEmpty: null;
} | {
    invalidTxn: null;
} | {
    success: null;
} | {
    categoryEmpty: null;
};
export interface User {
    principal: Principal;
    username: string;
    joinedAt: Time;
    role: Role;
}
import { type HttpAgentOptions, type ActorConfig, type Agent } from "@dfinity/agent";
export declare interface CreateActorOptions {
    agent?: Agent;
    agentOptions?: HttpAgentOptions;
    actorOptions?: ActorConfig;
}
export declare const createActor: (canisterId: string | Principal, actor?: CreateActorOptions) => backend;
export declare const canisterId: string;
export interface backend {
    acceptInvite(arg0: InviteToken, arg1: string): Promise<InvitationResponse>;
    addTransaction(arg0: Time, arg1: bigint, arg2: Category, arg3: PaymentMethod, arg4: string | null): Promise<AddTransactionResponse>;
    assertAdmin(): Promise<void>;
    deleteBudget(arg0: Category): Promise<DeleteBudgetResponse>;
    deleteTransaction(arg0: TransactionId): Promise<DeleteTransactionResponse>;
    generateInviteLink(): Promise<GenerateInviteLinkResponse>;
    getAllTransactions(): Promise<Array<[TransactionId, Transaction]>>;
    getBudgetSummary(): Promise<Array<[Category, bigint, bigint, bigint]>>;
    getBudgets(): Promise<Array<[Category, Budget]>>;
    getFilteredTransactions(arg0: Time | null, arg1: Time | null, arg2: bigint | null, arg3: bigint | null, arg4: Category | null, arg5: PaymentMethod | null): Promise<Array<[TransactionId, Transaction]>>;
    getTransaction(arg0: TransactionId): Promise<Transaction | null>;
    getUsers(): Promise<Array<User>>;
    revokeAccess(arg0: Principal): Promise<RevokeAccessResponse>;
    setBudget(arg0: Category, arg1: bigint): Promise<SetBudgetResponse>;
    updateTransaction(arg0: TransactionId, arg1: Time, arg2: bigint, arg3: Category, arg4: PaymentMethod, arg5: string | null): Promise<UpdateTransactionResponse>;
}

