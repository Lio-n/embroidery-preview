import { ImageDown, ScanEye, VolleyballIcon } from "lucide-react";
import type { ComponentProps } from "react";

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubItem,
  SidebarRail,
} from "@/components/ui/sidebar";
import { DrawRange } from "./DrawRange";
import { ColorGroup } from "./ColorGroup";
import {
  useEmbroideryStore,
  type EmbroideryStoreState,
} from "@/stores/embroiderySource.store";
import { UploadFile } from "./uploadFile";
import { useIsMobile } from "@/hooks/use-mobile";
import { Button } from "./ui/button";
import { useEmbroideryViewer } from "@/stores/embroideryViewer.store";

export function AppSidebar({ ...props }: ComponentProps<typeof Sidebar>) {
  const EmbStore = useEmbroideryStore();

  const isFileLoaded = EmbStore.geometries
    ? EmbStore.geometries.length > 0
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
              data={EmbStore.filesDetails}
            />

            <MenuExports isFileLoaded={isFileLoaded} />
          </SidebarMenu>

          <UploadFile />
        </SidebarGroup>
      </SidebarContent>
      <SidebarRail className="!py-2 !px-4" />
    </Sidebar>
  );
}

const MenuControls = ({ isFileLoaded }: { isFileLoaded: boolean }) => {
  const EmbViewer = useEmbroideryViewer();

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

          <SidebarMenuSubItem
            key={"ViewControlReset"}
            className="mb-4 self-baseline"
          >
            <p className="pb-3 text-start select-none text-sm font-medium">
              Scene
            </p>

            <Button
              variant="outline"
              size="sm"
              onClick={EmbViewer.resetCameraView}
            >
              <ScanEye /> Center
            </Button>
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
  data: EmbroideryStoreState["filesDetails"];
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
            <span className="font-semibold">
              {data?.stitches.toLocaleString() || "N/A"}
            </span>
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

const MenuExports = ({ isFileLoaded }: { isFileLoaded: boolean }) => {
  const EmbViewer = useEmbroideryViewer();

  return (
    <SidebarMenuItem key="Exports">
      <SidebarMenuButton asChild>
        <p className="select-none font-semibold">Exports</p>
      </SidebarMenuButton>

      {isFileLoaded ? (
        <SidebarMenuSub className="text-xs text-left">
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
      ) : (
        <p className="italic select-none text-xs">No file loaded</p>
      )}
    </SidebarMenuItem>
  );
};
