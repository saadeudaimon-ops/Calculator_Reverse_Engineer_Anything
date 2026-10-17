import { createFileRoute } from "@tanstack/react-router";
import { Calculator } from "@/components/calculator/calculator";

export const Route = createFileRoute("/")({ component: Home });

function Home() {
  return (
    <main className="desk">
      <Calculator />
    </main>
  );
}
