import React from "react";
import { useClipboard } from "../../hooks/use-clipboard";
import { ProjectOutput } from "../../lib/types";
import {
  FileTextIcon,
  LinkIcon,
  CheckIcon,
  CopyIcon,
  IpfsIcon,
  CodeIcon,
  ToolboxIcon,
  DatabaseIcon,
} from "../ui/icons";

export const OutputListItem = ({ output }: { output: ProjectOutput }) => {
  const { copy, copied } = useClipboard();

  const DataBox = ({ children }: { children: React.ReactNode }) => (
    <div className="flex items-center space-x-3 bg-cairn-gray-100 dark:bg-cairn-gray-800/60 p-2.5 rounded-lg font-mono text-sm border border-border dark:border-border-dark">
      {children}
    </div>
  );

  const renderLinkBox = (
    label: string,
    url: string,
    icon?: React.ReactNode
  ) => {
    if (!url) return null;
    return (
      <DataBox>
        {icon || (
          <LinkIcon className="w-5 h-5 text-text-secondary flex-shrink-0" />
        )}
        <span className="text-text-secondary mr-1">{label}:</span>
        <a
          href={!url.startsWith("http") ? `https://${url}` : url}
          target="_blank"
          rel="noopener noreferrer"
          className="text-primary dark:text-primary-light hover:underline truncate flex-grow"
        >
          {url}
        </a>
        <button
          onClick={() => copy(url)}
          className="p-1 rounded hover:bg-cairn-gray-300 dark:hover:bg-cairn-gray-600"
        >
          {copied ? (
            <CheckIcon className="w-4 h-4 text-status-success" />
          ) : (
            <CopyIcon className="w-4 h-4 text-text-secondary" />
          )}
        </button>
      </DataBox>
    );
  };

  return (
    <li className="py-6 first:pt-0 last:pb-0">
      <div className="flex items-start space-x-4">
        <FileTextIcon className="w-6 h-6 mt-1 text-primary flex-shrink-0" />
        <div className="flex-grow">
          <p className="font-semibold text-text dark:text-text-dark">
            {output.description}
          </p>
          <div className="mt-4 space-y-2">
            {renderLinkBox(
              "Paper",
              output.paper_url,
              <FileTextIcon className="w-5 h-5 text-text-secondary" />
            )}
            {renderLinkBox(
              "Dataset",
              output.resources.dataset_url,
              <DatabaseIcon className="w-5 h-5 text-text-secondary" />
            )}
            {renderLinkBox(
              "Code",
              output.resources.code_url,
              <CodeIcon className="w-5 h-5 text-text-secondary" />
            )}
            {renderLinkBox(
              "Code Output",
              output.resources.code_output_url,
              <IpfsIcon className="w-5 h-5 text-text-secondary" />
            )}

            {(output.tools.tools.length > 0 ||
              (output.tools.other_tools?.length ?? 0) > 0) && (
              <DataBox>
                <ToolboxIcon className="w-5 h-5 text-text-secondary flex-shrink-0" />
                <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
                  {output.tools.tools.map((tool) => (
                    <span
                      key={tool}
                      className="inline-flex items-center text-xs font-semibold text-text dark:text-text-dark"
                    >
                      <CheckIcon className="w-3.5 h-3.5 mr-1.5 text-primary" />
                      {tool}
                    </span>
                  ))}
                  {output.tools.other_tools?.map((tool) => (
                    <span
                      key={tool}
                      className="inline-flex items-center text-xs font-semibold text-text dark:text-text-dark"
                    >
                      <CheckIcon className="w-3.5 h-3.5 mr-1.5 text-primary" />
                      {tool}
                    </span>
                  ))}
                </div>
              </DataBox>
            )}
          </div>
        </div>
      </div>
    </li>
  );
};
