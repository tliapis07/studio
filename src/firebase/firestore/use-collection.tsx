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

/* Internal implementation of Query for path extraction */
export interface InternalQuery extends Query<DocumentData> {
  _query: {
    path: {
      canonicalString(): string;
      toString(): string;
    }
  };
  type: 'collection' | 'query' | string;
}

// Collections that require ownership filtering to pass Firestore Security Rules
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
 * AUTOMATIC HARDENING: This hook detects root-level user collections and 
 * automatically injects 'ownerUid' constraints to prevent permission denied errors.
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
    if (!memoizedTargetRefOrQuery) {
      setData(null);
      setIsLoading(false);
      setError(null);
      return;
    }

    // Harden path detection logic
    let collectionName = '';
    const queryObj = memoizedTargetRefOrQuery as any;
    
    try {
      if (queryObj.type === 'collection') {
        collectionName = queryObj.path || '';
      } else if (queryObj._query && queryObj._query.path) {
        const fullPath = queryObj._query.path.canonicalString() || '';
        collectionName = fullPath.split('/')[0] || '';
      } else if (typeof queryObj.path === 'string') {
        collectionName = queryObj.path;
      }
    } catch (e) {
      console.warn('[useCollection] Path extraction warning:', e);
    }

    // Normalize path
    collectionName = collectionName.replace(/^\/|\/$/g, '');
    
    // Final query preparation
    let finalQuery = memoizedTargetRefOrQuery as Query<DocumentData>;

    // Automatic filter injection for user-owned records
    if (USER_OWNED_COLLECTIONS.includes(collectionName)) {
      if (!user) {
        console.log(`[useCollection] Skipping ${collectionName}: User not authenticated.`);
        setData([]);
        setIsLoading(false);
        return;
      }

      console.log(`[useCollection] Hardening query for ${collectionName}: Appending ownerUid filter.`);
      // Enforce the 'Rules are not Filters' logic by scoping the query to the user's UID
      finalQuery = query(finalQuery, where('ownerUid', '==', user.uid));
    }

    setIsLoading(true);
    setError(null);

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
        console.error(`[useCollection] Permission crash on ${collectionName}:`, firestoreError);
        const permissionError = new FirestorePermissionError({
          operation: 'list',
          path: collectionName || 'unknown',
        });

        setError(permissionError);
        setData(null);
        setIsLoading(false);

        // Global propagation for system debugging
        errorEmitter.emit('permission-error', permissionError);
      }
    );

    return () => unsubscribe();
  }, [memoizedTargetRefOrQuery, user?.uid]);

  // Validation: Ensure memoization to prevent render loops
  if(memoizedTargetRefOrQuery && !memoizedTargetRefOrQuery.__memo) {
    throw new Error('useCollection: Input was not memoized using useMemoFirebase. Path: ' + collectionName);
  }

  return { data, isLoading, error };
}
