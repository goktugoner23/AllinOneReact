// Instagram Types - Matching Kotlin data models for React Native

// Instagram Posts API Response (actual format from backend)
export interface InstagramPostsApiResponse {
    success: boolean;
    data: InstagramPost[];
    count: number;
    source: string;
    syncInfo: SyncInfo;
    timestamp: string;
}

// Internal posts data for Redux store
export interface InstagramPostsData {
    posts: InstagramPost[];
    count: number;
    source: string;
    syncInfo: SyncInfo;
    timestamp: string;
}

// Sync information (actual API response format)
export interface SyncInfo {
    triggered: boolean;
    success?: boolean;
    error?: string;
    reason: string;
    previousCount?: number;
    currentCount?: number;
    newPosts?: number;
    processingTime?: string;
}

// Instagram Post (standardized format)
export interface InstagramPost {
    id: string;
    shortcode: string;
    caption: string;
    mediaType: string; // "IMAGE", "VIDEO", "CAROUSEL_ALBUM", "REELS"
    mediaUrl?: string;
    thumbnailUrl?: string;
    permalink: string;
    timestamp: string;
    formattedDate?: string;
    username?: string;
    metrics: InstagramMetrics;
    hashtags: string[];
    mentions: string[];
}

// Instagram Metrics
export interface InstagramMetrics {
    likesCount: number;
    commentsCount: number;
    sharesCount?: number;
    savesCount?: number;
    reachCount?: number;
    impressionsCount?: number;
    videoViewsCount?: number;
    engagementRate: number;
    totalInteractions?: number;
}

// Account Information
export interface InstagramAccount {
    id: string;
    username: string;
    name?: string;
    biography?: string;
    website?: string;
    profilePictureUrl?: string;
    followersCount: number;
    followsCount: number;
    mediaCount: number;
    accountType: string;
}

// Analytics Response (from GET /api/instagram/analytics)
export interface InstagramAnalytics {
    account: InstagramAccount;
    posts: InstagramPost[];
    summary: AnalyticsSummary;
}

export interface AnalyticsSummary {
    totalPosts: number;
    totalEngagement: number;
    avgEngagementRate: number;
    topPerformingPost?: TopPerformingPost;
    recentGrowth?: RecentGrowth;
    detailedMetrics?: DetailedMetrics;
}

export interface TopPerformingPost {
    id: string;
    caption: string;
    metrics: PostMetricsSummary;
}

export interface PostMetricsSummary {
    engagementRate: number;
    totalInteractions: number;
}

export interface RecentGrowth {
    engagement: number;
    reach: number;
}

export interface DetailedMetrics {
    totals: TotalMetrics;
    averages: AverageMetrics;
    topPerformers?: TopPerformers;
    contentAnalysis?: ContentAnalysis;
    engagementQuality?: EngagementQuality;
    trends?: Trends;
    performance?: PerformanceMetrics;
}

export interface TotalMetrics {
    totalPosts: number;
    totalLikes: number;
    totalComments: number;
    totalShares: number;
    totalSaves: number;
    totalReach: number;
    totalVideoViews: number;
    totalEngagement: number;
    totalWatchTime: string;
}

export interface AverageMetrics {
    avgLikes: number;
    avgComments: number;
    avgShares: number;
    avgSaves: number;
    avgReach: number;
    avgVideoViews: number;
    avgEngagement: number;
    avgEngagementRate: number;
    avgWatchTime: string;
}

export interface TopPerformers {
    topByEngagement?: InstagramPost;
    topByLikes?: InstagramPost;
    topByComments?: InstagramPost;
    topByReach?: InstagramPost;
    topByShares?: InstagramPost;
    topBySaves?: InstagramPost;
}

export interface ContentAnalysis {
    mediaTypeBreakdown?: MediaTypeBreakdown;
    postingFrequency?: PostingFrequency;
    hashtagAnalysis?: HashtagAnalysis;
}

export interface MediaTypeBreakdown {
    videos?: MediaTypeStats;
    images?: MediaTypeStats;
}

export interface MediaTypeStats {
    count: number;
    percentage: number;
    avgEngagementRate: number;
}

export interface PostingFrequency {
    avgDaysBetweenPosts: number;
    postsPerWeek: number;
    postsPerMonth: number;
}

export interface HashtagAnalysis {
    totalUniqueHashtags: number;
    avgHashtagsPerPost: number;
    topPerformingHashtags: HashtagPerformance[];
}

export interface HashtagPerformance {
    hashtag: string;
    count: number;
    avgEngagementRate?: number;
    totalPosts?: number;
}

export interface EngagementQuality {
    commentsToLikesRatio: number;
    savesToReachRatio: number;
    sharesToReachRatio: number;
    engagementScore: number;
    viralityScore: number;
}

export interface Trends {
    recentEngagementTrend: number;
    recentReachTrend: number;
    trendDirection: string;
}

export interface PerformanceMetrics {
    highPerformingPosts: number;
    lowPerformingPosts: number;
    consistencyScore: number;
    growthPotential: number;
}

// Health Check
export interface HealthStatus {
    instagram: boolean;
    firestore: boolean;
    rag: boolean;
    cache: boolean;
    overall: boolean;
}

// RAG Query Models
export interface RAGQueryRequest {
    query: string;
    domain?: string;
    options?: QueryOptions;
}

export interface QueryOptions {
    topK?: number;
    minScore?: number;
}

export interface RAGQueryResponse {
    answer: string;
    sources: AISource[];
    confidence: number;
    processingTime: number;
    metadata: AIMetadata;
}

export interface AISource {
    id: string;
    score: number;
    content: string;
    metadata: AISourceMetadata;
}

