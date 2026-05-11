import { useState, useEffect, useCallback } from "react";
import {
  Books,
  MagnifyingGlass,
  ArrowRight,
  Brain,
  Sparkle,
  FileText,
  CircleNotch,
  Trash,
  Download,
  ShareNetwork
} from "@phosphor-icons/react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Layout } from "@/components/layout/Layout";
import { cn } from "@/lib/utils";
import { noteMethods } from "@/data/mockData";
import NoteRoom from "./NoteRoom";
import { toast } from "sonner";
import { collectionsService, Collection } from "@/services/collectionsService";
import { noteService } from "@/services/noteService";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { jsPDF } from "jspdf";

// Filter only the 6 specified methods
const supportedMethodIds = ['sentence', 'boxing', 'outline', 'mindmap', 'charting', 'cornell'];
const filteredMethods = noteMethods.filter(m => supportedMethodIds.includes(m.id)).sort((a, b) => supportedMethodIds.indexOf(a.id) - supportedMethodIds.indexOf(b.id));

// Production implementation with real API integration

export default function Notes() {
  const [activeTopic, setActiveTopic] = useState<any | null>(null);
  const [activeMethod, setActiveMethod] = useState<string | null>(null);
  const [isNoteRoomOpen, setIsNoteRoomOpen] = useState(false);

  // Selection state
  const [collections, setCollections] = useState<Collection[]>([]);
  const [selectedCollectionId, setSelectedCollectionId] = useState<string>("");
  const [selectedMethodId, setSelectedMethodId] = useState<string>("sentence");

  // Data state
  const [notes, setNotes] = useState<any[]>([]);
  const [isLoadingCollections, setIsLoadingCollections] = useState(true);
  const [isLoadingNotes, setIsLoadingNotes] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  // Fetch collections on mount
  useEffect(() => {
    const fetchCollections = async () => {
      try {
        const data = await collectionsService.getCollections();
        setCollections(data);
        if (data.length > 0) {
          const lastCollection = localStorage.getItem('last_note_collection');
          const initialId = lastCollection && data.find(c => c.collection_id === lastCollection)
            ? lastCollection
            : data[0].collection_id;

          setSelectedCollectionId(initialId);

          const lastMethod = localStorage.getItem('last_note_method');
          if (lastMethod && supportedMethodIds.includes(lastMethod)) {
            setSelectedMethodId(lastMethod);
          }
        }
      } catch (error) {
        console.error("Failed to fetch collections:", error);
        toast.error("Could not load study collections.");
      } finally {
        setIsLoadingCollections(false);
      }
    };
    fetchCollections();
  }, []);

  // Persist selections
  useEffect(() => {
    if (selectedCollectionId) localStorage.setItem('last_note_collection', selectedCollectionId);
    if (selectedMethodId) localStorage.setItem('last_note_method', selectedMethodId);
  }, [selectedCollectionId, selectedMethodId]);

  const fetchNotes = useCallback(async () => {
    if (!selectedCollectionId || !selectedMethodId) return;

    setIsLoadingNotes(true);
    console.log(`[Notes Hub] Fetching notes for collection ${selectedCollectionId} and method ${selectedMethodId}...`);

    try {
      const data = await noteService.getNotes(selectedMethodId, selectedCollectionId);
      console.log(`[Notes Hub] Received ${data.length} notes from API.`);
      setNotes(data);
    } catch (error: any) {
      console.error(`[Notes Hub] Failed to fetch notes:`, error);
      toast.error(`Backend Error: ${error.response?.status || 'Connection failed'}`);
      setNotes([]); // Clear list on error to avoid showing stale data
    } finally {
      setIsLoadingNotes(false);
    }
  }, [selectedCollectionId, selectedMethodId]);

  // Fetch notes when selection changes
  useEffect(() => {
    fetchNotes();
  }, [fetchNotes]);

  const handleLaunch = async () => {
    if (!selectedCollectionId || !selectedMethodId) {
      toast.error("Please select a collection first.");
      return;
    }

    setIsGenerating(true);
    try {
      // POST /api/notes/{method}
      await noteService.generateNote(selectedMethodId, selectedCollectionId);
      toast.success("Note generated successfully!");

      // On success, refresh the list via GET
      await fetchNotes();
    } catch (error: any) {
      console.error(`[Notes Hub] Launch failed:`, error);
      const methodName = filteredMethods.find(m => m.id === selectedMethodId)?.name || selectedMethodId;
      const errorMsg = (selectedMethodId === 'outline' || selectedMethodId === 'mindmap' || selectedMethodId === 'cornell' || selectedMethodId === 'charting')
        ? `Failed to generate ${methodName} note. Please try again.`
        : (error.response?.data?.message || `AI service error (${error.response?.status || 'Unknown'})`);
      toast.error(errorMsg);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDeleteNote = async (e: React.MouseEvent, noteId: string) => {
    e.stopPropagation();
    try {
      // DELETE /api/notes/{method}/{note_id}
      await noteService.deleteNote(selectedMethodId, noteId);
      toast.success("Note removed successfully.");

      // On success, refresh the list via GET
      await fetchNotes();
    } catch (error) {
      console.error("Delete failed:", error);
      const methodName = filteredMethods.find(m => m.id === selectedMethodId)?.name || selectedMethodId;
      const errorMsg = (selectedMethodId === 'outline' || selectedMethodId === 'mindmap' || selectedMethodId === 'cornell' || selectedMethodId === 'charting')
        ? `Failed to delete ${methodName} note.`
        : "Could not delete this note.";
      toast.error(errorMsg);
    }
  };

  const handleDownload = (note: any) => {
    try {
      const doc = new jsPDF();
      const title = note.title || "Study Note";

      doc.setFontSize(20);
      doc.text(title, 10, 20);
      doc.setFontSize(12);
      doc.setTextColor(100);
      doc.text(`Generated by Questify AI on ${new Date().toLocaleDateString()}`, 10, 30);

      doc.setLineWidth(0.5);
      doc.line(10, 35, 200, 35);

      doc.setTextColor(0);
      doc.setFontSize(11);
      const content = note.content || note[selectedMethodId] || "No content available";
      const textContent = typeof content === 'string' ? content : JSON.stringify(content, null, 2);

      const splitText = doc.splitTextToSize(textContent, 180);
      doc.text(splitText, 10, 45);

      doc.save(`${title.replace(/\s+/g, '_')}.pdf`);
      toast.success("Note downloaded as PDF");
    } catch (err) {
      console.error("PDF Export failed:", err);
      toast.error("Failed to generate PDF");
    }
  };

  const handleShare = (noteId: string) => {
    const shareLink = `${window.location.origin}/note/${noteId}`;
    navigator.clipboard.writeText(shareLink);
    toast.success("Link copied to clipboard");
  };

  const handleOpenNote = (note: any) => {
    const transformedTopic = {
      id: note.id || note.note_id,
      title: note.title || "Generated Note",
      courseId: "AI-Studio",
      [selectedMethodId]: note,
      collectionId: selectedCollectionId
    };

    setActiveTopic(transformedTopic);
    setActiveMethod(selectedMethodId);
    setIsNoteRoomOpen(true);
  };

  const filteredCollections = collections.filter(collection =>
    collection.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (isNoteRoomOpen && activeTopic && activeMethod) {
    return (
      <Layout showSidebar={false} title={`Notes: ${activeTopic.title}`}>
        <NoteRoom
          topic={activeTopic}
          initialMethod={activeMethod}
          onClose={() => setIsNoteRoomOpen(false)}
        />
      </Layout>
    );
  }

  return (
    <DashboardLayout title="Cognitive Studio">
      <div className="container py-6 max-w-7xl mx-auto space-y-6">

        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-6 border-b">
          <div>
            <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">Cognitive Studio</h1>
            <p className="text-muted-foreground mt-1">Transform your study materials into structured cognitive assets.</p>
          </div>

          <div className="flex items-center gap-3">
            <Badge variant="outline" className="px-3 py-1 gap-1.5 font-medium rounded-full bg-primary/5">
              <Books className="w-3.5 h-3.5 text-primary" />
              {collections.length} Collections
            </Badge>
            <Badge variant="outline" className="px-3 py-1 gap-1.5 font-medium rounded-full bg-primary/5">
              <Brain className="w-3.5 h-3.5 text-primary" />
              6 Methods
            </Badge>
          </div>
        </div>

        <div className="grid lg:grid-cols-12 gap-8">
          {/* Left: Collections Sidebar */}
          <div className="lg:col-span-3 space-y-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between px-2">
                <h2 className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Select Collection</h2>
              </div>
              <div className="relative">
                <MagnifyingGlass className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Filter collections..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 h-10 rounded-xl border-none bg-muted/50"
                />
              </div>
              <div className="space-y-2 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
                {isLoadingCollections ? (
                  [1, 2, 3].map(i => <div key={i} className="h-16 rounded-xl bg-muted animate-pulse" />)
                ) : filteredCollections.map(c => (
                  <button
                    key={c.collection_id}
                    onClick={() => setSelectedCollectionId(c.collection_id)}
                    className={cn(
                      "w-full text-left p-3 rounded-xl transition-all border",
                      selectedCollectionId === c.collection_id
                        ? "bg-primary/10 border-primary text-primary"
                        : "border-transparent hover:bg-muted"
                    )}
                  >
                    <p className="font-bold text-sm truncate">{c.title}</p>
                    <p className="text-[10px] opacity-60">Created {new Date(c.created_at).toLocaleDateString()}</p>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Right: Tabs & Notes */}
          <div className="lg:col-span-9 space-y-8">
            <Tabs value={selectedMethodId} onValueChange={setSelectedMethodId} className="w-full">
              <TabsList className="grid grid-cols-3 md:grid-cols-6 h-auto p-1 bg-muted/50 rounded-2xl">
                {filteredMethods.map(m => (
                  <TabsTrigger
                    key={m.id}
                    value={m.id}
                    className="rounded-xl py-2.5 data-[state=active]:bg-card data-[state=active]:shadow-sm"
                  >
                    <div className="flex flex-col items-center gap-1">
                      <span className="text-lg">{m.icon}</span>
                      <span className="text-[10px] font-bold uppercase tracking-tighter">{m.name.split(' ')[0]}</span>
                    </div>
                  </TabsTrigger>
                ))}
              </TabsList>

              {filteredMethods.map(m => (
                <TabsContent key={m.id} value={m.id} className="mt-8 space-y-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-xl font-bold">{m.name}</h2>
                      <p className="text-sm text-muted-foreground">{m.description}</p>
                    </div>
                  </div>

                  {isLoadingNotes ? (
                    <div className="flex flex-col items-center justify-center py-24 gap-4 opacity-50 border border-dashed rounded-3xl">
                      <CircleNotch className="w-10 h-10 animate-spin text-primary" />
                      <p className="text-sm font-medium">Synchronizing studio...</p>
                    </div>
                  ) : notes.length === 0 ? (
                    <Card className="p-16 text-center border-dashed bg-muted/10 rounded-3xl">
                      <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4 text-primary">
                        <Sparkle className="w-8 h-8" weight="fill" />
                      </div>
                      <h3 className="text-lg font-bold mb-2">No notes yet</h3>
                      <p className="text-sm text-muted-foreground max-w-sm mx-auto mb-6">
                        No notes yet. Click 'Launch Studio' to generate one.
                      </p>
                    </Card>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
                      {notes.map((note) => (
                        <Card
                          key={note.note_id || note.id || Math.random().toString()}
                          className="group relative overflow-hidden p-6 transition-all cursor-pointer border-primary/10 hover:border-primary/30"
                          onClick={() => handleOpenNote(note)}
                        >
                          <div className="flex flex-col h-full gap-4">
                            <div className="flex items-start justify-between">
                              <div className="p-3 rounded-2xl bg-primary/10 text-primary">
                                <FileText className="w-6 h-6" />
                              </div>
                              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8 rounded-full hover:bg-primary/10"
                                  onClick={(e) => { e.stopPropagation(); handleDownload(note); }}
                                >
                                  <Download className="w-4 h-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8 rounded-full hover:bg-primary/10"
                                  onClick={(e) => { e.stopPropagation(); handleShare(note.note_id || note.id); }}
                                >
                                  <ShareNetwork className="w-4 h-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8 rounded-full hover:bg-destructive/10 hover:text-destructive"
                                  onClick={(e) => handleDeleteNote(e, note.note_id || note.id)}
                                >
                                  <Trash className="w-4 h-4" />
                                </Button>
                              </div>
                            </div>
                            <div className="space-y-3">
                              <div>
                                <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1 flex items-center gap-2">
                                  {note.created_at ? new Date(note.created_at).toLocaleDateString(undefined, { dateStyle: 'medium' }) : 'Recently'}
                                  <span className="w-1 h-1 rounded-full bg-muted-foreground/30" />
                                  <span className="text-primary/80">
                                    {collections.find(c => c.collection_id === selectedCollectionId)?.title || 'Active Collection'}
                                  </span>
                                </p>
                                <h3 className="text-lg font-bold leading-tight group-hover:text-primary transition-colors truncate">
                                  {note.title || `Note ${new Date(note.created_at).toLocaleDateString()}`}
                                </h3>
                              </div>

                              <div className="text-sm">
                                <p className="text-muted-foreground text-[13px] line-clamp-3 leading-relaxed italic">
                                  {typeof note.content === 'string' 
                                    ? note.content 
                                    : (note.summary || note.description || `Structured ${selectedMethodId} note for your study session.`)}
                                </p>
                              </div>
                            </div>
                            <div className="pt-4 border-t flex items-center justify-between text-xs font-bold text-primary opacity-0 group-hover:opacity-100 transition-opacity mt-auto">
                              Open in Studio
                              <ArrowRight className="w-4 h-4" />
                            </div>
                          </div>
                        </Card>
                      ))}
                    </div>
                  )}
                </TabsContent>
              ))}
            </Tabs>

            {/* Selection Summary Action */}
            <div className="bg-card p-4 rounded-xl shadow-lg border flex flex-col md:flex-row items-center justify-between gap-4 animate-fade-in">
              <div className="space-y-1 text-center md:text-left">
                <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Selected Configuration</p>
                <div className="flex items-center gap-3">
                  <span className="font-bold text-sm">
                    {selectedCollectionId ? collections.find(c => c.collection_id === selectedCollectionId)?.title : "Select a topic"}
                  </span>
                  <ArrowRight className="w-4 h-4 text-muted-foreground" />
                  <span className="font-bold text-sm text-primary">
                    {selectedMethodId ? filteredMethods.find(m => m.id === selectedMethodId)?.name : "Choose method"}
                  </span>
                </div>
              </div>

              <Button
                size="lg"
                onClick={handleLaunch}
                disabled={isGenerating || !selectedCollectionId}
                className="rounded-xl px-8 h-12 gap-2 font-bold shadow-lg shadow-primary/20"
              >
                {isGenerating ? <CircleNotch className="w-4 h-4 animate-spin" /> : <Sparkle className="w-4 h-4" />}
                Launch Studio
              </Button>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}