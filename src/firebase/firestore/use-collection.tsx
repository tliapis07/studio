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

/* Internal implementation of Query for path extraction */
export interface InternalQuery extends Query<DocumentData> {
  _query: {
    path: {
      canonicalString(): string;
      toString(): string;
      segments: string[];
    }
  }
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
 * Automatically injects ownerUid filter for root user-owned collections to prevent permission errors.
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

    // 1. IMPROVED PATH DETECTION
    let collectionName = '';
    if (memoizedTargetRefOrQuery.type === 'collection') {
      collectionName = (memoizedTargetRefOrQuery as CollectionReference).path;
    } else {
      // Cast to any to access internal _query path
      const internal = memoizedTargetRefOrQuery as unknown as any;
      if (internal._query?.path?.segments) {
        collectionName = internal._query.path.segments[0];
      }
    }
    
    console.log('[useCollection] Detected collection:', collectionName);

    let finalQuery = memoizedTargetRefOrQuery as Query<DocumentData>;

    // 2. PROACTIVE SECURITY FILTERING
    if (USER_OWNED_COLLECTIONS.includes(collectionName)) {
      if (!user) {
        console.warn('[useCollection] Blocking unauthorized query for:', collectionName);
        setData([]);
        setIsLoading(false);
        return;
      }
      
      // Inject ownership filter before listener is created
      // Note: 'ownerUid' is the standard field used in SalesStream rules
      finalQuery = query(finalQuery, where('ownerUid', '==', user.uid));
      console.log('[useCollection] Injected ownerUid filter for:', collectionName, user.uid);
    }

    setIsLoading(true);
    setError(null);

    // 3. ESTABLISH LISTENER
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
        console.error(`[useCollection] Permission Denied on path: /${collectionName}. Ensure query includes ownerUid filter.`);
        
        const contextualError = new FirestorePermissionError({
          operation: 'list',
          path: collectionName || 'unknown',
        });

        setError(contextualError);
        setData(null);
        setIsLoading(false);

        // Notify global error handler
        errorEmitter.emit('permission-error', contextualError);
      }
    );

    return () => unsubscribe();
  }, [memoizedTargetRefOrQuery, user?.uid]); 

  if(memoizedTargetRefOrQuery && !memoizedTargetRefOrQuery.__memo) {
    throw new Error(memoizedTargetRefOrQuery + ' was not properly memoized using useMemoFirebase');
  }
  
  return { data, isLoading, error };
}