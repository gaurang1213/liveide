import type { Playground, TemplateFile, User } from '@prisma/client';

// Mock data for development
const mockPlaygrounds: Playground[] = [
  {
    id: 'mock-playground-1',
    title: 'React TypeScript Starter',
    description: 'A basic React TypeScript project',
    template: 'REACT',
    userId: 'mock-user-1',
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: 'mock-playground-2',
    title: 'Next.js Starter',
    description: 'A basic Next.js project',
    template: 'NEXTJS',
    userId: 'mock-user-1',
    createdAt: new Date(),
    updatedAt: new Date(),
  },
];

type Account = {
  userId: string;
  type: string;
  provider: string;
  providerAccountId: string;
  refreshToken?: string | null;
  accessToken?: string | null;
  expiresAt?: number | null;
  tokenType?: string | null;
  scope?: string | null;
  idToken?: string | null;
  sessionState?: string | null;
};

const mockAccounts: Account[] = [];

type StarMark = {
  userId: string;
  playgroundId: string;
  isMarked: boolean;
};

const mockStarMarks: StarMark[] = [];

const mockTemplateFiles: TemplateFile[] = [
  {
    id: 'mock-template-1',
    content: {
      folderName: 'Root',
      items: [
        {
          filename: 'package.json',
          fileExtension: 'json',
          content: JSON.stringify({
            name: 'react-ts-starter',
            version: '0.1.0',
            dependencies: {
              react: '^18.2.0',
              'react-dom': '^18.2.0',
              typescript: '^5.0.0'
            }
          }, null, 2)
        },
        {
          filename: 'src',
          fileExtension: '',
          content: 'folder'
        }
      ]
    },
    playgroundId: 'mock-playground-1',
    createdAt: new Date(),
    updatedAt: new Date(),
  }
];

const mockUsers: User[] = [
  {
    id: 'mock-user-1',
    name: 'Demo User',
    email: 'demo@example.com',
    image: null,
    role: 'USER',
    createdAt: new Date(),
    updatedAt: new Date(),
  }
];

