import * as React from "react";
import { VolleyballIcon } from "lucide-react";

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  // SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarRail,
} from "@/components/ui/sidebar";
import { DrawRange } from "./DrawRange";
import { ColorGroup } from "./ColorGroup";
import {
  useEmbroideryStore,
  type EmbroideryState,
} from "@/stores/embroiderySource.store";
import { UploadFile } from "./uploadFile";
import { useIsMobile } from "@/hooks/use-mobile";

/*
// This is sample data
const data = {
  navMain: [
    {
      title: "Controls",
      items: [
        {
          title: "DrawRange",
          url: "#",
        },
        {
          title: "Pallete",
          url: "#",
        },
      ],
    },
    {
      title: "Getting Started",
      url: "#",
      items: [
        {
          title: "Installation",
          url: "#",
        },
        {
          title: "Project Structure",
          url: "#",
        },
      ],
    },
    {
      title: "Building Your Application",
      url: "#",
      items: [
        {
          title: "Routing",
          url: "#",
        },
        {
          title: "Data Fetching",
          url: "#",
          isActive: true,
        },
        {
          title: "Rendering",
          url: "#",
        },
        {
          title: "Caching",
          url: "#",
        },
        {
          title: "Styling",
          url: "#",
        },
        {
          title: "Optimizing",
          url: "#",
        },
        {
          title: "Configuring",
          url: "#",
        },
        {
          title: "Testing",
          url: "#",
        },
        {
          title: "Authentication",
          url: "#",
        },
        {
          title: "Deploying",
          url: "#",
        },
        {
          title: "Upgrading",
          url: "#",
        },
        {
          title: "Examples",
          url: "#",
        },
      ],
    },
    {
      title: "API Reference",
      url: "#",
      items: [
        {
          title: "Components",
          url: "#",
        },
        {
          title: "File Conventions",
          url: "#",
        },
        {
          title: "Functions",
          url: "#",
        },
        {
          title: "next.config.js Options",
          url: "#",
        },
        {
          title: "CLI",
          url: "#",
        },
        {
          title: "Edge Runtime",
          url: "#",
        },
      ],
    },
    {
      title: "Architecture",
      url: "#",
      items: [
        {
          title: "Accessibility",
          url: "#",
        },
        {
          title: "Fast Refresh",
          url: "#",
        },
        {
          title: "Next.js Compiler",
          url: "#",
        },
        {
          title: "Supported Browsers",
          url: "#",
        },
        {
          title: "Turbopack",
          url: "#",
        },
      ],
    },
    {
      title: "Community",
      url: "#",
      items: [
        {
          title: "Contribution Guide",
          url: "#",
        },
      ],
    },
  ],
}
*/

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const embroideryStore = useEmbroideryStore();
  const isFileLoaded = embroideryStore.geometries
    ? embroideryStore.geometries.length > 0
    : false;
  const isMobile = useIsMobile();

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
            {!isMobile && <MenuControls isFileLoaded={isFileLoaded} />}
            <MenuFileDetails
              isFileLoaded={isFileLoaded}
              data={embroideryStore.file_details}
            />
          </SidebarMenu>

          <UploadFile />
        </SidebarGroup>
      </SidebarContent>
      <SidebarRail className="!py-2 !px-4" />
    </Sidebar>
  );
}

const MenuControls = ({ isFileLoaded }: { isFileLoaded: boolean }) => {
  return (
    <SidebarMenuItem key={"Controls"}>
      <SidebarMenuButton asChild>
        <p className="select-none font-semibold">Controls</p>
      </SidebarMenuButton>

      {isFileLoaded ? (
        <SidebarMenuSub>
          <SidebarMenuSubItem key={"DrawnRange"} className="mb-4">
            <p className="pb-3 text-start select-none text-sm font-medium">
              Drawn Range
            </p>
            <DrawRange />
          </SidebarMenuSubItem>

          <SidebarMenuSubItem key={"ColorGroup"} className="mb-4">
            <p className="pb-3 text-start select-none text-sm font-medium">
              Color Group
            </p>
            <ColorGroup />
          </SidebarMenuSubItem>
        </SidebarMenuSub>
      ) : (
        <p className="italic select-none text-xs">No file loaded</p>
      )}
    </SidebarMenuItem>
  );
};

const MenuFileDetails = ({
  isFileLoaded,
  data,
}: {
  isFileLoaded: boolean;
  data: EmbroideryState["file_details"];
}) => {
  return (
    <SidebarMenuItem key="File Details">
      <SidebarMenuButton asChild>
        <p className="select-none font-semibold">File Details</p>
      </SidebarMenuButton>

      {isFileLoaded ? (
        <SidebarMenuSub className="text-xs text-left">
          <SidebarMenuSubItem key={"file_name"} className="mb-1">
            Name: <span className="font-semibold">{data?.name || "N/A"}</span>
          </SidebarMenuSubItem>
          <SidebarMenuSubItem key={"file_extension"} className="mb-1">
            Extension:{" "}
            <span className="font-semibold">{data?.extension || "N/A"}</span>
          </SidebarMenuSubItem>
          <SidebarMenuSubItem key={"file_version"} className="mb-1">
            Version:{" "}
            <span className="font-semibold">{data?.version || "N/A"}</span>
          </SidebarMenuSubItem>
          <SidebarMenuSubItem key={"file_date"} className="mb-1">
            Date: <span className="font-semibold">{data?.date || "N/A"}</span>
          </SidebarMenuSubItem>
          <SidebarMenuSubItem key={"file_color"} className="mb-1">
            Color Changes:{" "}
            <span className="font-semibold">
              {data?.color_changes || "N/A"}
            </span>
          </SidebarMenuSubItem>
          <SidebarMenuSubItem key={"file_stitches"} className="mb-1">
            Stitches:{" "}
            <span className="font-semibold">{data?.stitches || "N/A"}</span>
          </SidebarMenuSubItem>
          <SidebarMenuSubItem key={"file_jumps"} className="mb-1">
            Jumps: <span className="font-semibold">{data?.jumps || "N/A"}</span>
          </SidebarMenuSubItem>
          <SidebarMenuSubItem key={"file_size"} className="mb-1">
            Size:{" "}
            <span className="font-semibold">
              {data?.size.toFixed(2) || "N/A"} kb
            </span>
          </SidebarMenuSubItem>
          <SidebarMenuSubItem key={"file_Width"} className="mb-1">
            Width:{" "}
            <span className="font-semibold">{data?.width || "N/A"} mm</span>
          </SidebarMenuSubItem>
          <SidebarMenuSubItem key={"file_height"} className="mb-1">
            Height:{" "}
            <span className="font-semibold">{data?.height || "N/A"} mm</span>
          </SidebarMenuSubItem>
        </SidebarMenuSub>
      ) : (
        <p className="italic select-none text-xs">No file loaded</p>
      )}
    </SidebarMenuItem>
  );
};
