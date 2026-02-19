import { useQuery, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@shared/lib';
import { instagramApiService } from '@features/instagram/services/InstagramApiService';
import {
  InstagramAllDataResponse,
  InstagramProfilePictureResponse,
  InstagramStoriesResponse,
  InstagramUserPostsResponse,
  InstagramPostsApiResponse,
  InstagramAnalytics,
  HealthStatus,
} from '@features/instagram/types/Instagram';

// Hook for fetching all user data (profile + stories + posts)
export function useInstagramAllData(username: string, enabled = true) {
  return useQuery({
    queryKey: queryKeys.instagram.allData(username),
    queryFn: () => instagramApiService.getAllUserData(username),
    enabled: enabled && !!username,
    staleTime: 1000 * 60 * 5, // 5 minutes
    gcTime: 1000 * 60 * 30, // 30 minutes
  });
}

// Hook for fetching profile picture
export function useInstagramProfilePicture(username: string, enabled = true) {
  return useQuery({
    queryKey: queryKeys.instagram.profile(username),
    queryFn: () => instagramApiService.getProfilePicture(username),
    enabled: enabled && !!username,
    staleTime: 1000 * 60 * 30, // 30 minutes
  });
}

// Hook for fetching stories
export function useInstagramStories(username: string, enabled = true) {
  return useQuery({
    queryKey: queryKeys.instagram.stories(username),
    queryFn: () => instagramApiService.getStories(username),
    enabled: enabled && !!username,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

// Hook for fetching posts
export function useInstagramPosts(username: string, enabled = true) {
  return useQuery({
    queryKey: queryKeys.instagram.posts(username),
    queryFn: () => instagramApiService.getUserPosts(username),
    enabled: enabled && !!username,
    staleTime: 1000 * 60 * 10, // 10 minutes
  });
}

// Hook for fetching Instagram posts from Firestore (with sync)
export function useInstagramFirestorePosts(forceSync = false) {
  return useQuery({
    queryKey: [...queryKeys.instagram.all, 'firestore', forceSync],
    queryFn: () => instagramApiService.getInstagramPosts(forceSync),
    staleTime: 1000 * 60 * 5,
  });
}

// Hook for fetching Instagram analytics
export function useInstagramAnalytics() {
  return useQuery({
    queryKey: [...queryKeys.instagram.all, 'analytics'],
    queryFn: () => instagramApiService.getInstagramAnalytics(),
    staleTime: 1000 * 60 * 10, // 10 minutes
  });
}

// Hook for health check
export function useInstagramHealth() {
  return useQuery({
    queryKey: [...queryKeys.instagram.all, 'health'],
    queryFn: () => instagramApiService.checkInstagramHealth(),
    staleTime: 1000 * 60 * 2, // 2 minutes
    refetchInterval: 1000 * 60 * 5, // Refetch every 5 minutes
  });
}

// Prefetch function for profile data
export function usePrefetchInstagramData() {
  const queryClient = useQueryClient();

  return (username: string) => {
    queryClient.prefetchQuery({
      queryKey: queryKeys.instagram.allData(username),
      queryFn: () => instagramApiService.getAllUserData(username),
    });
  };
}
