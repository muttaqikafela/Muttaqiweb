import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  FileCode2,
  FolderOpen,
  Search,
  RefreshCw,
  Save,
  Copy,
  Check,
  RotateCcw,
  GitBranch,
  GitCommitHorizontal,
  CloudDownload,
  CloudUpload,
  Plus,
  Lock,
  Unlock,
  AlertTriangle,
  FilePlus2,
  X,
  Columns2,
  ChevronRight,
  ChevronDown,
  ShieldCheck
} from 'lucide-react';
import { useAdmin } from '../context/AdminContext';
import { DEVELOPER_EMAIL } from '../lib/developerAuth';
import {
  authenticateCodeSourceServer,
  clearCodeSourceToken,
  getCodeSourceToken
} from '../lib/codeSourceAuth';

export interface CodeTreeItem {
  path: string;
  size: number;
  lines: number;
  updatedAt?: string;
  category: string;
  syncStatus: 'synced' | 'modified' | 'local-only' | 'untracked';
}

interface GithubStatusInfo {
  configured: boolean;
  repo: string | null;
  branch: string;
  hasWriteToken: boolean;
  reachable: boolean;
  error?: string;
  latestCommit?: {
    sha: string;
    fullSha: string;
    message: string;
    author: string;
    date: string;
    url: string;
  } | null;
}

type CategoryFilter =
  | 'all'
  | 'diff'
  | 'src'
  | 'components'
  | 'pages'
  | 'config';

const CATEGORY_LABELS: Record<string, string> = {
  'root-config': 'রুট ও কনফিগারেশন',
  'deploy-public': 'ডিপ্লয়মেন্ট ও পাবলিক',
  'src-root': 'মূল অ্যাপ ও CSS',
  pages: 'পেইজসমূহ (Pages)',
  components: 'কম্পোনেন্টস (Components)',
  context: 'কনটেক্সট (Context)',
  'services-lib': 'সার্ভিস, লাইব্রেরি ও ইউটিলস',
  'data-types': 'ডাটা ও টাইপস'
};

const CATEGORY_ORDER = [
  'root-config',
  'deploy-public',
  'src-root',
  'pages',
  'components',
  'context',
  'services-lib',
  'data-types'
];

function classifyClientPath(relPath: string): string {
  if (relPath.startsWith('src/pages/')) return 'pages';
  if (relPath.startsWith('src/components/')) return 'components';
  if (relPath.startsWith('src/context/')) return 'context';
  if (
    relPath.startsWith('src/services/') ||
    relPath.startsWith('src/lib/') ||
    relPath.startsWith('src/utils/')
  ) {
    return 'services-lib';
  }
  if (relPath.startsWith('src/data/') || relPath.startsWith('src/types/')) return 'data-types';
  if (relPath.startsWith('src/')) return 'src-root';
  if (relPath.startsWith('.github/') || relPath.startsWith('public/')) return 'deploy-public';
  return 'root-config';
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  return `${(bytes / 1024).toFixed(1)} KB`;
}

function parseStaticGithubEnv(): { owner: string; repo: string; branch: string } | null {
  const raw = String(import.meta.env.VITE_GITHUB_REPO || '').trim();
  const branch = String(import.meta.env.VITE_GITHUB_BRANCH || 'main').trim() || 'main';
  if (!raw.includes('/')) return null;
  const [owner, repo] = raw.split('/').map((s) => s.trim());
  const validOwner = /^[A-Za-z0-9](?:[A-Za-z0-9-]{0,37}[A-Za-z0-9])?$/.test(owner);
  const validRepo = /^[A-Za-z0-9._-]{1,100}$/.test(repo);
  const validBranch = /^[A-Za-z0-9._/-]{1,100}$/.test(branch) && !branch.includes('..');
  if (!validOwner || !validRepo || !validBranch) return null;
  return { owner, repo, branch };
}

