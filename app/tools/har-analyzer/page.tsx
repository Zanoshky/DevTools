"use client";

import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { ToolLayout } from "@/components/tool-layout";
import { ToolCard } from "@/components/tool-card";
import { HarAnalyzerTabs } from "@/components/har/har-analyzer-tabs";
import { sampleHarData } from "@/components/har/sample-data";
import { useToast } from "@/hooks/use-toast";
import { Har, HarEntry } from "@/components/har-types";
import { Upload, FileJson, Trash2, Download, Info } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";

export default function HarAnalyzerPage() {
  const [harData, setHarData] = useState<Har | null>(null);
  const [compareHar, setCompareHar] = useState<Har | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [fileName, setFileName] = useState<string>("");
  const [selectedRequest, setSelectedRequest] = useState<HarEntry | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setIsLoading(true);
    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = (e: ProgressEvent<FileReader>) => {
      try {
        const content = JSON.parse(e.target?.result as string);
        if (!content.log) {
          toast({
            title: "Invalid HAR file",
            description: "The uploaded file is not a valid HAR format.",
            variant: "destructive",
          });
          setIsLoading(false);
          return;
        }
        setHarData(content);
        setCompareHar(null);
        toast({
          title: "HAR file loaded",
          description: `Successfully loaded ${file.name}`,
        });
      } catch {
        toast({
          title: "Error parsing HAR file",
          description: "Could not parse the uploaded file.",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };
    reader.readAsText(file);
  };

  const loadSampleData = () => {
    setIsLoading(true);
    setFileName("sample-data.har");
    setTimeout(() => {
      setHarData(sampleHarData);
      setCompareHar(null);
      toast({
        title: "Sample data loaded",
        description: "Successfully loaded sample HAR data",
      });
      setIsLoading(false);
    }, 300);
  };

  const clearData = () => {
    setHarData(null);
    setCompareHar(null);
    setFileName("");
    setSelectedRequest(null);
    toast({
      title: "Data cleared",
      description: "HAR data has been removed",
    });
  };

  const exportData = () => {
    if (!harData) return;
    const dataStr = JSON.stringify(harData, null, 2);
    const dataBlob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement("a");
    link.href = url;
    link.download = fileName || "export.har";
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <ToolLayout
      title="HAR Analyzer"
      description="Analyze HTTP Archive (HAR) files with detailed performance insights"
    >
      <div className="space-y-4">
        {/* Upload/Control Card */}
        <ToolCard>
          <div className="space-y-4">
            {!harData ? (
              <>
                <div className="flex gap-2 justify-center">
                  <Button 
                    onClick={() => fileInputRef.current?.click()} 
                    size="lg" 
                    disabled={isLoading}
                  >
                    <Upload className="h-4 w-4 mr-2" />
                    Upload HAR File
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={loadSampleData} 
                    disabled={isLoading} 
                    size="lg"
                  >
                    <FileJson className="h-4 w-4 mr-2" />
                    Load Sample
                  </Button>
                </div>

                <Alert>
                  <Info className="h-4 w-4" />
                  <AlertDescription className="text-sm space-y-2">
                    <div className="font-semibold mb-2">How to export HAR files:</div>
                    <div className="space-y-1.5 text-xs">
                      <div>
                        <span className="font-bold">Chrome/Edge:</span> Open DevTools → Network tab → Right-click on any request → &quot;Save all as HAR with content&quot;
                      </div>
                      <div>
                        <span className="font-bold">Firefox:</span> Open DevTools → Network tab → Click the gear icon → &quot;Save All As HAR&quot;
                      </div>
                      <div>
                        <span className="font-bold">Safari:</span> Open Web Inspector → Network tab → Click Export button → Save as HAR
                      </div>
                    </div>
                  </AlertDescription>
                </Alert>
              </>
            ) : (
              <div className="flex items-center justify-between flex-wrap gap-3">
                <div className="flex items-center gap-3">
                  <FileJson className="h-5 w-5 text-primary" />
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold">{fileName}</span>
                      {harData.log.browser && (
                        <Badge variant="outline" className="text-xs">
                          {harData.log.browser.name} {harData.log.browser.version}
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {harData.log.entries.length} requests • {harData.log.pages?.length || 0} pages
                    </p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={exportData}>
                    <Download className="h-4 w-4 mr-2" />
                    Export
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => fileInputRef.current?.click()}>
                    <Upload className="h-4 w-4 mr-2" />
                    New File
                  </Button>
                  <Button variant="outline" size="sm" onClick={clearData}>
                    <Trash2 className="h-4 w-4 mr-2" />
                    Clear
                  </Button>
                </div>
              </div>
            )}
          </div>
        </ToolCard>

        {/* Tabs - only show when data is loaded */}
        {harData && (
          <HarAnalyzerTabs 
            harData={harData} 
            compareHar={compareHar} 
            setCompareHar={setCompareHar}
            selectedRequest={selectedRequest}
            setSelectedRequest={setSelectedRequest}
          />
        )}
      </div>
      
      <input
        ref={fileInputRef}
        type="file"
        accept=".har,application/json"
        className="hidden"
        onChange={handleFileUpload}
      />
    </ToolLayout>
  );
}
