
'use client';

import { useState, useEffect } from 'react';
import {
  Query,
  onSnapshot,
  DocumentData,
  FirestoreError,
  QuerySnapshot,
  CollectionReference,
  query,
  where,
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

/* Internal implementation of Query for path extraction:
  https://github.com/firebase/firebase-js-sdk/blob/c5f08a9bc5da0d2b0207802c972d53724ccef055/packages/firestore/src/lite-api/reference.ts#L143
*/
export interface InternalQuery extends Query<DocumentData> {
  _query: {
    path: {
      canonicalString(): string;
      toString(): string;
    }
  };
  type: 'collection' | 'query' | string;
}

// Known collections that require ownerUid filtering to pass security rules
const USER_OWNED_COLLECTIONS = [
  'leads',
  'contacts',
  'notes',
  'activities',
  'calendarEvents',
  'training_materials'
];

/**
 * React hook to subscribe to a Firestore collection or query in real-time.
 * 
 * AUTOMATIC FILTERING: If the target is a root-level user-owned collection,
 * this hook automatically injects the 'ownerUid' constraint to comply with 
 * security rules and prevent "Missing or insufficient permissions" errors.
 */
export function useCollection<T = any>(
    memoizedTargetRefOrQuery: ((CollectionReference<DocumentData> | Query<DocumentData>) & {__memo?: boolean})  | null | undefined,
): UseCollectionResult<T> {
  const { user } = useUser();
  
  type ResultItemType = WithId<T>;
  type StateDataType = ResultItemType[] | null;

  const [data, setData] = useState<StateDataType>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<FirestoreError | Error | null>(null);

  useEffect(() => {
    // If no target provided, clear state
    if (!memoizedTargetRefOrQuery) {
      setData(null);
      setIsLoading(false);
      setError(null);
      return;
    }

    // Step 1: Reliable collection detection
    let collectionName = '';
    const queryObj = memoizedTargetRefOrQuery as any;
    
    try {
      if (queryObj.type === 'collection') {
        collectionName = queryObj.path || '';
      } else if (queryObj._query && queryObj._query.path) {
        // Extract the root collection name from the full path
        const fullPath = queryObj._query.path.canonicalString() || '';
        collectionName = fullPath.split('/')[0] || '';
      } else if (typeof queryObj.path === 'string') {
        collectionName = queryObj.path;
      }
    } catch (e) {
      console.warn('useCollection: Failed to extract path for query', e);
    }

    // Normalize: remove leading/trailing slashes
    collectionName = collectionName.replace(/^\/|\/$/g, '');

    console.log('[useCollection] Target path:', collectionName);

    // Step 2: Prepare the final query
    let q = memoizedTargetRefOrQuery as Query<DocumentData>;

    // If it's a root-level user-owned collection, we MUST have a user and a filter
    if (USER_OWNED_COLLECTIONS.includes(collectionName)) {
      if (!user) {
        console.log(`[useCollection] ${collectionName} requires auth. User not logged in.`);
        setData([]);
        setIsLoading(false);
        return;
      }

      console.log(`[useCollection] Injecting ownerUid filter for: ${collectionName} (User: ${user.uid})`);
      // Automatically append ownership filter to satisfy "Rules are not Filters" requirement.
      // Standardizing on 'ownerUid' as per firestore.rules
      q = query(q, where('ownerUid', '==', user.uid));
    }

    setIsLoading(true);
    setError(null);

    const unsubscribe = onSnapshot(
      q,
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
        console.error(`[useCollection] Permission Error for ${collectionName}:`, firestoreError);
        const permissionError = new FirestorePermissionError({
          operation: 'list',
          path: collectionName || 'unknown',
        });

        setError(permissionError);
        setData(null);
        setIsLoading(false);

        // trigger global error propagation
        errorEmitter.emit('permission-error', permissionError);
      }
    );

    return () => unsubscribe();
  }, [memoizedTargetRefOrQuery, user?.uid]);

  // Validation: In development, ensure we are using memoized references to avoid infinite loops
  if(memoizedTargetRefOrQuery && !memoizedTargetRefOrQuery.__memo) {
    throw new Error('useCollection: Input query/ref was not memoized using useMemoFirebase. Path: ' + 
      ((memoizedTargetRefOrQuery as any).type === 'collection' ? (memoizedTargetRefOrQuery as any).path : 'dynamic query'));
  }

  return { data, isLoading, error };
}
