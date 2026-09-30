import MeetingRoom from "@/components/meeting/MeetingRoom";

export const metadata = { title: "Join meeting · Zoom Workplace" };

export default async function MeetingPage({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  return <MeetingRoom code={code} />;
}