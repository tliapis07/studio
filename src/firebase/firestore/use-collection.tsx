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

export type WithId<T> = T & { id: string };

export interface UseCollectionResult<T> {
  data: WithId<T>[] | null;
  isLoading: boolean;
  error: FirestoreError | Error | null;
}

export interface InternalQuery extends Query<DocumentData> {
  _query: {
    path: {
      segments: string[];
      canonicalString(): string;
      toString(): string;
    }
  };
  type: 'collection' | 'query' | string;
  path?: string;
}

const USER_OWNED_COLLECTIONS = [
  'leads',
  'contacts',
  'notes',
  'activities',
  'calendarEvents',
  'training_materials'
];

/**
 * Hardened hook to subscribe to a Firestore collection or query in real-time.
 * Automatically injects ownership filters for root-level user collections to comply
 * with "Rules are not Filters" Firestore security principle.
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

    let collectionName = '';
    const queryObj = memoizedTargetRefOrQuery as any;
    
    // Reliable path detection for root collections
    try {
      if (queryObj.type === 'collection') {
        collectionName = queryObj.path || '';
      } else if (queryObj._query?.path) {
        // Most reliable way to extract collection name from a complex query
        const segments = queryObj._query.path.segments;
        if (segments && segments.length > 0) {
          collectionName = segments[0];
        }
      }
    } catch (e) {
      console.warn('[useCollection] Path detection error:', e);
    }

    // Normalize path string (strip slashes)
    collectionName = collectionName.replace(/^\/|\/$/g, '');
    
    let finalQuery = memoizedTargetRefOrQuery as Query<DocumentData>;

    // AUTOMATIC HARDENING: Force ownership filter for known user collections
    // This prevents rule violations by scoping the "list" operation to the current user
    if (USER_OWNED_COLLECTIONS.includes(collectionName)) {
      if (!user) {
        console.log(`[useCollection] Skipping ${collectionName} - No authenticated user.`);
        setData([]);
        setIsLoading(false);
        return;
      }

      console.log(`[useCollection] Scoping ${collectionName} to ownerUid: ${user.uid}`);
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
        console.error(`[useCollection] Permission Denied on path: /${collectionName}. Query must include ownerUid filter.`);
        const permissionError = new FirestorePermissionError({
          operation: 'list',
          path: collectionName || 'unknown',
        });

        setError(permissionError);
        setData(null);
        setIsLoading(false);
        errorEmitter.emit('permission-error', permissionError);
      }
    );

    return () => unsubscribe();
  }, [memoizedTargetRefOrQuery, user?.uid]);

  if(memoizedTargetRefOrQuery && !memoizedTargetRefOrQuery.__memo) {
    throw new Error('useCollection: Input was not memoized using useMemoFirebase.');
  }

  return { data, isLoading, error };
}
