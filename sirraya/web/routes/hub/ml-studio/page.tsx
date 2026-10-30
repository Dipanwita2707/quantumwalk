import { HubToolChrome } from "../../../components/hub/HubToolChrome";
import { MLStudioClient } from "../../../components/hub/MLStudioClient";

export default function MLStudioPage() {
  return (
    <HubToolChrome title="ML Studio">
      <MLStudioClient />
    </HubToolChrome>
  );
}
