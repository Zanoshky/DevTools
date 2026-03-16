
import { Har, HarEntry } from "../har-types";
import { DependencyTree } from "./dependency-tree";

export function DependenciesTab({ 
  harData,
  selectedRequest,
  setSelectedRequest,
}: { 
  harData: Har;
  selectedRequest: HarEntry | null;
  setSelectedRequest: (r: HarEntry | null) => void;
}) {
  if (!harData?.log?.entries) {
    return (
      <section
        aria-label="Dependencies"
        role="region"
        tabIndex={-1}
        className="p-4"
      >
        <p className="text-muted-foreground" role="status">
          No dependency data available.
        </p>
      </section>
    );
  }

  return (
    <section
      aria-label="Dependencies"
      role="region"
      tabIndex={-1}
      className="p-4"
    >
      <h2
        className="text-lg font-semibold mb-2"
        id="dependencies-heading"
        tabIndex={0}
      >
        Dependency Tree
      </h2>
      <DependencyTree
        entries={harData.log.entries}
        aria-labelledby="dependencies-heading"
        selectedRequest={selectedRequest}
        setSelectedRequest={setSelectedRequest}
      />
    </section>
  );
}
