import { ChevronRight, FileTerminal } from "lucide-react";

import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubItem,
} from "@/components/ui/sidebar";
import type { EmbroideryStoreState } from "@/stores/embroiderySource.store";

export const NavFileDetails = ({
  isFileLoaded,
  data,
}: {
  isFileLoaded: boolean;
  data: EmbroideryStoreState["filesDetails"];
}) => {
  return (
    <SidebarMenu>
      <Collapsible
        key="File_Details"
        asChild
        defaultOpen={false}
        className="group/collapsible"
      >
        <SidebarMenuItem>
          <CollapsibleTrigger asChild>
            <SidebarMenuButton tooltip="File_Details">
              <FileTerminal />
              <span>File Details</span>
              <ChevronRight className="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
            </SidebarMenuButton>
          </CollapsibleTrigger>

          {isFileLoaded && (
            <CollapsibleContent>
              <SidebarMenuSub className="text-xs text-left">
                <SidebarMenuSubItem key={"file_name"} className="mb-1">
                  Name:{" "}
                  <span className="font-semibold">{data?.name || "N/A"}</span>
                </SidebarMenuSubItem>
                <SidebarMenuSubItem key={"file_extension"} className="mb-1">
                  Extension:{" "}
                  <span className="font-semibold">
                    {data?.extension || "N/A"}
                  </span>
                </SidebarMenuSubItem>
                <SidebarMenuSubItem key={"file_version"} className="mb-1">
                  Version:{" "}
                  <span className="font-semibold">
                    {data?.version || "N/A"}
                  </span>
                </SidebarMenuSubItem>
                <SidebarMenuSubItem key={"file_date"} className="mb-1">
                  Date:{" "}
                  <span className="font-semibold">{data?.date || "N/A"}</span>
                </SidebarMenuSubItem>
                <SidebarMenuSubItem key={"file_color"} className="mb-1">
                  Color Changes:{" "}
                  <span className="font-semibold">
                    {data?.color_changes || "N/A"}
                  </span>
                </SidebarMenuSubItem>
                <SidebarMenuSubItem key={"file_stitches"} className="mb-1">
                  Stitches:{" "}
                  <span className="font-semibold">
                    {data?.stitches.toLocaleString() || "N/A"}
                  </span>
                </SidebarMenuSubItem>
                <SidebarMenuSubItem key={"file_jumps"} className="mb-1">
                  Jumps:{" "}
                  <span className="font-semibold">{data?.jumps || "N/A"}</span>
                </SidebarMenuSubItem>
                <SidebarMenuSubItem key={"file_size"} className="mb-1">
                  Size:{" "}
                  <span className="font-semibold">
                    {data?.size.toFixed(2) || "N/A"} kb
                  </span>
                </SidebarMenuSubItem>
                <SidebarMenuSubItem key={"file_Width"} className="mb-1">
                  Width:{" "}
                  <span className="font-semibold">
                    {data?.width || "N/A"} mm
                  </span>
                </SidebarMenuSubItem>
                <SidebarMenuSubItem key={"file_height"} className="mb-1">
                  Height:{" "}
                  <span className="font-semibold">
                    {data?.height || "N/A"} mm
                  </span>
                </SidebarMenuSubItem>
              </SidebarMenuSub>
            </CollapsibleContent>
          )}
        </SidebarMenuItem>
      </Collapsible>
    </SidebarMenu>
  );
};
