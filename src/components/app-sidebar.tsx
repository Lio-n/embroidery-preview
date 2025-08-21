import { VolleyballIcon } from "lucide-react";
import type { ComponentProps } from "react";

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from "@/components/ui/sidebar";
import { useEmbroideryStore } from "@/stores/embroiderySource.store";
import { UploadFile } from "./uploadFile";
// import { useIsMobile } from "@/hooks/use-mobile";
import { NavControls } from "./nav/controls.nav";
import { NavFileDetails } from "./nav/fileDetails.nav";
import { NavExports } from "./nav/exports.nav";

export function AppSidebar({ ...props }: ComponentProps<typeof Sidebar>) {
  const EmbStore = useEmbroideryStore();

  const isFileLoaded = EmbStore.geometries
    ? EmbStore.geometries.length > 0
    : false;
  // const isMobile = useIsMobile();
  /*
  $ Controls
	# Design
		- Stitch Range
		- Color Group
	# Scene
		- Center
		- Background
$ File Details
	- Name
    	- Extension
    	- Version
    	- Date
    	- Color Changes
    	- Stitches
    	- Jumps
    	- Size
    	- Width
    	- Height
$ Exports
	# Download JPG -> Open POPUP (format opcions)
	# Conversion -> Open POPUP (to other formats)
  */
  return (
    <Sidebar {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <a href="#">
                <div className="bg-sidebar-primary text-sidebar-primary-foreground flex aspect-square size-8 items-center justify-center rounded-lg">
                  <VolleyballIcon className="size-4" />
                </div>
                <div className="flex flex-col gap-0.5 leading-none">
                  <span className="font-medium">Embroidery Preview</span>
                  <span className="">v0.1.0</span>
                </div>
              </a>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent className="pr-4">
        <SidebarGroup className="flex justify-between h-full gap-8">
          <SidebarMenu>
            <SidebarGroupLabel>Platform</SidebarGroupLabel>
            <NavControls isFileLoaded={isFileLoaded} />
            <NavFileDetails
              isFileLoaded={isFileLoaded}
              data={EmbStore.filesDetails}
            />
            <NavExports isFileLoaded={isFileLoaded} />
          </SidebarMenu>

          <UploadFile />
        </SidebarGroup>
      </SidebarContent>
      <SidebarRail className="!py-2 !px-4" />
    </Sidebar>
  );
}
