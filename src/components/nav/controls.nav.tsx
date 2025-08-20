import { ChevronRight, Cog, ScanEye } from "lucide-react";

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
import { ColorGroup } from "../ColorGroup";
import { Button } from "../ui/button";
import { StitchRange } from "../StitchRange";
import { useEmbroideryViewer } from "@/stores/embroideryViewer.store";
import { useState } from "react";
import { ColorPicker } from "../ColorPicker";

export const NavControls = ({ isFileLoaded }: { isFileLoaded: boolean }) => {
  const EmbViewer = useEmbroideryViewer();
  const [isOpen, setOpen] = useState(true);

  return (
    <SidebarMenu>
      <Collapsible
        key="Controls"
        asChild
        onOpenChange={setOpen}
        defaultOpen={isOpen}
        className="group/collapsible"
      >
        <SidebarMenuItem>
          <CollapsibleTrigger asChild>
            <SidebarMenuButton tooltip="Controls">
              <Cog />
              <span>Controls</span>
              <ChevronRight className="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
            </SidebarMenuButton>
          </CollapsibleTrigger>

          {isFileLoaded ? (
            <CollapsibleContent
              forceMount
              className={isOpen ? "block" : "hidden"}
            >
              <SidebarMenuSub key="Exports_Design">
                <SidebarMenuSubItem>
                  <p className="text-start pb-3 select-none text-xs font-semibold">
                    Design
                  </p>
                </SidebarMenuSubItem>

                <SidebarMenuSubItem key={"StitchRange"} className="mb-4">
                  <p className="pb-3 text-start select-none text-xs font-medium">
                    Stitch Range
                  </p>
                  <StitchRange />
                </SidebarMenuSubItem>

                <SidebarMenuSubItem key={"ColorGroup"} className="mb-4">
                  <p className="pb-3 text-start select-none text-xs font-medium">
                    Color Group
                  </p>
                  <ColorGroup />
                </SidebarMenuSubItem>
              </SidebarMenuSub>

              <SidebarMenuSub key="Exports_Scene">
                <SidebarMenuSubItem>
                  <p className="text-start pb-3 select-none text-xs font-semibold">
                    Scene
                  </p>
                </SidebarMenuSubItem>

                <SidebarMenuSubItem className="mb-2 text-xs text-left">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={EmbViewer.resetCameraView}
                  >
                    <ScanEye /> Center
                  </Button>
                </SidebarMenuSubItem>

                <SidebarMenuSubItem className="text-xs text-left">
                  <p className="pb-3 text-start select-none text-xs font-medium">
                    Background
                  </p>
                  <ColorPicker
                    onChange={(v) =>
                      EmbViewer.updateScene({ backgroundColor: v as string })
                    }
                    value={EmbViewer.scene.backgroundColor as string}
                  />
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
