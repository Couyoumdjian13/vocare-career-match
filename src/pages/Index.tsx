import { useState } from "react";
import { ChatSidebar } from "@/components/ChatSidebar";
import { MessageBubble } from "@/components/MessageBubble";
import { ChatInput } from "@/components/ChatInput";
import { DatabasePanel } from "@/components/DatabasePanel";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
}

interface Conversation {
  id: string;
  title: string;
  lastUpdated: string;
  messages: Message[];
}

const WELCOME_MESSAGE: Message = {
  id: "welcome",
  role: "assistant",
  content: "👋 ¡Hola! Soy Vocare, tu asistente laboral.\n\nPuedo analizar tu CV o tus intereses y recomendarte las mejores oportunidades laborales.\n\n¿Quieres subir tu currículum o contarme sobre ti?",
};

const Index = () => {
  const { toast } = useToast();
  const [conversations, setConversations] = useState<Conversation[]>([
    {
      id: "1",
      title: "Búsqueda de empleo en tecnología",
      lastUpdated: "Hace 2 horas",
      messages: [WELCOME_MESSAGE],
    },
  ]);
  const [activeConversationId, setActiveConversationId] = useState<string>("1");
  const [isPanelOpen, setIsPanelOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const activeConversation = conversations.find((c) => c.id === activeConversationId);

  const handleSendMessage = (content: string) => {
    if (!activeConversationId) return;

    const newUserMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content,
    };

    setConversations((prev) =>
      prev.map((conv) =>
        conv.id === activeConversationId
          ? {
              ...conv,
              messages: [...conv.messages, newUserMessage],
              lastUpdated: "Ahora",
            }
          : conv
      )
    );

    // Simulate bot response
    setIsLoading(true);
    setTimeout(() => {
      const botResponse: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: "Entiendo que estás buscando oportunidades laborales. He analizado tu perfil y tengo algunas recomendaciones para ti. ¿Podrías contarme más sobre tus intereses y experiencia?",
      };

      setConversations((prev) =>
        prev.map((conv) =>
          conv.id === activeConversationId
            ? {
                ...conv,
                messages: [...conv.messages, botResponse],
              }
            : conv
        )
      );
      setIsLoading(false);
    }, 1500);
  };

  const handleFileUpload = (file: File) => {
    toast({
      title: "✓ CV recibido",
      description: `${file.name} se está analizando...`,
    });

    // Simulate CV processing
    setTimeout(() => {
      const botMessage: Message = {
        id: Date.now().toString(),
        role: "assistant",
        content: "He analizado tu CV exitosamente. Veo que tienes experiencia en desarrollo web y diseño UX. Te recomendaré las mejores ofertas que coincidan con tu perfil.",
      };

      setConversations((prev) =>
        prev.map((conv) =>
          conv.id === activeConversationId
            ? {
                ...conv,
                messages: [...conv.messages, botMessage],
                lastUpdated: "Ahora",
              }
            : conv
        )
      );
    }, 2000);
  };

  const handleNewConversation = () => {
    const newConv: Conversation = {
      id: Date.now().toString(),
      title: "Nueva conversación",
      lastUpdated: "Ahora",
      messages: [WELCOME_MESSAGE],
    };
    setConversations((prev) => [...prev, newConv]);
    setActiveConversationId(newConv.id);
  };

  const handleDeleteConversation = (id: string) => {
    setConversations((prev) => prev.filter((c) => c.id !== id));
    if (activeConversationId === id) {
      setActiveConversationId(conversations[0]?.id || "");
    }
  };

  return (
    <div className="flex h-screen w-full overflow-hidden bg-background">
      <ChatSidebar
        conversations={conversations}
        activeConversationId={activeConversationId}
        onSelectConversation={setActiveConversationId}
        onNewConversation={handleNewConversation}
        onDeleteConversation={handleDeleteConversation}
      />

      <main className="flex-1 flex flex-col relative">
        <ScrollArea className="flex-1 px-4 md:px-8">
          <div className="max-w-4xl mx-auto py-8">
            {activeConversation?.messages.map((message) => (
              <MessageBubble key={message.id} role={message.role} content={message.content} />
            ))}
          </div>
        </ScrollArea>

        <ChatInput
          onSendMessage={handleSendMessage}
          onFileUpload={handleFileUpload}
          isLoading={isLoading}
        />
      </main>

      <DatabasePanel isOpen={isPanelOpen} onToggle={() => setIsPanelOpen(!isPanelOpen)} />
    </div>
  );
};

export default Index;
