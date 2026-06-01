import { db, auth } from './firebase';
import { 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  setDoc, 
  deleteDoc, 
  query, 
  where 
} from 'firebase/firestore';
import { VacationPlan } from '../types';

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  }
}

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData?.map(provider => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || []
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

/**
 * Fetch all vacations belonging to the specified user from Firestore
 */
export async function getUserPlans(userId: string): Promise<VacationPlan[]> {
  const path = 'plans';
  try {
    const plansRef = collection(db, path);
    const q = query(plansRef, where('userId', '==', userId));
    const querySnapshot = await getDocs(q);
    const plans: VacationPlan[] = [];
    querySnapshot.forEach((docSnap) => {
      plans.push(docSnap.data() as VacationPlan);
    });
    return plans;
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, path);
    return [];
  }
}

/**
 * Retrieve a specific plan by its public identifier
 */
export async function getPlanById(planId: string): Promise<VacationPlan | null> {
  const path = `plans/${planId}`;
  try {
    const docRef = doc(db, 'plans', planId);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return docSnap.data() as VacationPlan;
    }
    return null;
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, path);
    return null;
  }
}

/**
 * Persist or update a traveler's plan in Firestore
 */
export async function saveUserPlan(userId: string, userEmail: string, plan: VacationPlan): Promise<void> {
  const path = `plans/${plan.id}`;
  try {
    const docRef = doc(db, 'plans', plan.id);
    const payload = {
      ...plan,
      userId,
      userEmail,
    };
    await setDoc(docRef, payload);
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

/**
 * Delete a specific traveler's plan from Firestore
 */
export async function deleteUserPlan(planId: string): Promise<void> {
  const path = `plans/${planId}`;
  try {
    const docRef = doc(db, 'plans', planId);
    await deleteDoc(docRef);
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}
