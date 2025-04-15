export const idlFactory = ({ IDL }) => {
  const InviteToken = IDL.Text;
  const InvitationResponse = IDL.Variant({
    'shortUsername' : IDL.Null,
    'alreadyUsedToken' : IDL.Null,
    'expiredToken' : IDL.Null,
    'success' : IDL.Null,
    'invalidToken' : IDL.Null,
    'alreadyRegistered' : IDL.Null,
  });
  const Time = IDL.Int;
  const Category = IDL.Text;
  const PaymentMethod = IDL.Text;
  const AddTransactionResponse = IDL.Variant({
    'paymentMethodEmpty' : IDL.Null,
    'success' : IDL.Null,
    'categoryEmpty' : IDL.Null,
  });
  const DeleteBudgetResponse = IDL.Variant({
    'success' : IDL.Null,
    'invalidCategory' : IDL.Null,
  });
  const TransactionId = IDL.Nat;
  const DeleteTransactionResponse = IDL.Variant({
    'invalidTxn' : IDL.Null,
    'success' : IDL.Null,
  });
  const GenerateInviteLinkResponse = IDL.Variant({
    'success' : IDL.Null,
    'failed' : IDL.Null,
  });
  const Transaction = IDL.Record({
    'id' : TransactionId,
    'paymentMethod' : PaymentMethod,
    'owner' : IDL.Principal,
    'date' : Time,
    'createdAt' : Time,
    'updatedAt' : Time,
    'notes' : IDL.Opt(IDL.Text),
    'category' : Category,
    'amount' : IDL.Int,
  });
  const Budget = IDL.Record({
    'updatedAt' : Time,
    'category' : Category,
    'amount' : IDL.Nat,
  });
  const Role = IDL.Variant({ 'Editor' : IDL.Null, 'Admin' : IDL.Null });
  const User = IDL.Record({
    'principal' : IDL.Principal,
    'username' : IDL.Text,
    'joinedAt' : Time,
    'role' : Role,
  });
  const RevokeAccessResponse = IDL.Variant({
    'unauthorizedActivity' : IDL.Null,
    'invalidUser' : IDL.Null,
    'success' : IDL.Null,
  });
  const SetBudgetResponse = IDL.Variant({
    'success' : IDL.Null,
    'categoryEmpty' : IDL.Null,
  });
  const UpdateTransactionResponse = IDL.Variant({
    'paymentMethodEmpty' : IDL.Null,
    'invalidTxn' : IDL.Null,
    'success' : IDL.Null,
    'categoryEmpty' : IDL.Null,
  });
  return IDL.Service({
    'acceptInvite' : IDL.Func(
        [InviteToken, IDL.Text],
        [InvitationResponse],
        [],
      ),
    'addTransaction' : IDL.Func(
        [Time, IDL.Int, Category, PaymentMethod, IDL.Opt(IDL.Text)],
        [AddTransactionResponse],
        [],
      ),
    'assertAdmin' : IDL.Func([], [], []),
    'deleteBudget' : IDL.Func([Category], [DeleteBudgetResponse], []),
    'deleteTransaction' : IDL.Func(
        [TransactionId],
        [DeleteTransactionResponse],
        [],
      ),
    'generateInviteLink' : IDL.Func([], [GenerateInviteLinkResponse], []),
    'getAllTransactions' : IDL.Func(
        [],
        [IDL.Vec(IDL.Tuple(TransactionId, Transaction))],
        ['query'],
      ),
    'getBudgetSummary' : IDL.Func(
        [],
        [IDL.Vec(IDL.Tuple(Category, IDL.Nat, IDL.Int, IDL.Nat))],
        ['query'],
      ),
    'getBudgets' : IDL.Func(
        [],
        [IDL.Vec(IDL.Tuple(Category, Budget))],
        ['query'],
      ),
    'getFilteredTransactions' : IDL.Func(
        [
          IDL.Opt(Time),
          IDL.Opt(Time),
          IDL.Opt(IDL.Int),
          IDL.Opt(IDL.Int),
          IDL.Opt(Category),
          IDL.Opt(PaymentMethod),
        ],
        [IDL.Vec(IDL.Tuple(TransactionId, Transaction))],
        ['query'],
      ),
    'getTransaction' : IDL.Func(
        [TransactionId],
        [IDL.Opt(Transaction)],
        ['query'],
      ),
    'getUsers' : IDL.Func([], [IDL.Vec(User)], ['query']),
    'revokeAccess' : IDL.Func([IDL.Principal], [RevokeAccessResponse], []),
    'setBudget' : IDL.Func([Category, IDL.Nat], [SetBudgetResponse], []),
    'updateTransaction' : IDL.Func(
        [
          TransactionId,
          Time,
          IDL.Int,
          Category,
          PaymentMethod,
          IDL.Opt(IDL.Text),
        ],
        [UpdateTransactionResponse],
        [],
      ),
  });
};
export const init = ({ IDL }) => { return []; };