export const DeveloperCodeSourceTab: React.FC = () => {
  const { requestConfirm, showToast } = useAdmin();

  const [mode, setMode] = useState<'loading' | 'needs-unlock' | 'live' | 'static-github' | 'static-unavailable'>('loading');
  const [unlockPass, setUnlockPass] = useState('');
  const [unlockError, setUnlockError] = useState<string | null>(null);
  const [isUnlocking, setIsUnlocking] = useState(false);

  const [files, setFiles] = useState<CodeTreeItem[]>([]);
  const [githubStatus, setGithubStatus] = useState<GithubStatusInfo | null>(null);
  const [githubCompared, setGithubCompared] = useState(false);
  const [githubCommitSha, setGithubCommitSha] = useState<string | null>(null);
  const [isLoadingTree, setIsLoadingTree] = useState(false);

  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>('all');
  const [collapsedGroups, setCollapsedGroups] = useState<Record<string, boolean>>({});
  const [showMobileExplorer, setShowMobileExplorer] = useState(true);

  const [selectedPath, setSelectedPath] = useState<string>('');
  const [originalContent, setOriginalContent] = useState<string>('');
  const [draftContent, setDraftContent] = useState<string>('');
  const [fileMeta, setFileMeta] = useState<{ size: number; lines: number; updatedAt?: string } | null>(null);
  const [isLoadingFile, setIsLoadingFile] = useState(false);
  const [isSavingFile, setIsSavingFile] = useState(false);
  const [isSyncingAll, setIsSyncingAll] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);

  const [commitMessage, setCommitMessage] = useState('');
  const [showCompareView, setShowCompareView] = useState(false);
  const [githubRemoteContent, setGithubRemoteContent] = useState<string | null>(null);
  const [githubInSync, setGithubInSync] = useState<boolean | null>(null);
  const [isLoadingDiff, setIsLoadingDiff] = useState(false);

  const [showNewFileBar, setShowNewFileBar] = useState(false);
  const [newFilePath, setNewFilePath] = useState('');

  const editorRef = useRef<HTMLTextAreaElement | null>(null);
  const gutterRef = useRef<HTMLDivElement | null>(null);

  const isDirty = Boolean(selectedPath && draftContent !== originalContent);
  const lineCount = useMemo(
    () => (draftContent.length === 0 ? 1 : draftContent.split(/\r?\n/).length),
    [draftContent]
  );

  const syncSummary = useMemo(() => {
    const synced = files.filter((f) => f.syncStatus === 'synced').length;
    const modified = files.filter((f) => f.syncStatus === 'modified').length;
    const localOnly = files.filter((f) => f.syncStatus === 'local-only').length;
    const totalSize = files.reduce((acc, f) => acc + f.size, 0);
    return { synced, modified, localOnly, totalSize };
  }, [files]);

  const filteredFiles = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return files.filter((f) => {
      if (categoryFilter === 'diff' && f.syncStatus !== 'modified' && f.syncStatus !== 'local-only') {
        return false;
      }
      if (categoryFilter === 'src' && !f.path.startsWith('src/')) return false;
      if (categoryFilter === 'components' && !f.path.startsWith('src/components/')) return false;
      if (categoryFilter === 'pages' && !f.path.startsWith('src/pages/')) return false;
      if (
        categoryFilter === 'config' &&
        (f.path.startsWith('src/components/') || f.path.startsWith('src/pages/'))
      ) {
        return false;
      }
      if (!q) return true;
      return f.path.toLowerCase().includes(q);
    });
  }, [files, searchQuery, categoryFilter]);

  const groupedFiles = useMemo(() => {
    const groups = new Map<string, CodeTreeItem[]>();
    for (const f of filteredFiles) {
      const key = f.category || 'root-config';
      const arr = groups.get(key) || [];
      arr.push(f);
      groups.set(key, arr);
    }
    return CATEGORY_ORDER.filter((cat) => groups.has(cat)).map((cat) => ({
      key: cat,
      label: CATEGORY_LABELS[cat] || cat,
      items: groups.get(cat) || []
    }));
  }, [filteredFiles]);

  const authFetchJson = useCallback(async (url: string, init: RequestInit = {}) => {
    const token = getCodeSourceToken();
    const res = await fetch(url, {
      ...init,
      headers: {
        ...(init.headers || {}),
        ...(token ? { Authorization: `Bearer ${token}` } : {})
      }
    });
    const contentType = res.headers.get('content-type') || '';
    if (!contentType.includes('application/json')) {
      return { status: res.status, isJson: false as const, data: null };
    }
    const data = await res.json();
    return { status: res.status, isJson: true as const, data };
  }, []);

  const openFile = useCallback(
    async (relPath: string, withCompare = false) => {
      if (!relPath) return;
      setIsLoadingFile(true);
      setShowCompareView(withCompare);
      setGithubRemoteContent(null);
      setGithubInSync(null);

      if (mode === 'static-github') {
        const staticEnv = parseStaticGithubEnv();
        if (!staticEnv) {
          setIsLoadingFile(false);
          return;
        }
        try {
          const encoded = relPath
            .split('/')
            .map((s) => encodeURIComponent(s))
            .join('/');
          const resp = await fetch(
            `https://api.github.com/repos/${staticEnv.owner}/${staticEnv.repo}/contents/${encoded}?ref=${encodeURIComponent(staticEnv.branch)}`,
            { headers: { Accept: 'application/vnd.github.raw+json' } }
          );
          if (!resp.ok) throw new Error('ফাইল লোড ব্যর্থ');
          const text = await resp.text();
          setSelectedPath(relPath);
          setOriginalContent(text);
          setDraftContent(text);
          setFileMeta({
            size: new Blob([text]).size,
            lines: text.length === 0 ? 0 : text.split(/\r?\n/).length
          });
          setShowMobileExplorer(false);
        } catch {
          showToast('গিটহাব থেকে ফাইল লোড করা যায়নি।');
        } finally {
          setIsLoadingFile(false);
        }
        return;
      }

      try {
        const query = `/api/code-source/file?path=${encodeURIComponent(relPath)}${withCompare ? '&compareGithub=1' : ''}`;
        const resp = await authFetchJson(query);
        if (!resp.isJson) {
          setMode('static-unavailable');
          setIsLoadingFile(false);
          return;
        }
        if (resp.status === 401) {
          clearCodeSourceToken();
          setMode('needs-unlock');
          setIsLoadingFile(false);
          return;
        }
        if (!resp.data?.ok) {
          showToast(resp.data?.error || 'ফাইলটি খোলা যায়নি।');
          setIsLoadingFile(false);
          return;
        }
        const content = String(resp.data.content ?? '');
        setSelectedPath(resp.data.path);
        setOriginalContent(content);
        setDraftContent(content);
        setFileMeta({
          size: Number(resp.data.size || 0),
          lines: Number(resp.data.lines || 0),
          updatedAt: resp.data.updatedAt
        });
        setGithubRemoteContent(
          typeof resp.data.githubContent === 'string' ? resp.data.githubContent : null
        );
        setGithubInSync(
          typeof resp.data.githubInSync === 'boolean' ? resp.data.githubInSync : null
        );
        setShowMobileExplorer(false);
      } catch {
        showToast('ফাইল লোড করতে নেটওয়ার্ক ত্রুটি হয়েছে।');
      } finally {
        setIsLoadingFile(false);
      }
    },
    [authFetchJson, mode, showToast]
  );

  const loadWorkspaceTree = useCallback(
    async (compareGithub = true, autoSelectFirst = false) => {
      setIsLoadingTree(true);
      const token = getCodeSourceToken();

      // Always verify whether Node backend exists before demanding unlock on static hosts
      if (!token) {
        try {
          const probe = await fetch('/api/code-source/github-status');
          const ct = probe.headers.get('content-type') || '';
          if (!ct.includes('application/json')) {
            const staticEnv = parseStaticGithubEnv();
            if (staticEnv) {
              setMode('static-github');
              try {
                const treeResp = await fetch(
                  `https://api.github.com/repos/${staticEnv.owner}/${staticEnv.repo}/git/trees/${encodeURIComponent(staticEnv.branch)}?recursive=1`
                );
                if (treeResp.ok) {
                  const data = (await treeResp.json()) as {
                    sha?: string;
                    tree?: Array<{ path?: string; type?: string; size?: number }>;
                  };
                  const items: CodeTreeItem[] = (data.tree || [])
                    .filter(
                      (t) =>
                        t.type === 'blob' &&
                        Boolean(t.path) &&
                        !t.path!.startsWith('.git/') &&
                        !t.path!.includes('node_modules/') &&
                        !t.path!.endsWith('.png') &&
                        !t.path!.endsWith('.jpg') &&
                        !t.path!.endsWith('.jpeg') &&
                        !t.path!.endsWith('.mp4') &&
                        !t.path!.endsWith('.traineddata') &&
                        t.path !== 'package-lock.json' &&
                        t.path !== 'bun.lock'
                    )
                    .map((t) => ({
                      path: t.path!,
                      size: Number(t.size || 0),
                      lines: 0,
                      category: classifyClientPath(t.path!),
                      syncStatus: 'synced' as const
                    }))
                    .sort((a, b) => a.path.localeCompare(b.path));
                  setFiles(items);
                  setGithubStatus({
                    configured: true,
                    repo: `${staticEnv.owner}/${staticEnv.repo}`,
                    branch: staticEnv.branch,
                    hasWriteToken: false,
                    reachable: true,
                    latestCommit: data.sha
                      ? {
                          sha: data.sha.slice(0, 7),
                          fullSha: data.sha,
                          message: 'GitHub Public Snapshot',
                          author: staticEnv.owner,
                          date: '',
                          url: ''
                        }
                      : null
                  });
                  setGithubCompared(true);
                }
              } catch {
                // ignore static fallback error
              }
            } else {
              setMode('static-unavailable');
            }
            setIsLoadingTree(false);
            return;
          }
          if (probe.status === 401) {
            setMode('needs-unlock');
            setIsLoadingTree(false);
            return;
          }
        } catch {
          setMode('static-unavailable');
          setIsLoadingTree(false);
          return;
        }
      }

      try {
        const [statusRes, treeRes] = await Promise.all([
          authFetchJson('/api/code-source/github-status'),
          authFetchJson(`/api/code-source/tree${compareGithub ? '?compareGithub=1' : ''}`)
        ]);

        if (!treeRes.isJson || !statusRes.isJson) {
          setMode('static-unavailable');
          setIsLoadingTree(false);
          return;
        }
        if (treeRes.status === 401 || statusRes.status === 401) {
          clearCodeSourceToken();
          setMode('needs-unlock');
          setIsLoadingTree(false);
          return;
        }

        setMode('live');
        if (statusRes.data?.ok) {
          setGithubStatus(statusRes.data as GithubStatusInfo);
        }
        if (treeRes.data?.ok && Array.isArray(treeRes.data.files)) {
          const loadedFiles = treeRes.data.files as CodeTreeItem[];
          setFiles(loadedFiles);
          setGithubCompared(Boolean(treeRes.data.githubCompared));
          setGithubCommitSha(treeRes.data.githubCommitSha || null);

          if (autoSelectFirst && !selectedPath && loadedFiles.length > 0) {
            const preferred =
              loadedFiles.find((f) => f.path === 'src/App.tsx') ||
              loadedFiles.find((f) => f.path === 'server.ts') ||
              loadedFiles[0];
            if (preferred) {
              void openFile(preferred.path, false);
            }
          }
        }
      } catch {
        showToast('কোড সোর্স তালিকা লোড করতে সমস্যা হয়েছে।');
      } finally {
        setIsLoadingTree(false);
      }
    },
    [authFetchJson, openFile, selectedPath, showToast]
  );

  useEffect(() => {
    void loadWorkspaceTree(true, true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleUnlockSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setUnlockError(null);
    if (!unlockPass.trim()) {
      setUnlockError('অনুগ্রহ করে ডেভেলপার পাসওয়ার্ড লিখুন।');
      return;
    }
    setIsUnlocking(true);
    const res = await authenticateCodeSourceServer(DEVELOPER_EMAIL, unlockPass.trim(), 'login');
    setIsUnlocking(false);
    setUnlockPass('');
    if (!res.serverAvailable) {
      setMode('static-unavailable');
      return;
    }
    if (!res.ok) {
      setUnlockError(res.error || 'ভুল ডেভেলপার পাসওয়ার্ড।');
      return;
    }
    setMode('live');
    await loadWorkspaceTree(true, true);
  };

  const selectFileSafely = (relPath: string) => {
    if (relPath === selectedPath) return;
    if (isDirty) {
      requestConfirm({
        title: 'অসংরক্ষিত পরিবর্তন বাতিল করবেন?',
        message: `"${selectedPath}" ফাইলের পরিবর্তনগুলো এখনো সেভ করা হয়নি। নতুন ফাইল খুললে পরিবর্তনগুলো মুছে যাবে।`,
        confirmText: 'হ্যাঁ, নতুন ফাইল খুলুন',
        onConfirm: () => {
          void openFile(relPath, false);
        }
      });
      return;
    }
    void openFile(relPath, false);
  };

  const performSaveFile = useCallback(async () => {
    if (!selectedPath || mode !== 'live') return;
    setIsSavingFile(true);
    try {
      const resp = await authFetchJson('/api/code-source/file', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          path: selectedPath,
          content: draftContent,
          syncToGithub: true,
          commitMessage:
            commitMessage.trim() || `Update ${selectedPath} via Developer Code Source`
        })
      });

      if (resp.status === 401) {
        clearCodeSourceToken();
        setMode('needs-unlock');
        setIsSavingFile(false);
        return;
      }
      if (!resp.isJson || !resp.data?.ok) {
        showToast(resp.data?.error || 'ফাইল সংরক্ষণ করা যায়নি।');
        setIsSavingFile(false);
        return;
      }

      setOriginalContent(draftContent);
      setFileMeta({
        size: Number(resp.data.size || 0),
        lines: Number(resp.data.lines || 0),
        updatedAt: resp.data.updatedAt
      });
      setCommitMessage('');

      if (resp.data.syncedToGithub) {
        showToast(
          `"${selectedPath}" সফলভাবে ওয়েবসাইট ও গিটহাবে (${resp.data.commitSha || 'synced'}) আপডেট হয়েছে!`
        );
      } else {
        showToast(
          `"${selectedPath}" ওয়েবসাইটে সেভ হয়েছে। (${resp.data.githubMessage || 'লোকাল সেভ সম্পন্ন'})`
        );
      }
      await loadWorkspaceTree(true, false);
      if (showCompareView) {
        void openFile(selectedPath, true);
      }
    } catch {
      showToast('কোড সংরক্ষণ করতে নেটওয়ার্ক ত্রুটি হয়েছে।');
    } finally {
      setIsSavingFile(false);
    }
  }, [
    authFetchJson,
    commitMessage,
    draftContent,
    loadWorkspaceTree,
    mode,
    openFile,
    selectedPath,
    showCompareView,
    showToast
  ]);

  const handleSaveClick = () => {
    if (!selectedPath || mode !== 'live') return;
    requestConfirm({
      title: 'কোড আপডেট নিশ্চিত করুন',
      message: githubStatus?.configured && githubStatus?.hasWriteToken
        ? `"${selectedPath}" ফাইলের নতুন কোড ওয়েবসাইটে সেভ এবং সরাসরি গিটহাব (${githubStatus.repo} • ${githubStatus.branch}) রিপোজিটরিতে কমিট ও পুশ করা হবে।`
        : `"${selectedPath}" ফাইলের নতুন কোড সরাসরি ওয়েবসাইট ওয়ার্কস্পেসে সংরক্ষণ করা হবে।`,
      confirmText: 'হ্যাঁ, আপডেট করুন',
      onConfirm: () => {
        void performSaveFile();
      }
    });
  };

  const handleCreateNewFile = async (e: React.FormEvent) => {
    e.preventDefault();
    const target = newFilePath.trim().replace(/^\/+/, '');
    if (!target || target.includes('..') || target.includes('\\')) {
      showToast('সঠিক ফাইল পাথ লিখুন (যেমন: src/components/MySection.tsx)');
      return;
    }
    setIsSavingFile(true);
    try {
      const starter = `// Created via Developer Code Source Panel\n`;
      const resp = await authFetchJson('/api/code-source/file', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          path: target,
          content: starter,
          syncToGithub: true,
          commitMessage: `Add ${target} via Developer Code Source`
        })
      });
      if (resp.status === 401) {
        clearCodeSourceToken();
        setMode('needs-unlock');
        setIsSavingFile(false);
        return;
      }
      if (!resp.isJson || !resp.data?.ok) {
        showToast(resp.data?.error || 'নতুন ফাইল তৈরি করা যায়নি।');
        setIsSavingFile(false);
        return;
      }
      setShowNewFileBar(false);
      setNewFilePath('');
      showToast(`নতুন ফাইল "${resp.data.path}" তৈরি হয়েছে।`);
      await loadWorkspaceTree(true, false);
      await openFile(resp.data.path, false);
    } catch {
      showToast('নতুন ফাইল তৈরি করতে সমস্যা হয়েছে।');
    } finally {
      setIsSavingFile(false);
    }
  };

  const handleToggleCompareGithub = async () => {
    if (!selectedPath || mode !== 'live') return;
    if (showCompareView) {
      setShowCompareView(false);
      return;
    }
    setIsLoadingDiff(true);
    try {
      const resp = await authFetchJson(
        `/api/code-source/file?path=${encodeURIComponent(selectedPath)}&compareGithub=1`
      );
      if (resp.isJson && resp.data?.ok) {
        setGithubRemoteContent(
          typeof resp.data.githubContent === 'string' ? resp.data.githubContent : null
        );
        setGithubInSync(
          typeof resp.data.githubInSync === 'boolean' ? resp.data.githubInSync : null
        );
        setShowCompareView(true);
      } else {
        showToast('গিটহাব তুলনা লোড করা যায়নি।');
      }
    } catch {
      showToast('গিটহাব সার্ভারের সাথে সংযোগ হয়নি।');
    } finally {
      setIsLoadingDiff(false);
    }
  };

  const handlePullFromGithub = (singleFilePath?: string) => {
    if (mode !== 'live') return;
    requestConfirm({
      title: singleFilePath
        ? 'গিটহাব থেকে এই ফাইলটি সিঙ্ক করবেন?'
        : 'গিটহাব থেকে সব কোড সিঙ্ক (Pull) করবেন?',
      message: singleFilePath
        ? `গিটহাবের ${githubStatus?.branch || 'main'} ব্রাঞ্চ থেকে "${singleFilePath}" ফাইলটি এনে বর্তমান কোডের সাথে মিলিয়ে নেওয়া হবে।`
        : `গিটহাব রিপোজিটরি (${githubStatus?.repo || 'configured'}) থেকে সর্বশেষ কোড এনে ওয়েবসাইটের কোড সম্পূর্ণ একরকম করা হবে।`,
      confirmText: 'হ্যাঁ, সিঙ্ক করুন',
      onConfirm: async () => {
        setIsSyncingAll(true);
        try {
          const resp = await authFetchJson('/api/code-source/pull-from-github', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(singleFilePath ? { path: singleFilePath } : {})
          });
          if (resp.status === 401) {
            clearCodeSourceToken();
            setMode('needs-unlock');
            setIsSyncingAll(false);
            return;
          }
          if (!resp.isJson || !resp.data?.ok) {
            showToast(resp.data?.error || 'গিটহাব সিঙ্ক ব্যর্থ হয়েছে।');
            setIsSyncingAll(false);
            return;
          }
          if (singleFilePath && typeof resp.data.content === 'string') {
            setOriginalContent(resp.data.content);
            setDraftContent(resp.data.content);
            setGithubRemoteContent(resp.data.content);
            setGithubInSync(true);
            showToast(`"${singleFilePath}" গিটহাবের সাথে মিলিয়ে আপডেট করা হয়েছে!`);
          } else {
            showToast(
              `গিটহাব থেকে সিঙ্ক সম্পন্ন: ${resp.data.updatedCount || 0}টি ফাইল আপডেট হয়েছে।`
            );
            if (selectedPath) {
              await openFile(selectedPath, showCompareView);
            }
          }
          await loadWorkspaceTree(true, false);
        } catch {
          showToast('গিটহাব থেকে সিঙ্ক করতে সমস্যা হয়েছে।');
        } finally {
          setIsSyncingAll(false);
        }
      }
    });
  };

  const handlePushAllToGithub = () => {
    if (mode !== 'live') return;
    requestConfirm({
      title: 'সকল পরিবর্তিত কোড গিটহাবে পুশ করবেন?',
      message: `ওয়েবসাইটের যে কোডগুলো গিটহাব থেকে আলাদা বা নতুন, সেগুলো একসাথে গিটহাব (${githubStatus?.repo} • ${githubStatus?.branch}) ব্রাঞ্চে পুশ করা হবে—ফলে গিটহাব ও ওয়েবসাইট হুবহু একই হবে।`,
      confirmText: 'হ্যাঁ, গিটহাবে পুশ করুন',
      onConfirm: async () => {
        setIsSyncingAll(true);
        try {
          const resp = await authFetchJson('/api/code-source/push-all-to-github', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              commitMessage:
                commitMessage.trim() || 'Sync all website code with GitHub via Developer Panel'
            })
          });
          if (resp.status === 401) {
            clearCodeSourceToken();
            setMode('needs-unlock');
            setIsSyncingAll(false);
            return;
          }
          if (!resp.isJson || !resp.data?.ok) {
            showToast(resp.data?.error || 'গিটহাবে পুশ করা যায়নি।');
            setIsSyncingAll(false);
            return;
          }
          if (resp.data.alreadyInSync) {
            showToast('ওয়েবসাইট এবং গিটহাবের সকল কোড ইতোমধ্যেই ১০০% একই রয়েছে!');
          } else {
            showToast(
              `সফল! ${resp.data.pushedCount}টি ফাইল গিটহাবে পুশ হয়েছে (Commit: ${resp.data.commitSha})।`
            );
          }
          await loadWorkspaceTree(true, false);
          if (selectedPath && showCompareView) {
            await openFile(selectedPath, true);
          }
        } catch {
          showToast('গিটহাবে পুশ করতে নেটওয়ার্ক ত্রুটি হয়েছে।');
        } finally {
          setIsSyncingAll(false);
        }
      }
    });
  };

  const handleCopyCode = async () => {
    if (!draftContent) return;
    try {
      await navigator.clipboard.writeText(draftContent);
      setCopiedCode(true);
      showToast(`"${selectedPath}" এর সম্পূর্ণ কোড কপি হয়েছে!`);
      setTimeout(() => setCopiedCode(false), 1800);
    } catch {
      showToast('কোড কপি করা যায়নি।');
    }
  };

  const handleEditorKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') {
      e.preventDefault();
      if (mode === 'live' && selectedPath && isDirty) {
        handleSaveClick();
      }
      return;
    }
    if (e.key === 'Tab' && mode === 'live') {
      e.preventDefault();
      const target = e.currentTarget;
      const start = target.selectionStart;
      const end = target.selectionEnd;
      const updated = `${draftContent.slice(0, start)}  ${draftContent.slice(end)}`;
      setDraftContent(updated);
      requestAnimationFrame(() => {
        if (editorRef.current) {
          editorRef.current.selectionStart = start + 2;
          editorRef.current.selectionEnd = start + 2;
        }
      });
    }
  };

  const syncScrollGutter = () => {
    if (editorRef.current && gutterRef.current) {
      gutterRef.current.scrollTop = editorRef.current.scrollTop;
    }
  };

  // Compute simple diff preview lines when compare view is toggled
  const diffRows = useMemo(() => {
    if (!showCompareView || githubRemoteContent === null) return null;
    const localLines = draftContent.split(/\r?\n/);
    const remoteLines = githubRemoteContent.split(/\r?\n/);
    const maxLen = Math.max(localLines.length, remoteLines.length);
    const rows: Array<{
      line: number;
      localText: string;
      remoteText: string;
      changed: boolean;
    }> = [];
    for (let i = 0; i < Math.min(maxLen, 1200); i++) {
      const l = localLines[i] ?? '';
      const r = remoteLines[i] ?? '';
      rows.push({
        line: i + 1,
        localText: l,
        remoteText: r,
        changed: l !== r
      });
    }
    return {
      rows,
      diffCount: rows.filter((x) => x.changed).length,
      truncated: maxLen > 1200
    };
  }, [showCompareView, githubRemoteContent, draftContent]);

  if (mode === 'loading') {
    return (
      <div className="py-16 flex flex-col items-center justify-center text-stone-500 gap-3">
        <RefreshCw className="w-6 h-6 animate-spin text-[#0f2922]" />
        <p className="text-sm font-bold text-[#0f2922]">কোড সোর্স লোড হচ্ছে...</p>
      </div>
    );
  }

  if (mode === 'needs-unlock') {
    return (
      <div className="max-w-md mx-auto my-6 bg-stone-50 border border-stone-200 rounded-2xl p-6 space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#0f2922] text-[#DCB473] flex items-center justify-center shrink-0">
            <Lock className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-extrabold text-[#0f2922]">
              কোড সোর্স সেশন আনলক করুন
            </h3>
            <p className="text-xs text-stone-500">
              নিরাপত্তার জন্য সোর্স কোড এডিটর সার্ভার-সাইড পাসওয়ার্ড যাচাইয়ের মাধ্যমে খোলা হয়।
            </p>
          </div>
        </div>

        <form onSubmit={handleUnlockSubmit} className="space-y-3">
          <div>
            <label className="block text-xs font-bold text-stone-700 mb-1">
              ডেভেলপার পাসওয়ার্ড
            </label>
            <input
              type="password"
              value={unlockPass}
              onChange={(e) => setUnlockPass(e.target.value)}
              placeholder="আপনার ডেভেলপার পাসওয়ার্ড লিখুন"
              className="w-full px-3.5 py-2.5 text-sm bg-white border border-stone-300 rounded-xl outline-none focus:border-[#0f2922]"
              autoFocus
            />
          </div>
          {unlockError && (
            <div className="text-xs font-semibold text-rose-700 bg-rose-50 border border-rose-200 rounded-xl px-3 py-2">
              {unlockError}
            </div>
          )}
          <button
            type="submit"
            disabled={isUnlocking}
            className="w-full flex items-center justify-center gap-2 py-2.5 bg-[#0f2922] hover:bg-[#163c32] text-[#DCB473] font-bold text-sm rounded-xl transition-all cursor-pointer disabled:opacity-60"
          >
            <Unlock className="w-4 h-4" />
            <span>{isUnlocking ? 'যাচাই হচ্ছে...' : 'কোড সোর্স আনলক করুন'}</span>
          </button>
        </form>
      </div>
    );
  }

  if (mode === 'static-unavailable') {
    return (
      <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5 space-y-3">
        <div className="flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
          <div className="space-y-1.5 text-xs sm:text-sm text-amber-950 leading-relaxed">
            <h3 className="font-extrabold text-sm sm:text-base text-[#0f2922]">
              স্ট্যাটিক হোস্টিং মোড (সার্ভার API সংযুক্ত নয়)
            </h3>
            <p>
              বর্তমান ডোমেইনটি স্ট্যাটিক বিল্ড হিসেবে চলছে, তাই সরাসরি ফাইল সিস্টেমে কোড পরিবর্তন করার নোড সার্ভার এখানে সক্রিয় নেই।
            </p>
            <p>
              সম্পূর্ণ লাইভ কোড দেখা, এডিট করা এবং গিটহাবে অটো-সিঙ্ক করার জন্য লাইভ অ্যাপ সার্ভার থেকে ডেভেলপার প্যানেল খুলুন অথবা বিল্ডের সময়{' '}
              <code className="px-1.5 py-0.5 bg-amber-100 rounded font-mono text-xs">
                VITE_GITHUB_REPO
              </code>{' '}
              যুক্ত করে গিটহাব রিড-অনলি প্রিভিউ সক্রিয় করুন।
            </p>
          </div>
        </div>
      </div>
    );
  }

  const isReadOnlyStatic = mode === 'static-github';

  return (
    <div className="space-y-3.5">
      {/* Top GitHub & Sync Status Bar */}
      <div className="bg-[#0f2922] text-stone-100 rounded-2xl p-3.5 sm:p-4 border border-[#DCB473]/30 space-y-3">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
          <div className="flex items-start sm:items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#DCB473]/15 border border-[#DCB473]/40 text-[#DCB473] flex items-center justify-center shrink-0">
              <FileCode2 className="w-5 h-5" />
            </div>
            <div className="space-y-0.5">
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="text-sm sm:text-base font-extrabold text-[#DCB473]">
                  ওয়েবসাইট ও গিটহাব কোড সোর্স
                </h3>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-200 border border-emerald-400/30">
                  <ShieldCheck className="w-3 h-3" />
                  {isReadOnlyStatic ? 'গিটহাব রিড-অনলি' : 'সুরক্ষিত ডেভেলপার সেশন'}
                </span>
              </div>
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-stone-300">
                <span>মোট ফাইল: {files.length}টি ({formatBytes(syncSummary.totalSize)})</span>
                {githubStatus?.configured ? (
                  <span className="inline-flex items-center gap-1 text-[#DCB473]">
                    <GitBranch className="w-3 h-3" />
                    {githubStatus.repo} ({githubStatus.branch})
                  </span>
                ) : (
                  <span className="text-amber-300">
                    গিটহাব রিপোজিটরি যুক্ত করতে সার্ভারে GITHUB_REPO ও GITHUB_TOKEN সেট করুন
                  </span>
                )}
                {githubStatus?.latestCommit?.sha && (
                  <span className="inline-flex items-center gap-1 text-stone-300">
                    <GitCommitHorizontal className="w-3 h-3" />
                    {githubStatus.latestCommit.sha}
                    {githubStatus.latestCommit.message ? ` — ${githubStatus.latestCommit.message}` : ''}
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => void loadWorkspaceTree(true, false)}
              disabled={isLoadingTree || isSyncingAll}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-white/10 hover:bg-white/20 text-white border border-white/15 transition-colors cursor-pointer disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoadingTree ? 'animate-spin' : ''}`} />
              <span>রিফ্রেশ</span>
            </button>

            {!isReadOnlyStatic && (
              <>
                <button
                  type="button"
                  onClick={() => setShowNewFileBar((prev) => !prev)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-white/10 hover:bg-white/20 text-white border border-white/15 transition-colors cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>নতুন ফাইল</span>
                </button>

                {githubStatus?.configured && (
                  <button
                    type="button"
                    onClick={() => handlePullFromGithub()}
                    disabled={isSyncingAll}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-sky-500/20 hover:bg-sky-500/30 text-sky-100 border border-sky-400/30 transition-colors cursor-pointer disabled:opacity-50"
                  >
                    <CloudDownload className="w-3.5 h-3.5" />
                    <span>গিটহাব থেকে আনুন</span>
                  </button>
                )}

                {githubStatus?.configured && githubStatus?.hasWriteToken && (
                  <button
                    type="button"
                    onClick={handlePushAllToGithub}
                    disabled={isSyncingAll}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-[#DCB473] hover:bg-[#caa05e] text-[#0f2922] transition-colors cursor-pointer disabled:opacity-50"
                  >
                    <CloudUpload className="w-3.5 h-3.5" />
                    <span>{isSyncingAll ? 'সিঙ্ক হচ্ছে...' : 'সব কোড গিটহাবে পুশ'}</span>
                  </button>
                )}
              </>
            )}
          </div>
        </div>

        {/* Sync Comparison Bar */}
        {githubCompared && githubStatus?.configured && (
          <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-white/10 text-[11px]">
            <div className="flex flex-wrap items-center gap-3">
              <span className="text-emerald-300 font-semibold">
                গিটহাবের সাথে মিল: {syncSummary.synced}টি
              </span>
              {syncSummary.modified > 0 && (
                <span className="text-amber-300 font-semibold">
                  পরিবর্তিত (ভিন্ন): {syncSummary.modified}টি
                </span>
              )}
              {syncSummary.localOnly > 0 && (
                <span className="text-sky-300 font-semibold">
                  শুধুমাত্র লোকাল: {syncSummary.localOnly}টি
                </span>
              )}
              {syncSummary.modified === 0 && syncSummary.localOnly === 0 && (
                <span className="text-emerald-200 font-bold">
                  ✓ ওয়েবসাইট ও গিটহাব ({githubCommitSha || githubStatus.branch}) ১০০% একই কোডে আছে
                </span>
              )}
            </div>
            {!githubStatus.hasWriteToken && !isReadOnlyStatic && (
              <span className="text-amber-200">
                সরাসরি পুশ চালু করতে সার্ভার এনভায়রনমেন্টে GITHUB_TOKEN যুক্ত করুন (শুধুমাত্র লোকাল সেভ এখন সক্রিয়)।
              </span>
            )}
          </div>
        )}
      </div>

      {/* Optional New File Creation Bar */}
      {showNewFileBar && !isReadOnlyStatic && (
        <form
          onSubmit={handleCreateNewFile}
          className="bg-stone-50 border border-stone-200 rounded-2xl p-3 flex flex-col sm:flex-row items-stretch sm:items-center gap-2"
        >
          <div className="flex items-center gap-2 flex-1">
            <FilePlus2 className="w-4 h-4 text-[#0f2922] shrink-0" />
            <input
              type="text"
              value={newFilePath}
              onChange={(e) => setNewFilePath(e.target.value)}
              placeholder="নতুন ফাইলের পাথ (যেমন: src/components/NewCard.tsx)"
              className="flex-1 px-3 py-1.5 text-xs sm:text-sm bg-white border border-stone-300 rounded-xl outline-none focus:border-[#0f2922] font-mono"
            />
          </div>
          <div className="flex items-center gap-2">
            <button
              type="submit"
              disabled={isSavingFile}
              className="px-3.5 py-1.5 bg-[#0f2922] text-[#DCB473] text-xs font-bold rounded-xl cursor-pointer disabled:opacity-50"
            >
              তৈরি করুন
            </button>
            <button
              type="button"
              onClick={() => setShowNewFileBar(false)}
              className="p-1.5 text-stone-500 hover:text-stone-800 rounded-lg cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </form>
      )}

      {/* Mobile File Explorer Toggle */}
      <div className="flex lg:hidden items-center justify-between gap-2">
        <button
          type="button"
          onClick={() => setShowMobileExplorer((p) => !p)}
          className="inline-flex items-center gap-2 px-3.5 py-2 bg-stone-100 hover:bg-stone-200 text-[#0f2922] rounded-xl text-xs font-bold border border-stone-200 cursor-pointer"
        >
          <FolderOpen className="w-4 h-4" />
          <span>
            {showMobileExplorer
              ? `ফাইল তালিকা লুকান (${filteredFiles.length})`
              : `ফাইল পরিবর্তন করুন (${filteredFiles.length})`}
          </span>
        </button>
        {selectedPath && (
          <span className="text-xs font-mono font-bold text-[#0f2922] truncate">
            {selectedPath}
          </span>
        )}
      </div>

      {/* Main Split-Pane IDE */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-3.5 items-stretch">
        {/* Left Sidebar: File Explorer */}
        <div
          className={`lg:col-span-4 xl:col-span-3 bg-stone-50 border border-stone-200 rounded-2xl flex flex-col overflow-hidden max-h-[580px] ${
            showMobileExplorer ? 'flex' : 'hidden lg:flex'
          }`}
        >
          <div className="p-3 border-b border-stone-200 space-y-2 bg-white">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="ফাইল খুঁজুন (যেমন App.tsx)..."
                className="w-full pl-8 pr-3 py-1.5 text-xs bg-stone-50 border border-stone-200 rounded-xl outline-none focus:border-[#0f2922]"
              />
            </div>
            <div className="flex flex-wrap gap-1">
              {[
                { id: 'all', label: `সব (${files.length})` },
                ...(syncSummary.modified + syncSummary.localOnly > 0
                  ? [
                      {
                        id: 'diff',
                        label: `পার্থক্য (${syncSummary.modified + syncSummary.localOnly})`
                      }
                    ]
                  : []),
                { id: 'components', label: 'কম্পোনেন্টস' },
                { id: 'pages', label: 'পেইজ' },
                { id: 'src', label: 'সব src/' },
                { id: 'config', label: 'সার্ভার/কনফিগ' }
              ].map((chip) => (
                <button
                  key={chip.id}
                  type="button"
                  onClick={() => setCategoryFilter(chip.id as CategoryFilter)}
                  className={`px-2 py-0.5 rounded-lg text-[10px] font-bold transition-colors cursor-pointer ${
                    categoryFilter === chip.id
                      ? 'bg-[#0f2922] text-[#DCB473]'
                      : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                  }`}
                >
                  {chip.label}
                </button>
              ))}
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-2 space-y-2">
            {groupedFiles.length === 0 ? (
              <p className="text-xs text-stone-400 text-center py-8">কোনো ফাইল পাওয়া যায়নি।</p>
            ) : (
              groupedFiles.map((group) => {
                const isCollapsed = Boolean(collapsedGroups[group.key]) && !searchQuery.trim();
                return (
                  <div key={group.key} className="space-y-0.5">
                    <button
                      type="button"
                      onClick={() =>
                        setCollapsedGroups((prev) => ({
                          ...prev,
                          [group.key]: !prev[group.key]
                        }))
                      }
                      className="w-full flex items-center justify-between px-2 py-1 text-[11px] font-extrabold text-[#0f2922] hover:bg-stone-200/60 rounded-lg cursor-pointer"
                    >
                      <span className="flex items-center gap-1 truncate">
                        {isCollapsed ? (
                          <ChevronRight className="w-3.5 h-3.5 shrink-0" />
                        ) : (
                          <ChevronDown className="w-3.5 h-3.5 shrink-0" />
                        )}
                        <span className="truncate">{group.label}</span>
                      </span>
                      <span className="text-[10px] text-stone-500 font-semibold">
                        {group.items.length}
                      </span>
                    </button>

                    {!isCollapsed && (
                      <div className="space-y-0.5 pl-1">
                        {group.items.map((item) => {
                          const active = selectedPath === item.path;
                          const shortName = item.path.split('/').pop() || item.path;
                          const dirPrefix = item.path.includes('/')
                            ? item.path.slice(0, item.path.lastIndexOf('/'))
                            : '';
                          return (
                            <button
                              key={item.path}
                              type="button"
                              onClick={() => selectFileSafely(item.path)}
                              title={item.path}
                              className={`w-full text-left px-2.5 py-1.5 rounded-xl text-xs transition-all cursor-pointer flex items-center justify-between gap-2 ${
                                active
                                  ? 'bg-[#0f2922] text-[#DCB473] shadow-xs'
                                  : 'text-stone-700 hover:bg-stone-200/70'
                              }`}
                            >
                              <div className="min-w-0 flex-1">
                                <div className="font-mono font-semibold truncate text-[11px]">
                                  {shortName}
                                </div>
                                {dirPrefix && (
                                  <div
                                    className={`font-mono text-[9px] truncate ${
                                      active ? 'text-[#DCB473]/75' : 'text-stone-400'
                                    }`}
                                  >
                                    {dirPrefix}
                                  </div>
                                )}
                              </div>
                              <div className="flex items-center gap-1 shrink-0">
                                {item.syncStatus === 'modified' && (
                                  <span
                                    title="গিটহাবের তুলনায় পরিবর্তিত"
                                    className="w-2 h-2 rounded-full bg-amber-400"
                                  />
                                )}
                                {item.syncStatus === 'local-only' && (
                                  <span
                                    title="শুধুমাত্র লোকালে আছে"
                                    className="w-2 h-2 rounded-full bg-sky-400"
                                  />
                                )}
                                {active && isDirty && (
                                  <span
                                    title="অসংরক্ষিত পরিবর্তন"
                                    className="px-1 py-0.2 rounded text-[9px] font-bold bg-amber-400 text-[#0f2922]"
                                  >
                                    M
                                  </span>
                                )}
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right Workspace: Editor / Diff Viewer */}
        <div className="lg:col-span-8 xl:col-span-9 border border-stone-200 rounded-2xl overflow-hidden flex flex-col bg-[#0b1713] text-stone-100 min-h-[460px] max-h-[580px]">
          {!selectedPath ? (
            <div className="flex-1 flex flex-col items-center justify-center text-stone-400 p-8 text-center gap-2">
              <FileCode2 className="w-10 h-10 text-[#DCB473]/60" />
              <p className="text-sm font-bold text-stone-200">
                বাম দিক থেকে যেকোনো কোড ফাইল নির্বাচন করুন
              </p>
              <p className="text-xs text-stone-400 max-w-md">
                এখান থেকে ওয়েবসাইটের সম্পূর্ণ সোর্স কোড দেখতে, কপি করতে এবং সরাসরি আপডেট করে গিটহাবের সাথে সিঙ্ক করতে পারবেন।
              </p>
            </div>
          ) : (
            <>
              {/* Editor Header */}
              <div className="bg-[#122620] px-3.5 py-2.5 border-b border-white/10 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                <div className="min-w-0 space-y-0.5">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-mono text-xs sm:text-sm font-bold text-[#DCB473] truncate">
                      {selectedPath}
                    </span>
                    {isDirty && (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-200 border border-amber-400/30">
                        অসংরক্ষিত পরিবর্তন
                      </span>
                    )}
                    {githubInSync === true && !isDirty && (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-200 border border-emerald-400/30">
                        গিটহাবের সাথে ১০০% মিল
                      </span>
                    )}
                    {githubInSync === false && (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-200 border border-amber-400/30">
                        গিটহাব থেকে ভিন্ন
                      </span>
                    )}
                  </div>
                  <div className="text-[10px] text-stone-400 flex flex-wrap gap-3">
                    <span>লাইন: {lineCount}</span>
                    <span>আকার: {formatBytes(fileMeta?.size ?? new Blob([draftContent]).size)}</span>
                    {!isReadOnlyStatic && <span>শর্টকাট: Ctrl+S সেভ করুন</span>}
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-1.5 shrink-0">
                  <button
                    type="button"
                    onClick={handleCopyCode}
                    className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[11px] font-bold bg-white/10 hover:bg-white/20 text-stone-100 cursor-pointer"
                  >
                    {copiedCode ? (
                      <Check className="w-3.5 h-3.5 text-emerald-300" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                    <span>{copiedCode ? 'কপি হয়েছে' : 'কপি'}</span>
                  </button>

                  {!isReadOnlyStatic && githubStatus?.configured && (
                    <button
                      type="button"
                      onClick={handleToggleCompareGithub}
                      disabled={isLoadingDiff}
                      className={`inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[11px] font-bold cursor-pointer ${
                        showCompareView
                          ? 'bg-[#DCB473] text-[#0f2922]'
                          : 'bg-white/10 hover:bg-white/20 text-stone-100'
                      }`}
                    >
                      <Columns2 className="w-3.5 h-3.5" />
                      <span>{isLoadingDiff ? 'লোড...' : showCompareView ? 'এডিটরে ফিরুন' : 'গিটহাব তুলনা'}</span>
                    </button>
                  )}

                  {!isReadOnlyStatic && githubStatus?.configured && (
                    <button
                      type="button"
                      onClick={() => handlePullFromGithub(selectedPath)}
                      disabled={isSyncingAll}
                      title="গিটহাব থেকে এই ফাইলটি পুনরায় আনুন"
                      className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[11px] font-bold bg-sky-500/20 hover:bg-sky-500/30 text-sky-100 cursor-pointer"
                    >
                      <CloudDownload className="w-3.5 h-3.5" />
                      <span>গিটহাব থেকে আনুন</span>
                    </button>
                  )}

                  {isDirty && (
                    <button
                      type="button"
                      onClick={() => setDraftContent(originalContent)}
                      className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[11px] font-bold bg-rose-500/20 hover:bg-rose-500/30 text-rose-200 cursor-pointer"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>বাতিল</span>
                    </button>
                  )}

                  {!isReadOnlyStatic && (
                    <button
                      type="button"
                      onClick={handleSaveClick}
                      disabled={isSavingFile || isLoadingFile}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-extrabold bg-[#DCB473] hover:bg-[#caa05e] text-[#0f2922] cursor-pointer disabled:opacity-50"
                    >
                      <Save className="w-3.5 h-3.5" />
                      <span>
                        {isSavingFile
                          ? 'সেভ হচ্ছে...'
                          : githubStatus?.configured && githubStatus?.hasWriteToken
                            ? 'সেভ ও গিটহাব সিঙ্ক'
                            : 'কোড সেভ করুন'}
                      </span>
                    </button>
                  )}
                </div>
              </div>

              {/* Optional Commit Message Bar when editing */}
              {!isReadOnlyStatic && githubStatus?.configured && githubStatus?.hasWriteToken && (
                <div className="px-3.5 py-1.5 bg-[#0f201b] border-b border-white/10 flex items-center gap-2">
                  <GitCommitHorizontal className="w-3.5 h-3.5 text-[#DCB473] shrink-0" />
                  <input
                    type="text"
                    value={commitMessage}
                    onChange={(e) => setCommitMessage(e.target.value)}
                    placeholder={`কমিট বার্তা (ঐচ্ছিক): Update ${selectedPath} via Developer Panel`}
                    className="flex-1 bg-transparent text-[11px] text-stone-200 placeholder-stone-500 outline-none"
                  />
                </div>
              )}

              {/* Editor or Diff Body */}
              {isLoadingFile ? (
                <div className="flex-1 flex items-center justify-center gap-2 text-stone-400 text-xs">
                  <RefreshCw className="w-4 h-4 animate-spin text-[#DCB473]" />
                  <span>ফাইল লোড হচ্ছে...</span>
                </div>
              ) : showCompareView && diffRows ? (
                <div className="flex-1 overflow-auto p-3 font-mono text-[11px] space-y-2">
                  <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-white/10">
                    <span className="font-sans text-xs font-bold text-[#DCB473]">
                      তুলনা: ওয়েবসাইটের বর্তমান কোড বনাম গিটহাব ({githubStatus?.branch || 'main'})
                    </span>
                    <span className="font-sans text-[11px] text-stone-300">
                      {diffRows.diffCount === 0
                        ? 'কোনো পার্থক্য নেই — উভয় কোড হুবহু এক!'
                        : `${diffRows.diffCount}টি লাইনে পার্থক্য পাওয়া গেছে`}
                    </span>
                  </div>
                  <div className="space-y-0.5">
                    {diffRows.rows.map((r) => (
                      <div
                        key={r.line}
                        className={`grid grid-cols-12 gap-2 px-2 py-0.5 rounded ${
                          r.changed ? 'bg-amber-500/15 border-l-2 border-amber-400' : ''
                        }`}
                      >
                        <div className="col-span-1 text-stone-500 select-none text-right pr-1">
                          {r.line}
                        </div>
                        <div className="col-span-5 whitespace-pre-wrap break-all text-emerald-200">
                          {r.localText || ' '}
                        </div>
                        <div className="col-span-6 whitespace-pre-wrap break-all text-sky-200 border-l border-white/10 pl-2">
                          {r.remoteText || ' '}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="flex-1 flex overflow-hidden relative">
                  {/* Synchronized Line-Number Gutter */}
                  <div
                    ref={gutterRef}
                    aria-hidden="true"
                    className="w-11 sm:w-12 py-3 px-1.5 bg-[#08120e] border-r border-white/10 text-right font-mono text-[11px] leading-[1.45rem] text-stone-500 select-none overflow-hidden shrink-0"
                  >
                    {Array.from({ length: lineCount }, (_, idx) => (
                      <div key={idx + 1}>{idx + 1}</div>
                    ))}
                  </div>
                  <textarea
                    ref={editorRef}
                    value={draftContent}
                    onChange={(e) => {
                      if (!isReadOnlyStatic) setDraftContent(e.target.value);
                    }}
                    onScroll={syncScrollGutter}
                    onKeyDown={handleEditorKeyDown}
                    readOnly={isReadOnlyStatic}
                    spellCheck={false}
                    wrap="off"
                    className="flex-1 w-full h-full py-3 px-3 bg-[#0b1713] text-stone-100 font-mono text-[12px] leading-[1.45rem] outline-none resize-none overflow-auto selection:bg-[#DCB473]/30"
                  />
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};