export interface AISourceMetadata {
    postId?: string;
    likesCount?: number;
    commentsCount?: number;
    engagementRate?: number;
    mediaType?: string;
    timestamp?: string;
    hashtags?: string[];
}

export interface AIMetadata {
    originalQuery: string;
    totalMatches: number;
}

// Chat functionality (Ask AI tab) - Enhanced for multimodal
export interface ChatMessage {
    text: string;
    isUser: boolean;
    timestamp: number;
    sources?: AISource[];
    confidence?: number;
    isLoading?: boolean;
    isError?: boolean;
    contentType?: ContentType;
    attachments?: MessageAttachment[];
    isTyping?: boolean;
    processingTime?: number;
}

// Content types supported by the multimodal AI
export enum ContentType {
    TEXT = 'TEXT',
    IMAGE = 'IMAGE',
    AUDIO = 'AUDIO',
    PDF = 'PDF',
    URL = 'URL',
    MULTIMODAL = 'MULTIMODAL'
}

// Message attachments for multimodal content
export interface MessageAttachment {
    id: string;
    type: AttachmentType;
    uri: string;
    fileName?: string;
    fileSize?: number;
    mimeType?: string;
    duration?: number;
    thumbnailUri?: string;
    uploadStatus?: UploadStatus;
    uploadProgress?: number;
    analysisQuery?: string;
}

// Attachment types matching backend specifications
export enum AttachmentType {
    IMAGE = 'IMAGE',
    AUDIO = 'AUDIO',
    PDF = 'PDF',
    VIDEO = 'VIDEO',
    VOICE_RECORDING = 'VOICE_RECORDING'
}

// Upload status tracking
export enum UploadStatus {
    PENDING = 'PENDING',
    UPLOADING = 'UPLOADING',
    PROCESSING = 'PROCESSING',
    COMPLETED = 'COMPLETED',
    FAILED = 'FAILED',
    CANCELLED = 'CANCELLED'
}

// Multimodal analysis request
export interface MultimodalAnalysisRequest {
    query: string;
    contentType: string;
    domain?: string;
    content?: string;
    options?: QueryOptions;
}

// Audio recording state
export interface AudioRecordingState {
    isRecording: boolean;
    duration: number;
    amplitude: number;
    filePath?: string;
    error?: string;
}

// Suggested actions for multimodal content
export interface MultimodalSuggestion {
    title: string;
    description: string;
    contentType: ContentType;
    icon: string;
    exampleQuery: string;
    acceptedFileTypes: string[];
}

// API Response wrapper
export interface ApiResponse<T> {
    success: boolean;
    data?: T;
    error?: string;
    timestamp: string;
    processingTime?: string;
}

// Result handling
export type InstagramResult<T> =
    | { type: 'success'; data: T }
    | { type: 'error'; message: string; cause?: Error }
    | { type: 'loading'; message?: string };

// Loading states
export interface LoadingState {
    isLoading: boolean;
    isRefreshing: boolean;
    error?: string;
}

// Instagram Redux State
export interface InstagramState {
    posts: {
        data: InstagramPostsData | null;
        loading: LoadingState;
    };
    analytics: {
        data: InstagramAnalytics | null;
        loading: LoadingState;
    };
    ai: {
        messages: ChatMessage[];
        loading: LoadingState;
        audioRecording: AudioRecordingState;
        attachmentPreview?: MessageAttachment;
        suggestions: MultimodalSuggestion[];
    };
    health: {
        status: HealthStatus | null;
        lastChecked?: string;
    };
}

// ==============
// Profiler Types
// ==============

// Profile picture endpoint response
export interface InstagramProfilePictureResponse {
    success: boolean;
    data: {
        username: string;
        imageUrl: string;
        isPrivate?: boolean;
        isVerified?: boolean;
        fullName?: string;
    };
    session?: {
        hasSession: boolean;
        valid: boolean;
        issue?: string;
    };
    timestamp?: number | string;
}

// Stories endpoint response
export interface InstagramStoriesResponse {
    success: boolean;
    data: InstagramStoryItem[];
    count?: number;
    session?: {
        hasSession: boolean;
        valid: boolean;
        issue?: string;
    };
    timestamp?: number | string;
}

export interface InstagramStoryItem {
    id: string;
    mediaType: 'IMAGE' | 'VIDEO';
    mediaUrl: string;
    timestamp?: string;
    expiresAt?: string;
}

// User posts endpoint response (for profiler)
export interface InstagramUserPostsResponse {
    success: boolean;
    data: InstagramUserPost[];
    count?: number;
    session?: {
        hasSession: boolean;
        valid: boolean;
        issue?: string;
    };
    timestamp?: number | string;
}

export interface InstagramUserPost {
    id: string;
    shortcode: string;
    caption?: string;
    mediaType: 'IMAGE' | 'VIDEO' | 'CAROUSEL_ALBUM';
    mediaUrl: string;
    thumbnailUrl?: string;
    permalink: string;
    timestamp: string;
    likesCount?: number;
    commentsCount?: number;
    videoViewsCount?: number;
}

// All-in-one endpoint response (profile + stories + posts)
export interface InstagramAllDataResponse {
    success: boolean;
    data: {
        profile: {
            username: string;
            imageUrl: string;
            isPrivate?: boolean;
            isVerified?: boolean;
            fullName?: string;
            biography?: string;
            postsCount?: number;
            followersCount?: number;
            followingCount?: number;
        } | null;
        stories: InstagramStoryItem[];
        posts: InstagramUserPost[];
    };
    counts: {
        stories: number;
        posts: number;
    };
    status: {
        profile: boolean;
        stories: boolean;
        posts: boolean;
    };
    scrapedAt?: string;
    timestamp: number;
}