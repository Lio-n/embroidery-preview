import { ChevronRight, Download } from "lucide-react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarMenuSub, SidebarMenuSubItem } from "@/components/ui/sidebar";
import { DownloadDialog } from "@/components/DownloadDialog";
import { ConversionDialog } from "../ConversionDialog";

export const NavExports = ({ isFileLoaded }: { isFileLoaded: boolean }) => {
  return (
    <SidebarMenu>
      <Collapsible key="Exports" asChild defaultOpen={true} className="group/collapsible">
        <SidebarMenuItem>
          <CollapsibleTrigger asChild>
            <SidebarMenuButton tooltip="Exports">
              <Download />
              <span>Exports</span>
              <ChevronRight className="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
            </SidebarMenuButton>
          </CollapsibleTrigger>

          <CollapsibleContent className="mb-4">
            <SidebarMenuSub className="pt-2 text-left">
              {isFileLoaded ? (
                <SidebarMenuSubItem key={"ExportsDownload"} className="mb-2">
                  <DownloadDialog />
                </SidebarMenuSubItem>
              ) : (
                <p className="italic select-none text-xs text-center mb-2">No file loaded</p>
              )}
              <SidebarMenuSubItem key={"ExportsConversion"}>
                <ConversionDialog />
              </SidebarMenuSubItem>
            </SidebarMenuSub>
          </CollapsibleContent>
        </SidebarMenuItem>
      </Collapsible>
    </SidebarMenu>
  );
};
