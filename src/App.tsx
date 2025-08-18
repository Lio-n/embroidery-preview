import "./App.css";
// import {
//   Breadcrumb,
//   BreadcrumbItem,
//   BreadcrumbLink,
//   BreadcrumbList,
//   BreadcrumbPage,
//   BreadcrumbSeparator,
// } from "./components/ui/breadcrumb";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "./components/ui/sidebar";
import { AppSidebar } from "./components/app-sidebar";
import { Separator } from "@/components/ui/separator";
import { ModeToggle } from "./components/mode-toggle";
import { useEmbroideryStore } from "./stores/embroiderySource.store";
import { useIsMobile } from "./hooks/use-mobile";
import { ColorGroup } from "./components/ColorGroup";
import { DrawRange } from "./components/DrawRange";
// https://medium.com/@devpedrodias/how-to-use-i18n-in-your-react-app-1f26deb2a3d8
// https://github.dev/JoshVarga/EmbroideryMobile/tree/main/app/src/main/res/layout
// https://github.dev/inkstitch/pystitch/blob/main/src/pystitch/ReadHelper.py
// https://github.com/frno7/libpes/tree/master/tools
// https://www.stitchcount.app/viewer
// https://edutechwiki.unige.ch/en/Embroidery_format_DST
const EmbroideryViewer = await import("./components/EmbroideryViewer");

function App() {
  const embroideryStore = useEmbroideryStore();
  const isMobile = useIsMobile();

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <header className="flex justify-between h-16 shrink-0 items-center gap-2 border-b">
          <div className="flex items-center gap-2 px-3">
            <SidebarTrigger />
            <Separator orientation="vertical" className="mr-2 h-4" />
            {/* <Breadcrumb>
              <BreadcrumbList>
                <BreadcrumbItem className="hidden md:block">
                  <BreadcrumbLink href="#">
                    Building Your Application
                  </BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator className="hidden md:block" />
                <BreadcrumbItem>
                  <BreadcrumbPage>Data Fetching</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb> */}
          </div>

          <div className="pr-3">
            <ModeToggle />
          </div>
        </header>
        <div>
          {isMobile &&
            embroideryStore.colorGroup?.length &&
            embroideryStore.geometries?.length && (
              <div className="p-6 grid place-items-center gap-4 sticky top-0 bg-[var(--background)] z-[1]">
                <DrawRange />
                <ColorGroup />
              </div>
            )}

          {EmbroideryViewer && embroideryStore.geometries?.length && (
            <EmbroideryViewer.EmbroideryViewer />
          )}
        </div>
        {/* <div className="flex flex-1 flex-col gap-4 p-4">
          <div className="grid auto-rows-min gap-4 md:grid-cols-3">
            <div className="bg-muted/50 aspect-video rounded-xl" />
            <div className="bg-muted/50 aspect-video rounded-xl" />
            <div className="bg-muted/50 aspect-video rounded-xl" />
          </div>
          <div className="bg-muted/50 min-h-[100vh] flex-1 rounded-xl md:min-h-min" />
        </div> */}
      </SidebarInset>
    </SidebarProvider>
  );
}

export default App;
