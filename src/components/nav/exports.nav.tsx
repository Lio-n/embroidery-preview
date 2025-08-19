import { ChevronRight, Download, ImageDown, RefreshCcwDot } from "lucide-react";

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
import { Button } from "../ui/button";
import { useEmbroideryViewer } from "@/stores/embroideryViewer.store";

export const NavExports = ({ isFileLoaded }: { isFileLoaded: boolean }) => {
  const EmbViewer = useEmbroideryViewer();
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
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={EmbViewer.downloadScreenshot}
                  >
                    <ImageDown /> Download JPG
                  </Button>
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
