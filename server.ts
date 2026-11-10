import express from 'express';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    },
  },
});

const DATA_DIR = path.join(__dirname, 'data');
const DB_FILE = path.join(DATA_DIR, 'mjj_records_db.json');

// Clean initial default state (no demo data)
const defaultDbData = {
  publishedNewspaper: null,
  archivedNewspapers: [],
  newspaperSubmissions: [],
  announcements: [],
  promoCodes: [],
  redemptions: [],
  marketingApplications: [],
  settings: {
    newsprintTextureEnabled: true,
    staffPasscode: '2513',
  },
};

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

function loadDb() {
  try {
    if (!fs.existsSync(DB_FILE)) {
      fs.writeFileSync(DB_FILE, JSON.stringify(defaultDbData, null, 2), 'utf-8');
      return defaultDbData;
    }
    const content = fs.readFileSync(DB_FILE, 'utf-8');
    const parsed = JSON.parse(content);
    return { ...defaultDbData, ...parsed };
  } catch (err) {
    console.error('Error reading DB file, using default:', err);
    return defaultDbData;
  }
}

function saveDb(data: any) {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), 'utf-8');
  } catch (err) {
    console.error('Error saving DB file:', err);
  }
}

async function startServer() {
  const app = express();
  const PORT = process.env.PORT || 3000;

  app.use(express.json({ limit: '20mb' }));

  // Helper to check if timer expired
  const updatePublicationTimerState = (dbData: any) => {
    if (dbData.publishedNewspaper && dbData.publishedNewspaper.isActive) {
      const now = new Date().getTime();
      const expires = new Date(dbData.publishedNewspaper.expiresAt).getTime();
      if (now >= expires) {
        if (dbData.publishedNewspaper.projectData) {
          const exists = dbData.archivedNewspapers.some(
            (p: any) => p.id === dbData.publishedNewspaper.projectData.id
          );
          if (!exists) {
            dbData.archivedNewspapers.unshift(dbData.publishedNewspaper.projectData);
          }
        }
        dbData.publishedNewspaper.isActive = false;
        saveDb(dbData);
      }
    }
  };

  // API Routes
  // 1. Get Public Studio Data (Fast real-time response)
  app.get('/api/public/data', (_req, res) => {
    const dbData = loadDb();
    updatePublicationTimerState(dbData);
    res.json({
      publishedNewspaper: dbData.publishedNewspaper,
      archivedNewspapers: dbData.archivedNewspapers || [],
      publicArchives: dbData.archivedNewspapers || [],
      announcements: (dbData.announcements || []).filter((a: any) => a.active),
      settings: dbData.settings,
      promoCodes: (dbData.promoCodes || [])
        .filter((c: any) => c.active && c.redemptionsCount < c.maxRedemptions)
        .map((c: any) => ({
          id: c.id,
          projectId: c.projectId,
          projectTitle: c.projectTitle || '',
          pageIndex: c.pageIndex,
          probability: c.probability,
          code: c.code,
          customMessage: c.customMessage,
        })),
    });
  });

  // 2. Public Redeem Code with Discord Username
  app.post('/api/public/redeem', (req, res) => {
    const { code, discordUser } = req.body;
    if (!code || !code.trim() || !discordUser || !discordUser.trim()) {
      return res.status(400).json({ error: 'Please enter both the secret code and your Discord username.' });
    }

    const dbData = loadDb();
    const cleanCode = code.trim().toUpperCase();
    const targetCode = (dbData.promoCodes || []).find(
      (c: any) => c.code.toUpperCase() === cleanCode && c.active
    );

    if (!targetCode) {
      return res.status(404).json({ error: 'Invalid secret code. Please verify the code and try again.' });
    }

    if (targetCode.redemptionsCount >= targetCode.maxRedemptions) {
      return res.status(410).json({
        error: 'This secret code has reached its maximum redemption limit and is no longer available.',
      });
    }

    const alreadyRedeemed = (dbData.redemptions || []).some(
      (r: any) => r.code === targetCode.code && r.discordUser.toLowerCase() === discordUser.trim().toLowerCase()
    );
    if (alreadyRedeemed) {
      return res.status(400).json({ error: 'You have already redeemed this code with this Discord username.' });
    }

    targetCode.redemptionsCount += 1;
    if (targetCode.redemptionsCount >= targetCode.maxRedemptions) {
      targetCode.active = false;
    }

    const newRedemption = {
      id: `red-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      code: targetCode.code,
      discordUser: discordUser.trim(),
      customMessage: targetCode.customMessage,
      redeemedAt: new Date().toISOString(),
    };

    if (!dbData.redemptions) dbData.redemptions = [];
    dbData.redemptions.unshift(newRedemption);
    saveDb(dbData);

    return res.json({
      success: true,
      customMessage: targetCode.customMessage,
      discordUser: discordUser.trim(),
      redemption: newRedemption,
    });
  });

  // 3. Public Submit Marketing Team Application (No preferred role field)
  app.post('/api/public/submit-application', (req, res) => {
    const { discordUser, fullName, reason } = req.body;
    if (!discordUser || !discordUser.trim() || !reason || !reason.trim()) {
      return res.status(400).json({ error: 'Discord username and reason for wanting to work in marketing are required.' });
    }

    const dbData = loadDb();
    const newApp = {
      id: `app-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      discordUser: discordUser.trim(),
      fullName: (fullName || 'Anonymous Applicant').trim(),
      reason: reason.trim(),
      submittedAt: new Date().toISOString(),
      status: 'Pending',
    };

    if (!dbData.marketingApplications) dbData.marketingApplications = [];
    dbData.marketingApplications.unshift(newApp);
    saveDb(dbData);

    return res.json({ success: true, application: newApp });
  });

  // 4. Staff Get Marketing Applications
  app.get('/api/staff/applications', (_req, res) => {
    const dbData = loadDb();
    res.json({ applications: dbData.marketingApplications || [] });
  });

  app.post('/api/staff/update-application-status', (req, res) => {
    const { id, status } = req.body;
    const dbData = loadDb();
    const appItem = (dbData.marketingApplications || []).find((a: any) => a.id === id);
    if (appItem) {
      appItem.status = status;
      saveDb(dbData);
      return res.json({ success: true, application: appItem });
    }
    return res.status(404).json({ error: 'Application not found' });
  });

  app.delete('/api/staff/application/:id', (req, res) => {
    const dbData = loadDb();
    dbData.marketingApplications = (dbData.marketingApplications || []).filter((a: any) => a.id !== req.params.id);
    saveDb(dbData);
    res.json({ success: true });
  });

  // 5. Staff Publish Newspaper
  app.post('/api/staff/publish', (req, res) => {
    const { project, durationMinutes } = req.body;
    if (!project) {
      return res.status(400).json({ error: 'Newspaper project data is required to publish.' });
    }

    const safeDurationMinutes = Math.max(1, Math.round(Number(durationMinutes) || 1440));

    const dbData = loadDb();
    const now = new Date();
    const expiresAt = new Date(now.getTime() + safeDurationMinutes * 60 * 1000);

    const projectTitle = project.title || project.name || 'MJJ Records Broadsheet Press';

    dbData.publishedNewspaper = {
      id: project.id || `project-${Date.now()}`,
      projectId: project.id || `project-${Date.now()}`,
      projectTitle,
      name: projectTitle,
      title: projectTitle,
      pages: project.pages || [],
      publishedAt: now.toISOString(),
      expiresAt: expiresAt.toISOString(),
      durationMinutes: safeDurationMinutes,
      isActive: true,
      projectData: project,
    };

    saveDb(dbData);
    res.json({ success: true, publishedNewspaper: dbData.publishedNewspaper });
  });

  // Submit Newspaper for Moderation
  app.post('/api/staff/submit-moderation', (req, res) => {
    const { project, durationMinutes } = req.body;
    if (!project) {
      return res.status(400).json({ error: 'Newspaper project data is required.' });
    }
    const safeDurationMinutes = Math.max(1, Math.round(Number(durationMinutes) || 1440));
    const dbData = loadDb();
    const projectTitle = project.title || project.name || 'MJJ Records Broadsheet Press';
    const submission = {
      id: `sub-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      project,
      projectTitle,
      durationMinutes: safeDurationMinutes,
      submittedAt: new Date().toISOString(),
      status: 'Pending Moderation',
    };
    if (!dbData.newspaperSubmissions) dbData.newspaperSubmissions = [];
    dbData.newspaperSubmissions.unshift(submission);
    saveDb(dbData);
    res.json({ success: true, submission });
  });

  // Get Newspaper Submissions
  app.get('/api/staff/newspaper-submissions', (_req, res) => {
    const dbData = loadDb();
    res.json({ submissions: dbData.newspaperSubmissions || [] });
  });

  // Accept Newspaper Submission (Publish Immediately)
  app.post('/api/staff/accept-submission', (req, res) => {
    const { id } = req.body;
    const dbData = loadDb();
    const subIndex = (dbData.newspaperSubmissions || []).findIndex((s: any) => s.id === id);
    if (subIndex === -1) {
      return res.status(404).json({ error: 'Submission not found' });
    }
    const submission = dbData.newspaperSubmissions[subIndex];
    dbData.newspaperSubmissions.splice(subIndex, 1);

    const project = submission.project;
    const safeDurationMinutes = submission.durationMinutes || 1440;
    const now = new Date();
    const expiresAt = new Date(now.getTime() + safeDurationMinutes * 60 * 1000);
    const projectTitle = submission.projectTitle;

    dbData.publishedNewspaper = {
      id: project.id || `project-${Date.now()}`,
      projectId: project.id || `project-${Date.now()}`,
      projectTitle,
      name: projectTitle,
      title: projectTitle,
      pages: project.pages || [],
      publishedAt: now.toISOString(),
      expiresAt: expiresAt.toISOString(),
      durationMinutes: safeDurationMinutes,
      isActive: true,
      projectData: project,
    };

    saveDb(dbData);
    res.json({ success: true, publishedNewspaper: dbData.publishedNewspaper, submissions: dbData.newspaperSubmissions });
  });

  // Delete/Reject Submission
  app.delete('/api/staff/submission/:id', (req, res) => {
    const dbData = loadDb();
    dbData.newspaperSubmissions = (dbData.newspaperSubmissions || []).filter((s: any) => s.id !== req.params.id);
    saveDb(dbData);
    res.json({ success: true, submissions: dbData.newspaperSubmissions });
  });

  // 6. Staff Unpublish / Move to Library
  app.post('/api/staff/unpublish', (_req, res) => {
    const dbData = loadDb();
    if (dbData.publishedNewspaper && dbData.publishedNewspaper.projectData) {
      if (!dbData.archivedNewspapers) dbData.archivedNewspapers = [];
      const exists = dbData.archivedNewspapers.some(
        (p: any) => p.id === dbData.publishedNewspaper.projectData.id
      );
      if (!exists) {
        dbData.archivedNewspapers.unshift(dbData.publishedNewspaper.projectData);
      }
    }
    if (dbData.publishedNewspaper) {
      dbData.publishedNewspaper.isActive = false;
    }
    saveDb(dbData);
    res.json({ success: true, archivedNewspapers: dbData.archivedNewspapers });
  });

  // 7. Staff Code Management (GET & POST)
  app.get('/api/staff/codes-and-redemptions', (_req, res) => {
    const dbData = loadDb();
    res.json({
      promoCodes: dbData.promoCodes || [],
      redemptions: dbData.redemptions || [],
    });
  });

  app.post('/api/staff/create-code', (req, res) => {
    const {
      code,
      projectId,
      pageIndex,
      probability,
      maxRedemptions,
      customMessage,
    } = req.body;

    const dbData = loadDb();
    const newCode = {
      id: `code-${Date.now()}`,
      code: (code || `MJJ-${Math.floor(100000 + Math.random() * 900000)}`).trim().toUpperCase(),
      projectId: projectId || 'all',
      pageIndex: pageIndex !== undefined ? Number(pageIndex) : 1,
      probability: probability !== undefined ? Number(probability) : 50,
      maxRedemptions: maxRedemptions !== undefined ? Number(maxRedemptions) : 1,
      redemptionsCount: 0,
      customMessage: customMessage || '🎉 Congratulations! You unlocked a special MJJ Records reward!',
      active: true,
    };

    if (!dbData.promoCodes) dbData.promoCodes = [];
    dbData.promoCodes.unshift(newCode);
    saveDb(dbData);
    res.json({ success: true, code: newCode });
  });

  app.delete('/api/staff/code/:id', (req, res) => {
    const dbData = loadDb();
    dbData.promoCodes = (dbData.promoCodes || []).filter((c: any) => c.id !== req.params.id);
    saveDb(dbData);
    res.json({ success: true });
  });

  // 8. Staff Announcements Management
  app.get('/api/staff/announcements', (_req, res) => {
    const dbData = loadDb();
    res.json({ announcements: dbData.announcements || [] });
  });

  app.post('/api/staff/announcements', (req, res) => {
    const { text } = req.body;
    if (!text || !text.trim()) {
      return res.status(400).json({ error: 'Text required' });
    }
    const dbData = loadDb();
    const newAnn = {
      id: `ann-${Date.now()}`,
      text: text.trim(),
      active: true,
      createdAt: new Date().toISOString(),
    };
    if (!dbData.announcements) dbData.announcements = [];
    dbData.announcements.unshift(newAnn);
    saveDb(dbData);
    res.json({ success: true, announcement: newAnn });
  });

  app.delete('/api/staff/announcements/:id', (req, res) => {
    const dbData = loadDb();
    dbData.announcements = (dbData.announcements || []).filter((a: any) => a.id !== req.params.id);
    saveDb(dbData);
    res.json({ success: true });
  });

  // 9. Global Settings (Toggle Newsprint Texture & Staff Passcode)
  app.post('/api/staff/settings', (req, res) => {
    const { newsprintTextureEnabled } = req.body;
    const dbData = loadDb();
    if (typeof newsprintTextureEnabled === 'boolean') {
      dbData.settings.newsprintTextureEnabled = newsprintTextureEnabled;
    }
    saveDb(dbData);
    res.json({ success: true, settings: dbData.settings });
  });

  // 10. Staff AI Newspaper Copilot with Google Search Grounding (gemini-3.8-flash)
  app.post('/api/staff/ai-assistant', async (req, res) => {
    try {
      const { message, history } = req.body;
      if (!message || !message.trim()) {
        return res.status(400).json({ error: 'Message is required.' });
      }

      const systemPrompt = `You are the official MJJ Records AI Newspaper Research & Broadsheet Copilot.
You specialize in Michael Jackson history, Jackson 5, Off the Wall, Thriller, Bad, Dangerous, HIStory, Invincible, Motown 25, world tours, discography, philanthropy, awards, and historical broadsheet music journalism.
You have access to Google Search grounding to verify dates, facts, quotes, and historical details accurately.

When the staff member asks you to create or research a newspaper, you must:
1. Research the requested topic, historical event, or custom specification using Google Search grounding.
2. Provide a knowledgeable, exciting journalistic editorial explanation of what you researched, including historical context, quotes, and citations.
3. Generate a complete, publishable broadsheet newspaper project structure in strict JSON format inside a single \`\`\`json ... \`\`\` code block at the end of your response.

The JSON MUST conform to this exact shape:
{
  "projectTitle": "Headline Title for Newspaper Project",
  "subtitle": "Informative Subtitle for Newspaper",
  "editionName": "THE MJJ DAILY PRESS",
  "dateText": "HISTORIC DATE (e.g. MARCH 25, 1983)",
  "issueNumber": "ISSUE NO. 88",
  "priceText": "PRICE 25 CENTS",
  "pages": [
    {
      "layoutId": "layout-top-hero",
      "sectionTitle": "FRONT PAGE SPECIAL REPORT",
      "leadHeadline": "PUNCHY FRONT PAGE HEADLINE",
      "leadKicker": "HISTORIC RECORD • SPECIAL DISPATCH",
      "leadSubhead": "Compelling subhead summarizing the story",
      "leadBody": "In-depth article text (2-4 paragraphs with rich journalistic detail, historical facts, and quotes)...",
      "leadByline": "BY MJJ PRESS BUREAU",
      "secondaryHeadline": "Secondary Article Headline",
      "secondaryBody": "Article text with facts...",
      "secondaryByline": "BY SPECIAL CORRESPONDENT",
      "tertiaryHeadline": "Third Column Dispatch",
      "tertiaryBody": "Article text with background...",
      "quote": "Memorable quote from Michael Jackson or key figure",
      "image1Caption": "Caption describing what photo should appear in Slot 1",
      "image2Caption": "Caption for Slot 2",
      "image3Caption": "Caption for Slot 3"
    }
  ]
}

Available layout IDs for pages:
- 'front-cover' (Standard front page masthead with hero photograph)
- 'layout-top-hero' (Hero banner top with 3 columns below)
- 'layout-vertical-trio' (3 vertical balanced columns)
- 'layout-left-split' (Feature spread with left side image and right narrative)
- 'layout-center-feature' (Center stage editorial with dual bookend columns)
- 'layout-horizontal-triptych' (3 horizontal triptych segments)
- 'layout-editorial-asymmetric' (Modern asymmetrical broadsheet layout)
- 'layout-headline-spread' (Gigantic bold banner headline spread)

Always be authentic, respectful, factually accurate, and enthusiastic about the King of Pop's artistry and legacy.`;

      const contents: any[] = [];
      if (Array.isArray(history) && history.length > 0) {
        for (const h of history) {
          if (h.role && h.text) {
            contents.push({
              role: h.role === 'user' ? 'user' : 'model',
              parts: [{ text: h.text }],
            });
          }
        }
      }

      contents.push({
        role: 'user',
        parts: [{ text: `${systemPrompt}\n\nStaff Request: ${message.trim()}` }],
      });

      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents,
        config: {
          tools: [{ googleSearch: {} }],
        },
      });

      const text = response.text || '';
      const groundingChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
      const webSources = groundingChunks
        .map((chunk: any) => chunk.web)
        .filter((w: any) => w && w.uri && w.title);

      // Extract JSON block if present
      let generatedProjectData: any = null;
      const jsonMatch = text.match(/```json\s*([\s\S]*?)\s*```/);
      if (jsonMatch) {
        try {
          generatedProjectData = JSON.parse(jsonMatch[1]);
        } catch (parseErr) {
          console.warn('JSON parse warning from AI response:', parseErr);
        }
      }

      return res.json({
        reply: text.replace(/```json[\s\S]*?```/, '').trim(),
        fullText: text,
        projectData: generatedProjectData,
        sources: webSources,
      });
    } catch (err: any) {
      console.error('AI assistant error:', err);
      return res.status(500).json({
        error: 'Failed to process AI newspaper request.',
        details: err?.message || String(err),
      });
    }
  });

  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, () => {
    console.log(`MJJ RECORDS Full-Stack Server running on port ${PORT}`);
  });
}

startServer();
