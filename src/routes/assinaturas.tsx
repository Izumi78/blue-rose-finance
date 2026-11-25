import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/assinaturas")({
  component: BlankPage,
});

function BlankPage() {
  return <main aria-label="Página em branco" />;
}
