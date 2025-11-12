import { useState } from "react";
import { MessageSquare, Plus, Trash2, Settings, Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";

interface Conversation {
  id: string;
  title: string;
  lastUpdated: string;
}

interface ChatSidebarProps {
  conversations: Conversation[];
  activeConversationId: string | null;
  onSelectConversation: (id: string) => void;
  onNewConversation: () => void;
  onDeleteConversation: (id: string) => void;
  className?: string;
}

export function ChatSidebar({
  conversations,
  activeConversationId,
  onSelectConversation,
  onNewConversation,
  onDeleteConversation,
  className,
}: ChatSidebarProps) {
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  const SidebarContent = () => (
    <div className="flex flex-col h-full bg-sidebar border-r border-sidebar-border">
      <div className="p-4 border-b border-sidebar-border">
        <Button
          onClick={() => {
            onNewConversation();
            setIsMobileOpen(false);
          }}
          className="w-full bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl font-medium"
        >
          <Plus className="w-4 h-4 mr-2" />
          Nueva conversación
        </Button>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-3 space-y-2">
          {conversations.map((conv) => (
            <div
              key={conv.id}
              className={cn(
                "group relative flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-all",
                "hover:bg-sidebar-accent",
                activeConversationId === conv.id && "bg-sidebar-accent"
              )}
              onClick={() => {
                onSelectConversation(conv.id);
                setIsMobileOpen(false);
              }}
            >
              <MessageSquare className="w-4 h-4 text-sidebar-foreground/60 shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-sidebar-foreground truncate">
                  {conv.title}
                </p>
                <p className="text-xs text-sidebar-foreground/50 truncate">
                  {conv.lastUpdated}
                </p>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="opacity-0 group-hover:opacity-100 transition-opacity shrink-0 h-8 w-8"
                onClick={(e) => {
                  e.stopPropagation();
                  onDeleteConversation(conv.id);
                }}
              >
                <Trash2 className="w-4 h-4 text-destructive" />
              </Button>
            </div>
          ))}
        </div>
      </ScrollArea>

      <div className="p-4 border-t border-sidebar-border">
        <div className="flex items-center gap-3 p-3 rounded-lg hover:bg-sidebar-accent cursor-pointer transition-all">
          <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-bold">
            V
          </div>
          <div className="flex-1">
            <p className="text-sm font-semibold text-sidebar-foreground">Vocare</p>
            <p className="text-xs text-sidebar-foreground/60">Asistente Laboral</p>
          </div>
          <Settings className="w-4 h-4 text-sidebar-foreground/60" />
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile Toggle Button */}
      <Button
        variant="ghost"
        size="icon"
        className="fixed top-4 left-4 z-50 md:hidden"
        onClick={() => setIsMobileOpen(!isMobileOpen)}
      >
        {isMobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
      </Button>

      {/* Desktop Sidebar */}
      <aside className={cn("hidden md:block w-64 h-full", className)}>
        <SidebarContent />
      </aside>

      {/* Mobile Sidebar */}
      {isMobileOpen && (
        <>
          <div
            className="fixed inset-0 bg-black/50 z-40 md:hidden"
            onClick={() => setIsMobileOpen(false)}
          />
          <aside className="fixed left-0 top-0 bottom-0 w-64 z-50 md:hidden">
            <SidebarContent />
          </aside>
        </>
      )}
    </>
  );
}
