import RoomPlaceholder from "@/components/meeting/RoomPlaceholder";

export default async function MeetingPage({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  return <RoomPlaceholder code={code} />;
}