export const mockDb = {
  playground: {
    findUnique: async ({ where }: { where: { id: string } }) => {
      return mockPlaygrounds.find(p => p.id === where.id) || null;
    },
    findMany: async (args?: any) => {
      const whereUserId: string | undefined = args?.where?.userId;
      const list = whereUserId ? mockPlaygrounds.filter(p => p.userId === whereUserId) : mockPlaygrounds.slice();
      // Attach Starmark array if requested to mimic include
      if (args?.include?.Starmark) {
        const userId = args.include.Starmark.where?.userId as string | undefined;
        return list.map(p => ({
          ...p,
          Starmark: userId
            ? mockStarMarks
                .filter(s => s.playgroundId === p.id && s.userId === userId)
                .map(s => ({ isMarked: s.isMarked }))
            : [],
        }));
      }
      return list;
    },
    create: async (data: any) => {
      const newPlayground = {
        ...data.data,
        id: `mock-${Date.now()}`,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      mockPlaygrounds.push(newPlayground);
      return newPlayground;
    },
    update: async ({ where, data }: { where: { id: string }, data: any }) => {
      const index = mockPlaygrounds.findIndex(p => p.id === where.id);
      if (index !== -1) {
        mockPlaygrounds[index] = { ...mockPlaygrounds[index], ...data, updatedAt: new Date() };
        return mockPlaygrounds[index];
      }
      return null;
    },
    delete: async ({ where }: { where: { id: string } }) => {
      const index = mockPlaygrounds.findIndex(p => p.id === where.id);
      if (index !== -1) {
        const deleted = mockPlaygrounds.splice(index, 1)[0];
        return deleted;
      }
      return null;
    }
  },
  templateFile: {
    findUnique: async ({ where }: { where: { playgroundId: string } }) => {
      return mockTemplateFiles.find(t => t.playgroundId === where.playgroundId) || null;
    },
    create: async (data: any) => {
      const newTemplateFile = {
        ...data.data,
        id: `mock-template-${Date.now()}`,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      mockTemplateFiles.push(newTemplateFile);
      return newTemplateFile;
    },
    update: async ({ where, data }: { where: { playgroundId: string }, data: any }) => {
      const index = mockTemplateFiles.findIndex(t => t.playgroundId === where.playgroundId);
      if (index !== -1) {
        mockTemplateFiles[index] = { ...mockTemplateFiles[index], ...data, updatedAt: new Date() } as any;
        return mockTemplateFiles[index];
      }
      return null;
    },
    upsert: async ({ where, update, create }: { where: { playgroundId: string }, update: any, create: any }) => {
      const existing = mockTemplateFiles.find(t => t.playgroundId === where.playgroundId);
      if (existing) {
        const updated = { ...existing, ...update, updatedAt: new Date() } as any;
        const idx = mockTemplateFiles.findIndex(t => t.id === existing.id);
        mockTemplateFiles[idx] = updated;
        return updated;
      }
      const newItem = {
        id: `mock-template-${Date.now()}`,
        playgroundId: create.playgroundId,
        content: create.content,
        createdAt: new Date(),
        updatedAt: new Date(),
      } as any;
      mockTemplateFiles.push(newItem);
      return newItem;
    }
  },
  account: {
    findUnique: async ({ where }: { where: { provider_providerAccountId: { provider: string; providerAccountId: string } } }) => {
      const { provider, providerAccountId } = where.provider_providerAccountId;
      return (
        mockAccounts.find(
          (a) => a.provider === provider && a.providerAccountId === providerAccountId
        ) || null
      ) as any;
    },
    findFirst: async ({ where }: { where: { userId: string } }) => {
      const { userId } = where;
      return (mockAccounts.find((a) => a.userId === userId) || null) as any;
    },
    create: async ({ data }: { data: any }) => {
      const acc: Account = {
        userId: data.userId,
        type: data.type,
        provider: data.provider,
        providerAccountId: data.providerAccountId,
        refreshToken: data.refreshToken ?? null,
        accessToken: data.accessToken ?? null,
        expiresAt: data.expiresAt ?? null,
        tokenType: data.tokenType ?? null,
        scope: data.scope ?? null,
        idToken: data.idToken ?? null,
        sessionState: data.sessionState ?? null,
      };
      mockAccounts.push(acc);
      return acc as any;
    },
  },
  starMark: {
    create: async ({ data }: { data: StarMark }) => {
      const exists = mockStarMarks.find(s => s.userId === data.userId && s.playgroundId === data.playgroundId);
      if (!exists) mockStarMarks.push({ ...data });
      return data;
    },
    delete: async ({ where }: { where: { userId_playgroundId: { userId: string; playgroundId: string } } }) => {
      const { userId, playgroundId } = where.userId_playgroundId;
      const idx = mockStarMarks.findIndex(s => s.userId === userId && s.playgroundId === playgroundId);
      if (idx !== -1) {
        const [removed] = mockStarMarks.splice(idx, 1);
        return removed;
      }
      return null as any;
    },
  },
  user: {
    findUnique: async ({ where, include }: { where: { email?: string; id?: string }, include?: { accounts?: boolean } }) => {
      let user: User | undefined;
      if (where.email) user = mockUsers.find(u => u.email === where.email);
      else if (where.id) user = mockUsers.find(u => u.id === where.id);
      const base = user || null;
      if (!base) return null as any;
      if (include?.accounts) {
        const accounts = mockAccounts.filter(a => a.userId === base.id);
        return { ...base, accounts } as any;
      }
      return base as any;
    },
    findUniqueById: async ({ where }: { where: { id: string } }) => {
      return mockUsers.find(u => u.id === where.id) || null;
    },
    create: async ({ data }: { data: Partial<User> & { accounts?: { create: any } } }) => {
      const newUser: User = {
        id: `mock-user-${Date.now()}`,
        name: (data.name as any) || null,
        email: data.email as string,
        image: (data.image as any) || null,
        role: 'USER' as any,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      mockUsers.push(newUser);
      if (data.accounts && (data.accounts as any).create) {
        const a = (data.accounts as any).create;
        mockAccounts.push({
          userId: newUser.id,
          type: a.type,
          provider: a.provider,
          providerAccountId: a.providerAccountId,
          refreshToken: a.refreshToken ?? null,
          accessToken: a.accessToken ?? null,
          expiresAt: a.expiresAt ?? null,
          tokenType: a.tokenType ?? null,
          scope: a.scope ?? null,
          idToken: a.idToken ?? null,
          sessionState: a.sessionState ?? null,
        });
      }
      return newUser;
    },
  }
};
