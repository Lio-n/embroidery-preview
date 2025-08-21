import { ChevronRight, Download, RefreshCcwDot } from "lucide-react";

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
import { Button } from "@/components/ui/button";
import { DownloadDialog } from "@/components/DownloadDialog";

export const NavExports = ({ isFileLoaded }: { isFileLoaded: boolean }) => {
  return (
    <SidebarMenu>
      <Collapsible
        key="Exports"
        asChild
        defaultOpen={true}
        className="group/collapsible"
      >
        <SidebarMenuItem>
          <CollapsibleTrigger asChild>
            <SidebarMenuButton tooltip="Exports">
              <Download />
              <span>Exports</span>
              <ChevronRight className="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
            </SidebarMenuButton>
          </CollapsibleTrigger>

          {isFileLoaded ? (
            <CollapsibleContent className="mb-4">
              <SidebarMenuSub className="pt-2 text-xs text-left">
                <SidebarMenuSubItem key={"ExportsDownload"} className="mb-2">
                  <DownloadDialog />
                </SidebarMenuSubItem>

                <SidebarMenuSubItem key={"ExportsConversion"}>
                  <Button variant="outline" size="sm" disabled>
                    <RefreshCcwDot /> Conversion
                  </Button>
                </SidebarMenuSubItem>
              </SidebarMenuSub>
            </CollapsibleContent>
          ) : (
            <p className="italic select-none text-xs">No file loaded</p>
          )}
        </SidebarMenuItem>
      </Collapsible>
    </SidebarMenu>
  );
};
