import { useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Send, MessageSquare } from "lucide-react";
import { Tables } from "@/integrations/supabase/types";

type Message = Tables<"messages">;

interface Contact {
  id: string;
  full_name: string;
}

export default function Chat() {
  const { user } = useAuth();
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMsg, setNewMsg] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    supabase.from("profiles").select("id, full_name").then(({ data }) => {
      if (data) setContacts(data.filter((p) => p.id !== user?.id) as Contact[]);
    });
  }, [user]);

  useEffect(() => {
    if (!selectedContact || !user) return;
    const loadMessages = async () => {
      const { data } = await supabase.from("messages").select("*")
        .or(`and(sender_id.eq.${user.id},receiver_id.eq.${selectedContact.id}),and(sender_id.eq.${selectedContact.id},receiver_id.eq.${user.id})`)
        .order("created_at");
      if (data) setMessages(data);
    };
    loadMessages();

    const channel = supabase.channel(`chat-${selectedContact.id}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "messages" }, (payload) => {
        const msg = payload.new as Message;
        if ((msg.sender_id === user.id && msg.receiver_id === selectedContact.id) ||
            (msg.sender_id === selectedContact.id && msg.receiver_id === user.id)) {
          setMessages((prev) => [...prev, msg]);
        }
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [selectedContact, user]);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  const sendMessage = async () => {
    const trimmed = newMsg.trim();
    if (!trimmed || trimmed.length > 5000 || !selectedContact || !user) return;
    await supabase.from("messages").insert({ sender_id: user.id, receiver_id: selectedContact.id, content: trimmed });
    setNewMsg("");
  };

  return (
    <div className="space-y-4">
      <h1 className="page-header">Chat</h1>
      <div className="flex gap-4 h-[calc(100vh-12rem)]">
        <div className="w-60 shrink-0 bg-card rounded-xl border overflow-hidden hidden md:block">
          <div className="p-3 border-b"><p className="text-xs font-semibold text-muted-foreground uppercase">Contacts</p></div>
          <ScrollArea className="h-full">
            {contacts.map((c) => (
              <button key={c.id} onClick={() => setSelectedContact(c)}
                className={`w-full text-left px-4 py-3 text-sm hover:bg-muted transition-colors ${selectedContact?.id === c.id ? "bg-muted font-medium" : ""}`}>
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center text-xs font-medium text-primary">{c.full_name?.[0] ?? "?"}</div>
                  <span className="truncate">{c.full_name ?? "User"}</span>
                </div>
              </button>
            ))}
          </ScrollArea>
        </div>

        <div className="flex-1 bg-card rounded-xl border flex flex-col overflow-hidden">
          {!selectedContact ? (
            <div className="flex-1 flex items-center justify-center text-muted-foreground">
              <div className="text-center"><MessageSquare className="h-10 w-10 mx-auto mb-2 opacity-40" /><p>Select a contact to start chatting</p></div>
            </div>
          ) : (
            <>
              <div className="p-3 border-b flex items-center gap-2">
                <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center text-xs font-medium text-primary">{selectedContact.full_name?.[0]}</div>
                <span className="text-sm font-medium">{selectedContact.full_name}</span>
              </div>
              <ScrollArea className="flex-1 p-4">
                <div className="space-y-3">
                  {messages.map((m) => (
                    <div key={m.id} className={`flex ${m.sender_id === user?.id ? "justify-end" : "justify-start"}`}>
                      <div className={`max-w-[70%] px-3 py-2 rounded-xl text-sm ${m.sender_id === user?.id ? "bg-primary text-primary-foreground" : "bg-muted"}`}>
                        <p>{m.content}</p>
                        <p className={`text-[10px] mt-1 ${m.sender_id === user?.id ? "text-primary-foreground/60" : "text-muted-foreground"}`}>
                          {new Date(m.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                        </p>
                      </div>
                    </div>
                  ))}
                  <div ref={bottomRef} />
                </div>
              </ScrollArea>
              <div className="p-3 border-t flex gap-2">
                <Input value={newMsg} onChange={(e) => setNewMsg(e.target.value)} placeholder="Type a message..."
                  onKeyDown={(e) => e.key === "Enter" && sendMessage()} className="flex-1" />
                <Button size="icon" onClick={sendMessage}><Send className="h-4 w-4" /></Button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
