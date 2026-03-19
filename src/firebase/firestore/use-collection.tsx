'use client';

import { useState, useEffect, useRef } from 'react';
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
 * Performance Optimized: Uses aggressive path detection and auth guarding.
 */
export function useCollection<T = any>(
    memoizedTargetRefOrQuery: ((CollectionReference<DocumentData> | Query<DocumentData>) & {__memo?: boolean})  | null | undefined,
): UseCollectionResult<T> {
  const { user } = useUser();
  const [data, setData] = useState<WithId<T>[] | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<FirestoreError | Error | null>(null);
  
  const lastQueryKeyRef = useRef<string>('');

  useEffect(() => {
    // 1. FAST BAIL: No query or no user for protected collections
    if (!memoizedTargetRefOrQuery) {
      setData(null);
      setIsLoading(false);
      return;
    }

    // High-speed root collection detection
    let collectionName = '';
    try {
      if (memoizedTargetRefOrQuery.type === 'collection') {
        collectionName = (memoizedTargetRefOrQuery as CollectionReference).path;
      } else {
        const internal = memoizedTargetRefOrQuery as any;
        const segments = internal._query?.path?.segments || internal.path?.segments;
        if (segments && segments.length > 0) {
          collectionName = segments[0];
        }
      }
    } catch (e) {}

    let finalQuery = memoizedTargetRefOrQuery as Query<DocumentData>;

    // 2. SECURITY GUARD: Inject ownerUid if targeting a user-owned collection
    if (USER_OWNED_COLLECTIONS.includes(collectionName)) {
      if (!user) {
        // Pause until auth resolves to prevent permission crashes
        setIsLoading(true);
        return;
      }
      // Satisfaction of "Rules are not Filters"
      finalQuery = query(finalQuery, where('ownerUid', '==', user.uid));
    }

    // 3. CACHE KEY: Prevent redundant re-subscriptions
    const queryKey = JSON.stringify((finalQuery as any)._query || collectionName);
    if (queryKey === lastQueryKeyRef.current) return;
    lastQueryKeyRef.current = queryKey;

    setIsLoading(true);
    setError(null);

    const unsubscribe = onSnapshot(
      finalQuery,
      (snapshot: QuerySnapshot<DocumentData>) => {
        const results: WithId<T>[] = snapshot.docs.map(doc => ({
          ...(doc.data() as T),
          id: doc.id
        }));
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

  // DIAGNOSTIC: Warn in dev if query isn't stable
  if (process.env.NODE_ENV === 'development' && memoizedTargetRefOrQuery && !memoizedTargetRefOrQuery.__memo) {
    console.warn('[useCollection] Un-memoized query detected. This will impact boot performance.');
  }
  
  return { data, isLoading, error };
}
