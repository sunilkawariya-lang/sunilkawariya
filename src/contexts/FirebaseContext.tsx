import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User, onAuthStateChanged } from 'firebase/auth';
import { doc, onSnapshot, setDoc, collection, getDocs, deleteDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { auth, db, getStorageInstance, loginWithGoogle, logout, handleFirestoreError, OperationType, sanitizeForFirestore } from '../firebase';
import { PortfolioState, FamilyMember } from '../types';
import { DEFAULT_PORTFOLIO } from '../constants';
import { handleError, ErrorType } from '../lib/errorHandler';

interface FirebaseContextType {
  user: User | null;
  loading: boolean;
  portfolio: PortfolioState;
  setPortfolio: React.Dispatch<React.SetStateAction<PortfolioState>>;
  login: () => Promise<void>;
  logout: () => Promise<void>;
  setSelectedMemberId: (id: string | 'family') => Promise<void>;
  addFamilyMember: (member: any) => Promise<void>;
  updateFamilyMember: (member: any) => Promise<void>;
  deleteFamilyMember: (id: string) => Promise<void>;
  addInvestment: (investment: any) => Promise<void>;
  updateInvestment: (investment: any) => Promise<void>;
  deleteInvestment: (id: string) => Promise<void>;
  addGoal: (goal: any) => Promise<void>;
  updateGoal: (goal: any) => Promise<void>;
  deleteGoal: (id: string) => Promise<void>;
  addInsurance: (insurance: any) => Promise<void>;
  updateInsurance: (insurance: any) => Promise<void>;
  deleteInsurance: (id: string) => Promise<void>;
  updateRiskProfile: (profile: any) => Promise<void>;
  updateEmergencyFund: (fund: any) => Promise<void>;
  updateEstatePlanning: (planning: any) => Promise<void>;
  updateIPSPolicy: (policy: any) => Promise<void>;
  updateTaxProfile: (profile: any) => Promise<void>;
  addExpense: (expense: any) => Promise<void>;
  updateExpense: (expense: any) => Promise<void>;
  deleteExpense: (id: string) => Promise<void>;
  addIncome: (income: any) => Promise<void>;
  updateIncome: (income: any) => Promise<void>;
  deleteIncome: (id: string) => Promise<void>;
  addTransaction: (transaction: any) => Promise<void>;
  updateTransaction: (transaction: any) => Promise<void>;
  deleteTransaction: (id: string) => Promise<void>;
  addLiability: (liability: any) => Promise<void>;
  updateLiability: (liability: any) => Promise<void>;
  deleteLiability: (id: string) => Promise<void>;
  addBankAccount: (account: any) => Promise<void>;
  updateBankAccount: (account: any) => Promise<void>;
  deleteBankAccount: (id: string) => Promise<void>;
  addBankTransaction: (transaction: any) => Promise<void>;
  updateBankTransaction: (transaction: any) => Promise<void>;
  deleteBankTransaction: (id: string) => Promise<void>;
  addCreditCard: (card: any) => Promise<void>;
  updateCreditCard: (card: any) => Promise<void>;
  deleteCreditCard: (id: string) => Promise<void>;
  addCreditCardTransaction: (transaction: any) => Promise<void>;
  updateCreditCardTransaction: (transaction: any) => Promise<void>;
  deleteCreditCardTransaction: (id: string) => Promise<void>;
  persistMarketIndices: (indices: any[]) => Promise<void>;
  updateLastRefresh: (timestamp: string) => Promise<void>;
  addSafeDocument: (doc: any) => Promise<void>;
  updateSafeDocument: (doc: any) => Promise<void>;
  deleteSafeDocument: (id: string) => Promise<void>;
  addMeetingDiscussion: (discussion: any) => Promise<void>;
  updateMeetingDiscussion: (discussion: any) => Promise<void>;
  deleteMeetingDiscussion: (id: string) => Promise<void>;
  updateFinancialPlan: (plan: any) => Promise<void>;
  addSnapshot: (snapshot: any) => Promise<void>;
  updateWalletBalance: (balance: number) => Promise<void>;
  addWalletTransaction: (transaction: any) => Promise<void>;
  uploadFile: (file: File, path: string) => Promise<string>;
  deleteFile: (url: string) => Promise<void>;
  localDataToMigrate: PortfolioState | null;
  migrateLocalData: () => Promise<void>;
  dismissMigration: () => void;
  selectedMemberId: string | 'family';
  familyMembers: FamilyMember[];
}

const FirebaseContext = createContext<FirebaseContextType | undefined>(undefined);

export function FirebaseProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [portfolio, setPortfolio] = useState<PortfolioState>(DEFAULT_PORTFOLIO);
  const [isAuthReady, setIsAuthReady] = useState(false);
  const [localDataToMigrate, setLocalDataToMigrate] = useState<PortfolioState | null>(null);
  const [hasDismissedMigration, setHasDismissedMigration] = useState(() => {
    return localStorage.getItem('rh_dismiss_migration') === 'true';
  });

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user && !hasDismissedMigration) {
        // Capture local data if it's significantly different from default
        // We check if the number of investments is different or if any ID is not in the default set
        setPortfolio(prev => {
          const defaultIds = new Set(DEFAULT_PORTFOLIO.investments.map(i => i.id));
          const hasNewInvestments = prev.investments.some(inv => !defaultIds.has(inv.id));
          const hasDifferentCount = prev.investments.length !== DEFAULT_PORTFOLIO.investments.length;
          
          if ((hasNewInvestments || hasDifferentCount) && prev.investments.length > 0) {
            setLocalDataToMigrate(prev);
          }
          return prev;
        });
      }
      setUser(user);
      setIsAuthReady(true);
      if (!user) setLoading(false);
    });
    return unsubscribe;
  }, [hasDismissedMigration]);

  // Sync portfolio from Firestore when user logs in
  useEffect(() => {
    if (!isAuthReady || !user) {
      if (isAuthReady && !user) {
        setPortfolio(DEFAULT_PORTFOLIO);
        setLoading(false);
      }
      return;
    }

    setLoading(true);
    const userDocRef = doc(db, 'users', user.uid);
    
    // 1. Listen for root document changes
    const unsubRoot = onSnapshot(userDocRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.data();
        // Separate subcollection data from root document data
        const { 
          investments, goals, expenses, incomes, transactions, insurances, 
          liabilities, bankAccounts, bankTransactions, creditCards, 
          creditCardTransactions, historicalSnapshots, meetingDiscussions,
          safeDocuments, walletTransactions, riskProfiles, taxProfiles,
          emergencyFunds, estatePlannings, ipsPolicies,
          ...rootData 
        } = data;

        setPortfolio(prev => ({
          ...prev,
          ...rootData,
          // Root-level fields that should be preserved if not in Firestore
          familyMembers: rootData.familyMembers || prev.familyMembers,
          selectedMemberId: rootData.selectedMemberId || prev.selectedMemberId,
          wallet: rootData.wallet || prev.wallet,
        }));
      } else {
        // Initialize new user
        setDoc(userDocRef, sanitizeForFirestore({
          familyMembers: DEFAULT_PORTFOLIO.familyMembers,
          selectedMemberId: DEFAULT_PORTFOLIO.selectedMemberId,
          riskProfiles: DEFAULT_PORTFOLIO.riskProfiles,
          taxProfiles: DEFAULT_PORTFOLIO.taxProfiles,
          emergencyFunds: DEFAULT_PORTFOLIO.emergencyFunds,
          estatePlannings: DEFAULT_PORTFOLIO.estatePlannings,
          ipsPolicies: DEFAULT_PORTFOLIO.ipsPolicies,
          wallet: DEFAULT_PORTFOLIO.wallet,
        })).catch(err => handleFirestoreError(err, OperationType.WRITE, `users/${user.uid}`));
      }
    }, (error) => {
      handleError(error, { type: ErrorType.FIRESTORE, title: 'Database Error' });
      handleFirestoreError(error, OperationType.GET, `users/${user.uid}`);
    });

    const subCollections = [
      { name: 'investments', key: 'investments' },
      { name: 'goals', key: 'goals' },
      { name: 'expenses', key: 'expenses' },
      { name: 'incomes', key: 'incomes' },
      { name: 'transactions', key: 'transactions' },
      { name: 'insurances', key: 'insurances' },
      { name: 'liabilities', key: 'liabilities' },
      { name: 'bankAccounts', key: 'bankAccounts' },
      { name: 'bankTransactions', key: 'bankTransactions' },
      { name: 'creditCards', key: 'creditCards' },
      { name: 'creditCardTransactions', key: 'creditCardTransactions' },
      { name: 'historicalSnapshots', key: 'historicalSnapshots' },
      { name: 'safeDocuments', key: 'safeDocuments' },
      { name: 'meetingDiscussions', key: 'meetingDiscussions' },
      { name: 'walletTransactions', key: 'walletTransactions' },
      { name: 'riskProfiles', key: 'riskProfiles' },
      { name: 'taxProfiles', key: 'taxProfiles' },
      { name: 'emergencyFunds', key: 'emergencyFunds' },
      { name: 'estatePlannings', key: 'estatePlannings' },
      { name: 'ipsPolicies', key: 'ipsPolicies' }
    ];

    const loadedCollections = new Set<string>();
    const totalToLoad = subCollections.length;

    const unsubs = subCollections.map(sub => {
      return onSnapshot(collection(db, 'users', user.uid, sub.name), (snapshot) => {
        const items = snapshot.docs.map(d => ({ ...d.data(), id: d.id }));
        setPortfolio(prev => ({
          ...prev,
          [sub.key]: items
        }));
        
        // Only set loading to false after all initial snapshots are in
        loadedCollections.add(sub.name);
        if (loadedCollections.size === totalToLoad) {
          setLoading(false);
        }
      }, (error) => {
        handleError(error, { type: ErrorType.FIRESTORE, title: 'Database Sync Error', silent: true });
        handleFirestoreError(error, OperationType.LIST, `users/${user.uid}/${sub.name}`);
        loadedCollections.add(sub.name); // Still count as "loaded" to avoid infinite spinner
        if (loadedCollections.size === totalToLoad) {
          setLoading(false);
        }
      });
    });

    return () => {
      unsubRoot();
      unsubs.forEach(unsub => unsub());
    };
  }, [user, isAuthReady]);

  // Derive singular profiles from arrays based on selectedMemberId
  useEffect(() => {
    const memberId = portfolio.selectedMemberId;
    // Default to 'm1' (Self) if 'family' is selected, or use the selected member's ID
    const targetId = memberId === 'family' ? 'm1' : memberId;

    const taxProfile = portfolio.taxProfiles.find(p => p.memberId === targetId) || portfolio.taxProfiles[0] || DEFAULT_PORTFOLIO.taxProfile;
    const riskProfile = portfolio.riskProfiles.find(p => p.memberId === targetId) || portfolio.riskProfiles[0] || DEFAULT_PORTFOLIO.riskProfile;
    const emergencyFund = portfolio.emergencyFunds.find(f => f.memberId === targetId) || portfolio.emergencyFunds[0] || DEFAULT_PORTFOLIO.emergencyFund;
    const estatePlanning = portfolio.estatePlannings.find(p => p.memberId === targetId) || portfolio.estatePlannings[0] || DEFAULT_PORTFOLIO.estatePlanning;
    const ipsPolicy = portfolio.ipsPolicies.find(p => p.memberId === targetId) || portfolio.ipsPolicies[0] || DEFAULT_PORTFOLIO.ipsPolicy;

    setPortfolio(prev => {
      // Only update if the singular profiles have actually changed to avoid unnecessary re-renders
      if (
        prev.taxProfile === taxProfile &&
        prev.riskProfile === riskProfile &&
        prev.emergencyFund === emergencyFund &&
        prev.estatePlanning === estatePlanning &&
        prev.ipsPolicy === ipsPolicy
      ) {
        return prev;
      }
      return {
        ...prev,
        taxProfile,
        riskProfile,
        emergencyFund,
        estatePlanning,
        ipsPolicy
      };
    });
  }, [
    portfolio.selectedMemberId, 
    portfolio.taxProfiles, 
    portfolio.riskProfiles, 
    portfolio.emergencyFunds, 
    portfolio.estatePlannings,
    portfolio.ipsPolicies
  ]);

  const setSelectedMemberId = async (id: string | 'family') => {
    setPortfolio(prev => ({ ...prev, selectedMemberId: id }));
    if (user) {
      try {
        await setDoc(doc(db, 'users', user.uid), sanitizeForFirestore({ selectedMemberId: id }), { merge: true });
      } catch (err) {
        handleFirestoreError(err, OperationType.WRITE, `users/${user.uid}`);
      }
    }
  };

  const addFamilyMember = async (memberData: any) => {
    const member = { ...memberData, id: memberData.id || Math.random().toString(36).substr(2, 9) };
    setPortfolio(prev => {
      const newMembers = [...prev.familyMembers, member];
      if (user) {
        setDoc(doc(db, 'users', user.uid), sanitizeForFirestore({ familyMembers: newMembers }), { merge: true })
          .catch(err => handleFirestoreError(err, OperationType.WRITE, `users/${user.uid}`));
      }
      return { ...prev, familyMembers: newMembers };
    });
  };

  const updateFamilyMember = async (member: any) => {
    setPortfolio(prev => {
      const newMembers = prev.familyMembers.map(m => m.id === member.id ? member : m);
      if (user) {
        setDoc(doc(db, 'users', user.uid), sanitizeForFirestore({ familyMembers: newMembers }), { merge: true })
          .catch(err => handleFirestoreError(err, OperationType.WRITE, `users/${user.uid}`));
      }
      return { ...prev, familyMembers: newMembers };
    });
  };

  const deleteFamilyMember = async (id: string) => {
    setPortfolio(prev => {
      const newMembers = prev.familyMembers.filter(m => m.id !== id);
      if (user) {
        setDoc(doc(db, 'users', user.uid), sanitizeForFirestore({ familyMembers: newMembers }), { merge: true })
          .catch(err => handleFirestoreError(err, OperationType.WRITE, `users/${user.uid}`));
      }
      return { ...prev, familyMembers: newMembers };
    });
  };

  // Persistence Methods
  const addInvestment = async (inv: any) => {
    const investment = { ...inv, id: inv.id || Math.random().toString(36).substr(2, 9) };
    if (!user) {
      setPortfolio(prev => ({
        ...prev,
        investments: [...prev.investments, investment]
      }));
      return;
    }
    try {
      const colRef = collection(db, 'users', user.uid, 'investments');
      await setDoc(doc(colRef, investment.id), sanitizeForFirestore(investment));
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `users/${user.uid}/investments`);
    }
  };

  const updateInvestment = async (inv: any) => {
    if (!user) {
      setPortfolio(prev => ({
        ...prev,
        investments: prev.investments.map(i => i.id === inv.id ? inv : i)
      }));
      return;
    }
    try {
      await setDoc(doc(db, 'users', user.uid, 'investments', inv.id), sanitizeForFirestore(inv), { merge: true });
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `users/${user.uid}/investments/${inv.id}`);
    }
  };

  const deleteInvestment = async (id: string) => {
    if (!user) {
      setPortfolio(prev => ({
        ...prev,
        investments: prev.investments.filter(i => i.id !== id)
      }));
      return;
    }
    try {
      await deleteDoc(doc(db, 'users', user.uid, 'investments', id));
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `users/${user.uid}/investments/${id}`);
    }
  };

  const addGoal = async (g: any) => {
    const goal = { ...g, id: g.id || Math.random().toString(36).substr(2, 9) };
    if (!user) {
      setPortfolio(prev => ({
        ...prev,
        goals: [...prev.goals, goal]
      }));
      return;
    }
    try {
      const colRef = collection(db, 'users', user.uid, 'goals');
      await setDoc(doc(colRef, goal.id), sanitizeForFirestore(goal));
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `users/${user.uid}/goals`);
    }
  };

  const updateGoal = async (goal: any) => {
    if (!user) {
      setPortfolio(prev => ({
        ...prev,
        goals: prev.goals.map(g => g.id === goal.id ? goal : g)
      }));
      return;
    }
    try {
      await setDoc(doc(db, 'users', user.uid, 'goals', goal.id), sanitizeForFirestore(goal), { merge: true });
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `users/${user.uid}/goals/${goal.id}`);
    }
  };

  const deleteGoal = async (id: string) => {
    if (!user) {
      setPortfolio(prev => ({
        ...prev,
        goals: prev.goals.filter(g => g.id !== id)
      }));
      return;
    }
    try {
      await deleteDoc(doc(db, 'users', user.uid, 'goals', id));
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `users/${user.uid}/goals/${id}`);
    }
  };

  const addInsurance = async (insData: any) => {
    const ins = { ...insData, id: insData.id || Math.random().toString(36).substr(2, 9) };
    if (!user) {
      setPortfolio(prev => ({
        ...prev,
        insurances: [...prev.insurances, ins]
      }));
      return;
    }
    try {
      const colRef = collection(db, 'users', user.uid, 'insurances');
      await setDoc(doc(colRef, ins.id), sanitizeForFirestore(ins));
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `users/${user.uid}/insurances`);
    }
  };

  const updateInsurance = async (ins: any) => {
    if (!user) {
      setPortfolio(prev => ({
        ...prev,
        insurances: prev.insurances.map(i => i.id === ins.id ? ins : i)
      }));
      return;
    }
    try {
      await setDoc(doc(db, 'users', user.uid, 'insurances', ins.id), sanitizeForFirestore(ins), { merge: true });
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `users/${user.uid}/insurances/${ins.id}`);
    }
  };

  const deleteInsurance = async (id: string) => {
    if (!user) {
      setPortfolio(prev => ({
        ...prev,
        insurances: prev.insurances.filter(i => i.id !== id)
      }));
      return;
    }
    try {
      await deleteDoc(doc(db, 'users', user.uid, 'insurances', id));
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `users/${user.uid}/insurances/${id}`);
    }
  };

  const updateRiskProfile = async (profile: any) => {
    setPortfolio(prev => {
      const newProfiles = prev.riskProfiles.some(p => p.memberId === profile.memberId)
        ? prev.riskProfiles.map(p => p.memberId === profile.memberId ? profile : p)
        : [...prev.riskProfiles, profile];
      
      if (user) {
        setDoc(doc(db, 'users', user.uid), sanitizeForFirestore({ 
          riskProfiles: newProfiles,
          profileCompleted: true 
        }), { merge: true })
          .catch(err => handleFirestoreError(err, OperationType.WRITE, `users/${user.uid}`));
      }
      return { ...prev, riskProfiles: newProfiles, profileCompleted: true };
    });
  };

  const updateEmergencyFund = async (fund: any) => {
    setPortfolio(prev => {
      const newFunds = prev.emergencyFunds.some(f => f.memberId === fund.memberId)
        ? prev.emergencyFunds.map(f => f.memberId === fund.memberId ? fund : f)
        : [...prev.emergencyFunds, fund];
      
      if (user) {
        setDoc(doc(db, 'users', user.uid), sanitizeForFirestore({ emergencyFunds: newFunds }), { merge: true })
          .catch(err => handleFirestoreError(err, OperationType.WRITE, `users/${user.uid}`));
      }
      return { ...prev, emergencyFunds: newFunds };
    });
  };

  const updateEstatePlanning = async (planning: any) => {
    setPortfolio(prev => {
      const newPlannings = prev.estatePlannings.some(p => p.memberId === planning.memberId)
        ? prev.estatePlannings.map(p => p.memberId === planning.memberId ? planning : p)
        : [...prev.estatePlannings, planning];
      
      if (user) {
        setDoc(doc(db, 'users', user.uid), sanitizeForFirestore({ estatePlannings: newPlannings }), { merge: true })
          .catch(err => handleFirestoreError(err, OperationType.WRITE, `users/${user.uid}`));
      }
      return { ...prev, estatePlannings: newPlannings };
    });
  };

  const updateIPSPolicy = async (policy: any) => {
    setPortfolio(prev => {
      const newPolicies = prev.ipsPolicies.some(p => p.memberId === policy.memberId)
        ? prev.ipsPolicies.map(p => p.memberId === policy.memberId ? policy : p)
        : [...prev.ipsPolicies, policy];
      
      if (user) {
        setDoc(doc(db, 'users', user.uid), sanitizeForFirestore({ ipsPolicies: newPolicies }), { merge: true })
          .catch(err => handleFirestoreError(err, OperationType.WRITE, `users/${user.uid}`));
      }
      return { ...prev, ipsPolicies: newPolicies };
    });
  };

  const updateTaxProfile = async (profile: any) => {
    setPortfolio(prev => {
      const newProfiles = prev.taxProfiles.some(p => p.memberId === profile.memberId)
        ? prev.taxProfiles.map(p => p.memberId === profile.memberId ? profile : p)
        : [...prev.taxProfiles, profile];
      
      if (user) {
        setDoc(doc(db, 'users', user.uid), sanitizeForFirestore({ taxProfiles: newProfiles }), { merge: true })
          .catch(err => handleFirestoreError(err, OperationType.WRITE, `users/${user.uid}`));
      }
      return { ...prev, taxProfiles: newProfiles };
    });
  };

  const addExpense = async (exp: any) => {
    const expense = { ...exp, id: exp.id || Math.random().toString(36).substr(2, 9) };
    if (!user) {
      setPortfolio(prev => ({
        ...prev,
        expenses: [...prev.expenses, expense]
      }));
      return;
    }
    try {
      await setDoc(doc(db, 'users', user.uid, 'expenses', expense.id), sanitizeForFirestore(expense));
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `users/${user.uid}/expenses/${expense.id}`);
    }
  };

  const updateExpense = async (expense: any) => {
    if (!user) {
      setPortfolio(prev => ({
        ...prev,
        expenses: prev.expenses.map(e => e.id === expense.id ? expense : e)
      }));
      return;
    }
    try {
      await setDoc(doc(db, 'users', user.uid, 'expenses', expense.id), sanitizeForFirestore(expense), { merge: true });
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `users/${user.uid}/expenses/${expense.id}`);
    }
  };

  const deleteExpense = async (id: string) => {
    if (!user) {
      setPortfolio(prev => ({
        ...prev,
        expenses: prev.expenses.filter(e => e.id !== id)
      }));
      return;
    }
    try {
      await deleteDoc(doc(db, 'users', user.uid, 'expenses', id));
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `users/${user.uid}/expenses/${id}`);
    }
  };

  const addIncome = async (inc: any) => {
    const income = { ...inc, id: inc.id || Math.random().toString(36).substr(2, 9) };
    if (!user) {
      setPortfolio(prev => ({
        ...prev,
        incomes: [...prev.incomes, income]
      }));
      return;
    }
    try {
      await setDoc(doc(db, 'users', user.uid, 'incomes', income.id), sanitizeForFirestore(income));
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `users/${user.uid}/incomes/${income.id}`);
    }
  };

  const updateIncome = async (income: any) => {
    if (!user) {
      setPortfolio(prev => ({
        ...prev,
        incomes: prev.incomes.map(i => i.id === income.id ? income : i)
      }));
      return;
    }
    try {
      await setDoc(doc(db, 'users', user.uid, 'incomes', income.id), sanitizeForFirestore(income), { merge: true });
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `users/${user.uid}/incomes/${income.id}`);
    }
  };

  const deleteIncome = async (id: string) => {
    if (!user) {
      setPortfolio(prev => ({
        ...prev,
        incomes: prev.incomes.filter(i => i.id !== id)
      }));
      return;
    }
    try {
      await deleteDoc(doc(db, 'users', user.uid, 'incomes', id));
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `users/${user.uid}/incomes/${id}`);
    }
  };

  const addTransaction = async (tx: any) => {
    const transaction = { ...tx, id: tx.id || Math.random().toString(36).substr(2, 9) };
    if (!user) {
      setPortfolio(prev => ({
        ...prev,
        transactions: [...prev.transactions, transaction]
      }));
      return;
    }
    try {
      await setDoc(doc(db, 'users', user.uid, 'transactions', transaction.id), sanitizeForFirestore(transaction));
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `users/${user.uid}/transactions/${transaction.id}`);
    }
  };

  const updateTransaction = async (transaction: any) => {
    if (!user) {
      setPortfolio(prev => ({
        ...prev,
        transactions: prev.transactions.map(t => t.id === transaction.id ? transaction : t)
      }));
      return;
    }
    try {
      await setDoc(doc(db, 'users', user.uid, 'transactions', transaction.id), sanitizeForFirestore(transaction), { merge: true });
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `users/${user.uid}/transactions/${transaction.id}`);
    }
  };

  const deleteTransaction = async (id: string) => {
    if (!user) {
      setPortfolio(prev => ({
        ...prev,
        transactions: prev.transactions.filter(t => t.id !== id)
      }));
      return;
    }
    try {
      await deleteDoc(doc(db, 'users', user.uid, 'transactions', id));
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `users/${user.uid}/transactions/${id}`);
    }
  };

  const addLiability = async (liab: any) => {
    const liability = { ...liab, id: liab.id || Math.random().toString(36).substr(2, 9) };
    if (!user) {
      setPortfolio(prev => ({
        ...prev,
        liabilities: [...prev.liabilities, liability]
      }));
      return;
    }
    try {
      await setDoc(doc(db, 'users', user.uid, 'liabilities', liability.id), sanitizeForFirestore(liability));
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `users/${user.uid}/liabilities/${liability.id}`);
    }
  };

  const updateLiability = async (liability: any) => {
    if (!user) {
      setPortfolio(prev => ({
        ...prev,
        liabilities: prev.liabilities.map(l => l.id === liability.id ? liability : l)
      }));
      return;
    }
    try {
      await setDoc(doc(db, 'users', user.uid, 'liabilities', liability.id), sanitizeForFirestore(liability), { merge: true });
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `users/${user.uid}/liabilities/${liability.id}`);
    }
  };

  const deleteLiability = async (id: string) => {
    if (!user) {
      setPortfolio(prev => ({
        ...prev,
        liabilities: prev.liabilities.filter(l => l.id !== id)
      }));
      return;
    }
    try {
      await deleteDoc(doc(db, 'users', user.uid, 'liabilities', id));
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `users/${user.uid}/liabilities/${id}`);
    }
  };

  const addBankAccount = async (acc: any) => {
    const account = { ...acc, id: acc.id || Math.random().toString(36).substr(2, 9), lastUpdated: new Date().toISOString() };
    if (!user) {
      setPortfolio(prev => ({
        ...prev,
        bankAccounts: [...prev.bankAccounts, account]
      }));
      return;
    }
    try {
      await setDoc(doc(db, 'users', user.uid, 'bankAccounts', account.id), sanitizeForFirestore(account));
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `users/${user.uid}/bankAccounts/${account.id}`);
    }
  };

  const updateBankAccount = async (account: any) => {
    const updatedAccount = { ...account, lastUpdated: new Date().toISOString() };
    if (!user) {
      setPortfolio(prev => ({
        ...prev,
        bankAccounts: prev.bankAccounts.map(a => a.id === updatedAccount.id ? updatedAccount : a)
      }));
      return;
    }
    try {
      await setDoc(doc(db, 'users', user.uid, 'bankAccounts', updatedAccount.id), sanitizeForFirestore(updatedAccount), { merge: true });
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `users/${user.uid}/bankAccounts/${updatedAccount.id}`);
    }
  };

  const deleteBankAccount = async (id: string) => {
    if (!user) {
      setPortfolio(prev => ({
        ...prev,
        bankAccounts: prev.bankAccounts.filter(a => a.id !== id)
      }));
      return;
    }
    try {
      await deleteDoc(doc(db, 'users', user.uid, 'bankAccounts', id));
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `users/${user.uid}/bankAccounts/${id}`);
    }
  };

  const addBankTransaction = async (tx: any) => {
    const transaction = { ...tx, id: tx.id || Math.random().toString(36).substr(2, 9) };
    if (!user) {
      setPortfolio(prev => ({
        ...prev,
        bankTransactions: [...prev.bankTransactions, transaction]
      }));
      return;
    }
    try {
      await setDoc(doc(db, 'users', user.uid, 'bankTransactions', transaction.id), sanitizeForFirestore(transaction));
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `users/${user.uid}/bankTransactions/${transaction.id}`);
    }
  };

  const updateBankTransaction = async (transaction: any) => {
    if (!user) {
      setPortfolio(prev => ({
        ...prev,
        bankTransactions: prev.bankTransactions.map(t => t.id === transaction.id ? transaction : t)
      }));
      return;
    }
    try {
      await setDoc(doc(db, 'users', user.uid, 'bankTransactions', transaction.id), sanitizeForFirestore(transaction), { merge: true });
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `users/${user.uid}/bankTransactions/${transaction.id}`);
    }
  };

  const deleteBankTransaction = async (id: string) => {
    if (!user) {
      setPortfolio(prev => ({
        ...prev,
        bankTransactions: prev.bankTransactions.filter(t => t.id !== id)
      }));
      return;
    }
    try {
      await deleteDoc(doc(db, 'users', user.uid, 'bankTransactions', id));
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `users/${user.uid}/bankTransactions/${id}`);
    }
  };

  const addCreditCard = async (cardData: any) => {
    const card = { ...cardData, id: cardData.id || Math.random().toString(36).substr(2, 9), lastUpdated: new Date().toISOString() };
    if (!user) {
      setPortfolio(prev => ({
        ...prev,
        creditCards: [...prev.creditCards, card]
      }));
      return;
    }
    try {
      await setDoc(doc(db, 'users', user.uid, 'creditCards', card.id), sanitizeForFirestore(card));
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `users/${user.uid}/creditCards/${card.id}`);
    }
  };

  const updateCreditCard = async (card: any) => {
    const updatedCard = { ...card, lastUpdated: new Date().toISOString() };
    if (!user) {
      setPortfolio(prev => ({
        ...prev,
        creditCards: prev.creditCards.map(c => c.id === updatedCard.id ? updatedCard : c)
      }));
      return;
    }
    try {
      await setDoc(doc(db, 'users', user.uid, 'creditCards', updatedCard.id), sanitizeForFirestore(updatedCard), { merge: true });
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `users/${user.uid}/creditCards/${updatedCard.id}`);
    }
  };

  const deleteCreditCard = async (id: string) => {
    if (!user) {
      setPortfolio(prev => ({
        ...prev,
        creditCards: prev.creditCards.filter(c => c.id !== id)
      }));
      return;
    }
    try {
      await deleteDoc(doc(db, 'users', user.uid, 'creditCards', id));
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `users/${user.uid}/creditCards/${id}`);
    }
  };

  const addCreditCardTransaction = async (tx: any) => {
    const transaction = { ...tx, id: tx.id || Math.random().toString(36).substr(2, 9) };
    if (!user) {
      setPortfolio(prev => ({
        ...prev,
        creditCardTransactions: [...prev.creditCardTransactions, transaction]
      }));
      return;
    }
    try {
      await setDoc(doc(db, 'users', user.uid, 'creditCardTransactions', transaction.id), sanitizeForFirestore(transaction));
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `users/${user.uid}/creditCardTransactions/${transaction.id}`);
    }
  };

  const updateCreditCardTransaction = async (transaction: any) => {
    if (!user) {
      setPortfolio(prev => ({
        ...prev,
        creditCardTransactions: prev.creditCardTransactions.map(t => t.id === transaction.id ? transaction : t)
      }));
      return;
    }
    try {
      await setDoc(doc(db, 'users', user.uid, 'creditCardTransactions', transaction.id), sanitizeForFirestore(transaction), { merge: true });
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `users/${user.uid}/creditCardTransactions/${transaction.id}`);
    }
  };

  const deleteCreditCardTransaction = async (id: string) => {
    if (!user) {
      setPortfolio(prev => ({
        ...prev,
        creditCardTransactions: prev.creditCardTransactions.filter(t => t.id !== id)
      }));
      return;
    }
    try {
      await deleteDoc(doc(db, 'users', user.uid, 'creditCardTransactions', id));
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `users/${user.uid}/creditCardTransactions/${id}`);
    }
  };

  const persistMarketIndices = async (indices: any[]) => {
    setPortfolio(prev => ({ ...prev, marketIndices: indices }));
    if (user) {
      try {
        await setDoc(doc(db, 'users', user.uid), sanitizeForFirestore({ marketIndices: indices }), { merge: true });
      } catch (err) {
        handleFirestoreError(err, OperationType.WRITE, `users/${user.uid}`);
      }
    }
  };

  const updateLastRefresh = async (timestamp: string) => {
    setPortfolio(prev => ({ ...prev, lastMarketRefresh: timestamp }));
    if (user) {
      try {
        await setDoc(doc(db, 'users', user.uid), sanitizeForFirestore({ lastMarketRefresh: timestamp }), { merge: true });
      } catch (err) {
        handleFirestoreError(err, OperationType.WRITE, `users/${user.uid}`);
      }
    }
  };

  const addSafeDocument = async (docData: any) => {
    const safeDoc = { ...docData, id: docData.id || Math.random().toString(36).substr(2, 9), uploadDate: new Date().toISOString() };
    if (!user) {
      setPortfolio(prev => ({
        ...prev,
        safeDocuments: [...prev.safeDocuments, safeDoc]
      }));
      return;
    }
    try {
      await setDoc(doc(db, 'users', user.uid, 'safeDocuments', safeDoc.id), sanitizeForFirestore(safeDoc));
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `users/${user.uid}/safeDocuments/${safeDoc.id}`);
    }
  };

  const updateSafeDocument = async (safeDoc: any) => {
    if (!user) {
      setPortfolio(prev => ({
        ...prev,
        safeDocuments: prev.safeDocuments.map(d => d.id === safeDoc.id ? safeDoc : d)
      }));
      return;
    }
    try {
      await setDoc(doc(db, 'users', user.uid, 'safeDocuments', safeDoc.id), sanitizeForFirestore(safeDoc), { merge: true });
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `users/${user.uid}/safeDocuments/${safeDoc.id}`);
    }
  };

  const deleteSafeDocument = async (id: string) => {
    const docToDelete = portfolio.safeDocuments.find(d => d.id === id);
    if (!user) {
      setPortfolio(prev => ({
        ...prev,
        safeDocuments: prev.safeDocuments.filter(d => d.id !== id)
      }));
      return;
    }
    try {
      // Delete from storage if it has a fileUrl or fileData that looks like a storage URL
      const urlToDelete = docToDelete?.fileUrl || docToDelete?.fileData;
      if (urlToDelete?.includes('firebasestorage.googleapis.com')) {
        await deleteFile(urlToDelete);
      }
      await deleteDoc(doc(db, 'users', user.uid, 'safeDocuments', id));
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `users/${user.uid}/safeDocuments/${id}`);
    }
  };

  const addMeetingDiscussion = async (discData: any) => {
    const discussion = { ...discData, id: discData.id || Math.random().toString(36).substr(2, 9) };
    if (!user) {
      setPortfolio(prev => ({
        ...prev,
        meetingDiscussions: [...prev.meetingDiscussions, discussion]
      }));
      return;
    }
    try {
      await setDoc(doc(db, 'users', user.uid, 'meetingDiscussions', discussion.id), sanitizeForFirestore(discussion));
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `users/${user.uid}/meetingDiscussions/${discussion.id}`);
    }
  };

  const updateMeetingDiscussion = async (discussion: any) => {
    if (!user) {
      setPortfolio(prev => ({
        ...prev,
        meetingDiscussions: prev.meetingDiscussions.map(d => d.id === discussion.id ? discussion : d)
      }));
      return;
    }
    try {
      await setDoc(doc(db, 'users', user.uid, 'meetingDiscussions', discussion.id), sanitizeForFirestore(discussion), { merge: true });
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `users/${user.uid}/meetingDiscussions/${discussion.id}`);
    }
  };

  const deleteMeetingDiscussion = async (id: string) => {
    if (!user) {
      setPortfolio(prev => ({
        ...prev,
        meetingDiscussions: prev.meetingDiscussions.filter(d => d.id !== id)
      }));
      return;
    }
    try {
      await deleteDoc(doc(db, 'users', user.uid, 'meetingDiscussions', id));
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `users/${user.uid}/meetingDiscussions/${id}`);
    }
  };

  const updateFinancialPlan = async (plan: any) => {
    const memberId = portfolio.selectedMemberId;
    setPortfolio(prev => {
      const newPlans = { ...(prev.financialPlans || {}), [memberId]: plan };
      if (user) {
        setDoc(doc(db, 'users', user.uid), sanitizeForFirestore({ 
          financialPlan: plan, // Keep for backward compatibility
          financialPlans: newPlans 
        }), { merge: true })
          .catch(err => handleFirestoreError(err, OperationType.WRITE, `users/${user.uid}`));
      }
      return { ...prev, financialPlan: plan, financialPlans: newPlans };
    });
  };

  const addSnapshot = async (snapshotData: any) => {
    const snapshot = { ...snapshotData, id: snapshotData.id || new Date().toISOString().split('T')[0] };
    if (!user) {
      setPortfolio(prev => ({
        ...prev,
        historicalSnapshots: [...prev.historicalSnapshots, snapshot]
      }));
      return;
    }
    try {
      const colRef = collection(db, 'users', user.uid, 'historicalSnapshots');
      await setDoc(doc(colRef, snapshot.id), sanitizeForFirestore(snapshot));
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `users/${user.uid}/historicalSnapshots`);
    }
  };

  const login = async () => {
    try {
      await loginWithGoogle();
    } catch (error) {
      handleError(error, { type: ErrorType.AUTH, title: 'Login Failed' });
    }
  };

  const updateWalletBalance = async (balance: number) => {
    if (!user) {
      setPortfolio(prev => ({
        ...prev,
        wallet: { balance, currency: prev.wallet?.currency || 'INR', lastUpdated: new Date().toISOString() }
      }));
      return;
    }
    try {
      await setDoc(doc(db, 'users', user.uid), sanitizeForFirestore({
        wallet: { balance, currency: portfolio.wallet?.currency || 'INR', lastUpdated: new Date().toISOString() }
      }), { merge: true });
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `users/${user.uid}`);
    }
  };

  const addWalletTransaction = async (tx: any) => {
    const transaction = { ...tx, id: tx.id || Math.random().toString(36).substr(2, 9), date: tx.date || new Date().toISOString() };
    if (!user) {
      setPortfolio(prev => ({
        ...prev,
        walletTransactions: [transaction, ...(prev.walletTransactions || [])]
      }));
      return;
    }
    try {
      await setDoc(doc(db, 'users', user.uid, 'walletTransactions', transaction.id), sanitizeForFirestore(transaction));
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `users/${user.uid}/walletTransactions/${transaction.id}`);
    }
  };

  const uploadFile = async (file: File, path: string): Promise<string> => {
    if (!user) throw new Error('Must be logged in to upload files');
    try {
      const fileRef = ref(getStorageInstance(), `users/${user.uid}/${path}/${Date.now()}_${file.name}`);
      const snapshot = await uploadBytes(fileRef, file);
      return await getDownloadURL(snapshot.ref);
    } catch (err) {
      console.error('Error uploading file:', err);
      throw err;
    }
  };

  const deleteFile = async (url: string) => {
    if (!user || !url) return;
    try {
      if (url.includes('firebasestorage.googleapis.com')) {
        const fileRef = ref(getStorageInstance(), url);
        await deleteObject(fileRef);
      }
    } catch (err) {
      console.error('Error deleting file:', err);
    }
  };

  const migrateLocalData = async () => {
    if (!user || !localDataToMigrate) return;
    
    try {
      setLoading(true);
      // Migrate root fields
      await setDoc(doc(db, 'users', user.uid), sanitizeForFirestore({
        familyMembers: localDataToMigrate.familyMembers,
        selectedMemberId: localDataToMigrate.selectedMemberId,
        riskProfiles: localDataToMigrate.riskProfiles,
        taxProfiles: localDataToMigrate.taxProfiles,
        emergencyFunds: localDataToMigrate.emergencyFunds,
        estatePlannings: localDataToMigrate.estatePlannings,
      }), { merge: true });

      // Migrate sub-collections
      const collections = [
        { name: 'investments', data: localDataToMigrate.investments },
        { name: 'goals', data: localDataToMigrate.goals },
        { name: 'expenses', data: localDataToMigrate.expenses },
        { name: 'incomes', data: localDataToMigrate.incomes },
        { name: 'transactions', data: localDataToMigrate.transactions },
        { name: 'insurances', data: localDataToMigrate.insurances },
        { name: 'liabilities', data: localDataToMigrate.liabilities },
        { name: 'bankAccounts', data: localDataToMigrate.bankAccounts }
      ];

      for (const col of collections) {
        const colRef = collection(db, 'users', user.uid, col.name);
        await Promise.all(col.data.map(item => {
          const { id, ...rest } = item as any;
          return setDoc(doc(colRef, id || undefined), sanitizeForFirestore(rest));
        }));
      }

      setLocalDataToMigrate(null);
      setLoading(false);
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `users/${user.uid}/migration`);
      setLoading(false);
    }
  };

  const dismissMigration = () => {
    setLocalDataToMigrate(null);
    setHasDismissedMigration(true);
    localStorage.setItem('rh_dismiss_migration', 'true');
  };

  const handleLogout = async () => {
    try {
      localStorage.removeItem('rh_dismiss_migration');
      setHasDismissedMigration(false);
      await logout();
    } catch (error) {
      handleError(error, { type: ErrorType.AUTH, title: 'Logout Failed' });
    }
  };

  return (
    <FirebaseContext.Provider value={{ 
      user, 
      loading, 
      portfolio, 
      setPortfolio, 
      login, 
      logout: handleLogout,
      setSelectedMemberId,
      addFamilyMember,
      updateFamilyMember,
      deleteFamilyMember,
      addInvestment,
      updateInvestment,
      deleteInvestment,
      addGoal,
      updateGoal,
      deleteGoal,
      addInsurance,
      updateInsurance,
      deleteInsurance,
      updateRiskProfile,
      updateEmergencyFund,
      updateEstatePlanning,
      updateIPSPolicy,
      updateTaxProfile,
      addExpense,
      updateExpense,
      deleteExpense,
      addIncome,
      updateIncome,
      deleteIncome,
      addTransaction,
      updateTransaction,
      deleteTransaction,
      addLiability,
      updateLiability,
      deleteLiability,
      addBankAccount,
      updateBankAccount,
      deleteBankAccount,
      addBankTransaction,
      updateBankTransaction,
      deleteBankTransaction,
      addCreditCard,
      updateCreditCard,
      deleteCreditCard,
      addCreditCardTransaction,
      updateCreditCardTransaction,
      deleteCreditCardTransaction,
      updateFinancialPlan,
      addSnapshot,
      addSafeDocument,
      updateSafeDocument,
      deleteSafeDocument,
      addMeetingDiscussion,
      updateMeetingDiscussion,
      deleteMeetingDiscussion,
      uploadFile,
      deleteFile,
      localDataToMigrate,
      migrateLocalData,
      dismissMigration,
      updateWalletBalance,
      addWalletTransaction,
      selectedMemberId: portfolio.selectedMemberId,
      familyMembers: portfolio.familyMembers,
      persistMarketIndices,
      updateLastRefresh
    }}>
      {children}
    </FirebaseContext.Provider>
  );
}

export function useFirebase() {
  const context = useContext(FirebaseContext);
  if (context === undefined) {
    throw new Error('useFirebase must be used within a FirebaseProvider');
  }
  return context;
}
