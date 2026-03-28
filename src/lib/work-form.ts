import { z } from 'zod';

export interface WorkFormValues {
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

type Translate = (key: string) => string;

interface BuildWorkFormSchemaOptions {
  requireTeamIntro?: boolean;
}

export function buildWorkFormSchema(
  t: Translate,
  options: BuildWorkFormSchemaOptions = {}
) {
  const { requireTeamIntro = true } = options;

  return z.object({
    name: z.string().min(2, t('validationNameMin')).max(50, t('validationNameMax')),
    intro: z.string().min(10, t('validationIntroMin')).max(100, t('validationIntroMax')),
    country: z.string().min(1, t('validationCountry')),
    city: z.string().min(1, t('validationCity')),
    category: z.string().min(1, t('validationCategory')),
    devStatus: z.string().min(1, t('validationDevStatus')),
    tags: z
      .array(z.number())
      .min(1, t('validationTagsMin') || t('validationTagsRequired'))
      .max(5, t('validationTagsMax')),
    team: z
      .array(z.object({ value: z.string().min(1, t('validationTeamMemberRequired')) }))
      .min(1, t('validationTeamMin')),
    teamIntro: requireTeamIntro
      ? z.string().min(1, t('validationTeamIntro'))
      : z.string(),
    contactPhone: z.string(),
    contactEmail: z.union([z.string().email(t('validationEmail')), z.literal('')]),
    coverUrl: z.string().min(1, t('validationCover')),
    story: z.string().min(20, t('validationStoryMin')),
    highlights: z
      .array(
        z.object({
          value: z
            .string()
            .min(1, t('validationHighlightRequired'))
            .max(30, t('validationHighlightMax')),
        })
      )
      .min(1, t('validationHighlightsMin'))
      .max(5, t('validationHighlightsMax')),
    scenarios: z
      .array(z.object({ value: z.string().min(1, t('validationScenarioRequired')) }))
      .min(1, t('validationScenariosMin')),
    screenshots: z
      .array(z.string())
      .min(1, t('validationScreenshotsMin'))
      .max(5, t('validationScreenshotsMax')),
    demoUrl: z.union([z.string().url(t('validationDemoUrl')), z.literal('')]),
    repoUrl: z.union([z.string().url(t('validationRepoUrl')), z.literal('')]),
  });
}
