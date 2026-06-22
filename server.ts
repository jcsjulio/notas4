import express from 'express';
import path from 'path';
import fs from 'fs';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI, Modality, Type } from '@google/genai';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Lazy initialization of Gemini client
let aiClient: GoogleGenAI | null = null;
function getGeminiClient(): GoogleGenAI {
  if (!aiClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error('GEMINI_API_KEY environment variable is required. Please set it in Settings > Secrets.');
    }
    aiClient = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  }
  return aiClient;
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Middleware for parsing requests (sized of images can be large)
  app.use(express.json({ limit: '15mb' }));
  app.use(express.urlencoded({ limit: '15mb', extended: true }));

  // --- API Routes Helper ---
  // Simple auth check in server to log if Gemini Key is present
  app.get('/api/config', (req, res) => {
    res.json({
      hasGeminiKey: !!process.env.GEMINI_API_KEY,
    });
  });

  // 1. TTS Note Reader Route (gemini-3.1-flash-tts-preview)
  app.post('/api/gemini/tts', async (req, res) => {
    try {
      const { text, voice = 'Zephyr' } = req.body;
      if (!text || text.trim() === '') {
        return res.status(400).json({ error: 'Texto não fornecido para síntese de voz.' });
      }

      const ai = getGeminiClient();
      const cleanText = text.length > 500 ? text.substring(0, 500) : text;

      // Ask Gemini to read the text in a natural way
      const response = await ai.models.generateContent({
        model: 'gemini-3.1-flash-tts-preview',
        contents: [{ parts: [{ text: `Diga com clareza e de forma natural, em português: ${cleanText}` }] }],
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: { voiceName: voice as any }, // Puck, Charon, Kore, Fenrir, Zephyr
            },
          },
        },
      });

      const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
      if (!base64Audio) {
        throw new Error('Não foi possível gerar fluxo de áudio da resposta do Gemini.');
      }

      res.json({ audio: base64Audio });
    } catch (error: any) {
      console.error('[TTS ERROR]', error);
      res.status(500).json({ error: error.message || 'Erro ao gerar áudio com Gemini TTS.' });
    }
  });

  // 2. Search Grounding Agent (gemini-3.5-flash with googleSearch tool)
  app.post('/api/gemini/search', async (req, res) => {
    try {
      const { prompt } = req.body;
      if (!prompt || prompt.trim() === '') {
        return res.status(400).json({ error: 'Prompt não fornecido para pesquisa.' });
      }

      const ai = getGeminiClient();

      const response = await ai.models.generateContent({
        model: 'gemini-3.5-flash',
        contents: `Analise a seguinte solicitação de busca e crie uma resposta bem estruturada em português. Adicione informações atualizadas e confiáveis. 
Seja conciso, formatando como uma resposta amigável e legível. 
Solicitação: ${prompt}`,
        config: {
          tools: [{ googleSearch: {} }],
        },
      });

      // Extract text content and sources metadata
      const text = response.text || '';
      const groundingChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
      const sources = groundingChunks
        .map((chunk: any) => ({
          title: chunk.web?.title || 'Fonte externa',
          uri: chunk.web?.uri || '',
        }))
        .filter((chunk: any) => chunk.uri !== '');

      res.json({ text, sources });
    } catch (error: any) {
      console.error('[SEARCH ERROR]', error);
      res.status(500).json({ error: error.message || 'Erro ao realizar busca com Gemini.' });
    }
  });

  // 3. Image Analysis (gemini-3.1-pro-preview)
  app.post('/api/gemini/analyze-image', async (req, res) => {
    try {
      const { image, mimeType = 'image/jpeg', userPrompt } = req.body;
      if (!image) {
        return res.status(400).json({ error: 'Nenhuma imagem foi recebida.' });
      }

      const ai = getGeminiClient();
      const base64Data = image.replace(/^data:image\/\w+;base64,/, '');

      const systemPrompt = `Você é um scanner inteligente e assistente de anotações pessoais.
Analise a imagem enviada (que pode ser um documento, receita, foto de caderno, lousa, link desenhado ou captura de tela).
Você deve extrair os dados e sugerir como convertê-la em uma anotação, lembrete ou link salvo.
Responda JSON estruturado seguindo rigorosamente o esquema de propriedades solicitado.

Instruções para os campos:
- title: Um título curto, elegante e descritivo em português para a anotação
- content: Conteúdo completo formatado em Markdown limpo (português). Extraia textos, tabelas ou listas legíveis. Se for uma foto de paisagem ou objeto, descreva-a de forma inspiradora.
- type: Classifique obrigatoriamente como 'nota' (para textos gerais), 'lembrete' (se houver prazos, datas ou tarefas a cumprir) ou 'link' (se o foco principal for extrair uma URL relevante).
- date: Digite uma data sugerida (YYYY-MM-DD) apenas se for do tipo 'lembrete' ou houver um evento futuro, caso contrário deixe como string vazia "".
- summary: Um resumo muito curto de 1 frase explicando o que a IA identificou nesta imagem.`;

      const response = await ai.models.generateContent({
        model: 'gemini-3.1-pro-preview',
        contents: [
          {
            inlineData: {
              data: base64Data,
              mimeType: mimeType,
            },
          },
          {
            text: userPrompt ? `${systemPrompt}\nContexto adicional do usuário: ${userPrompt}` : systemPrompt,
          },
        ],
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              title: { type: Type.STRING },
              content: { type: Type.STRING },
              type: {
                type: Type.STRING,
                description: "Classificação obrigatória do item: 'nota', 'lembrete', ou 'link'",
              },
              date: {
                type: Type.STRING,
                description: 'Data sugerida no formato YYYY-MM-DD se aplicável, senão string vazia',
              },
              summary: {
                type: Type.STRING,
                description: 'Resumo curto de 1 frase descrevendo o conteúdo capturado',
              },
            },
            required: ['title', 'content', 'type', 'summary'],
          },
        },
      });

      const responseText = response.text;
      if (!responseText) {
        throw new Error('Nenhum resultado de análise de imagem retornado pela IA.');
      }

      const analyzedResult = JSON.parse(responseText);
      res.json(analyzedResult);
    } catch (error: any) {
      console.error('[IMAGE ANALYZER ERROR]', error);
      res.status(500).json({ error: error.message || 'Erro ao analisar imagem com Gemini Pro.' });
    }
  });

  // --- Serve Dev Assets vs. Production Static Build ---
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const docsPath = path.join(process.cwd(), 'docs');
    const distPath = path.join(process.cwd(), 'dist');
    const staticPath = fs.existsSync(docsPath) ? docsPath : distPath;
    app.use(express.static(staticPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(staticPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[SERVER] Express Server running on port ${PORT}`);
  });
}

startServer();
