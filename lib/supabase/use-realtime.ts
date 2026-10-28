'use client';

import { useEffect, useRef } from 'react';
import { createClient } from './client';
import { RealtimeChannel } from '@supabase/supabase-js';

export interface RealtimeOptions<T = any> {
  table: 'alerts' | 'cases' | 'generation_jobs' | 'transactions';
  event?: 'INSERT' | 'UPDATE' | 'DELETE' | '*';
  filter?: string;
  onData: (payload: { eventType: string; new: T; old: T }) => void;
}

export function useRealtimeSubscription<T = any>({
  table,
  event = '*',
  filter,
  onData,
}: RealtimeOptions<T>) {
  const onDataRef = useRef(onData);
  onDataRef.current = onData;

  useEffect(() => {
    const supabase = createClient();
    if (!supabase) return;

    const channelName = `rt_${table}_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;

    const channel: RealtimeChannel = supabase
      .channel(channelName)
      .on(
        'postgres_changes' as any,
        {
          event,
          schema: 'public',
          table,
          filter,
        },
        (payload: any) => {
          if (payload && onDataRef.current) {
            onDataRef.current({
              eventType: payload.eventType,
              new: payload.new,
              old: payload.old,
            });
          }
        }
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          // Connected to live realtime WebSocket
        }
      });

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [table, event, filter]);
}

