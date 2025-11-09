// Community Feed API Service
import { API_CONFIG } from '../config/constants';
const COMMUNITY_FEED_BASE_URL = API_CONFIG.COMMUNITY_FEED.BASE_URL;

export interface CommunityPost {
  id: string;
  user_id: string;
  username: string;
  airport_code: string;
  airport_name: string;
  post_type: string;
  category: string;
  content: string;
  sentiment: 'positive' | 'negative' | 'neutral';
  likes: number;
  replies: number;
  verified: boolean;
  created_at: string;
  updated_at: string;
  is_active: boolean;
}

export interface CreatePostData {
  user_id: string;
  username: string;
  airport_code: string;
  content: string;
  category: string;
  post_type?: string;
  verified?: boolean;
}

export interface PostFilters {
  airport_code?: string;
  category?: string;
  sentiment?: string;
  verified?: boolean;
}

export interface AirportInfo {
  code: string;
  name: string;
  post_count: number;
  last_post: string | null;
}

export interface CommunityStats {
  total_posts: number;
  active_airports: number;
  unique_users: number;
  avg_likes: number;
  sentiment_breakdown: {
    positive: number;
    negative: number;
    neutral: number;
  };
}

class CommunityFeedAPI {
  private async makeRequest(endpoint: string, options: RequestInit = {}): Promise<any> {
    const url = `${COMMUNITY_FEED_BASE_URL}${endpoint}`;
    
    const defaultOptions: RequestInit = {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    };

    try {
      const response = await fetch(url, { ...defaultOptions, ...options });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Community Feed API Error:', error);
      throw error;
    }
  }

  // Get posts with optional filtering
  async getPosts(filters?: PostFilters, limit: number = 20, offset: number = 0): Promise<{ success: boolean; posts: CommunityPost[]; count: number }> {
    const params = new URLSearchParams({
      action: 'posts',
      limit: limit.toString(),
      offset: offset.toString(),
    });

    if (filters) {
      if (filters.airport_code) params.append('airport_code', filters.airport_code);
      if (filters.category) params.append('category', filters.category);
      if (filters.sentiment) params.append('sentiment', filters.sentiment);
      if (filters.verified !== undefined) params.append('verified', filters.verified.toString());
    }

    return this.makeRequest(`?${params.toString()}`);
  }

  // Create a new post
  async createPost(postData: CreatePostData): Promise<{ success: boolean; post_id: string; post: CommunityPost }> {
    return this.makeRequest('?action=create', {
      method: 'POST',
      body: JSON.stringify(postData),
    });
  }

  // Update an existing post
  async updatePost(postId: string, updateData: Partial<CreatePostData>): Promise<{ success: boolean; message: string }> {
    return this.makeRequest(`?action=update&post_id=${postId}`, {
      method: 'PUT',
      body: JSON.stringify(updateData),
    });
  }

  // Delete a post (soft delete)
  async deletePost(postId: string, userId: string): Promise<{ success: boolean; message: string }> {
    return this.makeRequest(`?action=delete&post_id=${postId}&user_id=${userId}`, {
      method: 'DELETE',
    });
  }

  // Like a post
  async likePost(postId: string, userId: string): Promise<{ success: boolean; likes: number }> {
    return this.makeRequest('?action=like', {
      method: 'POST',
      body: JSON.stringify({ post_id: postId, user_id: userId }),
    });
  }

  // Get list of airports with recent posts
  async getAirports(): Promise<{ success: boolean; airports: AirportInfo[] }> {
    return this.makeRequest('?action=airports');
  }

  // Get community statistics
  async getStatistics(): Promise<{ success: boolean; statistics: CommunityStats }> {
    return this.makeRequest('?action=statistics');
  }

  // Get posts for a specific airport
  async getAirportPosts(airportCode: string, limit: number = 20): Promise<{ success: boolean; posts: CommunityPost[]; count: number }> {
    return this.getPosts({ airport_code: airportCode }, limit);
  }

  // Get posts by category
  async getPostsByCategory(category: string, limit: number = 20): Promise<{ success: boolean; posts: CommunityPost[]; count: number }> {
    return this.getPosts({ category }, limit);
  }

  // Get posts by sentiment
  async getPostsBySentiment(sentiment: 'positive' | 'negative' | 'neutral', limit: number = 20): Promise<{ success: boolean; posts: CommunityPost[]; count: number }> {
    return this.getPosts({ sentiment }, limit);
  }

  // Get verified posts only
  async getVerifiedPosts(limit: number = 20): Promise<{ success: boolean; posts: CommunityPost[]; count: number }> {
    return this.getPosts({ verified: true }, limit);
  }

  // Search posts by content (if implemented in backend)
  async searchPosts(searchTerm: string, limit: number = 20): Promise<{ success: boolean; posts: CommunityPost[]; count: number }> {
    // This would need to be implemented in the backend
    // For now, we'll get all posts and filter client-side
    const result = await this.getPosts(undefined, 100);
    if (result.success) {
      const filteredPosts = result.posts.filter(post => 
        post.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
        post.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
        post.airport_name.toLowerCase().includes(searchTerm.toLowerCase())
      );
      return {
        success: true,
        posts: filteredPosts.slice(0, limit),
        count: filteredPosts.length
      };
    }
    return result;
  }
}

// Export singleton instance
export const communityFeedAPI = new CommunityFeedAPI();

// Export types for use in components
export type { CommunityPost, CreatePostData, PostFilters, AirportInfo, CommunityStats }; 