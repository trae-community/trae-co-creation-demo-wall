import { prisma } from "@/lib/prisma";
import { getOrSyncUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import { EditForm, InitialData } from "./edit-form";

// Define the type for InitialData to match SubmissionForm's expectations
// This duplicates the type from SubmissionForm but ensures type safety here
interface PageInitialData {
  id: string;
  name: string;
  intro: string;
  country: string;
  city: string;
  category: string;
  devStatus: string;
  tags: number[];
  team: { value: string }[];
  teamIntro: string;
  contactPhone: string;
  contactEmail: string;
  coverUrl: string;
  story: string;
  highlights: { value: string }[];
  scenarios: { value: string }[];
  screenshots: string[];
  demoUrl: string;
  repoUrl: string;
}

export default async function EditPage({ params }: { params: Promise<{ id: string; language: string }> }) {
  const { id, language } = await params;
  const user = await getOrSyncUser();

  if (!user) {
    redirect(`/${language}/sign-in`);
  }

  // Fetch existing work data
  const work = await prisma.workBase.findUnique({
    where: { id: BigInt(id) },
    include: {
      tags: { include: { tag: true } },
      detail: true,
      team: true,
      images: {
        where: { imageType: "screenshot" },
        orderBy: { sortOrder: "asc" }
      }
    }
  });

  if (!work) {
    // Handle not found
    return <div>Work not found</div>;
  }

  // Check ownership
  if (work.userId !== user.id) {
    return <div>Unauthorized</div>;
  }

  // Helper to safely parse JSON
  const safeParseJSON = (json: any, fallback: any) => {
    try {
      if (typeof json === 'string') {
        return JSON.parse(json);
      }
      return json || fallback;
    } catch {
      return fallback;
    }
  };

  // Transform to InitialData
  const initialData: PageInitialData = {
    id: work.id.toString(),
    name: work.title,
    intro: work.summary || "",
    country: work.countryCode || "",
    city: work.cityCode || "",
    category: work.categoryCode || "",
    devStatus: work.devStatusCode || "",
    tags: work.tags.map(t => t.tagId),
    team: work.team?.members ? safeParseJSON(work.team.members, []).map((m: string) => ({ value: m })) : [{ value: "" }],
    teamIntro: work.team?.teamIntro || "",
    contactPhone: work.team?.contactPhone || "",
    contactEmail: work.team?.contactEmail || "",
    coverUrl: work.coverUrl || "",
    story: work.detail?.story || "",
    highlights: work.detail?.highlights ? (work.detail.highlights as string[]).map(h => ({ value: h })) : [{ value: "" }],
    scenarios: work.detail?.scenarios ? (work.detail.scenarios as string[]).map(s => ({ value: s })) : [{ value: "" }],
    screenshots: work.images.map(img => img.imageUrl),
    demoUrl: work.detail?.demoUrl || "",
    repoUrl: work.detail?.repoUrl || "",
  };

  // Ensure arrays have at least one empty item if required by form validation
  if (initialData.team.length === 0) initialData.team.push({ value: "" });
  if (initialData.highlights.length === 0) initialData.highlights.push({ value: "" }, { value: "" }, { value: "" });
  if (initialData.scenarios.length === 0) initialData.scenarios.push({ value: "" });

  return <EditForm initialData={initialData as any} />;
}
