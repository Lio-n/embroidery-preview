import { ChevronRight, Download, ImageDown } from "lucide-react";

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
        defaultOpen={false}
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

          {isFileLoaded && (
            <CollapsibleContent>
              <SidebarMenuSub className="pt-2 text-xs text-left">
                <SidebarMenuSubItem
                  key={"ViewControlReset"}
                  className="mb-4 self-baseline"
                >
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={EmbViewer.downloadScreenshot}
                  >
                    <ImageDown /> Download JPG
                  </Button>
                </SidebarMenuSubItem>
              </SidebarMenuSub>
            </CollapsibleContent>
          )}
        </SidebarMenuItem>
      </Collapsible>
    </SidebarMenu>
  );
};
