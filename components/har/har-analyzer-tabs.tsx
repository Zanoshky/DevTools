
import { useState } from "react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { OverviewTab } from "./overview-tab";
import { RequestsTab } from "./request-tab";
import { DependenciesTab } from "./depedency-tab";
import { InsightsTab } from "./insight-tab";
import { CompareTab } from "./compare-tab";
import type { Har, HarEntry } from "@/components/har-types";

export function HarAnalyzerTabs({
  harData,
  compareHar,
  setCompareHar,
  selectedRequest,
  setSelectedRequest,
}: {
  harData: Har;
  compareHar: Har | null;
  setCompareHar: (d: Har | null) => void;
  selectedRequest: HarEntry | null;
  setSelectedRequest: (r: HarEntry | null) => void;
}) {
  const [activeTab, setActiveTab] = useState("overview");

  // Clear selection when switching to overview, insights, or compare tabs
  const handleTabChange = (value: string) => {
    setActiveTab(value);
    if (value === "overview" || value === "insights" || value === "compare") {
      setSelectedRequest(null);
    }
  };

  return (
    <Tabs
      value={activeTab}
      onValueChange={handleTabChange}
      className="w-full"
      aria-label="HAR Analyzer Sections"
      role="tablist"
    >
      <TabsList
        className="grid w-full grid-cols-5"
        aria-label="HAR Analyzer Tabs"
        role="tablist"
      >
        <TabsTrigger
          value="overview"
          aria-controls="tab-panel-overview"
          id="tab-overview"
        >
          Overview
        </TabsTrigger>
        <TabsTrigger
          value="requests"
          aria-controls="tab-panel-requests"
          id="tab-requests"
        >
          Requests
        </TabsTrigger>
        <TabsTrigger
          value="dependencies"
          aria-controls="tab-panel-dependencies"
          id="tab-dependencies"
        >
          Dependencies
        </TabsTrigger>
        <TabsTrigger
          value="insights"
          aria-controls="tab-panel-insights"
          id="tab-insights"
        >
          Insights
        </TabsTrigger>
        <TabsTrigger
          value="compare"
          aria-controls="tab-panel-compare"
          id="tab-compare"
        >
          Compare
        </TabsTrigger>
      </TabsList>
      <TabsContent
        value="overview"
        id="tab-panel-overview"
        aria-labelledby="tab-overview"
        role="tabpanel"
        tabIndex={0}
        className="mt-4"
      >
        <OverviewTab harData={harData} />
      </TabsContent>
      <TabsContent
        value="requests"
        id="tab-panel-requests"
        aria-labelledby="tab-requests"
        role="tabpanel"
        tabIndex={0}
        className="mt-4"
      >
        <RequestsTab 
          harData={harData} 
          selectedRequest={selectedRequest}
          setSelectedRequest={setSelectedRequest}
        />
      </TabsContent>
      <TabsContent
        value="dependencies"
        id="tab-panel-dependencies"
        aria-labelledby="tab-dependencies"
        role="tabpanel"
        tabIndex={0}
        className="mt-4"
      >
        <DependenciesTab 
          harData={harData}
          selectedRequest={selectedRequest}
          setSelectedRequest={setSelectedRequest}
        />
      </TabsContent>
      <TabsContent
        value="insights"
        id="tab-panel-insights"
        aria-labelledby="tab-insights"
        role="tabpanel"
        tabIndex={0}
        className="mt-4"
      >
        <InsightsTab harData={harData} />
      </TabsContent>
      <TabsContent
        value="compare"
        id="tab-panel-compare"
        aria-labelledby="tab-compare"
        role="tabpanel"
        tabIndex={0}
        className="mt-4"
      >
        <CompareTab
          harData={harData}
          compareHar={compareHar}
          setCompareHar={setCompareHar}
        />
      </TabsContent>
    </Tabs>
  );
}
