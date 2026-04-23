import { lovable, isLovableConfigured } from "@/lib/lovable";
import { mapRecordToCard, mapRecordToEditableProject } from "@/lib/ebook-defaults";
import type {
  EditableProject,
  EbookData,
  EbookProjectRecord,
  FontSizeOption,
  ProjectCardView,
  TemplateOption,
} from "@/types/ebook";

interface CreateProjectInput {
  title: string;
  template: TemplateOption;
  fontSize: FontSizeOption;
  ebookData: EbookData;
}

function assertConfigured() {
  if (!isLovableConfigured) {
    throw new Error(
      "Configure VITE_LOVABLE_URL e VITE_LOVABLE_ANON_KEY para usar autenticação e banco de dados.",
    );
  }
}

async function getCurrentUserId() {
  const {
    data: { user },
    error,
  } = await lovable.auth.getUser();

  if (error) {
    throw error;
  }

  if (!user) {
    throw new Error("Sessão não encontrada.");
  }

  return user.id;
}

export async function listProjects(): Promise<ProjectCardView[]> {
  assertConfigured();

  const { data, error } = await lovable
    .from("ebook_projects")
    .select("*")
    .order("updated_at", { ascending: false });

  if (error) {
    throw error;
  }

  return (data as EbookProjectRecord[]).map(mapRecordToCard);
}

export async function getProject(projectId: string): Promise<EditableProject | null> {
  assertConfigured();

  const { data, error } = await lovable
    .from("ebook_projects")
    .select("*")
    .eq("id", projectId)
    .maybeSingle();

  if (error) {
    throw error;
  }

  if (!data) {
    return null;
  }

  return mapRecordToEditableProject(data as EbookProjectRecord);
}

export async function createProject(input: CreateProjectInput): Promise<EditableProject> {
  assertConfigured();
  const userId = await getCurrentUserId();

  const { data, error } = await lovable
    .from("ebook_projects")
    .insert({
      user_id: userId,
      title: input.title,
      ebook_data: input.ebookData,
      template: input.template,
      font_size: input.fontSize,
    })
    .select("*")
    .single();

  if (error) {
    throw error;
  }

  return mapRecordToEditableProject(data as EbookProjectRecord);
}

export async function updateProject(project: EditableProject): Promise<EditableProject> {
  assertConfigured();

  const { data, error } = await lovable
    .from("ebook_projects")
    .update({
      title: project.title,
      ebook_data: project.ebookData,
      template: project.template,
      font_size: project.fontSize,
    })
    .eq("id", project.id)
    .select("*")
    .single();

  if (error) {
    throw error;
  }

  return mapRecordToEditableProject(data as EbookProjectRecord);
}
