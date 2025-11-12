import { useState } from "react";
import { Send, Mic, Paperclip } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";

interface ChatInputProps {
  onSendMessage: (message: string) => void;
  onFileUpload: (file: File) => void;
  isLoading?: boolean;
}

export function ChatInput({ onSendMessage, onFileUpload, isLoading }: ChatInputProps) {
  const [message, setMessage] = useState("");
  const { toast } = useToast();

  const handleSend = () => {
    if (message.trim() && !isLoading) {
      onSendMessage(message);
      setMessage("");
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.type === "application/pdf") {
        onFileUpload(file);
      } else {
        toast({
          title: "Formato no válido",
          description: "Por favor, sube un archivo PDF",
          variant: "destructive",
        });
      }
    }
  };

  return (
    <div className="border-t border-border bg-background p-4">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-end gap-2">
          <div className="flex-1 relative">
            <Textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyDown={handleKeyPress}
              placeholder="Escribe tu mensaje o sube tu CV..."
              className="min-h-[52px] max-h-32 resize-none rounded-xl pr-20 bg-muted/50 border-border focus:border-primary"
              disabled={isLoading}
            />
            <div className="absolute right-2 bottom-2 flex gap-1">
              <input
                type="file"
                id="file-upload"
                className="hidden"
                accept=".pdf"
                onChange={handleFileChange}
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-8 w-8 hover:bg-muted"
                onClick={() => document.getElementById("file-upload")?.click()}
                disabled={isLoading}
              >
                <Paperclip className="w-4 h-4 text-muted-foreground" />
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-8 w-8 hover:bg-muted"
                disabled={isLoading}
              >
                <Mic className="w-4 h-4 text-muted-foreground" />
              </Button>
            </div>
          </div>
          <Button
            onClick={handleSend}
            disabled={!message.trim() || isLoading}
            className="h-[52px] w-[52px] rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground shrink-0"
          >
            <Send className="w-5 h-5" />
          </Button>
        </div>
        {isLoading && (
          <div className="flex items-center gap-2 mt-2 text-sm text-muted-foreground">
            <div className="flex gap-1">
              <span className="w-2 h-2 bg-primary rounded-full animate-bounce [animation-delay:-0.3s]" />
              <span className="w-2 h-2 bg-primary rounded-full animate-bounce [animation-delay:-0.15s]" />
              <span className="w-2 h-2 bg-primary rounded-full animate-bounce" />
            </div>
            <span>Vocare está escribiendo...</span>
          </div>
        )}
      </div>
    </div>
  );
}
