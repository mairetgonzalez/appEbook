import {
  useCallback,
  useEffect,
  useEffectEvent,
  useMemo,
  useRef,
  useState,
} from "react";
import type { DraftSnapshot, EditableProject, SaveState } from "@/types/ebook";

const RETRY_SCHEDULE = [5000, 15000, 30000, 30000];

interface UseProjectAutosaveOptions {
  projectId: string;
  initialProject: EditableProject;
  saveRemote: (project: EditableProject) => Promise<EditableProject>;
}

export function useProjectAutosave({
  projectId,
  initialProject,
  saveRemote,
}: UseProjectAutosaveOptions) {
  const storageKey = useMemo(() => `diagramador-ebook:${projectId}:draft`, [projectId]);
  const [project, setProject] = useState(initialProject);
  const [saveState, setSaveState] = useState<SaveState>("idle");
  const [lastSavedAt, setLastSavedAt] = useState<string | null>(initialProject.updatedAt ?? null);
  const [hasPendingChanges, setHasPendingChanges] = useState(false);
  const retryIndexRef = useRef(0);
  const retryTimerRef = useRef<number | null>(null);
  const debounceRef = useRef<number | null>(null);
  const pendingRemoteRef = useRef(false);
  const latestProjectRef = useRef(project);
  const hasBootedRef = useRef(false);

  useEffect(() => {
    latestProjectRef.current = project;
  }, [project]);

  const clearRetryTimer = () => {
    if (retryTimerRef.current) {
      window.clearTimeout(retryTimerRef.current);
      retryTimerRef.current = null;
    }
  };

  const scheduleRetry = useEffectEvent(() => {
    clearRetryTimer();
    const delay = RETRY_SCHEDULE[Math.min(retryIndexRef.current, RETRY_SCHEDULE.length - 1)];
    retryIndexRef.current += 1;

    retryTimerRef.current = window.setTimeout(() => {
      void flushRemote();
    }, delay);
  });

  const flushRemote = useEffectEvent(async () => {
    if (!pendingRemoteRef.current) {
      return true;
    }

    setSaveState("saving");

    try {
      const savedProject = await saveRemote(latestProjectRef.current);
      retryIndexRef.current = 0;
      pendingRemoteRef.current = false;
      setHasPendingChanges(false);
      setSaveState("saved");
      setLastSavedAt(savedProject.updatedAt ?? new Date().toISOString());
      localStorage.setItem(
        storageKey,
        JSON.stringify({
          project: savedProject,
          savedAt: savedProject.updatedAt ?? new Date().toISOString(),
        } satisfies DraftSnapshot<EditableProject>),
      );
      return true;
    } catch (error) {
      pendingRemoteRef.current = true;
      setHasPendingChanges(true);
      setSaveState("error");
      scheduleRetry();
      return false;
    }
  });

  const persistLocally = useEffectEvent((nextProject: EditableProject) => {
    localStorage.setItem(
      storageKey,
      JSON.stringify({
        project: nextProject,
        savedAt: new Date().toISOString(),
      } satisfies DraftSnapshot<EditableProject>),
    );
  });

  useEffect(() => {
    if (!hasBootedRef.current) {
      hasBootedRef.current = true;
      persistLocally(project);
      return;
    }

    persistLocally(project);
    pendingRemoteRef.current = true;
    setHasPendingChanges(true);
    setSaveState("saving");

    if (debounceRef.current) {
      window.clearTimeout(debounceRef.current);
    }

    debounceRef.current = window.setTimeout(() => {
      void flushRemote();
    }, 800);

    return () => {
      if (debounceRef.current) {
        window.clearTimeout(debounceRef.current);
      }
    };
  }, [flushRemote, persistLocally, project]);

  useEffect(() => {
    const onBeforeUnload = (event: BeforeUnloadEvent) => {
      if (!hasPendingChanges) {
        return;
      }

      event.preventDefault();
      event.returnValue = "";
    };

    const flushOnLeave = () => {
      if (pendingRemoteRef.current) {
        void flushRemote();
      }
    };

    const onVisibility = () => {
      if (document.visibilityState === "hidden") {
        flushOnLeave();
      }
    };

    window.addEventListener("beforeunload", onBeforeUnload);
    window.addEventListener("blur", flushOnLeave);
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      window.removeEventListener("beforeunload", onBeforeUnload);
      window.removeEventListener("blur", flushOnLeave);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [flushRemote, hasPendingChanges]);

  useEffect(() => clearRetryTimer, []);

  const loadLocalSnapshot = useCallback(() => {
    const rawValue = localStorage.getItem(storageKey);
    if (!rawValue) {
      return null;
    }

    try {
      return JSON.parse(rawValue) as DraftSnapshot<EditableProject>;
    } catch {
      return null;
    }
  }, [storageKey]);

  return {
    project,
    setProject,
    saveState,
    lastSavedAt,
    hasPendingChanges,
    flushRemote,
    loadLocalSnapshot,
  };
}
