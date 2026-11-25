import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/carteira")({
  component: BlankPage,
});

function BlankPage() {
  return <main aria-label="Página em branco" />;
}
