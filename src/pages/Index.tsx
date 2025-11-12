import { useState, useRef } from "react";
import { ChatSidebar } from "@/components/ChatSidebar";
import { MessageBubble } from "@/components/MessageBubble";
import { ChatInput } from "@/components/ChatInput";
import { DatabasePanel } from "@/components/DatabasePanel";
import Headbar from "@/components/Headbar";
import Navbar from "@/components/Navbar";
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

const WELCOME_MESSAGES = [
  "👋 ¡Hola! Soy Vocare, tu asistente laboral.\n\nPuedo analizar tu CV o tus intereses y recomendarte las mejores oportunidades laborales.\n\n¿Quieres subir tu currículum o contarme sobre ti?",
  "¡Hola! 🌟 Me llamo Vocare y estoy aquí para ayudarte a encontrar oportunidades laborales que se ajusten a tu perfil.\n\n¿Tienes tu CV a mano o prefieres contarme sobre tu experiencia?",
  "¡Bienvenido! 💼 Soy Vocare, tu compañero en la búsqueda laboral.\n\nPuedo revisar tu currículum o simplemente conversar sobre tus intereses profesionales.\n\n¿Cómo te gustaría empezar?",
];

const GENERAL_RESPONSES = [
  "Entiendo 👍 Cuéntame más sobre lo que buscas y te ayudaré a encontrar las mejores opciones.",
  "Genial, gracias por contarme eso. Creo que tengo algo que podría interesarte 🌟",
  "Perfecto 🙌 Déjame buscar opciones que encajen con tu perfil.",
  "Me parece muy interesante tu experiencia. ¿Hay algún área específica en la que te gustaría trabajar?",
  "Excelente punto. Basándome en lo que me cuentas, puedo recomendarte algunas ofertas. ¿Quieres que busquemos juntos?",
  "Eso suena bien 💬 ¿Te gustaría que te muestre algunas oportunidades relacionadas?",
];

const CV_ANALYSIS_RESPONSES = [
  "¡Listo! 📄 He revisado tu CV y veo que tienes un perfil muy interesante. Déjame buscar ofertas que coincidan con tu experiencia.",
  "Perfecto, ya analicé tu currículum 🌟 Veo experiencia valiosa aquí. Te voy a recomendar algunas oportunidades que podrían encajar muy bien.",
  "Excelente CV 💼 He identificado tus fortalezas y áreas de interés. ¿Te gustaría ver las ofertas que más se ajustan a tu perfil?",
  "¡Muy bien! Ya revisé tu información. Tu experiencia es relevante para varias posiciones que tengo en mente. ¿Empezamos a explorar opciones?",
];

const getRandomMessage = (messages: string[]) => 
  messages[Math.floor(Math.random() * messages.length)];

const WELCOME_MESSAGE: Message = {
  id: "welcome",
  role: "assistant",
  content: getRandomMessage(WELCOME_MESSAGES),
};

const Index = () => {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
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
        content: getRandomMessage(GENERAL_RESPONSES),
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
        content: getRandomMessage(CV_ANALYSIS_RESPONSES),
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
      messages: [{
        id: "welcome-" + Date.now(),
        role: "assistant",
        content: getRandomMessage(WELCOME_MESSAGES),
      }],
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

  const triggerFileUpload = () => {
    fileInputRef.current?.click();
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileUpload(file);
    }
  };

  return (
    <div className="flex flex-col h-screen w-full overflow-hidden bg-background">
      <Headbar />
      <Navbar />
      
      <div className="flex flex-1 overflow-hidden">
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

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".pdf"
        className="hidden"
        onChange={handleFileInputChange}
      />
    </div>
  );
};

export default Index;
