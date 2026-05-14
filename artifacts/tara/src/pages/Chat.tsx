import { useState, useRef, useEffect } from "react";
import { Link } from "wouter";
import { useAuth } from "@/contexts/AuthContext";
import { useListAnthropicConversations, useGetAnthropicConversation, useCreateAnthropicConversation } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Mic, Send, Bot, User, Loader2, Plane, Hotel } from "lucide-react";

// Helper for SSE streaming chat
function useAnthropicChat(conversationId: number | null) {
  const [messages, setMessages] = useState<any[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  
  const sendMessage = async (content: string) => {
    if (!conversationId) return;
    
    // Add user message optimistically
    const newMsg = { role: "user", content };
    setMessages(prev => [...prev, newMsg]);
    setIsTyping(true);
    
    try {
      const token = localStorage.getItem("tara_token");
      const res = await fetch(`/api/anthropic/conversations/${conversationId}/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ content })
      });
      
      if (!res.ok) throw new Error("Failed to send");
      
      const reader = res.body?.getReader();
      if (!reader) throw new Error("No reader");
      
      let assistantMsg = "";
      
      // Add empty assistant message to stream into
      setMessages(prev => [...prev, { role: "assistant", content: "" }]);
      
      const decoder = new TextDecoder();
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        
        const chunk = decoder.decode(value);
        const lines = chunk.split('\\n');
        
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = JSON.parse(line.slice(6));
            if (data.done) {
              setIsTyping(false);
            } else if (data.content) {
              assistantMsg += data.content;
              setMessages(prev => {
                const newArr = [...prev];
                newArr[newArr.length - 1].content = assistantMsg;
                return newArr;
              });
            }
          }
        }
      }
    } catch (e) {
      console.error("Stream error", e);
      setIsTyping(false);
    }
  };
  
  return { messages, setMessages, sendMessage, isTyping };
}

export default function Chat() {
  const [input, setInput] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);
  
  // We'd normally fetch/create convo here. Using mock for UI build.
  const [conversationId, setConversationId] = useState<number>(1);
  const { messages, setMessages, sendMessage, isTyping } = useAnthropicChat(conversationId);
  
  // Initial greeting
  useEffect(() => {
    if (messages.length === 0) {
      setMessages([
        { role: "assistant", content: "Hi! I'm TARA. I can book your flights, find hotels, or check your upcoming trips. What do you need?" }
      ]);
    }
  }, []);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isTyping]);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;
    sendMessage(input);
    setInput("");
  };

  return (
    <div className="max-w-4xl mx-auto h-[calc(100vh-8rem)] flex flex-col glass-card rounded-2xl overflow-hidden border-primary/20">
      <header className="p-4 border-b border-border bg-card/50 flex items-center gap-3">
        <div className="relative">
          <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
            <Bot size={24} className="text-primary" />
          </div>
          <div className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-[#00FF88] border-2 border-card agent-active-glow"></div>
        </div>
        <div>
          <h2 className="font-bold font-heading">TARA Agent</h2>
          <p className="text-xs text-muted-foreground flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-[#00FF88] inline-block animate-pulse"></span>
            Online and ready
          </p>
        </div>
      </header>

      <ScrollArea className="flex-1 p-4" ref={scrollRef}>
        <div className="space-y-6 pb-4">
          {messages.map((msg, i) => (
            <div key={i} className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
              <div className={`w-8 h-8 rounded-full shrink-0 flex items-center justify-center ${msg.role === 'user' ? 'bg-secondary' : 'bg-primary/20'}`}>
                {msg.role === 'user' ? <User size={16} /> : <Bot size={16} className="text-primary" />}
              </div>
              <div className={`max-w-[80%] rounded-2xl p-4 ${
                msg.role === 'user' 
                  ? 'bg-primary text-primary-foreground rounded-tr-sm' 
                  : 'bg-card border border-border rounded-tl-sm'
              }`}>
                <div className="whitespace-pre-wrap leading-relaxed text-sm">{msg.content}</div>
                
                {/* Mock structured UI if text implies booking */}
                {msg.role === 'assistant' && msg.content.includes('₦') && !isTyping && (
                  <Card className="mt-4 bg-background/50 border-border p-3">
                    <div className="flex items-center gap-3 mb-2">
                      <Plane className="text-primary" size={16} />
                      <span className="font-medium text-sm">Suggested Flight</span>
                    </div>
                    <div className="flex justify-between items-center text-sm">
                      <div>Air Peace • LOS → ABJ</div>
                      <div className="font-bold">₦45,000</div>
                    </div>
                    <Button size="sm" className="w-full mt-3">Book Automatically</Button>
                  </Card>
                )}
              </div>
            </div>
          ))}
          
          {isTyping && (
            <div className="flex gap-3">
              <div className="w-8 h-8 rounded-full bg-primary/20 shrink-0 flex items-center justify-center">
                <Bot size={16} className="text-primary" />
              </div>
              <div className="bg-card border border-border rounded-2xl rounded-tl-sm p-4 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-primary animate-bounce"></span>
                <span className="w-2 h-2 rounded-full bg-primary animate-bounce delay-100"></span>
                <span className="w-2 h-2 rounded-full bg-primary animate-bounce delay-200"></span>
              </div>
            </div>
          )}
        </div>
      </ScrollArea>

      <div className="p-4 bg-card/50 border-t border-border">
        <form onSubmit={handleSend} className="flex gap-2">
          <Button type="button" variant="outline" size="icon" className="shrink-0 rounded-full">
            <Mic size={18} />
          </Button>
          <Input 
            value={input} 
            onChange={e => setInput(e.target.value)} 
            placeholder="Ask TARA to book a flight, check status..." 
            className="rounded-full bg-background border-border focus-visible:ring-primary"
          />
          <Button type="submit" size="icon" className="shrink-0 rounded-full" disabled={!input.trim() || isTyping}>
            <Send size={18} />
          </Button>
        </form>
        <div className="flex gap-2 mt-3 overflow-x-auto pb-1 scrollbar-hide">
          {["Book flight to Abuja", "Check my flight status", "Find hotel in Lagos"].map((suggestion, i) => (
            <button 
              key={i}
              type="button"
              onClick={() => setInput(suggestion)}
              className="text-xs whitespace-nowrap px-3 py-1.5 rounded-full border border-border bg-card hover:bg-secondary transition-colors"
            >
              {suggestion}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
