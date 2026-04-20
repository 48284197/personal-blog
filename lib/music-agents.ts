export type MusicVocalMode = 'vocal' | 'instrumental'
export type MusicLyricsMode = 'deepseek' | 'manual'
export type MusicAgentProvider = 'deepseek' | 'minimax' | 'system'
export type MusicAgentStage = 'briefing' | 'lyrics' | 'generation' | 'post'

export type MusicWorkflowInput = {
  title: string
  theme: string
  genre: string
  mood: string
  scene: string
  vocalMode: MusicVocalMode
  lyricsMode: MusicLyricsMode
  manualLyrics?: string
  extraPrompt?: string
}

export type MusicAgentDefinition = {
  id: string
  name: string
  provider: MusicAgentProvider
  stage: MusicAgentStage
  description: string
  responsibilities: string[]
  outputs: string[]
}

export type MusicWorkflowStep = {
  id: string
  agentId: string
  title: string
  description: string
  status: 'active' | 'optional'
  outputs: string[]
}

export const musicAgents: MusicAgentDefinition[] = [
  {
    id: 'brief-orchestrator',
    name: 'Brief Orchestrator',
    provider: 'system',
    stage: 'briefing',
    description: '负责收敛用户输入，统一产出给下游 agent 的音乐 brief。',
    responsibilities: [
      '提炼主题、风格、情绪和场景',
      '补齐生成 prompt 所需字段',
      '为多 agent 协作输出统一上下文',
    ],
    outputs: ['结构化音乐 brief', '生成 prompt', 'agent 执行计划'],
  },
  {
    id: 'lyrics-architect',
    name: 'Lyrics Architect',
    provider: 'deepseek',
    stage: 'lyrics',
    description: '基于 DeepSeek 负责写词、润色和段落结构组织。',
    responsibilities: [
      '按主题生成有段落标签的歌词',
      '控制韵律、意象和情绪推进',
      '后续可扩展为多版本歌词对比 agent',
    ],
    outputs: ['结构化歌词', '歌词创作说明'],
  },
  {
    id: 'music-composer',
    name: 'Music Composer',
    provider: 'minimax',
    stage: 'generation',
    description: '调用 MiniMax 音乐生成接口，把 brief 和歌词转成可播放音频。',
    responsibilities: [
      '根据 prompt 与歌词生成音乐',
      '支持 vocal 与 instrumental 两种模式',
      '输出音频地址与基础元信息',
    ],
    outputs: ['音频结果', 'trace id', '时长与采样信息'],
  },
  {
    id: 'release-editor',
    name: 'Release Editor',
    provider: 'system',
    stage: 'post',
    description: '为后续的封面、标题、标签、上架和分发 agent 预留位置。',
    responsibilities: [
      '整理最终标题和发布文案',
      '生成标签与内容摘要',
      '为多 agent 扩展留出后处理阶段',
    ],
    outputs: ['发布摘要', '标签建议', '后处理上下文'],
  },
]

export function buildMusicPrompt(input: MusicWorkflowInput) {
  return [
    input.genre.trim(),
    input.mood.trim(),
    input.theme.trim(),
    input.scene.trim(),
    input.extraPrompt?.trim() ?? '',
  ]
    .filter(Boolean)
    .join(', ')
}

export function buildMusicWorkflow(input: MusicWorkflowInput): MusicWorkflowStep[] {
  return [
    {
      id: 'step-brief',
      agentId: 'brief-orchestrator',
      title: '整理音乐需求',
      description: `汇总主题、曲风、情绪和场景，形成统一 brief。`,
      status: 'active',
      outputs: [
        `主题：${input.theme}`,
        `曲风：${input.genre}`,
        `情绪：${input.mood}`,
      ],
    },
    {
      id: 'step-lyrics',
      agentId: 'lyrics-architect',
      title: input.vocalMode === 'instrumental' ? '歌词阶段跳过' : '生成或整理歌词',
      description:
        input.vocalMode === 'instrumental'
          ? '当前选择纯音乐，无需歌词。'
          : input.lyricsMode === 'manual'
            ? '使用你提供的歌词，并保留后续润色扩展空间。'
            : '由 DeepSeek 先生成带结构标签的歌词。',
      status: input.vocalMode === 'instrumental' ? 'optional' : 'active',
      outputs:
        input.vocalMode === 'instrumental'
          ? ['纯音乐模式']
          : [
              input.lyricsMode === 'manual' ? '手动歌词' : 'DeepSeek 歌词草稿',
              '段落结构标签',
            ],
    },
    {
      id: 'step-music',
      agentId: 'music-composer',
      title: '调用 MiniMax 生成音乐',
      description: '将音乐 brief 与歌词一起发送给 MiniMax Music Generation 接口。',
      status: 'active',
      outputs: ['可播放音频', '生成 trace id', '音频元信息'],
    },
    {
      id: 'step-post',
      agentId: 'release-editor',
      title: '预留发行与后处理阶段',
      description: '后续可在这里接封面、标签、分发、审核或多 agent 复盘。',
      status: 'optional',
      outputs: ['标题建议', '摘要文案', '标签建议'],
    },
  ]
}
