import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/transacoes")({
  component: BlankPage,
});

function BlankPage() {
  return <main aria-label="Página em branco" />;
}
