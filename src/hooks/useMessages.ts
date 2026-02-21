import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { mapErrorToUserMessage } from "@/lib/error-utils";
import type { Database } from "@/integrations/supabase/types";

type AppRole = Database["public"]["Enums"]["app_role"];

export function useContacts() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['chat-contacts', user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data } = await supabase
        .from('profiles')
        .select('id, full_name, avatar_url')
        .neq('id', user.id)
        .limit(50);
      return data || [];
    },
    enabled: !!user,
  });
}

export function useConversation(contactId: string | null) {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['messages', user?.id, contactId],
    queryFn: async () => {
      if (!user || !contactId) return [];
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .or(`and(sender_id.eq.${user.id},receiver_id.eq.${contactId}),and(sender_id.eq.${contactId},receiver_id.eq.${user.id})`)
        .order('created_at', { ascending: true });
      if (error) throw new Error(mapErrorToUserMessage(error));
      return data || [];
    },
    enabled: !!user && !!contactId,
  });

  useEffect(() => {
    if (!user || !contactId) return;
    const channel = supabase
      .channel(`messages-${user.id}-${contactId}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, (payload) => {
        const msg = payload.new as any;
        if ((msg.sender_id === user.id && msg.receiver_id === contactId) ||
            (msg.sender_id === contactId && msg.receiver_id === user.id)) {
          queryClient.invalidateQueries({ queryKey: ['messages', user.id, contactId] });
        }
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [user, contactId, queryClient]);

  return query;
}

export function useSendMessage() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ senderId, receiverId, content, isBroadcast, broadcastRole }: {
      senderId: string;
      receiverId: string;
      content: string;
      isBroadcast?: boolean;
      broadcastRole?: AppRole;
    }) => {
      const trimmed = content.trim();
      if (!trimmed || trimmed.length > 5000) {
        throw new Error('Message must be between 1 and 5000 characters.');
      }
      const insertData = isBroadcast
        ? {
            sender_id: senderId,
            receiver_id: null,
            content,
            is_broadcast: true,
            broadcast_to_role: broadcastRole,
          }
        : {
            sender_id: senderId,
            receiver_id: receiverId,
            content,
          };
      const { data, error } = await supabase
        .from('messages')
        .insert([insertData])
        .select()
        .single();
      if (error) throw new Error(mapErrorToUserMessage(error));
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['messages'] });
      queryClient.invalidateQueries({ queryKey: ['chat-contacts'] });
    },
  });
}
