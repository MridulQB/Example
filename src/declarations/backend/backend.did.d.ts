import type { Principal } from '@dfinity/principal';
import type { ActorMethod } from '@dfinity/agent';
import type { IDL } from '@dfinity/candid';

export type AddTransactionResponse = { 'paymentMethodEmpty' : null } |
  { 'success' : null } |
  { 'categoryEmpty' : null };
export interface Budget {
  'updatedAt' : Time,
  'category' : Category,
  'amount' : bigint,
}
export type Category = string;
export type DeleteBudgetResponse = { 'success' : null } |
  { 'invalidCategory' : null };
export type DeleteTransactionResponse = { 'invalidTxn' : null } |
  { 'success' : null };
export type GenerateInviteLinkResponse = { 'success' : null } |
  { 'failed' : null };
export type InvitationResponse = { 'shortUsername' : null } |
  { 'alreadyUsedToken' : null } |
  { 'expiredToken' : null } |
  { 'success' : null } |
  { 'invalidToken' : null } |
  { 'alreadyRegistered' : null };
export type InviteToken = string;
export type PaymentMethod = string;
export type RevokeAccessResponse = { 'unauthorizedActivity' : null } |
  { 'invalidUser' : null } |
  { 'success' : null };
export type Role = { 'Editor' : null } |
  { 'Admin' : null };
export type SetBudgetResponse = { 'success' : null } |
  { 'categoryEmpty' : null };
export type Time = bigint;
export interface Transaction {
  'id' : TransactionId,
  'paymentMethod' : PaymentMethod,
  'owner' : Principal,
  'date' : Time,
  'createdAt' : Time,
  'updatedAt' : Time,
  'notes' : [] | [string],
  'category' : Category,
  'amount' : bigint,
}
export type TransactionId = bigint;
export type UpdateTransactionResponse = { 'paymentMethodEmpty' : null } |
  { 'invalidTxn' : null } |
  { 'success' : null } |
  { 'categoryEmpty' : null };
export interface User {
  'principal' : Principal,
  'username' : string,
  'joinedAt' : Time,
  'role' : Role,
}
export interface _SERVICE {
  'acceptInvite' : ActorMethod<[InviteToken, string], InvitationResponse>,
  'addTransaction' : ActorMethod<
    [Time, bigint, Category, PaymentMethod, [] | [string]],
    AddTransactionResponse
  >,
  'assertAdmin' : ActorMethod<[], undefined>,
  'deleteBudget' : ActorMethod<[Category], DeleteBudgetResponse>,
  'deleteTransaction' : ActorMethod<[TransactionId], DeleteTransactionResponse>,
  'generateInviteLink' : ActorMethod<[], GenerateInviteLinkResponse>,
  'getAllTransactions' : ActorMethod<[], Array<[TransactionId, Transaction]>>,
  'getBudgetSummary' : ActorMethod<
    [],
    Array<[Category, bigint, bigint, bigint]>
  >,
  'getBudgets' : ActorMethod<[], Array<[Category, Budget]>>,
  'getFilteredTransactions' : ActorMethod<
    [
      [] | [Time],
      [] | [Time],
      [] | [bigint],
      [] | [bigint],
      [] | [Category],
      [] | [PaymentMethod],
    ],
    Array<[TransactionId, Transaction]>
  >,
  'getTransaction' : ActorMethod<[TransactionId], [] | [Transaction]>,
  'getUsers' : ActorMethod<[], Array<User>>,
  'revokeAccess' : ActorMethod<[Principal], RevokeAccessResponse>,
  'setBudget' : ActorMethod<[Category, bigint], SetBudgetResponse>,
  'updateTransaction' : ActorMethod<
    [TransactionId, Time, bigint, Category, PaymentMethod, [] | [string]],
    UpdateTransactionResponse
  >,
}
export declare const idlFactory: IDL.InterfaceFactory;
export declare const init: (args: { IDL: typeof IDL }) => IDL.Type[];
