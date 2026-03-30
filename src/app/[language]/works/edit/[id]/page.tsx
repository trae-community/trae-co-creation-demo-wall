import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import { EditForm } from "../../../../../components/work/edit-form";

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
  const user = await getAuthUser();

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
  if (work.userId !== user.userId) {
    return <div>Unauthorized</div>;
  }

  // Helper to safely parse JSON or return as array
  const normalizeStringList = (input: unknown): string[] => {
    if (!input) return [];
    if (Array.isArray(input)) return input.map(String);
    try {
      if (typeof input === 'string') {
        const parsed = JSON.parse(input);
        if (Array.isArray(parsed)) return parsed.map(String);
      }
    } catch {
      // fallback to empty array
    }
    return [];
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
    team: work.team?.members ? normalizeStringList(work.team.members).map((m: string) => ({ value: m })) : [{ value: "" }],
    teamIntro: work.team?.teamIntro || "",
    contactPhone: work.team?.contactPhone || "",
    contactEmail: work.team?.contactEmail || "",
    coverUrl: work.coverUrl || "",
    story: work.detail?.story || "",
    highlights: work.detail?.highlights ? normalizeStringList(work.detail.highlights).map(h => ({ value: h })) : [{ value: "" }],
    scenarios: work.detail?.scenarios ? normalizeStringList(work.detail.scenarios).map(s => ({ value: s })) : [{ value: "" }],
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
