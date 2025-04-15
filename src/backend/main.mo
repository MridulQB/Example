import Principal "mo:base/Principal";
import Time "mo:base/Time";
import Nat "mo:base/Nat";
import Nat8 "mo:base/Nat8";
import Text "mo:base/Text";
import Map "mo:base/HashMap";
import Error "mo:base/Error";
import Random "mo:base/Random";
import Array "mo:base/Array";
import Option "mo:base/Option";
import Iter "mo:base/Iter";
import OrderedMap "mo:base/OrderedMap";
import Blob "mo:base/Blob";
import Int "mo:base/Int";

persistent actor BudgetTracker {
    type Role = { #Admin; #Editor; };
    type User = {
        principal : Principal;
        username : Text;
        role : Role;
        joinedAt : Time.Time;
    };
    type Category = Text;
    type PaymentMethod = Text;
    type TransactionId = Nat;
    type Transaction = {
        id : TransactionId;
        owner : Principal;
        date : Time.Time;
        amount : Int;
        category : Category;
        paymentMethod : PaymentMethod;
        notes : ?Text;
        createdAt : Time.Time;
        updatedAt : Time.Time;
    };
    type Budget = {
        category : Category;
        amount : Nat;
        updatedAt : Time.Time;
    };
    type InviteToken = Text;
    type Invite = {
        token : InviteToken;
        createdBy : Principal;
        createdAt : Time.Time;
        expiresAt : Time.Time;
        usedBy : ?Principal;
    };
    type AddTransactionResponse = {
        #success;
        #categoryEmpty;
        #paymentMethodEmpty;
    };
    type UpdateTransactionResponse = {
        #success;
        #categoryEmpty;
        #paymentMethodEmpty;
        #invalidTxn;
    };
    type DeleteTransactionResponse = {
        #success;
        #invalidTxn;
    };
    type SetBudgetResponse = {
        #success;
        #categoryEmpty;
    };
    type DeleteBudgetResponse = {
        #success;
        #invalidCategory;
    };
    type InvitationResponse = {
        #alreadyRegistered;
        #shortUsername;
        #invalidToken;
        #alreadyUsedToken;
        #expiredToken;
        #success;
    };
    type RevokeAccessResponse = {
        #unauthorizedActivity;
        #invalidUser;
        #success;
    };
    type GenerateInviteLinkResponse = {
        #success;
        #failed;
    };
    
    transient let usersMap = OrderedMap.Make<Principal>(Principal.compare);
    var users : OrderedMap.Map<Principal, User> = usersMap.empty<User>();
    transient let transactionMap = OrderedMap.Make<TransactionId>(Nat.compare);
    var transactions : OrderedMap.Map<TransactionId, Transaction> = transactionMap.empty<Transaction>();
    transient let budgetMap = OrderedMap.Make<Category>(Text.compare);
    var budgets : OrderedMap.Map<Category, Budget> = budgetMap.empty<Budget>();
    transient let inviteMap = OrderedMap.Make<InviteToken>(Text.compare);
    var invites : OrderedMap.Map<Category, Invite> = inviteMap.empty<Invite>();
    var nextTransactionId : TransactionId = 0;
    var adminPrincipal : ?Principal = null;

    func initializeAdmin(principal : Principal) {
        if (adminPrincipal == null and usersMap.size(users) == 0) {
            let newUser : User = {
                principal = principal;
                username = "admin";
                role = #Admin;
                joinedAt = Time.now();
            };
            users := usersMap.put(users, principal, newUser);
            adminPrincipal := ?principal;
        };
    };

    func isAdmin(principal : Principal) : Bool {
        let ?user = usersMap.get(users, principal) else return false;
        user.role == #Admin;
    };

    public shared ({ caller }) func assertAdmin() : async () {
        initializeAdmin(caller);
        if (not isAdmin(caller)) throw Error.reject("Access Denied: Admin role required.");
    };

    func toHex(n : Nat8) : Text {
        let hexChars = Iter.toArray(Text.toIter("0123456789abcdef"));
        let high = n / 16;
        let low = n % 16;
        let highChar : Char = hexChars[Nat8.toNat(high)];
        let lowChar : Char = hexChars[Nat8.toNat(low)];
        Text.fromChar(highChar) # Text.fromChar(lowChar);
    };

    func generateRandomToken() : async InviteToken {
        let blob : Blob = await Random.blob();
        let byteArray : [Nat8] = Blob.toArray(blob);
        let hexArray : [Text] = Array.map<Nat8, Text>(byteArray, toHex);
        let token : Text = Text.join("", Iter.fromArray(hexArray));
        token;
    };

    public query func getTransaction(id : TransactionId) : async ?Transaction {
        transactionMap.get(transactions, id);
    };

    public query func getAllTransactions() : async [(TransactionId, Transaction)] {
        var result : [(TransactionId, Transaction)] = Iter.toArray(transactionMap.entries(transactions));
        result := Array.sort<(TransactionId, Transaction)>(
            result,
            func((_, aTx), (_, bTx)) {
                if (aTx.date > bTx.date) return #less else if (aTx.date < bTx.date) return #greater else return #equal;
            },
        );
        result;
    };

    public query func getFilteredTransactions(
        startDate : ?Time.Time,
        endDate : ?Time.Time,
        minAmount : ?Int,
        maxAmount : ?Int,
        category : ?Category,
        paymentMethod : ?PaymentMethod,
    ) : async [(TransactionId, Transaction)] {
        var filtered : [(TransactionId, Transaction)] = [];
        for ((id, tx) in transactionMap.entries(transactions)) {
            var include = true;
            switch (startDate) {
                case (?start) if (tx.date < start) include := false;
                case null {};
            };
            switch (endDate) {
                case (?end) if (include and tx.date > end) include := false;
                case null {};
            };
            switch (minAmount) {
                case (?min) if (include and tx.amount < min) include := false;
                case null {};
            };
            switch (maxAmount) {
                case (?max) if (include and tx.amount > max) include := false;
                case null {};
            };
            switch (category) {
                case (?cat) if (include and tx.category != cat) include := false;
                case null {};
            };
            switch (paymentMethod) {
                case (?method) if (include and tx.paymentMethod != method) include := false;
                case null {};
            };
            if (include) {
                filtered := Array.append([(id, tx)], filtered);
            };
        };
        filtered;
    };

    public query func getBudgets() : async [(Category, Budget)] {
        var result : [(Category, Budget)] = [];
        for ((cat, budget) in budgetMap.entries(budgets)) result := Array.append([(cat, budget)], result);
        result := Array.sort<(Category, Budget)>(
            result,
            func((catA, _), (catB, _)) {
                Text.compare(catA, catB);
            },
        );
        result;
    };

    public query func getBudgetSummary() : async [(Category, Nat, Int, Nat)] {
        let now = Time.now();
        let approxMonthNanos : Nat = 30 * 24 * 60 * 60 * 1_000_000_000;
        let startOfMonthApprox : Time.Time = if (now < approxMonthNanos) 0 else now - approxMonthNanos;
        var spending = Map.HashMap<Category, Int>(0, Text.equal, Text.hash);
        for ((_, tx) in transactionMap.entries(transactions)) {
            if (tx.date >= startOfMonthApprox and tx.amount < 0) {
                let currentSpending = Option.get(spending.get(tx.category), 0);
                spending.put(tx.category, currentSpending + tx.amount);
            };
        };
        var summary : [(Category, Nat, Int, Nat)] = [];
        for ((cat, budget) in budgetMap.entries(budgets)) {
            let spent = Option.get(spending.get(cat), 0);
            let remaining : Nat = if ((-spent) >= budget.amount) 0 else budget.amount - Int.abs(spent);
            summary := Array.append([(cat, budget.amount, spent, remaining)], summary);
        };
        summary := Array.sort<(Category, Nat, Int, Nat)>(
            summary,
            func((catA, _, _, _), (catB, _, _, _)) {
                Text.compare(catA, catB);
            },
        );
        summary;
    };

    public query func getUsers() : async [User] {
        var result : [User] = [];
        for ((_, user) in usersMap.entries(users)) {
            result := Array.append([user], result);
        };
        result := Array.sort<User>(
            result,
            func(userA, userB) {
                Text.compare(userA.username, userB.username);
            },
        );
        result;
    };

    public shared ({ caller }) func addTransaction(
        date : Time.Time,
        amount : Int,
        category : Category,
        paymentMethod : PaymentMethod,
        notes : ?Text,
    ) : async AddTransactionResponse {
        let now = Time.now();
        let newId = nextTransactionId;
        if (Text.size(category) == 0) return #categoryEmpty;
        if (Text.size(paymentMethod) == 0) return #paymentMethodEmpty;
        let newTransaction : Transaction = {
            id = newId;
            owner = caller;
            date = date;
            amount = amount;
            category = category;
            paymentMethod = paymentMethod;
            notes = notes;
            createdAt = now;
            updatedAt = now;
        };
        transactions := transactionMap.put(transactions, newId, newTransaction);
        nextTransactionId += 1;
        #success;
    };

    public func updateTransaction(
        id : TransactionId,
        date : Time.Time,
        amount : Int,
        category : Category,
        paymentMethod : PaymentMethod,
        notes : ?Text,
    ) : async UpdateTransactionResponse {
        let now = Time.now();
        if (Text.size(category) == 0) return #categoryEmpty;
        if (Text.size(paymentMethod) == 0) return #paymentMethodEmpty;
        let ?oldTransaction = transactionMap.get(transactions, id) else return #invalidTxn;
        let updatedTransaction : Transaction = {
            id = oldTransaction.id;
            owner = oldTransaction.owner;
            createdAt = oldTransaction.createdAt;
            date = date;
            amount = amount;
            category = category;
            paymentMethod = paymentMethod;
            notes = notes;
            updatedAt = now;
        };
        transactions := transactionMap.put(transactions, id, updatedTransaction);
        #success;
    };

    public func deleteTransaction(id : TransactionId) : async DeleteTransactionResponse {
        let ?_tx = transactionMap.get(transactions, id) else return #invalidTxn;
        transactions := transactionMap.delete(transactions, id);
        #success;
    };

    public func setBudget(category : Category, amount : Nat) : async SetBudgetResponse {
        if (Text.size(category) == 0) return #categoryEmpty;
        let now = Time.now();
        let newBudget : Budget = {
            category = category;
            amount = amount;
            updatedAt = now;
        };
        budgets := budgetMap.put(budgets, category, newBudget);
        #success;
    };

    public func deleteBudget(category : Category) : async DeleteBudgetResponse {
        if (budgetMap.get(budgets, category) == null) return #invalidCategory;
        budgets := budgetMap.delete(budgets, category);
        #success;
    };

    public shared ({ caller }) func generateInviteLink() : async GenerateInviteLinkResponse {
        let now : Time.Time = Time.now();
        let expiryNanos : Nat = 24 * 60 * 60 * 1_000_000_000;
        let expiresAt : Time.Time = now + Int.abs(expiryNanos);
        var token : InviteToken = "";
        var attempts = 0;
        let maxAttempts = 10;
        label loopLabel while (true) {
            if (attempts >= maxAttempts) return #failed;
            let generated : InviteToken = await generateRandomToken();
            if (inviteMap.get(invites, generated) == null) {
                token := generated;
                break loopLabel;
            };
            attempts += 1;
        };
        let newInvite : Invite = {
            token = token;
            createdBy = caller;
            createdAt = now;
            expiresAt = expiresAt;
            usedBy = null;
        };
        invites := inviteMap.put(invites, token, newInvite);
        #success;
    };

    public shared ({ caller }) func acceptInvite(token : InviteToken, username : Text) : async InvitationResponse {
        let now = Time.now();
        if (usersMap.get(users, caller) != null) return #alreadyRegistered;
        if (Text.size(username) < 3) return #shortUsername;
        let ?invite = inviteMap.get(invites, token) else return #invalidToken;
        if (invite.usedBy != null) return #alreadyUsedToken;
        if (now > invite.expiresAt) {
            invites := inviteMap.delete(invites, token);
            return #expiredToken;
        };
        let updatedInvite : Invite = {
            token = invite.token;
            createdBy = invite.createdBy;
            createdAt = invite.createdAt;
            expiresAt = invite.expiresAt;
            usedBy = ?caller;
        };
        invites := inviteMap.put(invites, token, updatedInvite);
        let newUser : User = {
            principal = caller;
            username = username;
            role = #Editor;
            joinedAt = now;
        };
        users := usersMap.put(users, caller, newUser);
        #success;
    };

    public shared ({ caller }) func revokeAccess(userPrincipal : Principal) : async RevokeAccessResponse {
        if (userPrincipal == caller) return #unauthorizedActivity;
        if (usersMap.get(users, userPrincipal) == null) return #invalidUser;
        users := usersMap.delete(users, userPrincipal);
        #success;
    };
};
