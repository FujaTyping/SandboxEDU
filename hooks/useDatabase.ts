import { useEffect, useState } from 'react';
import { initDatabase, openDatabase } from '@/lib/database';

/**
 * Hook สำหรับ initialize database เมื่อ app เริ่มต้น
 */
export function useDatabase() {
  const [isReady, setIsReady] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    async function setup() {
      try {
        await initDatabase();
        setIsReady(true);
      } catch (err) {
        console.error('Database initialization failed:', err);
        setError(err as Error);
      }
    }

    setup();
  }, []);

  return { isReady, error };
}

/**
 * Hook สำหรับดึงข้อมูลจาก database
 */
export function useDatabaseQuery<T>(
  query: string,
  params: any[] = [],
  dependencies: any[] = []
) {
  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        const db = await openDatabase();
        const result = await db.getAllAsync<T>(query, params);
        setData(result);
        setError(null);
      } catch (err) {
        console.error('Query failed:', err);
        setError(err as Error);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, dependencies);

  return { data, loading, error };
}
