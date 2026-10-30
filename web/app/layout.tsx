import type { Metadata } from "next";
import "./style.css";
import "./qw-layout.css";
import "../../sirraya/web/styles/hub.css";
import "@/components/quantum-site-ambience.css";
import "./reference-system.css";
import "@/components/ui/quantum-ui.css";
import { AuthGate } from "@/components/AuthGate";
import { QuantumSiteAmbience } from "@/components/QuantumSiteAmbienceClient";
import { SiteAtmosphereProvider } from "@/lib/site-atmosphere";
import { SessionProvider } from "@/lib/api";
import { PreferenceMotion } from "@/components/PreferenceMotion";

export const metadata: Metadata = {
  title: "QuantumWalk — See inside a quantum algorithm",
  description: "Build a circuit and see how its quantum state changes, one step at a time.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className="qw-reference-ui">
        <SessionProvider>
          <PreferenceMotion />
          <SiteAtmosphereProvider>
            <AuthGate>
              <QuantumSiteAmbience />
              <div className="qw-app-layer">{children}</div>
            </AuthGate>
          </SiteAtmosphereProvider>
        </SessionProvider>
      </body>
    </html>
  );
}
