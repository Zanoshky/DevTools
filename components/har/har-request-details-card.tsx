import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { HarEntry } from "@/components/har-types";

interface HarRequestDetailsCardProps {
  selected: HarEntry;
}

export function HarRequestDetailsCard({
  selected,
}: HarRequestDetailsCardProps) {
  if (!selected) return null;

  return (
    <Card
      aria-label="Request details"
      role="region"
      tabIndex={-1}
      aria-labelledby="request-details-title"
    >
      <CardHeader>
        <CardTitle id="request-details-title" tabIndex={0} className="text-xs">
          Request Details
        </CardTitle>
      </CardHeader>
      <CardContent>
        <dl className="text-xs">
          <div className="mb-2">
            <dt>
              <b className="text-xs">URL:</b>
            </dt>
            <dd>
              <span className="break-all text-xs" tabIndex={0}>
                {selected.request.url}
              </span>
            </dd>
          </div>
          <div className="mb-2">
            <dt>
              <b className="text-xs">Method:</b>
            </dt>
            <dd>
              <Badge
                className="ml-1 text-xs"
                aria-label={selected.request.method}
              >
                {selected.request.method}
              </Badge>
            </dd>
          </div>
          <div className="mb-2">
            <dt>
              <b className="text-xs">Status:</b>
            </dt>
            <dd>
              <Badge
                className="ml-1 text-xs"
                aria-label={`Status ${selected.response.status}`}
              >
                {selected.response.status} {selected.response.statusText ?? ""}
              </Badge>
            </dd>
          </div>
          <div className="mb-2">
            <dt>
              <b className="text-xs">Type:</b>
            </dt>
            <dd>
              <span className="ml-1 text-xs" tabIndex={0}>
                {selected.response.content.mimeType}
              </span>
            </dd>
          </div>
          <div className="mb-2">
            <dt>
              <b className="text-xs">Request Cookies:</b>
            </dt>
            <dd>
              <ul className="ml-4 list-disc text-xs">
                {selected.request.cookies?.length ? (
                  selected.request.cookies.map(
                    (c: { name: string; value: string }, i: number) => (
                      <li key={i}>
                        <span className="font-mono text-xs">{c.name}</span>:{" "}
                        <span className="font-mono text-xs">{c.value}</span>
                      </li>
                    )
                  )
                ) : (
                  <li className="text-muted-foreground text-xs">
                    No cookies. Browsers do not send HttpOnly cookies in the
                    request cookies array (JavaScript cannot access them).
                  </li>
                )}
              </ul>
            </dd>
          </div>
          <div className="mb-2">
            <dt>
              <b className="text-xs">Response Cookies:</b>
            </dt>
            <dd>
              <ul className="ml-4 list-disc text-xs">
                {selected.response.cookies?.length ? (
                  selected.response.cookies.map(
                    (c: { name: string; value: string }, i: number) => (
                      <li key={i}>
                        <span className="font-mono text-xs">{c.name}</span>:{" "}
                        <span className="font-mono text-xs">{c.value}</span>
                      </li>
                    )
                  )
                ) : (
                  <li className="text-muted-foreground text-xs">
                    No cookies. Browsers do not send HttpOnly cookies in the
                    response cookies array (JavaScript cannot access them).
                  </li>
                )}
              </ul>
            </dd>
          </div>
          <div className="mb-2">
            <dt>
              <b className="text-xs">Request Headers:</b>
            </dt>
            <dd>
              <ul className="ml-4 list-disc text-xs">
                {selected.request.headers.map(
                  (h: { name: string; value: string }, i: number) => (
                    <li key={i}>
                      <span className="font-mono text-xs">{h.name}</span>:{" "}
                      <span className="font-mono text-xs">{h.value}</span>
                    </li>
                  )
                )}
              </ul>
            </dd>
          </div>
          <div className="mb-2">
            <dt>
              <b className="text-xs">Response Headers:</b>
            </dt>
            <dd>
              <ul className="ml-4 list-disc text-xs">
                {selected.response.headers.map(
                  (h: { name: string; value: string }, i: number) => (
                    <li key={i}>
                      <span className="font-mono text-xs">{h.name}</span>:{" "}
                      <span className="font-mono text-xs">{h.value}</span>
                    </li>
                  )
                )}
              </ul>
            </dd>
          </div>
          {selected.response.content?.text && (
            <div className="mb-2">
              <dt>
                <b className="text-xs">Response Body:</b>
              </dt>
              <dd>
                <pre
                  className="bg-muted p-2 rounded text-xs max-h-64 overflow-auto"
                  tabIndex={0}
                  aria-label="Response body"
                >
                  {selected.response.content.mimeType
                    ?.toLowerCase()
                    .includes("json")
                    ? (() => {
                        try {
                          return JSON.stringify(
                            JSON.parse(selected.response.content.text),
                            null,
                            2
                          );
                        } catch {
                          return selected.response.content.text;
                        }
                      })()
                    : selected.response.content.text}
                </pre>
              </dd>
            </div>
          )}
        </dl>
      </CardContent>
    </Card>
  );
}
