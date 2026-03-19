'use client';

import { useState, useEffect } from 'react';
import {
  Query,
  onSnapshot,
  DocumentData,
  FirestoreError,
  QuerySnapshot,
  CollectionReference,
  where,
  query,
} from 'firebase/firestore';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';
import { useUser } from '@/firebase';

/** Utility type to add an 'id' field to a given type T. */
export type WithId<T> = T & { id: string };

/**
 * Interface for the return value of the useCollection hook.
 * @template T Type of the document data.
 */
export interface UseCollectionResult<T> {
  data: WithId<T>[] | null; // Document data with ID, or null.
  isLoading: boolean;       // True if loading.
  error: FirestoreError | Error | null; // Error object, or null.
}

const USER_OWNED_COLLECTIONS = [
  'leads', 
  'contacts', 
  'notes', 
  'activities', 
  'calendarEvents', 
  'training_materials', 
  'tags'
];

/**
 * React hook to subscribe to a Firestore collection or query in real-time.
 * Automatically injects ownerUid filter for user-owned collections to prevent permission errors.
 */
export function useCollection<T = any>(
    memoizedTargetRefOrQuery: ((CollectionReference<DocumentData> | Query<DocumentData>) & {__memo?: boolean})  | null | undefined,
): UseCollectionResult<T> {
  type ResultItemType = WithId<T>;
  type StateDataType = ResultItemType[] | null;

  const { user } = useUser();
  const [data, setData] = useState<StateDataType>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<FirestoreError | Error | null>(null);

  useEffect(() => {
    if (!memoizedTargetRefOrQuery) {
      setData(null);
      setIsLoading(false);
      setError(null);
      return;
    }

    // 1. RELIABLE PATH DETECTION
    let collectionPath = '';
    try {
      if (memoizedTargetRefOrQuery.type === 'collection') {
        collectionPath = (memoizedTargetRefOrQuery as CollectionReference).path;
      } else {
        // Query object internal path extraction
        const internal = memoizedTargetRefOrQuery as any;
        const segments = internal._query?.path?.segments || 
                         internal.path?.segments || 
                         (internal.source?.path?.segments);
        
        if (segments && segments.length > 0) {
          collectionPath = segments[0];
        }
      }
    } catch (e) {
      console.warn('[useCollection] Path detection failed:', e);
    }

    const collectionName = collectionPath.split('/')[0];
    let finalQuery = memoizedTargetRefOrQuery as Query<DocumentData>;

    // 2. SECURITY FILTER INJECTION
    if (USER_OWNED_COLLECTIONS.includes(collectionName)) {
      if (!user) {
        setData(null);
        setIsLoading(true);
        return;
      }
      
      // Inject ownership filter to ensure compatibility with "Rules are not Filters"
      finalQuery = query(finalQuery, where('ownerUid', '==', user.uid));
      console.log(`[useCollection] Querying ${collectionName} with ownerUid filter applied.`);
    }

    setIsLoading(true);
    setError(null);

    // 3. SNAPSHOT LISTENER
    const unsubscribe = onSnapshot(
      finalQuery,
      (snapshot: QuerySnapshot<DocumentData>) => {
        const results: ResultItemType[] = [];
        for (const doc of snapshot.docs) {
          results.push({ ...(doc.data() as T), id: doc.id });
        }
        setData(results);
        setError(null);
        setIsLoading(false);
      },
      (firestoreError: FirestoreError) => {
        const isPermissionError = firestoreError.code === 'permission-denied';
        
        console.error(
          `[useCollection] ${isPermissionError ? 'PERMISSION DENIED' : 'Error'} on /${collectionName}:`, 
          firestoreError.message
        );
        
        const contextualError = new FirestorePermissionError({
          operation: 'list',
          path: collectionName || 'unknown',
        });

        setError(isPermissionError ? contextualError : firestoreError);
        setData(null);
        setIsLoading(false);

        if (isPermissionError && user) {
          errorEmitter.emit('permission-error', contextualError);
        }
      }
    );

    return () => unsubscribe();
  }, [memoizedTargetRefOrQuery, user?.uid]); 

  if(memoizedTargetRefOrQuery && !memoizedTargetRefOrQuery.__memo) {
    console.warn('[useCollection] Target query was not properly memoized using useMemoFirebase. This can cause performance issues or infinite loops.');
  }
  
  return { data, isLoading, error };
}