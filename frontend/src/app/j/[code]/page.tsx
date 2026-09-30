import Lobby from "@/components/join/Lobby";

// Server component: unwraps the async route params, then hands plain props to the client Lobby.
export default async function JoinPage({
  params,
  searchParams,
}: {
  params: Promise<{ code: string }>;
  searchParams: Promise<{ host?: string }>;
}) {
  const { code } = await params;
  const { host } = await searchParams;
  return <Lobby code={code} asHost={host === "1"} />;
}