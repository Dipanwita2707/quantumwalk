import { HubToolChrome } from "../../../components/hub/HubToolChrome";
import { DocEditorClient } from "../../../components/hub/DocEditorClient";

export default function DocEditorPage() {
  return (
    <HubToolChrome title="Doc Editor">
      <DocEditorClient />
    </HubToolChrome>
  );
}
